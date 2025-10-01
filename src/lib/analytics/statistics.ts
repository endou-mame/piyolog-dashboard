// Statistics calculation engine
// Functional programming style - pure functions for statistical analysis

import type { PiyologRecord, ActivityType } from '../../types/database'

// Statistical summary type
export type StatisticsSummary = {
  count: number
  sum: number
  mean: number
  median: number
  min: number
  max: number
  stdDev: number
  q1: number // 25th percentile
  q3: number // 75th percentile
}

// Activity statistics type
export type ActivityStatistics = {
  activityType: ActivityType
  frequency: number
  duration: StatisticsSummary | null
  quantity: StatisticsSummary | null
  timeDistribution: TimeDistribution
}

// Time distribution (24-hour format)
export type TimeDistribution = {
  byHour: Record<number, number> // 0-23
  byTimeOfDay: {
    morning: number // 6-12
    afternoon: number // 12-18
    evening: number // 18-22
    night: number // 22-6
  }
}

// Helper: Calculate mean
export const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

// Helper: Calculate median
export const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

// Helper: Calculate standard deviation
export const calculateStdDev = (values: number[], mean: number): number => {
  if (values.length === 0) return 0

  const squareDiffs = values.map((value) => Math.pow(value - mean, 2))
  const avgSquareDiff = calculateMean(squareDiffs)
  return Math.sqrt(avgSquareDiff)
}

// Helper: Calculate summary statistics
export const calculateSummary = (values: number[]): StatisticsSummary | null => {
  if (values.length === 0) return null

  const sum = values.reduce((acc, val) => acc + val, 0)
  const mean = calculateMean(values)
  const median = calculateMedian(values)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const stdDev = calculateStdDev(values, mean)
  const q1 = calculatePercentile(values, 25)
  const q3 = calculatePercentile(values, 75)

  return {
    count: values.length,
    sum,
    mean,
    median,
    min,
    max,
    stdDev,
    q1,
    q3,
  }
}

// Get time of day category
export const getTimeOfDay = (hour: number): 'morning' | 'afternoon' | 'evening' | 'night' => {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

// Calculate time distribution
export const calculateTimeDistribution = (records: PiyologRecord[]): TimeDistribution => {
  const byHour: Record<number, number> = {}
  const byTimeOfDay = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  }

  // Initialize hours
  for (let i = 0; i < 24; i++) {
    byHour[i] = 0
  }

  // Count records by hour
  records.forEach((record) => {
    const hour = record.timestamp.getHours()
    byHour[hour]++

    const timeOfDay = getTimeOfDay(hour)
    byTimeOfDay[timeOfDay]++
  })

  return {
    byHour,
    byTimeOfDay,
  }
}

// Calculate statistics for a specific activity type
export const calculateActivityStatistics = (
  records: PiyologRecord[],
  activityType: ActivityType
): ActivityStatistics => {
  const filteredRecords = records.filter((r) => r.activityType === activityType)

  // Extract values
  const durations = filteredRecords
    .map((r) => r.duration)
    .filter((d): d is number => d !== undefined)

  const quantities = filteredRecords
    .map((r) => r.quantity)
    .filter((q): q is number => q !== undefined)

  return {
    activityType,
    frequency: filteredRecords.length,
    duration: calculateSummary(durations),
    quantity: calculateSummary(quantities),
    timeDistribution: calculateTimeDistribution(filteredRecords),
  }
}

// Filter records by date range (inclusive of both start and end dates)
export const filterByDateRange = (
  records: PiyologRecord[],
  startDate?: string | Date,
  endDate?: string | Date
): PiyologRecord[] => {
  const start = startDate ? (typeof startDate === 'string' ? new Date(startDate) : startDate) : null
  const end = endDate ? (typeof endDate === 'string' ? new Date(endDate) : endDate) : null

  // Set end date to end of day (23:59:59.999)
  if (end) {
    end.setHours(23, 59, 59, 999)
  }

  return records.filter((record) => {
    const timestamp = record.timestamp.getTime()

    if (start && timestamp < start.getTime()) return false
    if (end && timestamp > end.getTime()) return false

    return true
  })
}

// Get all unique activity types from records (sorted by frequency descending)
export const getUniqueActivityTypes = (records: PiyologRecord[]): ActivityType[] => {
  const typeCounts = new Map<ActivityType, number>()

  records.forEach((record) => {
    const count = typeCounts.get(record.activityType) || 0
    typeCounts.set(record.activityType, count + 1)
  })

  return Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by frequency descending
    .map(([type]) => type)
}

// Calculate statistics for all activity types
export const calculateAllStatistics = (
  records: PiyologRecord[],
  startDate?: Date,
  endDate?: Date
): ActivityStatistics[] => {
  const filteredRecords = filterByDateRange(records, startDate, endDate)
  const activityTypes = getUniqueActivityTypes(filteredRecords)

  return activityTypes.map((activityType) =>
    calculateActivityStatistics(filteredRecords, activityType)
  )
}

// Calculate overall statistics (across all activity types)
export type OverallStatistics = {
  totalRecords: number
  dateRange: {
    earliest: Date | null
    latest: Date | null
    durationDays: number
  }
  activityTypeCount: number
  recordsPerDay: number
  activityBreakdown: Record<ActivityType, number>
}

export const calculateOverallStatistics = (records: PiyologRecord[]): OverallStatistics => {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      dateRange: {
        earliest: null,
        latest: null,
        durationDays: 0,
      },
      activityTypeCount: 0,
      recordsPerDay: 0,
      activityBreakdown: {} as Record<ActivityType, number>,
    }
  }

  // Get date range
  const timestamps = records.map((r) => r.timestamp.getTime())
  const earliest = new Date(Math.min(...timestamps))
  const latest = new Date(Math.max(...timestamps))
  const durationMs = latest.getTime() - earliest.getTime()
  const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)))

  // Activity breakdown
  const activityBreakdown = records.reduce((acc, record) => {
    acc[record.activityType] = (acc[record.activityType] || 0) + 1
    return acc
  }, {} as Record<ActivityType, number>)

  return {
    totalRecords: records.length,
    dateRange: {
      earliest,
      latest,
      durationDays,
    },
    activityTypeCount: Object.keys(activityBreakdown).length,
    recordsPerDay: records.length / durationDays,
    activityBreakdown,
  }
}

// Calculate percentile
export const calculatePercentile = (values: number[], percentile: number): number => {
  if (values.length === 0) return 0
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100')
  }

  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) {
    return sorted[lower]
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

// Calculate quartiles (Q1, Q2/median, Q3)
export type Quartiles = {
  q1: number
  q2: number
  q3: number
  iqr: number // Interquartile range
}

export const calculateQuartiles = (values: number[]): Quartiles | null => {
  if (values.length === 0) return null

  const q1 = calculatePercentile(values, 25)
  const q2 = calculatePercentile(values, 50)
  const q3 = calculatePercentile(values, 75)
  const iqr = q3 - q1

  return { q1, q2, q3, iqr }
}
