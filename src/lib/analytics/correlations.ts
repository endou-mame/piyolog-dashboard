// Correlation and outlier detection
// Functional programming style - pure functions for correlation analysis

import type { PiyologRecord, ActivityType } from '../../types/database'
import { groupRecordsByDate } from './trends'

// Correlation result
export type CorrelationResult = {
  activityType1: ActivityType
  activityType2: ActivityType
  coefficient: number // Pearson correlation coefficient (-1 to 1)
  strength: 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong'
  direction: 'positive' | 'negative' | 'none'
  sampleSize: number
}

// Outlier detection result
export type OutlierResult = {
  record: PiyologRecord
  metric: 'duration' | 'quantity'
  value: number
  method: 'z-score' | 'iqr'
  score: number // Z-score or IQR multiplier
  severity: 'mild' | 'moderate' | 'extreme'
}

// Calculate Pearson correlation coefficient
export const calculatePearsonCorrelation = (x: number[], y: number[]): number | null => {
  if (x.length !== y.length || x.length < 2) return null

  const n = x.length
  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
  const sumXX = x.reduce((sum, val) => sum + val * val, 0)
  const sumYY = y.reduce((sum, val) => sum + val * val, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

  if (denominator === 0) return null

  return numerator / denominator
}

// Interpret correlation strength
export const interpretCorrelationStrength = (
  coefficient: number
): 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong' => {
  const abs = Math.abs(coefficient)

  if (abs >= 0.8) return 'very strong'
  if (abs >= 0.6) return 'strong'
  if (abs >= 0.4) return 'moderate'
  if (abs >= 0.2) return 'weak'
  return 'very weak'
}

// Determine correlation direction
export const determineCorrelationDirection = (
  coefficient: number,
  threshold = 0.1
): 'positive' | 'negative' | 'none' => {
  if (Math.abs(coefficient) < threshold) return 'none'
  return coefficient > 0 ? 'positive' : 'negative'
}

// Calculate correlation between two activity types (by daily frequency)
export const calculateActivityCorrelation = (
  records: PiyologRecord[],
  activityType1: ActivityType,
  activityType2: ActivityType
): CorrelationResult | null => {
  // Group by date
  const grouped = groupRecordsByDate(records)

  // Create aligned daily frequency arrays
  const dates = Array.from(grouped.keys()).sort()
  const freq1: number[] = []
  const freq2: number[] = []

  dates.forEach((date) => {
    const dayRecords = grouped.get(date)!
    freq1.push(dayRecords.filter((r) => r.activityType === activityType1).length)
    freq2.push(dayRecords.filter((r) => r.activityType === activityType2).length)
  })

  // Need at least 7 days of data
  if (freq1.length < 7) return null

  const coefficient = calculatePearsonCorrelation(freq1, freq2)
  if (coefficient === null) return null

  return {
    activityType1,
    activityType2,
    coefficient,
    strength: interpretCorrelationStrength(coefficient),
    direction: determineCorrelationDirection(coefficient),
    sampleSize: freq1.length,
  }
}

// Calculate all pairwise correlations
export const calculateAllCorrelations = (
  records: PiyologRecord[],
  activityTypes: ActivityType[]
): CorrelationResult[] => {
  const correlations: CorrelationResult[] = []

  // Calculate pairwise correlations
  for (let i = 0; i < activityTypes.length; i++) {
    for (let j = i + 1; j < activityTypes.length; j++) {
      const correlation = calculateActivityCorrelation(records, activityTypes[i], activityTypes[j])
      if (correlation) {
        correlations.push(correlation)
      }
    }
  }

  // Sort by absolute correlation strength
  return correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
}

// Get significant correlations (moderate or stronger)
export const getSignificantCorrelations = (correlations: CorrelationResult[]): CorrelationResult[] => {
  return correlations.filter(
    (c) => c.strength === 'moderate' || c.strength === 'strong' || c.strength === 'very strong'
  )
}

// Calculate z-score
export const calculateZScore = (value: number, mean: number, stdDev: number): number => {
  if (stdDev === 0) return 0
  return (value - mean) / stdDev
}

// Detect outliers using z-score method
export const detectOutliersZScore = (
  records: PiyologRecord[],
  activityType: ActivityType,
  metric: 'duration' | 'quantity',
  threshold = 3
): OutlierResult[] => {
  const filtered = records.filter((r) => r.activityType === activityType)
  const values = filtered
    .map((r) => (metric === 'duration' ? r.duration : r.quantity))
    .filter((v): v is number => v !== undefined)

  if (values.length < 5) return [] // Need at least 5 data points

  // Calculate mean and standard deviation
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return []

  // Find outliers
  const outliers: OutlierResult[] = []

  filtered.forEach((record) => {
    const value = metric === 'duration' ? record.duration : record.quantity
    if (value === undefined) return

    const zScore = calculateZScore(value, mean, stdDev)
    const absZScore = Math.abs(zScore)

    if (absZScore > threshold) {
      let severity: 'mild' | 'moderate' | 'extreme'
      if (absZScore > 4) severity = 'extreme'
      else if (absZScore > 3.5) severity = 'moderate'
      else severity = 'mild'

      outliers.push({
        record,
        metric,
        value,
        method: 'z-score',
        score: zScore,
        severity,
      })
    }
  })

  return outliers.sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
}

