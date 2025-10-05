# Running Rake Tasks on Cloud Run

This guide explains how to run Rails rake tasks on our Cloud Run infrastructure, since we're using serverless Cloud Run services instead of traditional VM instances.

## Overview

Our application is deployed as a Cloud Run service (`app-web`) in the `meteor-madness-app` GCP project. Since Cloud Run services are serverless and don't allow SSH access like traditional VMs, we need to use Cloud Run Jobs to execute rake tasks.

## Project Configuration

- **Project ID**: `meteor-madness-app`
- **Region**: `us-central1`
- **Service Name**: `app-web`
- **Service Account**: `rails-deployer@meteor-madness-app.iam.gserviceaccount.com`
- **Database**: Cloud SQL PostgreSQL instance (`rails-postgres`)

## Method: Using Cloud Run Jobs

### Step 1: Get the Current Production Image

First, get the image currently deployed in production:

```bash
gcloud run services describe app-web \
  --project=meteor-madness-app \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].image)"
```

This will output something like:
```
us-central1-docker.pkg.dev/meteor-madness-app/app-repo/impactor:prod-202510051858-330a6e5722fb6a3843e6747a88d7b247473ac6cf
```

### Step 2: Create a Cloud Run Job

Create a Cloud Run job that uses the same environment as your production service:

```bash
gcloud run jobs create JOB_NAME \
  --image=PRODUCTION_IMAGE_URL \
  --region=us-central1 \
  --project=meteor-madness-app \
  --service-account=rails-deployer@meteor-madness-app.iam.gserviceaccount.com \
  --set-cloudsql-instances=$(gcloud sql instances describe rails-postgres --project=meteor-madness-app --format="value(connectionName)") \
  --set-secrets="RAILS_MASTER_KEY=rails-master-key:latest,DATABASE_URL=database-url:latest" \
  --set-env-vars="RAILS_ENV=production,ENV_VAR1=value1,ENV_VAR2=value2" \
  --args="bundle,exec,rake,YOUR_RAKE_TASK" \
  --cpu=1 \
  --memory=1Gi \
  --max-retries=0 \
  --parallelism=1
```

Replace:
- `JOB_NAME` with a descriptive name for your job
- `PRODUCTION_IMAGE_URL` with the image URL from Step 1
- `ENV_VAR1=value1,ENV_VAR2=value2` with any additional environment variables your rake task needs
- `YOUR_RAKE_TASK` with your actual rake task

### Step 3: Execute the Job

```bash
gcloud run jobs execute JOB_NAME --region=us-central1 --project=meteor-madness-app --wait
```

The `--wait` flag will make the command wait until the job completes and show you the final status.

## Real Example: neo:import Task

Here's the complete example we used for running `rake neo:import START_DATE=2025-10-01 END_DATE=2025-10-07`:

### 1. Get Current Image
```bash
gcloud run services describe app-web \
  --project=meteor-madness-app \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].image)"
```

Output: `us-central1-docker.pkg.dev/meteor-madness-app/app-repo/impactor:prod-202510051858-330a6e5722fb6a3843e6747a88d7b247473ac6cf`

### 2. Create the Job
```bash
gcloud run jobs create neo-import-job \
  --image=us-central1-docker.pkg.dev/meteor-madness-app/app-repo/impactor:prod-202510051858-330a6e5722fb6a3843e6747a88d7b247473ac6cf \
  --region=us-central1 \
  --project=meteor-madness-app \
  --service-account=rails-deployer@meteor-madness-app.iam.gserviceaccount.com \
  --set-cloudsql-instances=$(gcloud sql instances describe rails-postgres --project=meteor-madness-app --format="value(connectionName)") \
  --set-secrets="RAILS_MASTER_KEY=rails-master-key:latest,DATABASE_URL=database-url:latest" \
  --set-env-vars="RAILS_ENV=production,START_DATE=2025-10-01,END_DATE=2025-10-07" \
  --args="bundle,exec,rake,neo:import" \
  --cpu=1 \
  --memory=1Gi \
  --max-retries=0 \
  --parallelism=1
```

