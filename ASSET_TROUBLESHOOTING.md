# Asset Troubleshooting Guide - Production Deployment Issues

## 🔍 Problem Diagnosed

**Issue**: Assets are not displaying in production, with logs showing:
```
ActionController::RoutingError (No route matches [GET] "/assets/controllers/neo_selector_controller")
```

**Root Cause**: Importmap is looking for incorrect URLs. Instead of:
- ❌ `/assets/controllers/neo_selector_controller` 
- ✅ Should be: `/assets/controllers/neo_selector_controller-[hash].js`

## 💡 Solutions

### Solution 1: Fix Production Configuration (Recommended)

Add explicit static file serving configuration to production.rb:

```ruby
# config/environments/production.rb
config.public_file_server.enabled = true
config.public_file_server.headers = {
  'Cache-Control' => 'public, max-age=31557600' # 1 year
}
```

### Solution 2: Force Asset Precompilation with Correct Environment

Update the production configuration to ensure proper asset resolution:

```ruby
# config/environments/production.rb
config.assets.compile = false
config.assets.unknown_asset_fallback = false
config.assets.digest = true
```

### Solution 3: Fix Importmap Resolution in Production

Ensure importmap tags work correctly in production by updating the layout:

```erb
<!-- app/views/layouts/application.html.erb -->
<%= javascript_importmap_tags %>
```

### Solution 4: Verify Docker Build Process

Ensure the Docker build includes all necessary steps:

1. Assets are compiled with correct hashes
2. Importmap configuration is included
3. Stimulus manifest is updated

## 🔧 Immediate Fixes to Implement

### Fix 1: Update Production Environment Configuration

```ruby
# Add to config/environments/production.rb
config.public_file_server.enabled = true
config.public_file_server.headers = {
  'Cache-Control' => 'public, max-age=31557600'
}

# Ensure proper asset configuration
config.assets.compile = false
config.assets.digest = true
config.assets.debug = false
config.assets.compress = true
```

### Fix 2: Add Asset Debugging in Production (Temporary)

Add temporary logging to see what's happening:

```ruby
# Add to config/environments/production.rb (temporarily for debugging)
config.log_level = :debug
config.assets.debug = false
config.assets.logger = Rails.logger
```

### Fix 3: Force Importmap Regeneration

Ensure the Docker build properly regenerates importmap:

```dockerfile
# In Dockerfile, after copying application code
RUN ./bin/importmap pin --all
RUN ./bin/rails stimulus:manifest:update
```

## 🚀 Quick Fix Commands

Run these commands to fix the immediate issue:

```bash
# 1. Force regenerate importmap locally
./bin/importmap pin --all

# 2. Update stimulus manifest
./bin/rails stimulus:manifest:update

# 3. Clean and rebuild assets
RAILS_ENV=production ./bin/rails assets:clobber
RAILS_ENV=production ./bin/rails assets:precompile

# 4. Commit and redeploy
git add -A
git commit -m "Fix asset loading in production"
git push origin master
```

## 📊 Verification Steps

After implementing fixes:

1. **Check Asset URLs**: Visit your site and inspect network tab
2. **Verify Manifest**: Check `public/assets/.sprockets-manifest-*.json`
3. **Test Importmap**: Check importmap resolution with `bin/rails console`
4. **Monitor Logs**: Watch Cloud Run logs for 404 errors

## 🎯 Expected Results

After fixes:
- ✅ No more 404 errors for `/assets/controllers/*`
- ✅ Correct URLs like `/assets/controllers/neo_selector_controller-[hash].js`
- ✅ JavaScript and CSS loading properly
- ✅ Stimulus controllers working
- ✅ D3.js functionality available

## 🔄 Testing Locally vs Production

**Local Development:**
- Uses non-digested asset names
- Assets compiled on-demand
- Importmap resolves directly

**Production:**
- Uses digested asset names (with hashes)
- Assets must be precompiled
- Importmap must resolve to digested names

## 📝 Common Issues and Solutions

### Issue: Assets load locally but not in production
**Solution**: Ensure `config.public_file_server.enabled = true` and `RAILS_SERVE_STATIC_FILES=true`

### Issue: Importmap doesn't resolve in production  
**Solution**: Run `bin/rails stimulus:manifest:update` in Docker build

### Issue: CSS/JS files have 404 errors
**Solution**: Verify assets are properly precompiled with digests

### Issue: Old cached assets
**Solution**: Clear browser cache and ensure proper Cache-Control headers

## 🚨 Emergency Rollback

If issues persist after deployment:

```bash
# Rollback to previous working revision
gcloud run services update-traffic app-web --to-revisions=PREVIOUS_REVISION=100 --region=us-central1
```