// Calculate IQR outliers
export const detectOutliersIQR = (
  records: PiyologRecord[],
  activityType: ActivityType,
  metric: 'duration' | 'quantity',
  multiplier = 1.5
): OutlierResult[] => {
  const filtered = records.filter((r) => r.activityType === activityType)
  const values = filtered
    .map((r) => (metric === 'duration' ? r.duration : r.quantity))
    .filter((v): v is number => v !== undefined)

  if (values.length < 5) return []

  // Calculate quartiles
  const sorted = [...values].sort((a, b) => a - b)
  const q1Index = Math.floor(sorted.length * 0.25)
  const q3Index = Math.floor(sorted.length * 0.75)
  const q1 = sorted[q1Index]
  const q3 = sorted[q3Index]
  const iqr = q3 - q1

  const lowerBound = q1 - multiplier * iqr
  const upperBound = q3 + multiplier * iqr

  // Find outliers
  const outliers: OutlierResult[] = []

  filtered.forEach((record) => {
    const value = metric === 'duration' ? record.duration : record.quantity
    if (value === undefined) return

    if (value < lowerBound || value > upperBound) {
      // Calculate IQR score (how many IQRs away from the bounds)
      let iqrScore: number
      if (value < lowerBound) {
        iqrScore = (lowerBound - value) / iqr
      } else {
        iqrScore = (value - upperBound) / iqr
      }

      let severity: 'mild' | 'moderate' | 'extreme'
      if (iqrScore > 3) severity = 'extreme'
      else if (iqrScore > 2) severity = 'moderate'
      else severity = 'mild'

      outliers.push({
        record,
        metric,
        value,
        method: 'iqr',
        score: iqrScore,
        severity,
      })
    }
  })

  return outliers.sort((a, b) => b.score - a.score)
}

// Detect all outliers (combines both methods)
export const detectAllOutliers = (
  records: PiyologRecord[],
  activityType: ActivityType,
  metric: 'duration' | 'quantity'
): OutlierResult[] => {
  const zScoreOutliers = detectOutliersZScore(records, activityType, metric)
  const iqrOutliers = detectOutliersIQR(records, activityType, metric)

  // Combine and deduplicate
  const seen = new Set<number>()
  const combined: OutlierResult[] = []

  // Prefer z-score method
  zScoreOutliers.forEach((outlier) => {
    const id = outlier.record.id
    if (!seen.has(id)) {
      seen.add(id)
      combined.push(outlier)
    }
  })

  iqrOutliers.forEach((outlier) => {
    const id = outlier.record.id
    if (!seen.has(id)) {
      seen.add(id)
      combined.push(outlier)
    }
  })

  return combined.sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
}

// Generate human-readable insight
export type CorrelationInsight = {
  message: string
  type: 'positive' | 'negative' | 'neutral'
}

export const generateCorrelationInsight = (correlation: CorrelationResult): CorrelationInsight => {
  const { activityType1, activityType2, strength, direction, coefficient } = correlation

  if (direction === 'none' || strength === 'very weak') {
    return {
      message: `${activityType1}と${activityType2}の間に明確な関連性は見られません`,
      type: 'neutral',
    }
  }

  const strengthJa =
    strength === 'very strong'
      ? '非常に強い'
      : strength === 'strong'
        ? '強い'
        : strength === 'moderate'
          ? '中程度の'
          : '弱い'

  if (direction === 'positive') {
    return {
      message: `${activityType1}と${activityType2}の間に${strengthJa}正の相関があります（${coefficient.toFixed(2)}）。${activityType1}が増えると${activityType2}も増える傾向があります`,
      type: 'positive',
    }
  } else {
    return {
      message: `${activityType1}と${activityType2}の間に${strengthJa}負の相関があります（${coefficient.toFixed(2)}）。${activityType1}が増えると${activityType2}は減る傾向があります`,
      type: 'negative',
    }
  }
}

// Generate outlier insight
export type OutlierInsight = {
  message: string
  type: 'warning' | 'info'
}

export const generateOutlierInsight = (outlier: OutlierResult): OutlierInsight => {
  const { record, metric, value, severity } = outlier
  const metricJa = metric === 'duration' ? '時間' : '量'
  const date = record.timestamp.toLocaleDateString('ja-JP')

  const severityJa =
    severity === 'extreme' ? '極端に' : severity === 'moderate' ? '著しく' : 'やや'

  const comparison = outlier.score > 0 ? '長い' : '短い'

  return {
    message: `${date}の${record.activityType}の${metricJa}が${severityJa}${comparison}です（${value}）`,
    type: severity === 'extreme' ? 'warning' : 'info',
  }
}
