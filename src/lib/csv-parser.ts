// CSV parser for Piyolog export format
// Functional programming style - pure functions

import Papa from 'papaparse'
import type { ActivityType, PiyologRecord } from '../types/database'
import { logError } from './error-logger'

// CSV parsing result type
export type CSVParseResult = {
  records: Array<Omit<PiyologRecord, 'id'>>
  errors: CSVParseError[]
  totalRows: number
  successRows: number
}

export type CSVParseError = {
  row: number
  field?: string
  message: string
  rawData?: unknown
}

// Expected CSV header columns for Piyolog export
const EXPECTED_HEADERS = ['timestamp', 'activity_type', 'duration_minutes', 'quantity_ml', 'notes'] as const

// Activity type mapping from CSV to internal type
const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  'feeding': 'feeding',
  'sleeping': 'sleeping',
  'diaper': 'diaper',
  'temperature': 'temperature',
  'weight': 'weight',
  'height': 'height',
  'bath': 'bath',
  'walk': 'walk',
  'medicine': 'medicine',
  'hospital': 'hospital',
}

// Validate CSV headers
export const validateHeaders = (headers: string[]): { valid: boolean; errors: CSVParseError[] } => {
  const errors: CSVParseError[] = []
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase())

  // Check for required headers
  EXPECTED_HEADERS.forEach((expected) => {
    if (!normalizedHeaders.includes(expected)) {
      errors.push({
        row: 0,
        field: expected,
        message: `Missing required header: ${expected}`,
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Parse timestamp string to Date
export const parseTimestamp = (value: string): Date | null => {
  if (!value || value.trim() === '') return null

  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}

// Validate and parse activity type
export const parseActivityType = (value: string): ActivityType | null => {
  if (!value || value.trim() === '') return null

  const normalized = value.trim().toLowerCase()
  return ACTIVITY_TYPE_MAP[normalized] ?? null
}

// Parse numeric value
export const parseNumeric = (value: string): number | undefined => {
  if (!value || value.trim() === '') return undefined

  const parsed = parseFloat(value)
  return isNaN(parsed) ? undefined : parsed
}

// Validate numeric range
export const validateNumericRange = (
  value: number | undefined,
  field: string,
  min?: number,
  max?: number
): string | null => {
  if (value === undefined) return null

  if (min !== undefined && value < min) {
    return `${field} must be >= ${min}, got ${value}`
  }
  if (max !== undefined && value > max) {
    return `${field} must be <= ${max}, got ${value}`
  }

  return null
}

// Parse a single CSV row to PiyologRecord
export const parseCSVRow = (
  row: Record<string, string>,
  rowIndex: number,
  filename: string
): { record: Omit<PiyologRecord, 'id'> | null; errors: CSVParseError[] } => {
  const errors: CSVParseError[] = []

  // Parse timestamp (required)
  const timestamp = parseTimestamp(row.timestamp)
  if (!timestamp) {
    errors.push({
      row: rowIndex,
      field: 'timestamp',
      message: 'Invalid or missing timestamp',
      rawData: row.timestamp,
    })
  }

  // Parse activity type (required)
  const activityType = parseActivityType(row.activity_type)
  if (!activityType) {
    errors.push({
      row: rowIndex,
      field: 'activity_type',
      message: 'Invalid or missing activity type',
      rawData: row.activity_type,
    })
  }

  // Parse optional numeric fields
  const duration = parseNumeric(row.duration_minutes)
  const quantity = parseNumeric(row.quantity_ml)

  // Validate numeric ranges
  const durationError = validateNumericRange(duration, 'duration_minutes', 0, 1440)
  if (durationError) {
    errors.push({
      row: rowIndex,
      field: 'duration_minutes',
      message: durationError,
      rawData: row.duration_minutes,
    })
  }

  const quantityError = validateNumericRange(quantity, 'quantity_ml', 0, 10000)
  if (quantityError) {
    errors.push({
      row: rowIndex,
      field: 'quantity_ml',
      message: quantityError,
      rawData: row.quantity_ml,
    })
  }

  // If critical errors exist, return null record
  if (!timestamp || !activityType) {
    return { record: null, errors }
  }

  // Create record
  const record: Omit<PiyologRecord, 'id'> = {
    timestamp,
    activityType,
    duration: duration,
    quantity: quantity,
    notes: row.notes?.trim() || undefined,
    metadata: {
      importedAt: new Date(),
      importedFilename: filename,
    },
  }

  return { record, errors }
}

// Parse CSV file content
export const parseCSV = (
  csvContent: string,
  filename: string
): Promise<CSVParseResult> => {
  return new Promise((resolve) => {
    const records: Array<Omit<PiyologRecord, 'id'>> = []
    const errors: CSVParseError[] = []
    let totalRows = 0

    Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        // Validate headers
        const headerValidation = validateHeaders(results.meta.fields || [])
        if (!headerValidation.valid) {
          errors.push(...headerValidation.errors)
          logError(new Error('Invalid CSV headers'), 'parse', {
            filename,
            errors: headerValidation.errors
          })
          resolve({
            records: [],
            errors,
            totalRows: 0,
            successRows: 0,
          })
          return
        }

        // Parse each row
        results.data.forEach((row, index) => {
          totalRows++
          const { record, errors: rowErrors } = parseCSVRow(row, index + 1, filename)

          if (record) {
            records.push(record)
          }
          if (rowErrors.length > 0) {
            errors.push(...rowErrors)
          }
        })

        resolve({
          records,
          errors,
          totalRows,
          successRows: records.length,
        })
      },
      error: (error) => {
        errors.push({
          row: 0,
          message: `CSV parsing failed: ${error.message}`,
        })
        resolve({
          records: [],
          errors,
          totalRows: 0,
          successRows: 0,
        })
      },
    })
  })
}

// Format errors for user display
export const formatParseErrors = (errors: CSVParseError[]): string => {
  if (errors.length === 0) return ''

  const grouped = errors.reduce((acc, error) => {
    const key = error.row
    if (!acc[key]) acc[key] = []
    acc[key].push(error)
    return acc
  }, {} as Record<number, CSVParseError[]>)

  const messages = Object.entries(grouped).map(([row, errs]) => {
    const rowNum = row === '0' ? 'Header' : `Row ${row}`
    const errorList = errs.map(e => `  - ${e.field ? `${e.field}: ` : ''}${e.message}`).join('\n')
    return `${rowNum}:\n${errorList}`
  })

  return messages.join('\n\n')
}
