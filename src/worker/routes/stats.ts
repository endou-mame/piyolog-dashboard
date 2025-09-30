// Stats API route
// Functional programming style

import { Hono } from 'hono'
import type { Bindings, StatsResponse } from '../../types/api'
import { jsonResponse, errorResponse } from '../../lib/api-utils'
import { getSummaryStats } from '../../lib/db-utils'

const stats = new Hono<{ Bindings: Bindings }>()

// GET /api/records/stats - Get summary statistics
stats.get('/', async (c) => {
  try {
    const summary = await getSummaryStats(c.env.DB)

    const response: StatsResponse = {
      totalRecords: summary.totalRecords,
      dateRange: {
        oldestRecord: summary.oldestRecord,
        newestRecord: summary.newestRecord,
      },
      activityTypeCounts: summary.activityTypeCounts,
    }

    return jsonResponse(c, response)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return errorResponse(
      c,
      500,
      'STATS_ERROR',
      'Failed to fetch statistics',
      error instanceof Error ? error.message : String(error)
    )
  }
})

export default stats