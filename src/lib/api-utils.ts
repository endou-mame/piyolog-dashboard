// API utility functions
// Functional programming style - pure functions, no classes

import type { Context } from 'hono'
import type { Bindings, ErrorResponse } from '../types/api'

// Create error response helper
export const createErrorResponse = (
  error: string,
  message: string,
  details?: unknown
): ErrorResponse => ({
  error,
  message,
  details,
})

// Create JSON response with status code
export const jsonResponse = <T>(c: Context, data: T, status = 200) => {
  return c.json(data, status)
}

// Create error JSON response
export const errorResponse = (
  c: Context,
  status: number,
  error: string,
  message: string,
  details?: unknown
) => {
  return jsonResponse(c, createErrorResponse(error, message, details), status)
}

// Validate required fields in request body
export const validateRequiredFields = <T extends Record<string, unknown>>(
  data: T,
  requiredFields: Array<keyof T>
): { valid: boolean; missing: string[] } => {
  const missing = requiredFields.filter((field) => {
    const value = data[field]
    return value === undefined || value === null
  })

  return {
    valid: missing.length === 0,
    missing: missing.map(String),
  }
}

// Parse query parameters to appropriate types
export const parseQueryParam = (value: string | undefined): string | undefined => {
  return value && value.trim() !== '' ? value : undefined
}

export const parseIntQueryParam = (value: string | undefined): number | undefined => {
  if (!value) return undefined
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? undefined : parsed
}

// CORS headers for local development
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Add CORS headers to response
export const addCorsHeaders = (response: Response): Response => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}