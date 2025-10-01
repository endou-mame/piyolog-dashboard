import { Hono } from 'hono'
import { basicAuth } from 'hono/basic-auth'
import { cors } from 'hono/cors'
import type { Bindings } from '../types/api'
import { jsonResponse, errorResponse } from '../lib/api-utils'
import records from './routes/records'
import stats from './routes/stats'

const app = new Hono<{ Bindings: Bindings }>()

// CORS middleware for development
app.use('*', cors())

// Health check endpoint (public, no auth required)
app.get('/health', (c) => {
  return jsonResponse(c, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'production',
  })
})

// Authentication middleware for all API routes
app.use('/api/*', async (c, next) => {
  const auth = basicAuth({
    username: 'family',
    password: c.env.DASHBOARD_PASSWORD || 'changeme',
  })

  return auth(c, next)
})

// Mount API routes
app.route('/api/records/stats', stats)
app.route('/api/records', records)

// API info endpoint
app.get('/api', (c) => {
  return jsonResponse(c, {
    message: 'Piyolog Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      records: 'GET /api/records',
      recordsCreate: 'POST /api/records',
      recordsDelete: 'DELETE /api/records',
      stats: 'GET /api/records/stats',
    },
  })
})

// Serve static assets and SPA
// Note: When deployed to Cloudflare Workers with [site] configuration,
// static files are automatically served from the bucket specified in wrangler.toml
// This is a fallback for local development
app.get('*', async (c) => {
  // For API routes, this won't be reached due to earlier route definitions
  // For other routes, serve index.html for SPA routing
  return c.html('<h1>Piyolog Dashboard</h1><p>Static assets served via Cloudflare Workers Site</p>')
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return errorResponse(c, 500, 'INTERNAL_ERROR', 'An unexpected error occurred', {
    message: err.message,
  })
})

export default app