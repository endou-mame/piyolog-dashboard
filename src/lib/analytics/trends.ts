// Trend analysis algorithm
// Functional programming style - pure functions for trend detection

import type { PiyologRecord, ActivityType } from '../../types/database'

// Trend direction
export type TrendDirection = 'increasing' | 'decreasing' | 'stable'

// Trend significance
export type TrendSignificance = 'low' | 'medium' | 'high'

// Trend analysis result
export type TrendAnalysis = {
  activityType: ActivityType
  metric: 'frequency' | 'duration' | 'quantity'
  direction: TrendDirection
  magnitude: number // Rate of change per day
  confidence: number // 0-1
  significance: TrendSignificance
  dataPoints: number
  hasEnoughData: boolean // At least 7 days
}

// Time series data point
export type TimeSeriesPoint = {
  date: Date
  value: number
}

// Minimum days required for trend analysis
const MIN_DAYS_FOR_TREND = 7

// Group records by date
export const groupRecordsByDate = (records: PiyologRecord[]): Map<string, PiyologRecord[]> => {
  const grouped = new Map<string, PiyologRecord[]>()

  records.forEach((record) => {
    const dateKey = record.timestamp.toISOString().split('T')[0]
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(record)
  })

  return grouped
}

// Calculate daily frequency
export const calculateDailyFrequency = (
  records: PiyologRecord[],
  activityType: ActivityType
): TimeSeriesPoint[] => {
  const filtered = records.filter((r) => r.activityType === activityType)
  const grouped = groupRecordsByDate(filtered)

  const points: TimeSeriesPoint[] = []

  grouped.forEach((dayRecords, dateKey) => {
    points.push({
      date: new Date(dateKey),
      value: dayRecords.length,
    })
  })

  return points.sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Calculate daily aggregation (sum/average)
export const calculateDailyAggregation = (
  records: PiyologRecord[],
  activityType: ActivityType,
  metric: 'duration' | 'quantity',
  aggregation: 'sum' | 'average' = 'sum'
): TimeSeriesPoint[] => {
  const filtered = records.filter((r) => r.activityType === activityType)
  const grouped = groupRecordsByDate(filtered)

  const points: TimeSeriesPoint[] = []

  grouped.forEach((dayRecords, dateKey) => {
    const values = dayRecords
      .map((r) => (metric === 'duration' ? r.duration : r.quantity))
      .filter((v): v is number => v !== undefined)

    if (values.length === 0) return

    const value =
      aggregation === 'sum'
        ? values.reduce((sum, v) => sum + v, 0)
        : values.reduce((sum, v) => sum + v, 0) / values.length

    points.push({
      date: new Date(dateKey),
      value,
    })
  })

  return points.sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Calculate moving average
export const calculateMovingAverage = (
  data: TimeSeriesPoint[],
  windowSize: number
): TimeSeriesPoint[] => {
  if (data.length < windowSize) return []

  const result: TimeSeriesPoint[] = []

  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1)
    const average = window.reduce((sum, point) => sum + point.value, 0) / windowSize

    result.push({
      date: data[i].date,
      value: average,
    })
  }

  return result
}

// Calculate linear regression (least squares method)
export type LinearRegression = {
  slope: number // Rate of change
  intercept: number
  rSquared: number // Coefficient of determination (0-1)
}

export const calculateLinearRegression = (data: TimeSeriesPoint[]): LinearRegression | null => {
  if (data.length < 2) return null

  // Convert dates to numeric values (days since first date)
  const firstDate = data[0].date.getTime()
  const x = data.map((p) => (p.date.getTime() - firstDate) / (1000 * 60 * 60 * 24))
  const y = data.map((p) => p.value)

  const n = x.length
  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
  const sumXX = x.reduce((sum, val) => sum + val * val, 0)
  const sumYY = y.reduce((sum, val) => sum + val * val, 0)

  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R-squared
  const meanY = sumY / n
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0)
  const ssResidual = y.reduce((sum, val, i) => {
    const predicted = slope * x[i] + intercept
    return sum + Math.pow(val - predicted, 2)
  }, 0)
  const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal

  return {
    slope,
    intercept,
    rSquared,
  }
}

// Determine trend direction
export const determineTrendDirection = (
  slope: number,
  threshold = 0.01
): TrendDirection => {
  if (Math.abs(slope) < threshold) return 'stable'
  return slope > 0 ? 'increasing' : 'decreasing'
}

