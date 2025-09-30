// API Client for Piyolog Dashboard
// Functional programming style - pure functions for HTTP communication

import type {
  GetRecordsQuery,
  GetRecordsResponse,
  BatchInsertRequest,
  BatchInsertResponse,
  DeleteRecordsResponse,
  StatsResponse,
  ErrorResponse,
} from '../types/api'

// API client configuration
export type APIClientConfig = {
  baseURL: string
  username: string
  password: string
  timeout?: number // milliseconds
}

// API error types
export type APIError = {
  type: 'network' | 'timeout' | 'auth' | 'server' | 'client' | 'unknown'
  status?: number
  message: string
  details?: unknown
}

// API result type
export type APIResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: APIError
    }

// Create authorization header
export const createAuthHeader = (username: string, password: string): string => {
  const credentials = btoa(`${username}:${password}`)
  return `Basic ${credentials}`
}

// Create fetch options with auth
export const createFetchOptions = (
  config: APIClientConfig,
  options: RequestInit = {}
): RequestInit => {
  const headers = new Headers(options.headers)
  headers.set('Authorization', createAuthHeader(config.username, config.password))
  headers.set('Content-Type', 'application/json')

  return {
    ...options,
    headers,
  }
}

// Create AbortSignal with timeout
export const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

// Parse API error from response
export const parseAPIError = async (response: Response): Promise<APIError> => {
  const status = response.status

  // Handle 401 Unauthorized
  if (status === 401) {
    return {
      type: 'auth',
      status,
      message: 'Authentication failed. Please check your credentials.',
    }
  }

  // Try to parse error response body
  try {
    const errorResponse = (await response.json()) as ErrorResponse
    return {
      type: status >= 500 ? 'server' : 'client',
      status,
      message: errorResponse.message || response.statusText,
      details: errorResponse.details,
    }
  } catch {
    // Failed to parse JSON error
    return {
      type: status >= 500 ? 'server' : 'client',
      status,
      message: response.statusText || 'Unknown error',
    }
  }
}

// Generic fetch with retry logic
export const fetchWithRetry = async <T>(
  url: string,
  config: APIClientConfig,
  options: RequestInit = {},
  retries = 3
): Promise<APIResult<T>> => {
  const timeout = config.timeout ?? 10000
  const signal = createTimeoutSignal(timeout)

  const fetchOptions = createFetchOptions(config, {
    ...options,
    signal,
  })

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions)

      // Success response
      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data: data as T,
        }
      }

      // Non-retryable errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const error = await parseAPIError(response)
        return {
          success: false,
          error,
        }
      }

      // Server errors (5xx) or rate limiting (429) - retry
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Max retries reached
      const error = await parseAPIError(response)
      return {
        success: false,
        error,
      }
    } catch (error) {
      // Network or timeout error
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Max retries reached
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            type: 'timeout',
            message: `Request timed out after ${timeout}ms`,
          },
        }
      }

      return {
        success: false,
        error: {
          type: 'network',
          message: error instanceof Error ? error.message : 'Network error',
        },
      }
    }
  }

  // Should never reach here
  return {
    success: false,
    error: {
      type: 'unknown',
      message: 'Unknown error occurred',
    },
  }
}

// Build query string from object
export const buildQueryString = (params: Record<string, string | number | undefined>): string => {
  const entries = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)

  return entries.length > 0 ? `?${entries.join('&')}` : ''
}

// API Client class (for convenience, wraps functional API)
export const createAPIClient = (config: APIClientConfig) => ({
  // GET /api/records - Fetch records with filters
  getRecords: async (query?: GetRecordsQuery): Promise<APIResult<GetRecordsResponse>> => {
    const queryString = query ? buildQueryString(query) : ''
    const url = `${config.baseURL}/api/records${queryString}`
    return fetchWithRetry<GetRecordsResponse>(url, config, { method: 'GET' })
  },

  // POST /api/records - Batch insert records
  insertRecords: async (request: BatchInsertRequest): Promise<APIResult<BatchInsertResponse>> => {
    const url = `${config.baseURL}/api/records`
    return fetchWithRetry<BatchInsertResponse>(url, config, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // DELETE /api/records - Clear all records
  deleteAllRecords: async (): Promise<APIResult<DeleteRecordsResponse>> => {
    const url = `${config.baseURL}/api/records`
    return fetchWithRetry<DeleteRecordsResponse>(url, config, { method: 'DELETE' })
  },

  // GET /api/records/stats - Get summary statistics
  getStats: async (): Promise<APIResult<StatsResponse>> => {
    const url = `${config.baseURL}/api/records/stats`
    return fetchWithRetry<StatsResponse>(url, config, { method: 'GET' })
  },

  // GET /health - Health check (no auth required)
  healthCheck: async (): Promise<
    APIResult<{ status: string; timestamp: string; environment: string }>
  > => {
    const url = `${config.baseURL}/health`
    // Health check doesn't need auth or retry
    try {
      const response = await fetch(url, { signal: createTimeoutSignal(5000) })
      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      }
      const error = await parseAPIError(response)
      return { success: false, error }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'network',
          message: error instanceof Error ? error.message : 'Network error',
        },
      }
    }
  },
})

// Map API error to user-friendly message
export const formatAPIError = (error: APIError): string => {
  switch (error.type) {
    case 'network':
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
    case 'timeout':
      return 'リクエストがタイムアウトしました。もう一度お試しください。'
    case 'auth':
      return '認証に失敗しました。パスワードを確認してください。'
    case 'server':
      return `サーバーエラーが発生しました: ${error.message}`
    case 'client':
      return `リクエストエラー: ${error.message}`
    default:
      return `エラーが発生しました: ${error.message}`
  }
}
