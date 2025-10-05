# Custom Domain Setup Guide for Cloud Run

This guide walks you through setting up a custom domain from Porkbun for your Google Cloud Run service.

## 🎯 **Overview**

We'll configure your Porkbun domain to point to your Cloud Run service at:
- **Current Service**: https://app-web-jxjcu2bgbq-uc.a.run.app
- **Target Domain**: Your custom domain (e.g., `impactor.yourdomain.com`)

## 📋 **Prerequisites**

- ✅ Cloud Run service deployed and running
- ✅ Domain registered at Porkbun
- ✅ Google Cloud CLI configured
- ✅ Project ID: `meteor-madness-app`

## 🔧 **Step 1: Set Up Domain Mapping in Google Cloud**

### **1.1 Check Current Service Status**

```bash
# Verify your service is running
gcloud run services describe app-web \
  --region=us-central1 \
  --format="value(status.url,status.conditions[0].status)"
```

### **1.2 Enable Required APIs**

```bash
# Enable Cloud Run Admin API (if not already enabled)
gcloud services enable run.googleapis.com

# Enable Cloud Domains API
gcloud services enable domains.googleapis.com
```

### **1.3 Create Domain Mapping**

Replace `YOUR_DOMAIN.com` with your actual domain:

```bash
# Set your domain (replace with your actual domain)
export DOMAIN="YOUR_DOMAIN.com"  # e.g., "impactor.example.com"

# Create domain mapping for Cloud Run
gcloud run domain-mappings create \
  --service=app-web \
  --domain=$DOMAIN \
  --region=us-central1
```

**Expected Output:**
```
✓ Creating new domain mapping...
  Domain mapping creation in progress...
  ✓ Creating domain mapping...done.
  ✓ Waiting for certificate provisioning...
```

### **1.4 Get DNS Records**

After creating the domain mapping, get the required DNS records:

```bash
# Get the required DNS records
gcloud run domain-mappings describe $DOMAIN \
  --region=us-central1 \
  --format="value(status.resourceRecords[].name,status.resourceRecords[].rrdata)"
```

This will show you something like:
```
YOUR_DOMAIN.com    ghs.googlehosted.com
```

## 🌐 **Step 2: Configure DNS in Porkbun**

### **2.1 Access Porkbun DNS Management**

1. **Login to Porkbun**: https://porkbun.com/account
2. **Go to Domain Management**: Find your domain
3. **Click "DNS Records"** or "Manage DNS"

### **2.2 Add DNS Records**

You have two main options:

#### **Option A: Subdomain (Recommended for testing)**

If using a subdomain like `impactor.yourdomain.com`:

1. **Add CNAME Record**:
   - **Type**: CNAME
   - **Host/Name**: `impactor` (or your chosen subdomain)
   - **Points to/Value**: `ghs.googlehosted.com`
   - **TTL**: 300 (5 minutes)

#### **Option B: Root Domain**

If using the root domain like `yourdomain.com`:

