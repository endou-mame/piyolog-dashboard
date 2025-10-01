# Deployment Guide - Cloudflare Workers

## Overview

This guide covers deploying the Piyolog Dashboard to Cloudflare Workers. The application is a Single Page Application (SPA) built with React, TypeScript, and Hono.js, optimized for Cloudflare's edge network.

## Prerequisites

### Required
- Node.js 18+ and pnpm 8+
- Cloudflare account (free tier is sufficient)
- Wrangler CLI (included in project dependencies)

### Optional
- GitHub account (for CI/CD)
- Custom domain (for production deployment)

## Architecture

```
┌─────────────────────────────────────────────┐
│         Cloudflare Edge Network             │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │      Hono.js Worker (src/worker/)    │  │
│  │                                      │  │
│  │  ┌────────────┐  ┌──────────────┐  │  │
│  │  │ Static     │  │ API Routes   │  │  │
│  │  │ Assets     │  │ /api/*       │  │  │
│  │  │ (React SPA)│  │              │  │  │
│  │  └────────────┘  └──────────────┘  │  │
│  │                                      │  │
│  │  Authentication: Basic Auth          │  │
│  │  Storage: LocalStorage (client-side)│  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build the Application

Build the React SPA and prepare for deployment:

```bash
pnpm build
```

This will:
- Compile TypeScript to JavaScript
- Bundle React application with Vite
- Optimize assets (minify, tree-shake)
- Generate production build in `dist/` folder

**Build Output:**
```
dist/
├── index.html          # SPA entry point
├── assets/
│   ├── index-[hash].js       # Main bundle
│   ├── react-vendor-[hash].js  # React dependencies
│   ├── chart-vendor-[hash].js  # Chart.js dependencies
│   ├── analytics-[hash].js     # Analytics modules
│   └── index-[hash].css        # Styles
```

### 3. Configure Wrangler

The `wrangler.toml` file is already configured for deployment:

```toml
name = "piyolog-dashboard"
main = "src/worker/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = "./dist"

[vars]
ENVIRONMENT = "development"
```

**Important Settings:**
- `name`: Your worker name (appears in Cloudflare dashboard)
- `main`: Entry point for the worker (Hono.js app)
- `site.bucket`: Static assets directory (built React app)
- `compatibility_date`: Cloudflare Workers runtime version

### 4. Set Up Secrets

Set the dashboard password for Basic Auth:

```bash
# Development
wrangler secret put DASHBOARD_PASSWORD
# Enter your password when prompted

# Production (if using different environments)
wrangler secret put DASHBOARD_PASSWORD --env production
```

**Note:** Secrets are encrypted and stored securely by Cloudflare. They are never exposed in your code or logs.

### 5. Deploy to Cloudflare Workers

Deploy the application:

```bash
pnpm deploy
# or
wrangler deploy
```

**What happens during deployment:**
1. Wrangler bundles the worker code (`src/worker/index.ts`)
2. Uploads static assets from `dist/` folder
3. Configures routes and bindings
4. Deploys to Cloudflare's global edge network
5. Returns deployment URL

**Expected Output:**
```
⛅️ wrangler 3.22.0
-------------------
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded piyolog-dashboard (X.XX sec)
Published piyolog-dashboard (X.XX sec)
  https://piyolog-dashboard.<your-subdomain>.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 6. Verify Deployment

Test the deployment:

```bash
# Health check (public endpoint)
curl https://piyolog-dashboard.<your-subdomain>.workers.dev/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-10-02T...",
#   "environment": "development"
# }
```

**Manual Testing:**
1. Open the deployment URL in your browser
2. You should see the Piyolog Dashboard landing page
3. Try importing a Piyolog file
4. Verify data analysis and visualization works

## Environment Configuration

### Development vs. Production

**Development:**
```bash
wrangler deploy
```

**Production:**
```toml
# Add to wrangler.toml
[env.production]
vars = { ENVIRONMENT = "production" }
```

```bash
wrangler deploy --env production
```

### Environment Variables

**Available Variables:**
- `ENVIRONMENT`: "development" or "production"
- `DASHBOARD_PASSWORD`: Basic Auth password (secret)

**Setting Variables:**
```bash
# Public variables (in wrangler.toml)
[vars]
ENVIRONMENT = "production"

# Secrets (via CLI)
wrangler secret put DASHBOARD_PASSWORD
```

## Custom Domain Setup

### Prerequisites
- Domain registered with Cloudflare (or DNS managed by Cloudflare)
- Cloudflare Workers subscription (if using Workers Custom Domains)

### Steps

1. **Add Custom Domain in Cloudflare Dashboard:**
   - Go to Workers & Pages
   - Select your worker
   - Navigate to "Triggers" > "Custom Domains"
   - Click "Add Custom Domain"
   - Enter your domain (e.g., `dashboard.example.com`)

2. **Update wrangler.toml:**
```toml
[env.production]
routes = [
  { pattern = "dashboard.example.com/*", zone_name = "example.com" }
]
```

