# Deployment Guide

This guide walks you through deploying the Cloudflare Agent to production.

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Node.js 20+ installed

## Setup Steps

### 1. Authentication

```bash
# Authenticate with Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

### 2. Create Cloudflare Resources

#### KV Namespace for Caching

```bash
# Production
wrangler kv:namespace create "CACHE" --env production

# Staging
wrangler kv:namespace create "CACHE" --env staging

# Development
wrangler kv:namespace create "CACHE" --env development
```

#### D1 Database for Conversations

```bash
# Create database
wrangler d1 create agent-conversations

# Deploy schema
wrangler d1 execute agent-conversations --file=./schema.sql
```

### 3. Configure wrangler.toml

Update the `wrangler.toml` file with your resource IDs:

```toml
# Update these with your actual IDs
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

[[d1_databases]]
binding = "DB"
database_name = "agent-conversations"
database_id = "your-d1-database-id"
```

### 4. Set Secrets

```bash
# Required: Context7 API key
wrangler secret put CONTEXT7_API_KEY

# Optional: Anthropic API key
wrangler secret put ANTHROPIC_API_KEY
```

### 5. Deploy

#### Manual Deployment

```bash
# Development
npm run dev

# Staging
wrangler deploy --env staging

# Production
wrangler deploy --env production
```

#### Automated Deployment (CI/CD)

Set up GitHub secrets:

1. Go to your repository settings
2. Add these secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - Add other secrets as needed

The GitHub Actions workflow will automatically:

- Run tests on every PR
- Deploy to staging on develop branch
- Deploy to production on main branch

## Environment Configuration

### Development

- Uses preview KV and D1 instances
- Debug logging enabled
- Hot reload with `wrangler dev`

### Staging

- Separate KV and D1 instances
- Production-like configuration
- Used for testing before production

### Production

- Production KV and D1 instances
- Optimized performance settings
- Error tracking and monitoring

## Monitoring & Maintenance

### Health Checks

Monitor the `/health` endpoint:

```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

### Logs

View real-time logs:

```bash
# Follow logs
wrangler tail

# Filter by environment
wrangler tail --env production
```

### Analytics

Check usage in Cloudflare Dashboard:

- Workers > Analytics
- D1 > Metrics
- KV > Metrics

### Database Maintenance

```bash
# Run migrations
wrangler d1 execute agent-conversations --file=./migrations/001_add_index.sql

# Backup data
wrangler d1 export agent-conversations --output=backup.sql

# View database stats
wrangler d1 execute agent-conversations --command="SELECT COUNT(*) FROM conversations"
```

## Performance Optimization

### KV Configuration

```bash
# Set TTL for cached data
wrangler kv:key put --binding=CACHE "key" "value" --ttl=3600
```

### D1 Optimization

- Regular cleanup of old conversations
- Index optimization for queries
- Connection pooling (automatic)

### Worker Configuration

- CPU limits: 50ms (free), 30s (paid)
- Memory limits: 128MB
- Request limits: 100k/day (free), unlimited (paid)

## Troubleshooting

### Common Issues

1. **"KV binding not found"**
   - Check KV namespace IDs in wrangler.toml
   - Verify namespace exists in Cloudflare dashboard

2. **"D1 database not found"**
   - Check database ID in wrangler.toml
   - Ensure database exists and schema is deployed

3. **"Context7 API key not set"**
   - Set secret with `wrangler secret put CONTEXT7_API_KEY`
   - Verify secret exists with `wrangler secret list`

4. **Rate limiting issues**
   - Check KV namespace permissions
   - Verify rate limit configuration

### Debug Mode

Enable debug logging:

```bash
# Set log level
wrangler secret put LOG_LEVEL debug

# Check logs
wrangler tail --format=pretty
```

### Rollback

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback [deployment-id]
```

## Security Checklist

- [ ] API keys stored as secrets (not in code)
- [ ] Rate limiting configured
- [ ] CORS headers properly set
- [ ] Input validation enabled
- [ ] Error messages don't leak sensitive data
- [ ] Database access restricted to worker
- [ ] KV namespace access restricted

## Cost Optimization

### Free Tier Limits

- Workers: 100k requests/day
- KV: 100k reads/day, 1k writes/day
- D1: 25 million reads, 50k writes/day

### Paid Plan Benefits

- Unlimited requests
- Higher KV and D1 limits
- Advanced analytics
- Custom domains

Monitor usage in Cloudflare Dashboard to avoid unexpected charges.
