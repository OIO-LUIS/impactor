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
REGION="us-central1"

show_help() {
    echo "Deployment Utilities for Impactor Rails App"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup-secrets     Create or update the database-url secret"
    echo "  check-secrets     Verify all required secrets exist"
    echo "  check-service     Check the current Cloud Run service status"
    echo "  logs              View recent application logs"
    echo "  rollback          Rollback to previous revision"
    echo "  cleanup           Clean up old Docker images"
    echo "  help              Show this help message"
    echo ""
}

setup_secrets() {
    log_info "Setting up secrets for deployment..."
    
    # Check if individual database secrets exist
    if ! gcloud secrets describe db-user >/dev/null 2>&1 ||
       ! gcloud secrets describe db-password >/dev/null 2>&1 ||
       ! gcloud secrets describe db-name >/dev/null 2>&1; then
        log_error "Individual database secrets (db-user, db-password, db-name) not found"
        log_info "Please create these secrets first using:"
        echo "  gcloud secrets create db-user --data-file=-"
        echo "  gcloud secrets create db-password --data-file=-"
        echo "  gcloud secrets create db-name --data-file=-"
        exit 1
    fi
    
    log_info "Creating/updating database-url secret..."
    DB_USER=$(gcloud secrets versions access latest --secret="db-user")
    DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password")
    DB_NAME=$(gcloud secrets versions access latest --secret="db-name")
    
    # Create the proper DATABASE_URL for Cloud SQL with Unix domain sockets
    DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME?host=/cloudsql/$PROJECT_ID:$REGION:rails-postgres"
    
    if gcloud secrets describe database-url >/dev/null 2>&1; then
        echo "$DATABASE_URL" | gcloud secrets versions add database-url --data-file=-
        log_success "database-url secret updated"
    else
        echo "$DATABASE_URL" | gcloud secrets create database-url --data-file=-
        log_success "database-url secret created"
    fi
}

check_secrets() {
    log_info "Checking required secrets..."
    
    REQUIRED_SECRETS=("rails-master-key" "database-url" "db-user" "db-password" "db-name")
    ALL_EXIST=true
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if gcloud secrets describe "$secret" >/dev/null 2>&1; then
            echo "  ✓ $secret"
        else
            echo "  ✗ $secret (missing)"
            ALL_EXIST=false
        fi
    done
    
    if $ALL_EXIST; then
        log_success "All required secrets exist"
    else
        log_error "Some secrets are missing"
        exit 1
    fi
}

check_service() {
    log_info "Checking Cloud Run service status..."
    
    if gcloud run services describe app-web --region="$REGION" >/dev/null 2>&1; then
        SERVICE_URL=$(gcloud run services describe app-web --region="$REGION" --format="value(status.url)")
        READY_STATUS=$(gcloud run services describe app-web --region="$REGION" --format="value(status.conditions[0].status)")
        
        echo "  Service URL: $SERVICE_URL"
        echo "  Status: $READY_STATUS"
        
        if [ "$READY_STATUS" = "True" ]; then
            log_success "Service is ready and healthy"
            
            # Test if service responds
            if curl -sf "$SERVICE_URL" >/dev/null; then
                log_success "Service is responding to requests"
            else
                log_warning "Service exists but may not be responding"
            fi
        else
            log_warning "Service exists but is not ready"
        fi
    else
        log_error "Cloud Run service 'app-web' not found in region $REGION"
        exit 1
    fi
}

show_logs() {
    log_info "Fetching recent application logs..."
    gcloud logging read \
        "resource.type=cloud_run_revision AND resource.labels.service_name=app-web" \
        --limit=50 \
        --format="value(timestamp, severity, textPayload)" \
        --freshness=1h
}

rollback() {
    log_info "Available revisions for rollback:"
    gcloud run revisions list --service=app-web --region="$REGION" --format="table(metadata.name,status.conditions[0].status,metadata.creationTimestamp)"
    
    echo ""
    read -p "Enter revision name to rollback to: " REVISION_NAME
    
    if [ -n "$REVISION_NAME" ]; then
        log_info "Rolling back to revision: $REVISION_NAME"
        gcloud run services update-traffic app-web --region="$REGION" --to-revisions="$REVISION_NAME=100"
        log_success "Rollback completed"
    else
        log_error "No revision specified"
    fi
}

cleanup_images() {
    log_info "Listing old Docker images in Artifact Registry..."
    gcloud artifacts docker images list us-central1-docker.pkg.dev/$PROJECT_ID/app-repo/impactor \
        --include-tags --format="table(IMAGE,TAGS,CREATE_TIME)"
    
    echo ""
    log_warning "This will delete old images to free up space"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Keep only the 5 most recent images
        gcloud artifacts docker images list us-central1-docker.pkg.dev/$PROJECT_ID/app-repo/impactor \
            --format="value(IMAGE)" --limit=999 --sort-by="CREATE_TIME" | head -n -5 | \
            while read -r image; do
                log_info "Deleting old image: $image"
                gcloud artifacts docker images delete "$image" --quiet
            done
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Main script logic
case "${1:-help}" in
    "setup-secrets")
        setup_secrets
        ;;
    "check-secrets")
        check_secrets
        ;;
    "check-service")
        check_service
        ;;
    "logs")
        show_logs
        ;;
    "rollback")
        rollback
        ;;
    "cleanup")
        cleanup_images
        ;;
    "help"|*)
        show_help
        ;;
esac
# Test custom domain (added by setup-domain.sh)
test_custom_domain() {
    local domain="$1"
    if [ -z "$domain" ]; then
        echo "Usage: ./deploy-utils.sh test-domain <domain>"
        return 1
    fi
    
    log_info "Testing custom domain: $domain"
    
    # Check DNS
    if nslookup "$domain" >/dev/null 2>&1; then
        log_success "DNS resolution working"
    else
        log_error "DNS resolution failed"
        return 1
    fi
    
    # Check HTTP/HTTPS
    if curl -sf "https://$domain" >/dev/null; then
        log_success "HTTPS access working"
    else
        log_warning "HTTPS access failed or not ready"
    fi
    
    # Check certificate
    if openssl s_client -connect "$domain:443" -servername "$domain" < /dev/null 2>/dev/null | openssl x509 -noout >/dev/null 2>&1; then
        log_success "SSL certificate valid"
    else
        log_warning "SSL certificate not ready or invalid"
    fi
}

# Add test-domain command
if [ "${1}" = "test-domain" ]; then
    test_custom_domain "$2"
    exit 0
fi
