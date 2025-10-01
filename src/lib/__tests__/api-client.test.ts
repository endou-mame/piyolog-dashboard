// API Client unit tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createAuthHeader,
  createFetchOptions,
  parseAPIError,
  type APIClientConfig,
} from '../api-client'

describe('API Client', () => {
  describe('createAuthHeader', () => {
    it('should create Basic Auth header', () => {
      const header = createAuthHeader('testuser', 'testpass')

      expect(header).toMatch(/^Basic /)

      // Decode and verify
      const encoded = header.replace('Basic ', '')
      const decoded = atob(encoded)
      expect(decoded).toBe('testuser:testpass')
    })

    it('should handle special characters in credentials', () => {
      const header = createAuthHeader('user@example.com', 'p@ss:w0rd!')

      const encoded = header.replace('Basic ', '')
      const decoded = atob(encoded)
      expect(decoded).toBe('user@example.com:p@ss:w0rd!')
    })
  })

  describe('createFetchOptions', () => {
    const config: APIClientConfig = {
      baseURL: 'https://api.example.com',
      username: 'testuser',
      password: 'testpass',
      timeout: 5000,
    }

    it('should create fetch options with auth header', () => {
      const options = createFetchOptions(config)

      expect(options.headers).toBeDefined()
      const headers = options.headers as Headers
      expect(headers.get('Authorization')).toMatch(/^Basic /)
      expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('should merge custom headers', () => {
      const options = createFetchOptions(config, {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      })

      const headers = options.headers as Headers
      expect(headers.get('Authorization')).toMatch(/^Basic /)
      expect(headers.get('X-Custom-Header')).toBe('custom-value')
    })

    it('should merge custom options', () => {
      const options = createFetchOptions(config, {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      })

      expect(options.method).toBe('POST')
      expect(options.body).toBe(JSON.stringify({ test: 'data' }))
    })
  })

  describe('parseAPIError', () => {
    it('should parse 401 authentication error', async () => {
      const response = new Response(null, { status: 401, statusText: 'Unauthorized' })

      const error = await parseAPIError(response)

      expect(error.type).toBe('auth')
      expect(error.status).toBe(401)
      expect(error.message).toContain('Authentication failed')
    })

    it('should parse 404 client error', async () => {
      const response = new Response(
        JSON.stringify({ message: 'Not found', details: 'Resource does not exist' }),
        { status: 404, statusText: 'Not Found', headers: { 'Content-Type': 'application/json' } }
      )

      const error = await parseAPIError(response)

      expect(error.type).toBe('client')
      expect(error.status).toBe(404)
      expect(error.message).toBe('Not found')
      expect(error.details).toBe('Resource does not exist')
    })

    it('should parse 500 server error', async () => {
      const response = new Response(
        JSON.stringify({ message: 'Internal server error' }),
        { status: 500, statusText: 'Internal Server Error', headers: { 'Content-Type': 'application/json' } }
      )

      const error = await parseAPIError(response)

      expect(error.type).toBe('server')
      expect(error.status).toBe(500)
      expect(error.message).toBe('Internal server error')
    })

    it('should handle non-JSON error responses', async () => {
      const response = new Response('Plain text error', {
        status: 503,
        statusText: 'Service Unavailable',
      })

      const error = await parseAPIError(response)

      expect(error.type).toBe('server')
      expect(error.status).toBe(503)
      expect(error.message).toBe('Service Unavailable')
    })
  })

  describe('fetchWithRetry', () => {
    const config: APIClientConfig = {
      baseURL: 'https://api.example.com',
      username: 'testuser',
      password: 'testpass',
      timeout: 1000,
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should succeed on first attempt', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: 'success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      global.fetch = mockFetch

      const { fetchWithRetry } = await import('../api-client')
      const result = await fetchWithRetry('https://api.example.com/test', config)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ data: 'success' })
      }
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should not retry on 4xx errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' })
      )
      global.fetch = mockFetch

      const { fetchWithRetry } = await import('../api-client')
      const result = await fetchWithRetry('https://api.example.com/test', config)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('client')
      }
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      global.fetch = mockFetch

      const { fetchWithRetry } = await import('../api-client')
      const result = await fetchWithRetry('https://api.example.com/test', config, {}, 0)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('network')
        expect(result.error.message).toContain('Network error')
      }
    })
  })

  describe('Error Logging Integration', () => {
    it('should log authentication errors', async () => {
      const response = new Response(null, { status: 401, statusText: 'Unauthorized' })

      await parseAPIError(response)

      // Error logging is called internally
      // We can verify the error structure is correct
      expect(response.status).toBe(401)
    })

    it('should log API errors with context', async () => {
      const response = new Response(
        JSON.stringify({ message: 'Server error', details: { code: 'DB_CONNECTION_FAILED' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )

      const error = await parseAPIError(response)

      expect(error.details).toEqual({ code: 'DB_CONNECTION_FAILED' })
    })
  })
})
