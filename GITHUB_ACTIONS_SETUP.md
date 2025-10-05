# GitHub Actions CI/CD Setup Guide

This guide will help you set up automatic deployment to Google Cloud Run using GitHub Actions when code is pushed to the master branch.

## 🚀 Overview

The GitHub Actions workflow will:
1. **Run tests** on every pull request and push
2. **Deploy to Cloud Run** automatically when code is pushed to master
3. **Clean up old Docker images** to save storage costs
4. **Provide deployment summaries** with clickable links

## 📋 Prerequisites

- GitHub repository with your Rails app
- Google Cloud Project: `meteor-madness-app`
- Google Cloud Run service: `app-web`
- All secrets properly configured in Google Secret Manager

## 🔧 Setup Steps

### Step 1: Create Service Account for GitHub Actions

First, create a dedicated service account for GitHub Actions:

```bash
# Create service account
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer" \
  --description="Service account for GitHub Actions deployments"

# Grant necessary permissions
gcloud projects add-iam-policy-binding meteor-madness-app \
  --member="serviceAccount:github-actions-deployer@meteor-madness-app.iam.gserviceaccount.com" \
  --role="roles/run.developer"

gcloud projects add-iam-policy-binding meteor-madness-app \
  --member="serviceAccount:github-actions-deployer@meteor-madness-app.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding meteor-madness-app \
  --member="serviceAccount:github-actions-deployer@meteor-madness-app.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding meteor-madness-app \
  --member="serviceAccount:github-actions-deployer@meteor-madness-app.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding meteor-madness-app \
  --member="serviceAccount:github-actions-deployer@meteor-madness-app.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download service account key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions-deployer@meteor-madness-app.iam.gserviceaccount.com
```

### Step 2: Add GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following repository secrets:

#### Required Secret:
- **`GCP_SA_KEY`**: Contents of the `github-actions-key.json` file you just created

```bash
# Display the key content to copy to GitHub
cat github-actions-key.json
```

⚠️ **Security Note**: After copying the key content, delete the local file:
```bash
rm github-actions-key.json
```

### Step 3: Update Workflow Configuration (Optional)

The workflow is pre-configured for your project, but you may want to customize:

**File**: `.github/workflows/deploy.yml`

Key configuration variables:
```yaml
env:
  PROJECT_ID: meteor-madness-app
  REGION: us-central1
  SERVICE_NAME: app-web
  REGISTRY: us-central1-docker.pkg.dev
  REPOSITORY: app-repo
  IMAGE_NAME: impactor
```

### Step 4: Customize Test Configuration

Update the test section if needed:

```yaml
- name: Run tests
  env:
    RAILS_ENV: test
    DATABASE_URL: postgres://postgres:postgres@localhost:5432/impactor_test
  run: |
    bundle exec rspec
    # Add your test commands:
    # bundle exec cucumber
    # yarn test
    # bundle exec rubocop
```

### Step 5: Verify Ruby and Node Versions

Ensure the workflow uses the correct versions:

```yaml
- name: Set up Ruby
  uses: ruby/setup-ruby@v1
  with:
    ruby-version: 3.3.0  # Update to match your .ruby-version file

- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'    # Update to match your .nvmrc or package.json
```

## 🎯 Workflow Triggers

The workflow runs on:

1. **Push to master/main branch** → Runs tests + deploys
2. **Pull requests to master/main** → Runs tests only
3. **Manual trigger** (via GitHub Actions UI)

## 📊 Workflow Jobs

### Job 1: Test
- Sets up Ruby, Node.js, and PostgreSQL
- Installs dependencies
- Runs database setup
- Executes test suite
- Performs security audit

### Job 2: Deploy (only on master push)
- Builds Docker image with unique tag
- Pushes to Google Artifact Registry
- Deploys to Cloud Run
- Tests deployment
- Cleans up old images
- Creates deployment summary

### Job 3: Notify Failure
- Runs only if previous jobs fail
- Creates helpful error summary

