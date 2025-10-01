// Statistics analytics unit tests
import { describe, it, expect } from 'vitest'
import {
  calculateOverallStatistics,
  calculateAllStatistics,
  getUniqueActivityTypes,
  filterByDateRange,
} from '../statistics'
import type { PiyologRecord } from '../../../types/database'

const createMockRecord = (
  timestamp: string,
  activityType: PiyologRecord['activityType'],
  duration?: number,
  quantity?: number
): PiyologRecord => ({
  id: Math.random(),
  timestamp: new Date(timestamp),
  activityType,
  duration,
  quantity,
  notes: undefined,
  metadata: {
    importedAt: new Date(),
    importedFilename: 'test.csv',
  },
})

describe('Statistics', () => {
  describe('getUniqueActivityTypes', () => {
    it('should return unique activity types', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
        createMockRecord('2025-01-15 10:00:00', 'sleeping'),
        createMockRecord('2025-01-15 11:00:00', 'feeding'),
        createMockRecord('2025-01-15 12:00:00', 'diaper'),
      ]

      const types = getUniqueActivityTypes(records)

      expect(types).toHaveLength(3)
      expect(types).toContain('feeding')
      expect(types).toContain('sleeping')
      expect(types).toContain('diaper')
    })

    it('should return empty array for empty records', () => {
      const types = getUniqueActivityTypes([])

      expect(types).toHaveLength(0)
    })

    it('should sort by frequency descending', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
        createMockRecord('2025-01-15 10:00:00', 'sleeping'),
        createMockRecord('2025-01-15 11:00:00', 'feeding'),
        createMockRecord('2025-01-15 12:00:00', 'feeding'),
        createMockRecord('2025-01-15 13:00:00', 'sleeping'),
      ]

      const types = getUniqueActivityTypes(records)

      expect(types[0]).toBe('feeding') // 3 occurrences
      expect(types[1]).toBe('sleeping') // 2 occurrences
    })
  })

  describe('filterByDateRange', () => {
    const records: PiyologRecord[] = [
      createMockRecord('2025-01-10 09:00:00', 'feeding'),
      createMockRecord('2025-01-15 10:00:00', 'sleeping'),
      createMockRecord('2025-01-20 11:00:00', 'feeding'),
      createMockRecord('2025-01-25 12:00:00', 'diaper'),
    ]

    it('should filter by start date only', () => {
      const filtered = filterByDateRange(records, '2025-01-15', undefined)

      expect(filtered).toHaveLength(3)
      expect(filtered[0].timestamp.toISOString()).toContain('2025-01-15')
    })

    it('should filter by end date only', () => {
      const filtered = filterByDateRange(records, undefined, '2025-01-20')

      expect(filtered).toHaveLength(3)
      expect(filtered[filtered.length - 1].timestamp.toISOString()).toContain('2025-01-20')
    })

    it('should filter by date range', () => {
      const filtered = filterByDateRange(records, '2025-01-15', '2025-01-20')

      expect(filtered).toHaveLength(2)
      expect(filtered[0].timestamp.toISOString()).toContain('2025-01-15')
      expect(filtered[1].timestamp.toISOString()).toContain('2025-01-20')
    })

    it('should return all records when no dates provided', () => {
      const filtered = filterByDateRange(records, undefined, undefined)

      expect(filtered).toHaveLength(4)
    })
  })

  describe('calculateOverallStatistics', () => {
    it('should calculate statistics for multiple records', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
        createMockRecord('2025-01-16 10:00:00', 'sleeping'),
        createMockRecord('2025-01-17 11:00:00', 'feeding'),
        createMockRecord('2025-01-18 12:00:00', 'diaper'),
      ]

      const stats = calculateOverallStatistics(records)

      expect(stats.totalRecords).toBe(4)
      expect(stats.activityTypeCount).toBe(3)
      expect(stats.dateRange.earliest).not.toBeNull()
      expect(stats.dateRange.latest).not.toBeNull()
      expect(stats.recordsPerDay).toBeGreaterThan(0)
      expect(Object.keys(stats.activityBreakdown)).toHaveLength(3)
    })

    it('should handle empty records', () => {
      const stats = calculateOverallStatistics([])

      expect(stats.totalRecords).toBe(0)
      expect(stats.activityTypeCount).toBe(0)
      expect(stats.dateRange.earliest).toBeNull()
      expect(stats.dateRange.latest).toBeNull()
      expect(stats.recordsPerDay).toBe(0)
    })

    it('should calculate correct activity breakdown', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
        createMockRecord('2025-01-15 10:00:00', 'feeding'),
        createMockRecord('2025-01-15 11:00:00', 'sleeping'),
      ]

      const stats = calculateOverallStatistics(records)

      expect(stats.activityBreakdown.feeding).toBe(2)
      expect(stats.activityBreakdown.sleeping).toBe(1)
    })

    it('should calculate records per day correctly', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
        createMockRecord('2025-01-16 10:00:00', 'sleeping'),
        createMockRecord('2025-01-17 11:00:00', 'feeding'),
      ]

      const stats = calculateOverallStatistics(records)

      // 3 records over 3 days (15, 16, 17) = 1 record/day
      expect(stats.recordsPerDay).toBeCloseTo(1.0, 1)
    })
  })

  describe('calculateAllStatistics', () => {
    it('should calculate statistics for each activity type', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding', 20, 150),
        createMockRecord('2025-01-15 10:00:00', 'feeding', 25, 180),
        createMockRecord('2025-01-15 11:00:00', 'sleeping', 120),
      ]

      const stats = calculateAllStatistics(records)

      expect(stats).toHaveLength(2)

      const feedingStats = stats.find(s => s.activityType === 'feeding')
      expect(feedingStats).toBeDefined()
      expect(feedingStats?.frequency).toBe(2)
      expect(feedingStats?.duration?.mean).toBeCloseTo(22.5, 1)
      expect(feedingStats?.quantity?.mean).toBeCloseTo(165, 1)

      const sleepingStats = stats.find(s => s.activityType === 'sleeping')
      expect(sleepingStats).toBeDefined()
      expect(sleepingStats?.frequency).toBe(1)
      expect(sleepingStats?.duration?.mean).toBe(120)
    })

    it('should handle records with missing values', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding', 20, 150),
        createMockRecord('2025-01-15 10:00:00', 'feeding', undefined, undefined),
        createMockRecord('2025-01-15 11:00:00', 'feeding', 30, 200),
      ]

      const stats = calculateAllStatistics(records)

      expect(stats).toHaveLength(1)
      const feedingStats = stats[0]
      expect(feedingStats.frequency).toBe(3)
      expect(feedingStats.duration?.mean).toBeCloseTo(25, 1) // (20 + 30) / 2
      expect(feedingStats.quantity?.mean).toBeCloseTo(175, 1) // (150 + 200) / 2
    })

    it('should return empty array for empty records', () => {
      const stats = calculateAllStatistics([])

      expect(stats).toHaveLength(0)
    })

    it('should calculate correct quartiles', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding', 10),
        createMockRecord('2025-01-15 10:00:00', 'feeding', 20),
        createMockRecord('2025-01-15 11:00:00', 'feeding', 30),
        createMockRecord('2025-01-15 12:00:00', 'feeding', 40),
      ]

      const stats = calculateAllStatistics(records)
      const feedingStats = stats[0]

      expect(feedingStats.duration?.median).toBe(25)
      expect(feedingStats.duration?.q1).toBeCloseTo(17.5, 1) // Linear interpolation
      expect(feedingStats.duration?.q3).toBeCloseTo(32.5, 1) // Linear interpolation
    })
  })
})
