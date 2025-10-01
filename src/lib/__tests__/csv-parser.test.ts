// CSV Parser unit tests
import { describe, it, expect } from 'vitest'
import {
  parseCSV,
  parseCSVRow,
  validateHeaders,
  formatParseErrors,
} from '../csv-parser'

describe('CSV Parser', () => {
  describe('validateHeaders', () => {
    it('should accept valid headers', () => {
      const headers = ['timestamp', 'activity_type', 'duration_minutes', 'quantity_ml', 'notes']
      const result = validateHeaders(headers)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing required headers', () => {
      const headers = ['timestamp', 'activity_type']
      const result = validateHeaders(headers)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].message).toContain('Missing required headers')
    })

    it('should accept headers in any order', () => {
      const headers = ['notes', 'quantity_ml', 'duration_minutes', 'activity_type', 'timestamp']
      const result = validateHeaders(headers)

      expect(result.valid).toBe(true)
    })

    it('should handle empty headers', () => {
      const headers: string[] = []
      const result = validateHeaders(headers)

      expect(result.valid).toBe(false)
    })
  })

  describe('parseCSVRow', () => {
    it('should parse valid feeding record', () => {
      const row = {
        timestamp: '2025-01-15 09:30:00',
        activity_type: 'feeding',
        duration_minutes: '20',
        quantity_ml: '150',
        notes: 'Good feeding session',
      }

      const { record, errors } = parseCSVRow(row, 1, 'test.csv')

      expect(errors).toHaveLength(0)
      expect(record).not.toBeNull()
      expect(record?.activityType).toBe('feeding')
      expect(record?.durationMinutes).toBe(20)
      expect(record?.quantityMl).toBe(150)
      expect(record?.notes).toBe('Good feeding session')
    })

    it('should parse valid sleeping record', () => {
      const row = {
        timestamp: '2025-01-15 14:00:00',
        activity_type: 'sleeping',
        duration_minutes: '120',
        quantity_ml: '',
        notes: '',
      }

      const { record, errors } = parseCSVRow(row, 1, 'test.csv')

      expect(errors).toHaveLength(0)
      expect(record).not.toBeNull()
      expect(record?.activityType).toBe('sleeping')
      expect(record?.durationMinutes).toBe(120)
      expect(record?.quantityMl).toBeUndefined()
    })

    it('should reject invalid timestamp', () => {
      const row = {
        timestamp: 'invalid-date',
        activity_type: 'feeding',
        duration_minutes: '20',
        quantity_ml: '150',
        notes: '',
      }

      const { record, errors } = parseCSVRow(row, 1, 'test.csv')

      expect(record).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].field).toBe('timestamp')
    })

    it('should reject invalid activity type', () => {
      const row = {
        timestamp: '2025-01-15 09:30:00',
        activity_type: 'invalid_type',
        duration_minutes: '20',
        quantity_ml: '150',
        notes: '',
      }

      const { record, errors } = parseCSVRow(row, 1, 'test.csv')

      expect(record).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].field).toBe('activity_type')
    })

    it('should validate duration range', () => {
      const row = {
        timestamp: '2025-01-15 09:30:00',
        activity_type: 'feeding',
        duration_minutes: '-10',
        quantity_ml: '150',
        notes: '',
      }

      const { record, errors } = parseCSVRow(row, 1, 'test.csv')

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.field === 'duration_minutes')).toBe(true)
    })

    it('should validate quantity range', () => {
      const row = {
        timestamp: '2025-01-15 09:30:00',
        activity_type: 'feeding',
        duration_minutes: '20',
        quantity_ml: '-50',
        notes: '',
      }

      const { record, errors } = parseCSVRow(row, 1, 'test.csv')

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.field === 'quantity_ml')).toBe(true)
    })

    it('should handle empty optional fields', () => {
      const row = {
        timestamp: '2025-01-15 09:30:00',
        activity_type: 'diaper',
        duration_minutes: '',
        quantity_ml: '',
        notes: '',
      }

      const { record, errors } = parseCSVRow(row, 1, 'test.csv')

      expect(errors).toHaveLength(0)
      expect(record).not.toBeNull()
      expect(record?.durationMinutes).toBeUndefined()
      expect(record?.quantityMl).toBeUndefined()
    })

    it('should trim whitespace from notes', () => {
      const row = {
        timestamp: '2025-01-15 09:30:00',
        activity_type: 'feeding',
        duration_minutes: '20',
        quantity_ml: '150',
        notes: '  Test note  ',
      }

      const { record, errors } = parseCSVRow(row, 1, 'test.csv')

      expect(errors).toHaveLength(0)
      expect(record?.notes).toBe('Test note')
    })
  })

  describe('parseCSV', () => {
    it('should parse valid CSV content', async () => {
      const csvContent = `timestamp,activity_type,duration_minutes,quantity_ml,notes
2025-01-15 09:30:00,feeding,20,150,Good session
2025-01-15 14:00:00,sleeping,120,,Nap time
2025-01-15 18:00:00,diaper,,,Changed`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.totalRows).toBe(3)
      expect(result.successRows).toBe(3)
      expect(result.records).toHaveLength(3)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle CSV with errors', async () => {
      const csvContent = `timestamp,activity_type,duration_minutes,quantity_ml,notes
2025-01-15 09:30:00,feeding,20,150,Valid
invalid-date,feeding,20,150,Invalid timestamp
2025-01-15 14:00:00,invalid_type,120,,Invalid type`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.totalRows).toBe(3)
      expect(result.successRows).toBe(1)
      expect(result.records).toHaveLength(1)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject CSV with invalid headers', async () => {
      const csvContent = `wrong_header1,wrong_header2
2025-01-15 09:30:00,feeding`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.totalRows).toBe(0)
      expect(result.successRows).toBe(0)
      expect(result.records).toHaveLength(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should skip empty lines', async () => {
      const csvContent = `timestamp,activity_type,duration_minutes,quantity_ml,notes
2025-01-15 09:30:00,feeding,20,150,Valid

2025-01-15 14:00:00,sleeping,120,,Valid`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.totalRows).toBe(2)
      expect(result.successRows).toBe(2)
      expect(result.records).toHaveLength(2)
    })

    it('should handle large CSV files', async () => {
      // Generate 1000 rows
      const rows = Array.from({ length: 1000 }, (_, i) => {
        const date = new Date(2025, 0, 1, i % 24, i % 60)
        return `${date.toISOString().slice(0, 19).replace('T', ' ')},feeding,20,150,Row ${i}`
      })
      const csvContent = `timestamp,activity_type,duration_minutes,quantity_ml,notes\n${rows.join('\n')}`

      const result = await parseCSV(csvContent, 'large.csv')

      expect(result.totalRows).toBe(1000)
      expect(result.successRows).toBe(1000)
      expect(result.records).toHaveLength(1000)
    })
  })

  describe('formatParseErrors', () => {
    it('should format single error', () => {
      const errors = [
        { row: 5, field: 'timestamp', message: 'Invalid timestamp' },
      ]

      const formatted = formatParseErrors(errors)

      expect(formatted).toContain('Row 5')
      expect(formatted).toContain('timestamp')
      expect(formatted).toContain('Invalid timestamp')
    })

    it('should format multiple errors', () => {
      const errors = [
        { row: 3, field: 'timestamp', message: 'Invalid timestamp' },
        { row: 5, field: 'activity_type', message: 'Unknown activity' },
        { row: 8, message: 'General error' },
      ]

      const formatted = formatParseErrors(errors)

      expect(formatted).toContain('Row 3')
      expect(formatted).toContain('Row 5')
      expect(formatted).toContain('Row 8')
    })

    it('should limit error list when too many', () => {
      const errors = Array.from({ length: 20 }, (_, i) => ({
        row: i + 1,
        message: `Error ${i}`,
      }))

      const formatted = formatParseErrors(errors)

      expect(formatted).toContain('and 10 more')
    })
  })
})