### 3. Execute the Job
```bash
gcloud run jobs execute neo-import-job --region=us-central1 --project=meteor-madness-app --wait
```

### 4. Check Results
After completion, you can:

- **View execution details**:
  ```bash
  gcloud run jobs executions describe EXECUTION_ID --region=us-central1 --project=meteor-madness-app
  ```

- **View logs**: Visit the Google Cloud Console URL provided in the output, or use:
  ```bash
  gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=neo-import-job" --limit=50 --project=meteor-madness-app
  ```

## Reusing Jobs

Once created, you can reuse the same job for multiple executions:

```bash
gcloud run jobs execute neo-import-job --region=us-central1 --project=meteor-madness-app --wait
```

## Updating Jobs

If you need to change parameters (like environment variables), you can update the existing job:

```bash
gcloud run jobs replace-traffic neo-import-job \
  --set-env-vars="RAILS_ENV=production,START_DATE=2025-10-08,END_DATE=2025-10-14" \
  --region=us-central1 \
  --project=meteor-madness-app
```

Or delete and recreate:

```bash
# Delete existing job
gcloud run jobs delete neo-import-job --region=us-central1 --project=meteor-madness-app --quiet

# Recreate with new parameters
gcloud run jobs create neo-import-job \
  --image=NEW_IMAGE_URL \
  # ... rest of parameters
```

## Common Rake Task Patterns

### 1. Tasks with Environment Variables
```bash
--set-env-vars="RAILS_ENV=production,START_DATE=2025-10-01,END_DATE=2025-10-07,BATCH_SIZE=1000"
```

### 2. Tasks with Arguments
```bash
--args="bundle,exec,rake,db:migrate:status"
--args="bundle,exec,rake,assets:precompile"
--args="bundle,exec,rake,your_namespace:task_name[arg1,arg2]"
```

### 3. Memory-Intensive Tasks
```bash
--memory=2Gi
--cpu=2
```

### 4. Long-Running Tasks
```bash
--task-timeout=3600  # 1 hour timeout
```

## Troubleshooting

### Common Issues

1. **Permission Denied on Secrets**
   - Ensure you're using the correct service account: `rails-deployer@meteor-madness-app.iam.gserviceaccount.com`

2. **Job Already Exists**
   ```bash
   gcloud run jobs delete JOB_NAME --region=us-central1 --project=meteor-madness-app --quiet
   ```

3. **Database Connection Issues**
   - Verify the Cloud SQL instance connection is correctly set
   - Check that the `DATABASE_URL` secret is accessible

4. **Task Fails**
   - Check the execution logs in Google Cloud Console
   - Verify all required environment variables are set
   - Ensure the rake task exists in your codebase

### Viewing Logs

```bash
# Get execution ID from the execute command output, then:
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=JOB_NAME" \
  --limit=100 \
  --project=meteor-madness-app \
  --format="value(timestamp,severity,textPayload)"
```

## Security Notes

- Always use the `rails-deployer` service account which has the necessary permissions
- Secrets are automatically injected as environment variables
- Jobs run in the same network context as your production service
- Cloud SQL connections are handled through the Cloud SQL Proxy automatically

## Best Practices

1. **Use descriptive job names** that indicate their purpose
2. **Set appropriate resource limits** based on your task requirements
3. **Use environment variables** for parameters instead of hardcoding them
4. **Monitor execution time** and set appropriate timeouts
5. **Clean up old jobs** that are no longer needed
6. **Test with smaller datasets** first for data processing tasks
7. **Use the latest production image** to ensure consistency with your deployed code

## Quick Reference Commands

```bash
# List all jobs
gcloud run jobs list --region=us-central1 --project=meteor-madness-app

# Get current production image
gcloud run services describe app-web --project=meteor-madness-app --region=us-central1 --format="value(spec.template.spec.containers[0].image)"

# Execute existing job
gcloud run jobs execute JOB_NAME --region=us-central1 --project=meteor-madness-app --wait

# Delete job
gcloud run jobs delete JOB_NAME --region=us-central1 --project=meteor-madness-app --quiet

# View job executions
gcloud run jobs executions list --job=JOB_NAME --region=us-central1 --project=meteor-madness-app
```