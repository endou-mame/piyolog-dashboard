// API types for Piyolog Dashboard
// Functional programming style - no classes

import type { PiyologRecord, ActivityType } from './database'

// Environment bindings for Cloudflare Workers
export type Bindings = {
  DB: D1Database
  DASHBOARD_PASSWORD: string
}

// API Request/Response types

// POST /api/records - Batch insert
export type BatchInsertRequest = {
  records: Array<Omit<PiyologRecord, 'id'>>
}

export type BatchInsertResponse = {
  insertedCount: number
  errors: RecordError[]
}

export type RecordError = {
  index: number
  message: string
}

// GET /api/records - Fetch records
export type GetRecordsQuery = {
  startDate?: string // ISO 8601
  endDate?: string
  activityType?: ActivityType
  limit?: string
  offset?: string
}

export type GetRecordsResponse = {
  records: PiyologRecord[]
  totalCount: number
}

// DELETE /api/records - Clear all records
export type DeleteRecordsResponse = {
  deletedCount: number
}

// GET /api/records/stats - Summary statistics
export type StatsResponse = {
  totalRecords: number
  dateRange: {
    oldestRecord: string | null
    newestRecord: string | null
  }
  activityTypeCounts: Record<string, number>
}

// Error response
export type ErrorResponse = {
  error: string
  message: string
  details?: unknown
}