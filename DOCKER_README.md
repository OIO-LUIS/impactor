# Docker Configuration for Prototipo Meteorito

This Rails application includes comprehensive Docker configurations for both development and production environments.

## Prerequisites

- Docker Desktop installed and running
- Rails application with encrypted credentials configured

## Files Overview

```
├── Dockerfile                    # Production Docker image
├── Dockerfile.development        # Development Docker image
├── docker-compose.yml           # Current/legacy compose file
├── docker-compose.prod.yml      # Production environment
├── docker-compose.dev.yml       # Development environment
└── CREDENTIALS_STRUCTURE.md     # Guide for setting up Rails credentials
```

## Setup Rails Credentials

Before using Docker, set up your Rails encrypted credentials:

1. **Edit your credentials:**
   ```bash
   EDITOR="code --wait" rails credentials:edit
   ```

2. **Add the required structure** (see `CREDENTIALS_STRUCTURE.md` for the complete YAML structure)

3. **Set your master key** in your environment or Docker Compose

## Development Environment

### Quick Start

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Or run in background
docker-compose -f docker-compose.dev.yml up -d --build
```

### Features

- **Live code reloading** - Changes to your code are immediately reflected
- **Volume mounting** - Source code, gems, and data persist between container restarts
- **PostgreSQL** on port 5433 (to avoid conflicts with local DB)
- **Redis** on port 6380 (to avoid conflicts with local Redis)
- **Rails server** on port 3000
- **Bundle cache** - Speeds up gem installation
- **Interactive debugging** - Supports `binding.pry` and similar tools

### Optional Services

Enable optional services using profiles:

```bash
# With Mailcatcher for email testing
docker-compose -f docker-compose.dev.yml --profile with-mail up -d

# With Sidekiq for background jobs
docker-compose -f docker-compose.dev.yml --profile with-sidekiq up -d

# With both
docker-compose -f docker-compose.dev.yml --profile with-mail --profile with-sidekiq up -d
```

**Mailcatcher URLs:**
- Web Interface: http://localhost:1080
- SMTP Server: localhost:1025

### Common Development Commands

```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f web

# Run Rails console
docker-compose -f docker-compose.dev.yml exec web rails console

# Run migrations
docker-compose -f docker-compose.dev.yml exec web rails db:migrate

# Run tests
docker-compose -f docker-compose.dev.yml exec web rails test

# Install new gems
docker-compose -f docker-compose.dev.yml exec web bundle install
docker-compose -f docker-compose.dev.yml restart web

# Database operations
docker-compose -f docker-compose.dev.yml exec web rails db:reset
docker-compose -f docker-compose.dev.yml exec web rails db:seed

# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d prototipo_meteorito_development

# Connect to Redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli
```

### Debugging

The development container supports interactive debugging:

```bash
# Attach to the running container for debugging
docker-compose -f docker-compose.dev.yml exec web bash

# View real-time logs
docker-compose -f docker-compose.dev.yml logs -f
```

## Production Environment

### Quick Start

1. **Set your master key:**
   ```bash
   export RAILS_MASTER_KEY=your_master_key_here
   ```

2. **Start production environment:**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```

### Features

- **Multi-stage Docker build** - Optimized production image
- **PostgreSQL** with persistent data
- **Redis** for caching and background jobs
- **Health checks** for all services
- **Automatic restarts** on failure
- **Log aggregation** to stdout
- **Static file serving**

### Optional Nginx Reverse Proxy

Enable Nginx with SSL support:

```bash
# With Nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

**Nginx Configuration Required:**
- Create `config/nginx.conf` with your Nginx configuration
- Place SSL certificates in `config/ssl/`

### Production Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Run migrations
docker-compose -f docker-compose.prod.yml exec web rails db:migrate

# Access Rails console
docker-compose -f docker-compose.prod.yml exec web rails console

# Database backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres prototipo_meteorito_production > backup.sql

# Scale web servers
docker-compose -f docker-compose.prod.yml up --scale web=3 -d
```

## Environment Variables

Only these environment variables are needed:

```bash
# Required
RAILS_MASTER_KEY=your_master_key_here

# Optional (with defaults)
RAILS_ENV=development  # or production
RAILS_MAX_THREADS=5
WEB_CONCURRENCY=1
```

All other configuration (database, Redis, API keys) is stored in Rails encrypted credentials.

## Data Persistence

### Development
- `postgres_dev_data` - PostgreSQL data
- `redis_dev_data` - Redis data
- `bundle_cache` - Gem cache
- `node_modules` - Node.js modules (if applicable)

### Production
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data

## Networking

### Development
- Rails: http://localhost:3000
- PostgreSQL: localhost:5433
- Redis: localhost:6380
- Mailcatcher: http://localhost:1080

### Production
- Rails: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Nginx (if enabled): http://localhost:80, https://localhost:443

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :5432
   lsof -i :6379
   
   # Stop conflicting services
   brew services stop postgresql
   brew services stop redis
   ```

2. **Permission issues:**
   ```bash
   # Fix file permissions
   docker-compose -f docker-compose.dev.yml exec web chown -R rails:rails /rails
   ```

3. **Database connection issues:**
   ```bash
   # Reset database
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d db
   # Wait for DB to be ready, then:
   docker-compose -f docker-compose.dev.yml up web
   ```

4. **Gem installation issues:**
   ```bash
   # Clear bundle cache
   docker-compose -f docker-compose.dev.yml down
   docker volume rm prototipo_meteorito_bundle_cache
   docker-compose -f docker-compose.dev.yml up --build
   ```

### Health Checks

Check service health:

```bash
# Development
docker-compose -f docker-compose.dev.yml ps

# Production
docker-compose -f docker-compose.prod.yml ps
```

### Logs

View specific service logs:

```bash
# Web application logs
docker-compose -f docker-compose.dev.yml logs -f web

# Database logs
docker-compose -f docker-compose.dev.yml logs -f db

# Redis logs
docker-compose -f docker-compose.dev.yml logs -f redis

# All services
docker-compose -f docker-compose.dev.yml logs -f
```

## Cleanup

```bash
# Stop and remove containers, networks
docker-compose -f docker-compose.dev.yml down

# Also remove volumes (careful - this deletes data!)
docker-compose -f docker-compose.dev.yml down -v

# Remove Docker images
docker-compose -f docker-compose.dev.yml down --rmi all

# Clean up unused Docker resources
docker system prune -a
```

## Performance Tips

### Development
- Use volume caching for better performance on macOS/Windows
- Keep bundle cache volume to avoid reinstalling gems
- Use `.dockerignore` to exclude unnecessary files

### Production
- Multi-stage builds reduce final image size
- Health checks ensure service availability
- Use Redis for caching and session storage
- Consider using a CDN for static assets

## Security Notes

1. Never commit `config/master.key` to version control
2. Use strong passwords in production credentials
3. Regularly update Docker base images
4. Use secrets management for production deployments
5. Enable SSL in production (Nginx configuration)
6. Limit database and Redis access in production networks