3. **Deploy:**
```bash
wrangler deploy --env production
```

## Monitoring and Maintenance

### Logs

**View Real-Time Logs:**
```bash
wrangler tail
```

**Filter Logs:**
```bash
wrangler tail --status error
wrangler tail --method POST
```

### Metrics

View metrics in Cloudflare Dashboard:
- Workers & Pages > Your Worker > Metrics
- Request count, error rate, CPU time, bandwidth

### Rollback

If a deployment has issues:

```bash
# View previous deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback [deployment-id]
```

## Troubleshooting

### Build Fails

**Error:** `TypeScript compilation errors`
**Solution:**
```bash
# Check for type errors
pnpm run build
# Fix any TypeScript errors in src/
```

### Deployment Fails

**Error:** `Authentication error`
**Solution:**
```bash
# Login to Cloudflare
wrangler login

# Verify account
wrangler whoami
```

**Error:** `Exceeded worker size limit`
**Solution:**
- Check bundle size in `dist/`
- Optimize imports (use tree-shaking)
- Consider code splitting

### Runtime Errors

**Error:** `DASHBOARD_PASSWORD not set`
**Solution:**
```bash
wrangler secret put DASHBOARD_PASSWORD
```

**Error:** `Static assets not found`
**Solution:**
- Verify `dist/` folder exists
- Run `pnpm build` before deploying
- Check `wrangler.toml` [site] configuration

### API Authentication Fails

**Error:** `401 Unauthorized` when accessing API
**Solution:**
- Verify Basic Auth credentials
- Username: `family`
- Password: Value you set with `wrangler secret put DASHBOARD_PASSWORD`

## CI/CD with GitHub Actions

### Setup

1. **Create GitHub Secrets:**
   - `CLOUDFLARE_API_TOKEN`: API token from Cloudflare dashboard
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
   - `DASHBOARD_PASSWORD`: Dashboard password

2. **Create Workflow File:**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test -- --run

      - name: Build
        run: pnpm build

      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
          secrets: |
            DASHBOARD_PASSWORD
        env:
          DASHBOARD_PASSWORD: ${{ secrets.DASHBOARD_PASSWORD }}
```

## Performance Optimization

### Build Optimization

Already configured in `vite.config.ts`:
- ✅ Code splitting (vendor chunks)
- ✅ Minification (terser)
- ✅ Tree shaking
- ✅ Source maps (for debugging)
- ✅ Console removal in production

### Runtime Optimization

- ✅ Edge computing (low latency)
- ✅ Global CDN (Cloudflare network)
- ✅ Static asset caching
- ✅ Compression (gzip/brotli)

### Further Optimizations

**Caching Headers:**
```typescript
// In src/worker/index.ts
app.get('/assets/*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
})
```

**Security Headers:**
```typescript
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
})
```

## Security Best Practices

### Secrets Management
- ✅ Never commit secrets to version control
- ✅ Use `wrangler secret put` for sensitive values
- ✅ Rotate passwords regularly

### Authentication
- ✅ Basic Auth for API endpoints
- ✅ Strong password requirements
- ⚠️ Consider OAuth for production

### Data Privacy
- ✅ Client-side storage (LocalStorage)
- ✅ No server-side data persistence (privacy-first)
- ✅ CORS configured appropriately

### Content Security
- ⚠️ Add Content Security Policy headers
- ⚠️ Implement rate limiting
- ⚠️ Add CSRF protection

## Cost Estimation

### Cloudflare Workers Free Tier
- **Requests:** 100,000 per day
- **CPU Time:** 10ms per request
- **Duration:** 50ms per request

**Expected Usage:**
- Typical request: < 5ms CPU time
- Static assets: Cached, minimal CPU
- API requests: 5-10ms CPU time

**Estimated Cost:**
- **Free tier:** Sufficient for personal use (< 3,000 requests/month)
- **Paid tier:** $5/month for 10M requests (if needed)

## Backup and Disaster Recovery

### Data Backup
- No server-side data storage
- All data in client LocalStorage
- Users responsible for data export

### Application Backup
- Code in Git repository
- Deployment history in Cloudflare
- Easy rollback with `wrangler rollback`

### Recovery Plan
1. Rollback to previous deployment
2. Re-deploy from Git
3. Verify with health check endpoint

## Next Steps

1. ✅ Deploy to Cloudflare Workers
2. ✅ Verify deployment with health check
3. ✅ Test with real Piyolog data
4. ⚠️ Set up custom domain (optional)
5. ⚠️ Configure CI/CD pipeline
6. ⚠️ Enable monitoring and alerts
7. ⚠️ Set up staging environment

## Support and Resources

### Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono.js Documentation](https://hono.dev/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

### Community
- [Cloudflare Workers Discord](https://discord.gg/cloudflaredev)
- [Hono.js GitHub](https://github.com/honojs/hono)

### Project Resources
- GitHub Repository: (add your repo URL)
- Issues: (add issues URL)
- Documentation: `/docs` folder
