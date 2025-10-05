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
SERVICE_ACCOUNT_NAME="github-actions-deployer"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="github-actions-key.json"

log_info "Setting up GitHub Actions service account for project: $PROJECT_ID"
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

# Create service account
log_info "Creating service account: $SERVICE_ACCOUNT_NAME"
if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" >/dev/null 2>&1; then
    log_warning "Service account already exists: $SERVICE_ACCOUNT_EMAIL"
else
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="GitHub Actions Deployer" \
        --description="Service account for GitHub Actions deployments"
    log_success "Service account created: $SERVICE_ACCOUNT_EMAIL"
fi

# Define required roles
ROLES=(
    "roles/run.developer"
    "roles/artifactregistry.writer"
    "roles/cloudsql.client"
    "roles/secretmanager.secretAccessor"
    "roles/iam.serviceAccountUser"
)

# Grant permissions
log_info "Granting IAM permissions..."
for role in "${ROLES[@]}"; do
    log_info "Granting role: $role"
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="$role" \
        --quiet
done
log_success "IAM permissions granted"

# Create service account key
log_info "Creating service account key..."
if [ -f "$KEY_FILE" ]; then
    log_warning "Key file already exists: $KEY_FILE"
    read -p "Do you want to create a new key? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Using existing key file"
    else
        rm "$KEY_FILE"
        gcloud iam service-accounts keys create "$KEY_FILE" \
            --iam-account="$SERVICE_ACCOUNT_EMAIL"
        log_success "New service account key created: $KEY_FILE"
    fi
else
    gcloud iam service-accounts keys create "$KEY_FILE" \
        --iam-account="$SERVICE_ACCOUNT_EMAIL"
    log_success "Service account key created: $KEY_FILE"
fi

# Display setup instructions
echo ""
log_success "Service account setup completed!"
echo ""
echo "Next steps:"
echo "1. Copy the contents of $KEY_FILE to your GitHub repository secrets"
echo "2. Go to your GitHub repository → Settings → Secrets and variables → Actions"
echo "3. Add a new secret named 'GCP_SA_KEY' with the key file contents"
echo ""

log_info "Displaying key file contents for copying:"
echo "----------------------------------------"
cat "$KEY_FILE"
echo "----------------------------------------"
echo ""

log_warning "IMPORTANT: After copying the key to GitHub, delete the local file for security:"
echo "rm $KEY_FILE"
echo ""

log_info "GitHub Actions workflow is ready to use!"
echo "The workflow will run automatically when you:"
echo "- Push to master/main branch (runs tests + deploys)"
echo "- Create pull requests (runs tests only)"
echo ""

log_success "Setup complete! 🚀"