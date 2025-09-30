// Database utility functions
// Functional programming style - pure functions, no classes

import type { D1Database } from '@cloudflare/workers-types'
import type { D1PiyologRecord, RecordQueryFilters } from '../types/database'

// Build SELECT query with filters
export const buildSelectQuery = (filters?: RecordQueryFilters): string => {
  let query = 'SELECT * FROM piyolog_records'
  const conditions: string[] = []

  if (filters?.startDate) {
    conditions.push('timestamp >= ?')
  }
  if (filters?.endDate) {
    conditions.push('timestamp <= ?')
  }
  if (filters?.activityType) {
    conditions.push('activity_type = ?')
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  query += ' ORDER BY timestamp DESC'

  if (filters?.limit) {
    query += ' LIMIT ?'
  }
  if (filters?.offset) {
    query += ' OFFSET ?'
  }

  return query
}

// Build query parameters array
export const buildQueryParams = (filters?: RecordQueryFilters): unknown[] => {
  const params: unknown[] = []

  if (filters?.startDate) params.push(filters.startDate)
  if (filters?.endDate) params.push(filters.endDate)
  if (filters?.activityType) params.push(filters.activityType)
  if (filters?.limit) params.push(filters.limit)
  if (filters?.offset) params.push(filters.offset)

  return params
}

// Execute query with filters
export const executeSelectQuery = async (
  db: D1Database,
  filters?: RecordQueryFilters
): Promise<D1PiyologRecord[]> => {
  const query = buildSelectQuery(filters)
  const params = buildQueryParams(filters)

  const stmt = db.prepare(query)
  const boundStmt = params.reduce((acc, param) => acc.bind(param), stmt)
  const { results } = await boundStmt.all<D1PiyologRecord>()

  return results ?? []
}

// Get summary statistics
export const getSummaryStats = async (
  db: D1Database
): Promise<{
  totalRecords: number
  oldestRecord: string | null
  newestRecord: string | null
  activityTypeCounts: Record<string, number>
}> => {
  // Get total count and date range
  const countQuery = `
    SELECT
      COUNT(*) as total_records,
      MIN(timestamp) as oldest_record,
      MAX(timestamp) as newest_record
    FROM piyolog_records
  `
  const countResult = await db.prepare(countQuery).first<{
    total_records: number
    oldest_record: string | null
    newest_record: string | null
  }>()

  // Get activity type counts
  const typeQuery = `
    SELECT activity_type, COUNT(*) as count
    FROM piyolog_records
    GROUP BY activity_type
  `
  const typeResults = await db.prepare(typeQuery).all<{
    activity_type: string
    count: number
  }>()

  const activityTypeCounts = (typeResults.results ?? []).reduce(
    (acc, row) => ({
      ...acc,
      [row.activity_type]: row.count,
    }),
    {} as Record<string, number>
  )

  return {
    totalRecords: countResult?.total_records ?? 0,
    oldestRecord: countResult?.oldest_record ?? null,
    newestRecord: countResult?.newest_record ?? null,
    activityTypeCounts,
  }
}

// Delete all records
export const deleteAllRecords = async (db: D1Database): Promise<number> => {
  const result = await db.prepare('DELETE FROM piyolog_records').run()
  return result.meta.changes ?? 0
}

// Batch insert records using D1 batch API
export const batchInsertRecords = async (
  db: D1Database,
  records: Array<Omit<import('../types/database').D1PiyologRecord, 'id'>>
): Promise<{ insertedCount: number; errors: Array<{ index: number; message: string }> }> => {
  const errors: Array<{ index: number; message: string }> = []

  // Create prepared statements for each record
  const statements = records.map((record, index) => {
    try {
      return db
        .prepare(
          `INSERT INTO piyolog_records
           (timestamp, activity_type, duration_minutes, quantity_ml, notes, imported_at, imported_filename)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          record.timestamp,
          record.activity_type,
          record.duration_minutes,
          record.quantity_ml,
          record.notes,
          record.imported_at,
          record.imported_filename
        )
    } catch (error) {
      errors.push({
        index,
        message: error instanceof Error ? error.message : 'Failed to prepare statement',
      })
      return null
    }
  })

  // Filter out failed statements
  const validStatements = statements.filter(
    (stmt): stmt is Exclude<typeof stmt, null> => stmt !== null
  )

  if (validStatements.length === 0) {
    return { insertedCount: 0, errors }
  }

  try {
    // Execute batch insert
    const results = await db.batch(validStatements)

    // Count successful inserts
    const insertedCount = results.filter((result) => result.success).length

    // Collect errors from failed inserts
    results.forEach((result, index) => {
      if (!result.success && result.error) {
        errors.push({
          index,
          message: result.error,
        })
      }
    })

    return { insertedCount, errors }
  } catch (error) {
    // If batch operation fails entirely, add a general error
    errors.push({
      index: -1,
      message: error instanceof Error ? error.message : 'Batch operation failed',
    })
    return { insertedCount: 0, errors }
  }
}