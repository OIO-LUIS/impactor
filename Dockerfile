# syntax = docker/dockerfile:1

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version and Gemfile
ARG RUBY_VERSION=3.3.0
FROM registry.docker.com/library/ruby:$RUBY_VERSION-slim AS base

# Rails app lives here
WORKDIR /rails

# Set production environment
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build gems and Node.js for importmap/stimulus
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev libvips pkg-config curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install --no-install-recommends -y nodejs

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/

# Configure importmap and stimulus for production
# Pin d3 library for importmap (if not already pinned)
RUN if ! grep -q 'pin "d3"' config/importmap.rb; then \
        ./bin/importmap pin d3; \
    fi

# Ensure importmap is properly configured
# (local assets are automatically pinned via pin_all_from in importmap.rb)

# Update stimulus manifest
RUN ./bin/rails stimulus:manifest:update || true

# Precompiling assets for production without database or credentials
# Skip loading the environment for asset precompilation
RUN RAILS_ENV=production \
    DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    SECRET_KEY_BASE="dummy-secret-key-base-for-asset-precompilation-only-not-for-production-use" \
    ./bin/rails assets:clobber && \
    RAILS_ENV=production \
    DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    SECRET_KEY_BASE="dummy-secret-key-base-for-asset-precompilation-only-not-for-production-use" \
    ./bin/rails assets:precompile --trace


# Final stage for app image
FROM base

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libvips postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built artifacts: gems, application
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /rails /rails

# Run and own only the runtime files as a non-root user for security
RUN useradd rails --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp
USER rails:rails

# Entrypoint prepares the database.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["./bin/rails", "server"]
