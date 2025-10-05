# Asset Build Process for Production

This document explains the enhanced asset build process that includes D3.js, Stimulus manifest updates, and proper asset precompilation for production deployment.

## What's Included

The build process now includes these steps:
1. **Pin D3.js library** - Ensures D3 is available via importmap
2. **Update Stimulus manifest** - Updates controller manifest for proper loading
3. **Clean and precompile assets** - Full asset pipeline with clobber and precompile

## Build Scripts

### Production Build
```bash
./bin/build-assets
```
- Runs with `RAILS_ENV=production`
- Matches exactly what happens in Docker
- Use this to test production builds locally

### Development Build  
```bash
./bin/build-assets-dev
```
- Runs with `RAILS_ENV=development`
- Useful for testing the build process locally
- Generates non-minified assets for debugging

## Docker Integration

The Dockerfile now automatically includes these build steps:

```dockerfile
# Pin d3 library for importmap (if not already pinned)
RUN if ! grep -q 'pin "d3"' config/importmap.rb; then \
        ./bin/importmap pin d3; \
    fi

# Update stimulus manifest
RUN ./bin/rails stimulus:manifest:update || true

# Precompiling assets for production without database or credentials
RUN RAILS_ENV=production \
    DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    SECRET_KEY_BASE="dummy-secret-key-base-for-asset-precompilation-only-not-for-production-use" \
    ./bin/rails assets:clobber && \
    RAILS_ENV=production \
    DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    SECRET_KEY_BASE="dummy-secret-key-base-for-asset-precompilation-only-not-for-production-use" \
    ./bin/rails assets:precompile
```

### Node.js Installation

The build stage includes Node.js 18 for importmap and stimulus commands:

```dockerfile
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev libvips pkg-config curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install --no-install-recommends -y nodejs
```

## GitHub Actions

Your GitHub Actions workflow automatically includes these steps when building the Docker image. No changes needed to the workflow file - everything happens during the Docker build process.

## D3.js Configuration

D3 is already configured in your `config/importmap.rb`:

```ruby
pin "d3" # @7.9.0
pin "d3-array" # @3.2.4
pin "d3-axis" # @3.0.0
# ... all D3 modules
```

## Troubleshooting

### Build Failures
If asset compilation fails:
1. Check that all required files exist
2. Verify importmap.rb is properly configured  
3. Run `./bin/build-assets-dev` locally to debug

### Missing Assets
If assets don't load in production:
1. Check that `config.assets.compile = false` in production.rb
2. Verify assets are precompiled in Docker build
3. Check that RAILS_SERVE_STATIC_FILES=true in deployment

### Stimulus Controllers
If Stimulus controllers don't load:
1. Make sure controllers are in `app/javascript/controllers/`
2. Check that `stimulus:manifest:update` completed successfully
3. Verify stimulus is properly configured in application.js

## Files Added/Modified

### New Files
- `bin/build-assets` - Production build script
- `bin/build-assets-dev` - Development build script
- `ASSET_BUILD.md` - This documentation

### Modified Files
- `Dockerfile` - Enhanced with Node.js and build steps
- No changes needed to GitHub Actions or Rails config

## Usage in Development

For local development, you can run:
```bash
# Test the full build process
./bin/build-assets-dev

# Or run individual commands
bin/importmap pin d3
bin/rails stimulus:manifest:update
bin/rails assets:clobber
bin/rails assets:precompile
```

## Next Deployment

Your next deployment will automatically include these enhancements:
1. Push your code to the master branch
2. GitHub Actions will build the Docker image with the new process
3. The built image will include properly compiled assets with D3 and Stimulus
4. Deploy to Cloud Run as usual

The production deployment process remains unchanged - all improvements are built into the Docker image automatically.