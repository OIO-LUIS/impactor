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

# Set the environment variables
export PROJECT_ID="meteor-madness-app"
export REGION="us-central1"
export TIMESTAMP=$(date +"%Y%m%d%H%M")
export IMAGE="us-central1-docker.pkg.dev/meteor-madness-app/app-repo/impactor:prod-${TIMESTAMP}"
export SERVICE_NAME="app-web"

log_info "Starting deployment with the following configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Image: $IMAGE"
echo "  Service: $SERVICE_NAME"
echo ""

# Verify gcloud authentication and project
log_info "Verifying gcloud configuration..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    log_error "Current gcloud project ($CURRENT_PROJECT) doesn't match expected project ($PROJECT_ID)"
    log_info "Run: gcloud config set project $PROJECT_ID"
    exit 1
fi
log_success "gcloud configuration verified"

# Check if required secrets exist
log_info "Checking required secrets..."
REQUIRED_SECRETS=("rails-master-key" "database-url")
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! gcloud secrets describe "$secret" >/dev/null 2>&1; then
        log_error "Required secret '$secret' not found"
        exit 1
    fi
done
log_success "All required secrets found"

# Build and push the Docker image
log_info "Building Docker image for linux/amd64 platform..."
if ! docker buildx build --platform linux/amd64 -t "$IMAGE" .; then
    log_error "Docker build failed"
    exit 1
fi
log_success "Docker image built successfully"

log_info "Pushing Docker image to Artifact Registry..."
if ! docker push "$IMAGE"; then
    log_error "Docker push failed"
    exit 1
fi
log_success "Docker image pushed successfully"

# Get the Cloud SQL instance connection name
log_info "Getting Cloud SQL instance connection name..."
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe rails-postgres --format="value(connectionName)" 2>/dev/null)
if [ -z "$INSTANCE_CONNECTION_NAME" ]; then
    log_error "Could not retrieve Cloud SQL instance connection name"
    exit 1
fi
log_success "Cloud SQL instance connection name: $INSTANCE_CONNECTION_NAME"

# Deploy to Cloud Run
log_info "Deploying to Cloud Run..."
if gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --service-account "rails-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-cloudsql-instances "$INSTANCE_CONNECTION_NAME" \
  --set-secrets "RAILS_MASTER_KEY=rails-master-key:latest,DATABASE_URL=database-url:latest" \
  --set-env-vars "RAILS_ENV=production,RAILS_LOG_TO_STDOUT=true,RAILS_SERVE_STATIC_FILES=true" \
  --cpu=1 \
  --memory=1Gi \
  --concurrency=20 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --port=3000; then
    
    log_success "Deployment completed successfully!"
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")
    
    log_info "Service Details:"
    echo "  Service URL: $SERVICE_URL"
    echo "  Image: $IMAGE"
    echo "  Region: $REGION"
    echo ""
    
    # Test the deployment
    log_info "Testing the deployment..."
    if curl -sf "$SERVICE_URL" >/dev/null; then
        log_success "Service is responding correctly!"
        echo "  You can access your application at: $SERVICE_URL"
    else
        log_warning "Service deployed but may not be responding yet. This can take a few moments."
        log_info "You can check the logs with: gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit=50 --freshness=10m"
    fi
    
else
    log_error "Cloud Run deployment failed"
    exit 1
fi

log_success "Deployment script completed successfully!"
echo ""
