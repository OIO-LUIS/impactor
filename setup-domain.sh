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

# Configuration
PROJECT_ID="meteor-madness-app"
SERVICE_NAME="app-web"
REGION="us-central1"

# Get domain from command line argument
if [ -z "$1" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 impactor.example.com"
    echo "         $0 example.com"
    exit 1
fi

DOMAIN="$1"

log_info "Setting up custom domain: $DOMAIN"
echo ""

# Verify gcloud configuration
log_info "Verifying gcloud configuration..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    log_error "Current gcloud project ($CURRENT_PROJECT) doesn't match expected project ($PROJECT_ID)"
    log_info "Run: gcloud config set project $PROJECT_ID"
    exit 1
fi
log_success "gcloud configuration verified"

# Check if service exists and is healthy
log_info "Checking Cloud Run service status..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null)
if [ -z "$SERVICE_URL" ]; then
    log_error "Cloud Run service '$SERVICE_NAME' not found in region $REGION"
    exit 1
fi
log_success "Service found: $SERVICE_URL"

# Enable required APIs
log_info "Enabling required APIs..."
gcloud services enable run.googleapis.com --quiet
gcloud services enable domains.googleapis.com --quiet
log_success "APIs enabled"

# Check if domain mapping already exists
log_info "Checking if domain mapping already exists..."
if gcloud beta run domain-mappings describe $DOMAIN --region=$REGION >/dev/null 2>&1; then
    log_warning "Domain mapping for $DOMAIN already exists"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deleting existing domain mapping..."
        gcloud beta run domain-mappings delete $DOMAIN --region=$REGION --quiet
        log_success "Existing domain mapping deleted"
    else
        log_info "Using existing domain mapping"
    fi
fi

# Create domain mapping
if ! gcloud beta run domain-mappings describe $DOMAIN --region=$REGION >/dev/null 2>&1; then
    log_info "Creating domain mapping for $DOMAIN..."
    gcloud beta run domain-mappings create \
        --service=$SERVICE_NAME \
        --domain=$DOMAIN \
        --region=$REGION
    log_success "Domain mapping created"
else
    log_success "Domain mapping already exists"
fi

# Get DNS records
log_info "Getting required DNS records..."
DNS_RECORDS=$(gcloud beta run domain-mappings describe $DOMAIN \
    --region=$REGION \
    --format="value(status.resourceRecords[].rrdata)" 2>/dev/null | head -n 1)

if [ -z "$DNS_RECORDS" ]; then
    log_warning "DNS records not yet available. This is normal for new mappings."
    DNS_RECORDS="ghs.googlehosted.com"
fi

echo ""
log_success "Domain mapping setup completed!"
echo ""
echo "=== DNS CONFIGURATION REQUIRED ==="
echo ""
log_info "Configure the following DNS record in Porkbun:"
echo ""

# Determine if it's a subdomain or root domain
if [[ $DOMAIN == *.*.* ]] || [[ $DOMAIN != *.* ]]; then
    # Likely a subdomain (has more than one dot, or no dots)
    SUBDOMAIN=$(echo $DOMAIN | cut -d'.' -f1)
    echo "📋 DNS Record Configuration:"
    echo "   Type:     CNAME"
    echo "   Host:     $SUBDOMAIN"
    echo "   Value:    $DNS_RECORDS"
    echo "   TTL:      300"
else
    # Likely a root domain
    echo "📋 DNS Record Configuration (Root Domain):"
    echo ""
    echo "Option A - Using CNAME (recommended):"
    echo "   Type:     CNAME"
    echo "   Host:     www"
    echo "   Value:    $DNS_RECORDS"
    echo "   TTL:      300"
    echo ""
    echo "   + Set up domain forwarding from root to www in Porkbun"
    echo ""
    echo "Option B - Using A records:"
    echo "   Get IP addresses: nslookup $DNS_RECORDS"
    echo "   Add A records for root domain pointing to those IPs"
fi

echo ""
echo "=== PORKBUN CONFIGURATION STEPS ==="
echo "1. Login to Porkbun: https://porkbun.com/account"
echo "2. Find your domain: $DOMAIN"
echo "3. Click 'DNS Records' or 'Manage DNS'"
echo "4. Add the DNS record shown above"
echo "5. Save changes"
echo ""

# Monitor certificate provisioning
log_info "Monitoring certificate provisioning (this may take a few minutes)..."
echo "You can monitor progress with:"
echo "  gcloud beta run domain-mappings describe $DOMAIN --region=$REGION"
echo ""

# Provide testing commands
echo "=== TESTING COMMANDS ==="
echo ""
echo "After DNS propagation (5-60 minutes), test with:"
echo ""
echo "# Check DNS propagation"
echo "nslookup $DOMAIN"
echo "dig @8.8.8.8 $DOMAIN"
echo ""
echo "# Test HTTP/HTTPS access"
echo "curl -I http://$DOMAIN"
echo "curl -I https://$DOMAIN"
echo ""
echo "# Open in browser"
echo "open https://$DOMAIN"
echo ""

# Provide monitoring commands
echo "=== MONITORING COMMANDS ==="
echo ""
echo "# Check certificate status"
echo "gcloud beta run domain-mappings describe $DOMAIN --region=$REGION --format='value(status.conditions[].status,status.conditions[].type)'"
echo ""
echo "# List all domain mappings"
echo "gcloud beta run domain-mappings list --region=$REGION"
echo ""
echo "# Check service health"
echo "./deploy-utils.sh check-service"
echo ""

# Add to deployment utilities
if [ -f "./deploy-utils.sh" ]; then
    log_info "Updating deploy-utils.sh with domain testing..."
    if ! grep -q "CUSTOM_DOMAIN" "./deploy-utils.sh"; then
        cat >> "./deploy-utils.sh" << EOF

# Test custom domain (added by setup-domain.sh)
test_custom_domain() {
    local domain="\$1"
    if [ -z "\$domain" ]; then
        echo "Usage: ./deploy-utils.sh test-domain <domain>"
        return 1
    fi
    
    log_info "Testing custom domain: \$domain"
    
    # Check DNS
    if nslookup "\$domain" >/dev/null 2>&1; then
        log_success "DNS resolution working"
    else
        log_error "DNS resolution failed"
        return 1
    fi
    
    # Check HTTP/HTTPS
    if curl -sf "https://\$domain" >/dev/null; then
        log_success "HTTPS access working"
    else
        log_warning "HTTPS access failed or not ready"
    fi
    
    # Check certificate
    if openssl s_client -connect "\$domain:443" -servername "\$domain" < /dev/null 2>/dev/null | openssl x509 -noout >/dev/null 2>&1; then
        log_success "SSL certificate valid"
    else
        log_warning "SSL certificate not ready or invalid"
    fi
}

# Add test-domain command
if [ "\${1}" = "test-domain" ]; then
    test_custom_domain "\$2"
    exit 0
fi
EOF
        log_success "Added domain testing to deploy-utils.sh"
        echo "You can now test your domain with: ./deploy-utils.sh test-domain $DOMAIN"
    fi
fi

echo ""
log_success "Domain setup completed!"
log_info "Next steps:"
echo "1. Configure DNS records in Porkbun as shown above"
echo "2. Wait for DNS propagation (5-60 minutes)"
echo "3. Test your domain: ./deploy-utils.sh test-domain $DOMAIN"
echo "4. Monitor certificate: watch 'gcloud beta run domain-mappings describe $DOMAIN --region=$REGION'"
echo ""
log_warning "Note: SSL certificate provisioning can take up to 24 hours in some cases."
echo ""
log_success "Setup script completed! 🚀"