1. **Add A Records** (you'll need to get the IP addresses):
   ```bash
   # Get the IP addresses for the root domain
   nslookup ghs.googlehosted.com
   ```
   
   Then add A records pointing to those IPs, or:

2. **Add CNAME for www and redirect root**:
   - **Type**: CNAME
   - **Host/Name**: `www`
   - **Points to/Value**: `ghs.googlehosted.com`
   - **TTL**: 300

### **2.3 Porkbun DNS Configuration Examples**

#### **For Subdomain Setup:**
```
Type    Host        Value                   TTL
CNAME   impactor    ghs.googlehosted.com    300
```

#### **For Root Domain Setup:**
```
Type    Host    Value                   TTL
A       @       216.239.32.21          300
A       @       216.239.34.21          300  
A       @       216.239.36.21          300
A       @       216.239.38.21          300
CNAME   www     ghs.googlehosted.com    300
```

## ⏱️ **Step 3: Wait for DNS Propagation**

DNS changes can take time to propagate:
- **Porkbun**: Usually 5-15 minutes
- **Global propagation**: Up to 48 hours (usually much faster)

### **3.1 Check DNS Propagation**

```bash
# Check if DNS is propagating
nslookup $DOMAIN

# Check specific DNS servers
dig @8.8.8.8 $DOMAIN
dig @1.1.1.1 $DOMAIN

# Online tools (visit in browser):
# https://whatsmydns.net/
# https://dnschecker.org/
```

## 🔒 **Step 4: Verify SSL Certificate**

Google Cloud automatically provisions SSL certificates for custom domains.

### **4.1 Check Certificate Status**

```bash
# Check domain mapping status
gcloud run domain-mappings describe $DOMAIN \
  --region=us-central1 \
  --format="value(status.conditions[0].status,status.conditions[0].type)"
```

### **4.2 Monitor Certificate Provisioning**

```bash
# Watch certificate status (may take 10-60 minutes)
watch -n 30 "gcloud run domain-mappings describe $DOMAIN --region=us-central1 --format='value(status.conditions[].status,status.conditions[].type)'"
```

Expected progression:
1. `False CertificatePending` → Certificate is being issued
2. `True Ready` → Certificate issued and domain is ready

## ✅ **Step 5: Test Your Domain**

### **5.1 Test HTTP/HTTPS Access**

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://$DOMAIN

# Test HTTPS
curl -I https://$DOMAIN

# Test in browser
open https://$DOMAIN
```

### **5.2 Verify SSL Certificate**

```bash
# Check SSL certificate details
openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | openssl x509 -text -noout | grep -A 2 "Subject:"
```

## 🛠️ **Step 6: Update Your Application (Optional)**

### **6.1 Update Allowed Hosts (if needed)**

If your Rails app has host restrictions, update them:

```ruby
# config/environments/production.rb
config.hosts << "your-domain.com"
config.hosts << "www.your-domain.com"
```

### **6.2 Update CORS Settings (if needed)**

```ruby
# config/initializers/cors.rb (if using CORS)
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'your-domain.com', 'www.your-domain.com'
    # ... other CORS settings
  end
end
```

## 🎯 **Automated Setup Script**

Create a script to automate the domain setup:

```bash
#!/bin/bash

# Domain Setup Script
DOMAIN="${1:-yourdomain.com}"
PROJECT_ID="meteor-madness-app"
SERVICE_NAME="app-web"
REGION="us-central1"

echo "Setting up domain: $DOMAIN"

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable run.googleapis.com domains.googleapis.com

# Create domain mapping
echo "Creating domain mapping..."
gcloud run domain-mappings create \
  --service=$SERVICE_NAME \
  --domain=$DOMAIN \
  --region=$REGION

# Get DNS records
echo "DNS Records needed:"
gcloud run domain-mappings describe $DOMAIN \
  --region=$REGION \
  --format="table(status.resourceRecords[].name,status.resourceRecords[].rrdata)"

echo "Configure these DNS records in Porkbun:"
echo "Type: CNAME"
echo "Host: @ (or subdomain)"
echo "Value: ghs.googlehosted.com"
echo "TTL: 300"
```

## 📊 **Monitoring and Troubleshooting**

### **Common Issues:**

#### **Issue: "Domain ownership not verified"**
**Solution**: Ensure DNS records are correctly set in Porkbun

#### **Issue: "Certificate provisioning failed"**
**Solution**: 
1. Check DNS propagation: `dig $DOMAIN`
2. Verify CNAME points to `ghs.googlehosted.com`
3. Wait longer (can take up to 24 hours)

#### **Issue: "404 Not Found on custom domain"**
**Solution**: 
1. Verify domain mapping exists: `gcloud run domain-mappings list --region=us-central1`
2. Check service is healthy: `./deploy-utils.sh check-service`

### **Useful Commands:**

```bash
# List all domain mappings
gcloud run domain-mappings list --region=us-central1

# Delete domain mapping (if needed)
gcloud run domain-mappings delete $DOMAIN --region=us-central1

# Check service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=app-web" --limit=50

# Test connectivity
curl -v https://$DOMAIN
```

## 🔄 **Update Deployment Scripts**

Update your deployment scripts to include the custom domain:

```bash
# Add to deploy-utils.sh check-service function
if [ -n "$CUSTOM_DOMAIN" ]; then
  echo "Testing custom domain: $CUSTOM_DOMAIN"
  curl -sf "https://$CUSTOM_DOMAIN" >/dev/null && echo "✅ Custom domain responding" || echo "❌ Custom domain not responding"
fi
```

## 📝 **Next Steps After Domain Setup**

1. ✅ **Update Documentation**: Add your domain to README.md
2. ✅ **Update GitHub Actions**: Test deployments with new domain
3. ✅ **Setup Monitoring**: Monitor both Cloud Run URL and custom domain
4. ✅ **Consider CDN**: Setup Cloud CDN for better performance
5. ✅ **Setup Analytics**: Configure Google Analytics or similar

## 🎉 **Success Checklist**

- [ ] Domain mapping created in Google Cloud
- [ ] DNS records configured in Porkbun
- [ ] SSL certificate provisioned (HTTPS working)
- [ ] Custom domain responds correctly
- [ ] Redirects from HTTP to HTTPS work
- [ ] Original Cloud Run URL still works
- [ ] Application functions correctly on new domain

---

**🚀 Your custom domain should now be pointing to your Cloud Run service!**

**Need Help?**
- Check DNS: https://whatsmydns.net/
- Test SSL: https://www.ssllabs.com/ssltest/
- Monitor logs: `./deploy-utils.sh logs`