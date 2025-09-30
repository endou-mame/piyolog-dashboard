// Records API routes
// Functional programming style - pure handler functions

import { Hono } from 'hono'
import type { Bindings, GetRecordsQuery, GetRecordsResponse, DeleteRecordsResponse, BatchInsertRequest, BatchInsertResponse } from '../../types/api'
import { jsonResponse, errorResponse, parseQueryParam, parseIntQueryParam, validateRequiredFields } from '../../lib/api-utils'
import { executeSelectQuery, deleteAllRecords, fromD1Record, batchInsertRecords } from '../../lib/db-utils'
import type { RecordQueryFilters } from '../../types/database'
import { toD1Record } from '../../types/database'

const records = new Hono<{ Bindings: Bindings }>()

// GET /api/records - Fetch all records with optional filters
records.get('/', async (c) => {
  try {
    const query = c.req.query() as GetRecordsQuery

    // Build filters from query parameters
    const filters: RecordQueryFilters = {
      startDate: parseQueryParam(query.startDate),
      endDate: parseQueryParam(query.endDate),
      activityType: parseQueryParam(query.activityType) as RecordQueryFilters['activityType'],
      limit: parseIntQueryParam(query.limit),
      offset: parseIntQueryParam(query.offset),
    }

    // Execute query
    const d1Records = await executeSelectQuery(c.env.DB, filters)

    // Convert D1 records to application records
    const appRecords = d1Records.map(fromD1Record)

    const response: GetRecordsResponse = {
      records: appRecords,
      totalCount: appRecords.length,
    }

    return jsonResponse(c, response)
  } catch (error) {
    console.error('Error fetching records:', error)
    return errorResponse(
      c,
      500,
      'FETCH_ERROR',
      'Failed to fetch records',
      error instanceof Error ? error.message : String(error)
    )
  }
})

// POST /api/records - Batch insert records
records.post('/', async (c) => {
  try {
    // Parse request body
    const body = await c.req.json<BatchInsertRequest>()

    // Validate required fields
    const validation = validateRequiredFields(body, ['records'])
    if (!validation.valid) {
      return errorResponse(
        c,
        400,
        'VALIDATION_ERROR',
        'Missing required fields',
        { missing: validation.missing }
      )
    }

    // Validate records array
    if (!Array.isArray(body.records) || body.records.length === 0) {
      return errorResponse(
        c,
        400,
        'VALIDATION_ERROR',
        'records must be a non-empty array'
      )
    }

    // Convert PiyologRecord to D1PiyologRecord format
    const d1Records = body.records.map(toD1Record)

    // Execute batch insert
    const { insertedCount, errors } = await batchInsertRecords(c.env.DB, d1Records)

    const response: BatchInsertResponse = {
      insertedCount,
      errors,
    }

    // Return 207 Multi-Status if there were partial errors, 201 if all succeeded
    const status = errors.length > 0 ? 207 : 201

    return jsonResponse(c, response, status)
  } catch (error) {
    console.error('Error inserting records:', error)
    return errorResponse(
      c,
      500,
      'INSERT_ERROR',
      'Failed to insert records',
      error instanceof Error ? error.message : String(error)
    )
  }
})

// DELETE /api/records - Clear all records
records.delete('/', async (c) => {
  try {
    const deletedCount = await deleteAllRecords(c.env.DB)

    const response: DeleteRecordsResponse = {
      deletedCount,
    }

    return jsonResponse(c, response)
  } catch (error) {
    console.error('Error deleting records:', error)
    return errorResponse(
      c,
      500,
      'DELETE_ERROR',
      'Failed to delete records',
      error instanceof Error ? error.message : String(error)
    )
  }
})

export default records