// Determine trend significance
export const determineTrendSignificance = (
  magnitude: number,
  confidence: number
): TrendSignificance => {
  // High: strong confidence and large magnitude
  if (confidence >= 0.7 && Math.abs(magnitude) >= 0.5) return 'high'

  // Medium: moderate confidence or magnitude
  if (confidence >= 0.5 || Math.abs(magnitude) >= 0.3) return 'medium'

  // Low: weak confidence and small magnitude
  return 'low'
}

// Check if there's enough data for trend analysis
export const hasEnoughDataForTrend = (data: TimeSeriesPoint[]): boolean => {
  if (data.length < MIN_DAYS_FOR_TREND) return false

  // Check date range spans at least 7 days
  const firstDate = data[0].date.getTime()
  const lastDate = data[data.length - 1].date.getTime()
  const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24)

  return daysDiff >= MIN_DAYS_FOR_TREND - 1
}

// Analyze trend for frequency
export const analyzeTrendForFrequency = (
  records: PiyologRecord[],
  activityType: ActivityType
): TrendAnalysis => {
  const data = calculateDailyFrequency(records, activityType)
  const hasEnoughData = hasEnoughDataForTrend(data)

  if (!hasEnoughData || data.length < 2) {
    return {
      activityType,
      metric: 'frequency',
      direction: 'stable',
      magnitude: 0,
      confidence: 0,
      significance: 'low',
      dataPoints: data.length,
      hasEnoughData: false,
    }
  }

  const regression = calculateLinearRegression(data)

  if (!regression) {
    return {
      activityType,
      metric: 'frequency',
      direction: 'stable',
      magnitude: 0,
      confidence: 0,
      significance: 'low',
      dataPoints: data.length,
      hasEnoughData: true,
    }
  }

  const direction = determineTrendDirection(regression.slope)
  const significance = determineTrendSignificance(regression.slope, regression.rSquared)

  return {
    activityType,
    metric: 'frequency',
    direction,
    magnitude: regression.slope,
    confidence: regression.rSquared,
    significance,
    dataPoints: data.length,
    hasEnoughData: true,
  }
}

// Analyze trend for duration or quantity
export const analyzeTrendForMetric = (
  records: PiyologRecord[],
  activityType: ActivityType,
  metric: 'duration' | 'quantity'
): TrendAnalysis => {
  const data = calculateDailyAggregation(records, activityType, metric, 'average')
  const hasEnoughData = hasEnoughDataForTrend(data)

  if (!hasEnoughData || data.length < 2) {
    return {
      activityType,
      metric,
      direction: 'stable',
      magnitude: 0,
      confidence: 0,
      significance: 'low',
      dataPoints: data.length,
      hasEnoughData: false,
    }
  }

  const regression = calculateLinearRegression(data)

  if (!regression) {
    return {
      activityType,
      metric,
      direction: 'stable',
      magnitude: 0,
      confidence: 0,
      significance: 'low',
      dataPoints: data.length,
      hasEnoughData: true,
    }
  }

  const direction = determineTrendDirection(regression.slope)
  const significance = determineTrendSignificance(regression.slope, regression.rSquared)

  return {
    activityType,
    metric,
    direction,
    magnitude: regression.slope,
    confidence: regression.rSquared,
    significance,
    dataPoints: data.length,
    hasEnoughData: true,
  }
}

// Analyze all trends for an activity type
export const analyzeAllTrends = (
  records: PiyologRecord[],
  activityType: ActivityType
): TrendAnalysis[] => {
  const trends: TrendAnalysis[] = []

  // Frequency trend
  trends.push(analyzeTrendForFrequency(records, activityType))

  // Duration trend (if applicable)
  const hasDuration = records.some((r) => r.activityType === activityType && r.duration !== undefined)
  if (hasDuration) {
    trends.push(analyzeTrendForMetric(records, activityType, 'duration'))
  }

  // Quantity trend (if applicable)
  const hasQuantity = records.some((r) => r.activityType === activityType && r.quantity !== undefined)
  if (hasQuantity) {
    trends.push(analyzeTrendForMetric(records, activityType, 'quantity'))
  }

  return trends
}

// Get significant trends (medium or high significance)
export const getSignificantTrends = (trends: TrendAnalysis[]): TrendAnalysis[] => {
  return trends.filter((trend) => trend.significance === 'medium' || trend.significance === 'high')
}