## 🔍 Monitoring and Debugging

### View Workflow Status
- Go to your GitHub repository → Actions tab
- Click on any workflow run to see detailed logs

### Debug Failed Deployments
1. Check the GitHub Actions logs
2. Look for specific error messages
3. Verify secrets are properly set
4. Check Google Cloud Console for service status

### Local Testing
You can test the deployment locally before pushing:
```bash
# Run your local deploy script
./deploy.sh

# Check status
./deploy-utils.sh check-service
```

## 🏷️ Image Tagging Strategy

The workflow creates unique image tags:
```
prod-{YYYYMMDDHHMM}-{git-commit-sha}
```

Example: `prod-202510050130-a1b2c3d4`

This ensures:
- ✅ No tag conflicts
- ✅ Easy rollback to specific commits
- ✅ Clear deployment history

## 🔄 Rollback Process

If you need to rollback a deployment:

### Option 1: Via GitHub (Recommended)
1. Go to GitHub Actions → Find the successful previous deployment
2. Click "Re-run all jobs" on the working version

### Option 2: Via Local Script
```bash
./deploy-utils.sh rollback
```

### Option 3: Via gcloud CLI
```bash
# List revisions
gcloud run revisions list --service=app-web --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic app-web \
  --region=us-central1 \
  --to-revisions=app-web-00001-xyz=100
```

## 🧹 Maintenance

### Clean Up Old Images
The workflow automatically keeps only the 10 most recent images. You can also run:
```bash
./deploy-utils.sh cleanup
```

### Monitor Costs
- Check Artifact Registry storage usage
- Monitor Cloud Run instance hours
- Review GitHub Actions usage (free tier: 2,000 minutes/month)

## 📈 Advanced Features

### Branch-based Deployments
You can extend the workflow for staging deployments:

```yaml
# Add this job for staging
deploy-staging:
  if: github.ref == 'refs/heads/develop'
  # ... deploy to staging service
```

### Slack/Discord Notifications
Add notification steps:

```yaml
- name: Notify Slack
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: "🚀 Deployed to production: ${{ steps.service.outputs.SERVICE_URL }}"
```

### Database Migrations
Add migration step before deployment:

```yaml
- name: Run database migrations
  run: |
    # Run migrations in a temporary Cloud Run job
    gcloud run jobs create migrate-job \
      --image ${{ steps.image.outputs.IMAGE_URL }} \
      --region ${{ env.REGION }} \
      --set-env-vars "RAILS_ENV=production" \
      --set-secrets "DATABASE_URL=database-url:latest" \
      --command="bundle,exec,rails,db:migrate"
```

## 🛡️ Security Best Practices

1. **Minimal Permissions**: Service account has only required permissions
2. **Secure Secrets**: Credentials stored in GitHub Secrets, not code
3. **No Secret Logging**: Secrets never appear in logs
4. **Regular Rotation**: Rotate service account keys periodically
5. **Branch Protection**: Enable branch protection rules for master

## 🚨 Troubleshooting

### Common Issues

**Issue**: "Permission denied" errors
**Solution**: Verify service account permissions and GitHub secret

**Issue**: Tests failing in CI but passing locally
**Solution**: Check database setup and environment variables

**Issue**: Docker build timeouts
**Solution**: Optimize Dockerfile and check GitHub Actions limits

**Issue**: Cloud Run deployment fails
**Solution**: Check service quotas and resource limits

### Getting Help

1. Check GitHub Actions logs for detailed error messages
2. Use local deployment scripts to test: `./deploy.sh`
3. Verify service status: `./deploy-utils.sh check-service`
4. Review Cloud Run logs: `./deploy-utils.sh logs`

## 📝 Next Steps

1. Set up the service account and GitHub secrets
2. Push the workflow file to your repository
3. Create a pull request to test the workflow
4. Merge to master to trigger your first automated deployment!

The workflow is now ready to automatically deploy your Rails application whenever you push to master! 🎉