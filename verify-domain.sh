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

log_info "Domain verification guide for: $DOMAIN"
echo ""

log_info "Checking current verification status..."
VERIFIED_DOMAINS=$(gcloud domains list-user-verified 2>/dev/null | grep -c "$DOMAIN" || echo "0")

if [ "$VERIFIED_DOMAINS" -gt 0 ]; then
    log_success "Domain $DOMAIN is already verified!"
    echo ""
    log_info "You can now proceed with domain mapping:"
    echo "  ./setup-domain.sh $DOMAIN"
    exit 0
fi

log_warning "Domain $DOMAIN is not yet verified"
echo ""

echo "=== DOMAIN VERIFICATION OPTIONS ==="
echo ""

echo "📋 Option 1: Google Search Console (Recommended)"
echo "1. Visit: https://search.google.com/search-console"
echo "2. Click 'Add property' and select 'Domain'"
echo "3. Enter: $DOMAIN"
echo "4. Choose verification method:"
echo "   - DNS record (easiest for Porkbun)"
echo "   - HTML file upload"
echo "   - HTML meta tag"
echo ""

echo "📋 Option 2: Google Cloud Console"
echo "1. Visit: https://console.cloud.google.com/appengine/settings/domains"
echo "2. Click 'Add a custom domain'"
echo "3. Enter: $DOMAIN"
echo "4. Follow verification steps"
echo ""

echo "📋 Option 3: Command Line (Advanced)"
echo "1. Enable Domain Verification API:"
echo "   gcloud services enable siteverification.googleapis.com"
echo "2. Get verification token:"
echo "   gcloud domains verify $DOMAIN"
echo ""

echo "=== DNS VERIFICATION (PORKBUN) ==="
echo ""
log_info "If using DNS verification, you'll add a TXT record like this:"
echo ""
echo "Type:     TXT"
echo "Host:     @ (or root/blank)"
echo "Value:    google-site-verification=XXXXXX... (from verification process)"
echo "TTL:      300"
echo ""

echo "=== VERIFICATION STATUS CHECK ==="
echo ""
echo "After completing verification, check status with:"
echo "  gcloud domains list-user-verified"
echo "  ./verify-domain.sh $DOMAIN"
echo ""
echo "Then proceed with domain mapping:"
echo "  ./setup-domain.sh $DOMAIN"
echo ""

log_warning "Note: Domain verification can take a few minutes to propagate"
echo ""

# Optional: Try to initiate verification process
read -p "Would you like me to try initiating the verification process? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Enabling Site Verification API..."
    gcloud services enable siteverification.googleapis.com --quiet
    
    log_info "Attempting to get verification token..."
    echo ""
    echo "If this fails, please use the Google Search Console method above."
    echo ""
    
    # This might not work for all domains, but worth trying
    if gcloud domains verify "$DOMAIN" 2>/dev/null; then
        log_success "Verification initiated! Follow the instructions above."
    else
        log_warning "Command-line verification not available for this domain."
        log_info "Please use Google Search Console: https://search.google.com/search-console"
    fi
fi

echo ""
log_info "After verification, run: ./setup-domain.sh $DOMAIN"