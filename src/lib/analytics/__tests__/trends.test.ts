// Trends analytics unit tests
import { describe, it, expect } from 'vitest'
import {
  calculateLinearRegression,
  analyzeTrendForFrequency,
  analyzeAllTrends,
  getSignificantTrends,
  groupRecordsByDate,
} from '../trends'
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

describe('Trends', () => {
  describe('groupRecordsByDate', () => {
    it('should group records by date', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
        createMockRecord('2025-01-15 14:00:00', 'feeding'),
        createMockRecord('2025-01-16 10:00:00', 'feeding'),
      ]

      const grouped = groupRecordsByDate(records)

      expect(grouped.size).toBe(2)
      expect(grouped.get('2025-01-15')).toHaveLength(2)
      expect(grouped.get('2025-01-16')).toHaveLength(1)
    })

    it('should handle empty records', () => {
      const grouped = groupRecordsByDate([])

      expect(grouped.size).toBe(0)
    })
  })

  describe('calculateLinearRegression', () => {
    it('should calculate regression for increasing trend', () => {
      const data = [
        { date: '2025-01-15', value: 10 },
        { date: '2025-01-16', value: 12 },
        { date: '2025-01-17', value: 14 },
        { date: '2025-01-18', value: 16 },
      ]

      const regression = calculateLinearRegression(data)

      expect(regression).not.toBeNull()
      expect(regression!.slope).toBeGreaterThan(0)
      expect(regression!.rSquared).toBeCloseTo(1, 1) // Perfect linear fit
    })

    it('should calculate regression for decreasing trend', () => {
      const data = [
        { date: '2025-01-15', value: 20 },
        { date: '2025-01-16', value: 15 },
        { date: '2025-01-17', value: 10 },
        { date: '2025-01-18', value: 5 },
      ]

      const regression = calculateLinearRegression(data)

      expect(regression).not.toBeNull()
      expect(regression!.slope).toBeLessThan(0)
    })

    it('should return null for insufficient data', () => {
      const data = [{ date: '2025-01-15', value: 10 }]

      const regression = calculateLinearRegression(data)

      expect(regression).toBeNull()
    })

    it('should return null for constant values', () => {
      const data = [
        { date: '2025-01-15', value: 10 },
        { date: '2025-01-16', value: 10 },
        { date: '2025-01-17', value: 10 },
      ]

      const regression = calculateLinearRegression(data)

      expect(regression).toBeNull()
    })
  })

  describe('analyzeTrendForFrequency', () => {
    it('should detect increasing frequency trend', () => {
      const records: PiyologRecord[] = [
        // Day 1: 1 feeding
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
        // Day 2: 2 feedings
        createMockRecord('2025-01-16 09:00:00', 'feeding'),
        createMockRecord('2025-01-16 14:00:00', 'feeding'),
        // Day 3: 3 feedings
        createMockRecord('2025-01-17 09:00:00', 'feeding'),
        createMockRecord('2025-01-17 12:00:00', 'feeding'),
        createMockRecord('2025-01-17 15:00:00', 'feeding'),
        // Day 4: 4 feedings
        createMockRecord('2025-01-18 09:00:00', 'feeding'),
        createMockRecord('2025-01-18 12:00:00', 'feeding'),
        createMockRecord('2025-01-18 15:00:00', 'feeding'),
        createMockRecord('2025-01-18 18:00:00', 'feeding'),
        // Day 5: 5 feedings
        createMockRecord('2025-01-19 09:00:00', 'feeding'),
        createMockRecord('2025-01-19 11:00:00', 'feeding'),
        createMockRecord('2025-01-19 13:00:00', 'feeding'),
        createMockRecord('2025-01-19 15:00:00', 'feeding'),
        createMockRecord('2025-01-19 17:00:00', 'feeding'),
        // Day 6: 6 feedings
        createMockRecord('2025-01-20 09:00:00', 'feeding'),
        createMockRecord('2025-01-20 11:00:00', 'feeding'),
        createMockRecord('2025-01-20 13:00:00', 'feeding'),
        createMockRecord('2025-01-20 15:00:00', 'feeding'),
        createMockRecord('2025-01-20 17:00:00', 'feeding'),
        createMockRecord('2025-01-20 19:00:00', 'feeding'),
        // Day 7: 7 feedings
        createMockRecord('2025-01-21 09:00:00', 'feeding'),
        createMockRecord('2025-01-21 11:00:00', 'feeding'),
        createMockRecord('2025-01-21 13:00:00', 'feeding'),
        createMockRecord('2025-01-21 15:00:00', 'feeding'),
        createMockRecord('2025-01-21 17:00:00', 'feeding'),
        createMockRecord('2025-01-21 19:00:00', 'feeding'),
        createMockRecord('2025-01-21 21:00:00', 'feeding'),
      ]

      const trend = analyzeTrendForFrequency(records, 'feeding')

      expect(trend).not.toBeNull()
      expect(trend!.metric).toBe('frequency')
      expect(trend!.hasEnoughData).toBe(true)
      expect(trend!.direction).toBe('increasing')
      expect(trend!.magnitude).toBeGreaterThan(0)
    })

    it('should return stable trend for insufficient data', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
      ]

      const trend = analyzeTrendForFrequency(records, 'feeding')

      expect(trend).not.toBeNull()
      expect(trend!.hasEnoughData).toBe(false)
      expect(trend!.direction).toBe('stable')
    })
  })

  describe('analyzeAllTrends', () => {
    it('should analyze all trend types', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding', 20, 150),
        createMockRecord('2025-01-16 09:00:00', 'feeding', 22, 160),
        createMockRecord('2025-01-17 09:00:00', 'feeding', 24, 170),
        createMockRecord('2025-01-18 09:00:00', 'feeding', 26, 180),
      ]

      const trends = analyzeAllTrends(records, 'feeding')

      expect(trends.length).toBeGreaterThan(0)

      const frequencyTrend = trends.find(t => t.metric === 'frequency')
      expect(frequencyTrend).toBeDefined()

      const durationTrend = trends.find(t => t.metric === 'duration')
      expect(durationTrend).toBeDefined()

      const quantityTrend = trends.find(t => t.metric === 'quantity')
      expect(quantityTrend).toBeDefined()
    })

    it('should handle empty records', () => {
      const trends = analyzeAllTrends([], 'feeding')

      // Even with empty records, frequency trend is always returned
      expect(trends.length).toBeGreaterThanOrEqual(1)
      expect(trends[0].metric).toBe('frequency')
      expect(trends[0].hasEnoughData).toBe(false)
    })
  })

  describe('getSignificantTrends', () => {
    it('should filter trends by significance threshold', () => {
      const trends = [
        {
          activityType: 'feeding' as const,
          metric: 'frequency' as const,
          direction: 'increasing' as const,
          magnitude: 2.5,
          confidence: 0.95,
          significance: 'high' as const,
          dataPoints: 5,
          hasEnoughData: true,
        },
        {
          activityType: 'feeding' as const,
          metric: 'duration' as const,
          direction: 'stable' as const,
          magnitude: 0.1,
          confidence: 0.3,
          significance: 'low' as const,
          dataPoints: 5,
          hasEnoughData: true,
        },
      ]

      const significant = getSignificantTrends(trends)

      expect(significant).toHaveLength(1)
      expect(significant[0].metric).toBe('frequency')
    })

    it('should sort by significance', () => {
      const trends = [
        {
          activityType: 'feeding' as const,
          metric: 'frequency' as const,
          direction: 'increasing' as const,
          magnitude: 1.5,
          confidence: 0.8,
          significance: 'high' as const,
          dataPoints: 5,
          hasEnoughData: true,
        },
        {
          activityType: 'sleeping' as const,
          metric: 'duration' as const,
          direction: 'decreasing' as const,
          magnitude: -2.0,
          confidence: 0.95,
          significance: 'high' as const,
          dataPoints: 5,
          hasEnoughData: true,
        },
      ]

      const significant = getSignificantTrends(trends)

      expect(significant[0].metric).toBe('duration') // Higher confidence (0.95 > 0.8)
    })
  })
})
