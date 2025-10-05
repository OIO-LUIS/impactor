# Deployment Guide for Impactor Rails App

This guide covers deploying your Rails application to Google Cloud Run with PostgreSQL on Cloud SQL.

## Prerequisites

- Docker Desktop installed and running
- Google Cloud CLI (`gcloud`) installed and authenticated
- Project ID: `meteor-madness-app`
- Region: `us-central1`

## Quick Start

1. **Deploy the application:**
   ```bash
   ./deploy.sh
   ```

2. **Check deployment status:**
   ```bash
   ./deploy-utils.sh check-service
   ```

## Scripts Overview

### `deploy.sh`
Main deployment script that:
- Builds Docker image with timestamp tags
- Pushes to Google Artifact Registry
- Deploys to Cloud Run with proper configuration
- Tests the deployment
- Provides service URL

### `deploy-utils.sh`
Utility script for deployment management:
- `setup-secrets`: Create/update database-url secret
- `check-secrets`: Verify all required secrets exist
- `check-service`: Check Cloud Run service status
- `logs`: View recent application logs
- `rollback`: Rollback to previous revision
- `cleanup`: Clean up old Docker images

## Environment Configuration

### Required Secrets
The following secrets must exist in Google Secret Manager:
- `rails-master-key`: Rails master key for production
- `database-url`: PostgreSQL connection string (auto-generated)
- `db-user`: Database username
- `db-password`: Database password
- `db-name`: Database name

### Cloud Run Configuration
- **Service**: `app-web`
- **Region**: `us-central1`
- **Platform**: Managed
- **Authentication**: Allow unauthenticated
- **Resources**: 1 CPU, 1GB RAM
- **Scaling**: 0-10 instances
- **Port**: 3000
- **Timeout**: 300 seconds

### Cloud SQL Integration
- **Instance**: `rails-postgres`
- **Connection**: Via Unix domain socket
- **Authentication**: Service account (`rails-deployer`)

## Usage Examples

### Basic Deployment
```bash
# Deploy with latest changes
./deploy.sh
```

### Check Status
```bash
# Verify all secrets exist
./deploy-utils.sh check-secrets

# Check service health
./deploy-utils.sh check-service

# View recent logs
./deploy-utils.sh logs
```

### Troubleshooting
```bash
# Check application logs
./deploy-utils.sh logs

# Rollback to previous version
./deploy-utils.sh rollback

# Clean up old images to save space
./deploy-utils.sh cleanup
```

## Deployment Process

1. **Pre-flight checks**: Verify gcloud config and secrets
2. **Build**: Create Docker image for linux/amd64
3. **Push**: Upload image to Artifact Registry
4. **Deploy**: Create/update Cloud Run service
5. **Test**: Verify service responds correctly
6. **Report**: Display service URL and status

## Key Features

### ✅ Improvements Made
- **Error handling**: Script exits on any failure
- **Colored output**: Clear status messages
- **Timestamped images**: Unique tags for each deployment
- **Pre-flight checks**: Verify configuration before deployment
- **Automatic testing**: Verify deployment success
- **Proper secret management**: Secure handling of credentials
- **Resource limits**: Prevent runaway costs
- **Comprehensive logging**: Detailed deployment information

### 🔧 Configuration
- Uses timestamped Docker tags (`prod-YYYYMMDDHHMM`)
- Proper Cloud SQL connection string format
- Rails production environment variables
- Service account with minimal required permissions

### 🛡️ Security
- No secrets in environment variables or logs
- Service account authentication
- HTTPS-only communication
- Secure secret management via Google Secret Manager

## Common Issues

### Database Connection Issues
- Ensure `database-url` secret has correct format
- Verify Cloud SQL instance is running
- Check service account permissions

### Docker Build Issues
- Ensure Docker Desktop is running
- Check for sufficient disk space
- Verify Artifact Registry permissions

### Service Not Responding
- Check application logs: `./deploy-utils.sh logs`
- Verify port configuration (Rails should bind to $PORT)
- Check startup timeout settings

## Manual Commands

If you need to run individual commands:

```bash
# Build and push manually
docker buildx build --platform linux/amd64 -t IMAGE_URL .
docker push IMAGE_URL

# Deploy manually
gcloud run deploy app-web \
  --image IMAGE_URL \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated

# Check service status
gcloud run services describe app-web --region us-central1

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=app-web" --limit=50
```

## Support

For issues or questions:
1. Check the logs: `./deploy-utils.sh logs`
2. Verify service status: `./deploy-utils.sh check-service`
3. Review this documentation
4. Check Google Cloud Console for detailed error messages