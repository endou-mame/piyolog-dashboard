// Database types for Piyolog Dashboard
// Using functional programming style - no classes

export type ActivityType =
  | 'feeding'
  | 'sleeping'
  | 'diaper'
  | 'temperature'
  | 'weight'
  | 'height'
  | 'bath'
  | 'walk'
  | 'medicine'
  | 'hospital'

// D1 database record (as stored in SQLite)
export type D1PiyologRecord = {
  id: number
  timestamp: string // ISO 8601 string
  activity_type: string
  duration_minutes: number | null
  quantity_ml: number | null
  notes: string | null
  imported_at: string
  imported_filename: string | null
}

// Application domain record (TypeScript-friendly)
export type PiyologRecord = {
  id: number
  timestamp: Date
  activityType: ActivityType
  duration?: number
  quantity?: number
  notes?: string
  metadata: {
    importedAt: Date
    importedFilename?: string
  }
}

// Conversion functions (pure functions, no classes)
export const fromD1Record = (d1Record: D1PiyologRecord): PiyologRecord => ({
  id: d1Record.id,
  timestamp: new Date(d1Record.timestamp),
  activityType: d1Record.activity_type as ActivityType,
  duration: d1Record.duration_minutes ?? undefined,
  quantity: d1Record.quantity_ml ?? undefined,
  notes: d1Record.notes ?? undefined,
  metadata: {
    importedAt: new Date(d1Record.imported_at),
    importedFilename: d1Record.imported_filename ?? undefined,
  },
})

export const toD1Record = (
  record: Omit<PiyologRecord, 'id'>
): Omit<D1PiyologRecord, 'id'> => ({
  timestamp: record.timestamp.toISOString(),
  activity_type: record.activityType,
  duration_minutes: record.duration ?? null,
  quantity_ml: record.quantity ?? null,
  notes: record.notes ?? null,
  imported_at: record.metadata.importedAt.toISOString(),
  imported_filename: record.metadata.importedFilename ?? null,
})

// Batch insert data structure
export type BatchInsertData = {
  records: Array<Omit<PiyologRecord, 'id'>>
}

// Query filter options
export type RecordQueryFilters = {
  startDate?: string // ISO 8601
  endDate?: string
  activityType?: ActivityType
  limit?: number
  offset?: number
}