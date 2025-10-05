#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get domain from command line argument
if [ -z "$1" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 neotracker.study"
    exit 1
fi

DOMAIN="$1"
REGION="us-central1"

log_info "DNS Diagnosis for: $DOMAIN"
echo ""

# Check Google Cloud domain mapping status
log_info "Checking Google Cloud domain mapping status..."
echo ""
if gcloud beta run domain-mappings describe --domain=$DOMAIN --region=$REGION >/dev/null 2>&1; then
    log_success "Domain mapping exists in Google Cloud"
    
    # Get expected DNS records
    echo ""
    log_info "Expected DNS records from Google Cloud:"
    gcloud beta run domain-mappings describe --domain=$DOMAIN --region=$REGION --format="value(status.resourceRecords[].type,status.resourceRecords[].rrdata)" | while read type ip; do
        if [ "$type" = "A" ]; then
            echo "   A Record: $ip"
        fi
    done
    
    # Get certificate status
    echo ""
    log_info "Certificate provisioning status:"
    CERT_STATUS=$(gcloud beta run domain-mappings describe --domain=$DOMAIN --region=$REGION --format="value(status.conditions[?type='CertificateProvisioned'].message)" | head -1)
    if [ -n "$CERT_STATUS" ]; then
        echo "   $CERT_STATUS"
    fi
    
    READY_STATUS=$(gcloud beta run domain-mappings describe --domain=$DOMAIN --region=$REGION --format="value(status.conditions[?type='Ready'].message)" | head -1)
    if [ -n "$READY_STATUS" ]; then
        echo "   $READY_STATUS"
    fi
else
    log_error "Domain mapping not found in Google Cloud"
    echo "Run: ./setup-domain.sh $DOMAIN"
    exit 1
fi

echo ""
echo "=== DNS RESOLUTION TESTS ==="
echo ""

# Test with different DNS servers
DNS_SERVERS=("8.8.8.8" "1.1.1.1" "208.67.222.222")

for dns in "${DNS_SERVERS[@]}"; do
    log_info "Testing DNS resolution with $dns..."
    
    # Check A records
    A_RECORDS=$(dig +short @$dns $DOMAIN A 2>/dev/null || echo "")
    if [ -n "$A_RECORDS" ]; then
        log_success "A records found:"
        echo "$A_RECORDS" | while read ip; do
            echo "   $ip"
        done
    else
        log_warning "No A records found"
    fi
    
    # Check AAAA records
    AAAA_RECORDS=$(dig +short @$dns $DOMAIN AAAA 2>/dev/null || echo "")
    if [ -n "$AAAA_RECORDS" ]; then
        log_success "AAAA records found:"
        echo "$AAAA_RECORDS" | while read ip; do
            echo "   $ip"
        done
    else
        log_warning "No AAAA records found"
    fi
    
    echo ""
done

# Check nameservers
log_info "Checking domain nameservers..."
NS_SERVERS=$(dig +short $DOMAIN NS 2>/dev/null || echo "")
if [ -n "$NS_SERVERS" ]; then
    log_success "Nameservers:"
    echo "$NS_SERVERS" | while read ns; do
        echo "   $ns"
    done
else
    log_warning "No nameservers found"
fi

echo ""

# Check SOA record for propagation info
log_info "Checking SOA record for DNS info..."
SOA_RECORD=$(dig +short $DOMAIN SOA 2>/dev/null | head -1)
if [ -n "$SOA_RECORD" ]; then
    log_success "SOA record found:"
    echo "   $SOA_RECORD"
else
    log_warning "No SOA record found"
fi

echo ""
echo "=== TROUBLESHOOTING RECOMMENDATIONS ==="
echo ""

# Check if any A records exist
if [ -z "$(dig +short @8.8.8.8 $DOMAIN A)" ]; then
    log_error "No A records found in DNS!"
    echo ""
    echo "📋 Please verify in Porkbun that you have added:"
    echo "   Type: A"
    echo "   Host: @ (or blank/root)"
    echo "   Value: 216.239.32.21"
    echo "   TTL: 300"
    echo ""
    echo "   Type: A"
    echo "   Host: @ (or blank/root)"
    echo "   Value: 216.239.34.21"
    echo "   TTL: 300"
    echo ""
    echo "   Type: A"
    echo "   Host: @ (or blank/root)"
    echo "   Value: 216.239.36.21"
    echo "   TTL: 300"
    echo ""
    echo "   Type: A"
    echo "   Host: @ (or blank/root)"
    echo "   Value: 216.239.38.21"
    echo "   TTL: 300"
    echo ""
    echo "🔧 Steps to fix:"
    echo "1. Login to Porkbun: https://porkbun.com/account"
    echo "2. Find domain: $DOMAIN"
    echo "3. Go to DNS Records"
    echo "4. Add the A records above"
    echo "5. Save and wait 5-30 minutes"
    echo ""
else
    log_success "A records found in DNS - checking if they match Google Cloud..."
    
    # Compare expected vs actual
    EXPECTED_IPS=("216.239.32.21" "216.239.34.21" "216.239.36.21" "216.239.38.21")
    ACTUAL_IPS=($(dig +short @8.8.8.8 $DOMAIN A))
    
    echo ""
    log_info "Expected IPs: ${EXPECTED_IPS[*]}"
    log_info "Actual IPs:   ${ACTUAL_IPS[*]}"
    
    # Check if all expected IPs are present
    MISSING_IPS=()
    for expected in "${EXPECTED_IPS[@]}"; do
        if ! [[ " ${ACTUAL_IPS[@]} " =~ " ${expected} " ]]; then
            MISSING_IPS+=("$expected")
        fi
    done
    
    if [ ${#MISSING_IPS[@]} -eq 0 ]; then
        log_success "All expected A records are properly configured!"
        echo ""
        log_info "Certificate should provision automatically within 24 hours."
        echo "Monitor with: gcloud beta run domain-mappings describe --domain=$DOMAIN --region=$REGION"
    else
        log_warning "Missing A records: ${MISSING_IPS[*]}"
        echo "Please add these missing A records in Porkbun."
    fi
fi

echo ""
echo "=== MONITORING COMMANDS ==="
echo ""
echo "# Check domain mapping status"
echo "gcloud beta run domain-mappings describe --domain=$DOMAIN --region=$REGION"
echo ""
echo "# Test domain periodically"
echo "./diagnose-dns.sh $DOMAIN"
echo ""
echo "# Test connectivity"
echo "./deploy-utils.sh test-domain $DOMAIN"
echo ""
log_info "Diagnosis completed!"