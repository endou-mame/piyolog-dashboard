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
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
        createMockRecord('2025-01-16 09:00:00', 'feeding'),
        createMockRecord('2025-01-16 14:00:00', 'feeding'),
        createMockRecord('2025-01-17 09:00:00', 'feeding'),
        createMockRecord('2025-01-17 12:00:00', 'feeding'),
        createMockRecord('2025-01-17 15:00:00', 'feeding'),
      ]

      const trend = analyzeTrendForFrequency(records, 'feeding')

      expect(trend).not.toBeNull()
      expect(trend!.metric).toBe('frequency')
      expect(trend!.direction).toBe('increasing')
      expect(trend!.slope).toBeGreaterThan(0)
    })

    it('should return null for insufficient data', () => {
      const records: PiyologRecord[] = [
        createMockRecord('2025-01-15 09:00:00', 'feeding'),
      ]

      const trend = analyzeTrendForFrequency(records, 'feeding')

      expect(trend).toBeNull()
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

      expect(trends).toHaveLength(0)
    })
  })

  describe('getSignificantTrends', () => {
    it('should filter trends by significance threshold', () => {
      const trends = [
        {
          activityType: 'feeding' as const,
          metric: 'frequency' as const,
          direction: 'increasing' as const,
          slope: 2.5,
          rSquared: 0.95,
          startValue: 5,
          endValue: 15,
          changePercent: 200,
          dataPoints: 5,
        },
        {
          activityType: 'feeding' as const,
          metric: 'duration' as const,
          direction: 'stable' as const,
          slope: 0.1,
          rSquared: 0.3,
          startValue: 20,
          endValue: 20.5,
          changePercent: 2.5,
          dataPoints: 5,
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
          slope: 1.5,
          rSquared: 0.8,
          startValue: 5,
          endValue: 10,
          changePercent: 100,
          dataPoints: 5,
        },
        {
          activityType: 'sleeping' as const,
          metric: 'duration' as const,
          direction: 'decreasing' as const,
          slope: -2.0,
          rSquared: 0.95,
          startValue: 120,
          endValue: 80,
          changePercent: -33,
          dataPoints: 5,
        },
      ]

      const significant = getSignificantTrends(trends)

      expect(significant[0].metric).toBe('duration') // Higher rSquared
    })
  })
})
