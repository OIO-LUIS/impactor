#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Impactor Deployment Setup Summary${NC}"
echo "========================================"
echo ""

echo -e "${BLUE}📁 Deployment Files Created:${NC}"
echo ""

echo "Local Deployment Scripts:"
echo "  ✅ deploy.sh                 - Enhanced deployment script with error handling"
echo "  ✅ deploy-utils.sh           - Deployment utilities (logs, rollback, cleanup)"
echo "  ✅ setup-github-actions.sh   - Setup script for GitHub Actions service account"
echo ""

echo "GitHub Actions Workflows:"
echo "  ✅ .github/workflows/deploy.yml      - Main CI/CD pipeline"
echo "  ✅ .github/workflows/test-setup.yml  - Setup validation workflow"
echo ""

echo "Documentation:"
echo "  ✅ DEPLOYMENT.md                - Local deployment guide"
echo "  ✅ GITHUB_ACTIONS_SETUP.md      - GitHub Actions setup guide"
echo ""

echo -e "${BLUE}🎯 Quick Start Guide:${NC}"
echo ""

echo "1. Setup GitHub Actions (one-time):"
echo "   ./setup-github-actions.sh"
echo ""

echo "2. Local deployment:"
echo "   ./deploy.sh"
echo ""

echo "3. Check deployment status:"
echo "   ./deploy-utils.sh check-service"
echo ""

echo -e "${BLUE}📊 Current Status:${NC}"

# Check if service is running
if command -v gcloud >/dev/null 2>&1; then
    SERVICE_URL=$(gcloud run services describe app-web --region=us-central1 --format="value(status.url)" 2>/dev/null || echo "Not deployed")
    if [ "$SERVICE_URL" != "Not deployed" ]; then
        echo "  ✅ Service is deployed: $SERVICE_URL"
        if curl -sf "$SERVICE_URL" >/dev/null 2>&1; then
            echo "  ✅ Service is responding correctly"
        else
            echo "  ⚠️  Service deployed but may not be responding"
        fi
    else
        echo "  ❌ Service not deployed yet"
    fi
else
    echo "  ❌ gcloud CLI not found"
fi

echo ""
echo -e "${BLUE}🔄 Workflow Triggers:${NC}"
echo "  • Push to master/main → Tests + Deploy"
echo "  • Pull requests → Tests only"
echo "  • Manual trigger via GitHub Actions UI"
echo ""

echo -e "${BLUE}🛠️  Next Steps:${NC}"
echo "1. Run: ./setup-github-actions.sh (to setup GitHub Actions)"
echo "2. Add GCP_SA_KEY secret to your GitHub repository"
echo "3. Push to master branch to trigger first automated deployment"
echo ""

echo -e "${YELLOW}📖 For detailed instructions, see:${NC}"
echo "  • DEPLOYMENT.md - Local deployment"
echo "  • GITHUB_ACTIONS_SETUP.md - CI/CD setup"
echo ""

echo -e "${GREEN}✨ Your deployment pipeline is ready! ✨${NC}"