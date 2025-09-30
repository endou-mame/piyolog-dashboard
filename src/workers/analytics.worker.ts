// Analytics computation Web Worker
// Offloads heavy analytics calculations to background thread

import type { PiyologRecord, ActivityType } from '../types/database'
import { calculateAllStatistics } from '../lib/analytics/statistics'
import { analyzeAllTrends } from '../lib/analytics/trends'
import { calculateAllCorrelations, detectAllOutliers } from '../lib/analytics/correlations'

export type AnalyticsWorkerMessage =
  | { type: 'compute_all'; records: PiyologRecord[]; activityTypes: ActivityType[] }
  | { type: 'compute_statistics'; records: PiyologRecord[]; activityTypes: ActivityType[] }
  | { type: 'compute_trends'; records: PiyologRecord[]; activityTypes: ActivityType[] }
  | { type: 'compute_correlations'; records: PiyologRecord[]; activityTypes: ActivityType[] }

export type AnalyticsWorkerResponse =
  | { type: 'progress'; message: string; percent: number }
  | { type: 'error'; error: string }
  | { type: 'statistics_result'; result: ReturnType<typeof calculateAllStatistics> }
  | { type: 'trends_result'; result: ReturnType<typeof analyzeAllTrends> }
  | { type: 'correlations_result'; result: ReturnType<typeof calculateAllCorrelations> }
  | { type: 'all_result'; statistics: any; trends: any; correlations: any; outliers: any }

// Worker message handler
self.onmessage = (event: MessageEvent<AnalyticsWorkerMessage>) => {
  const { type } = event.data

  try {
    switch (type) {
      case 'compute_all':
        computeAll(event.data.records, event.data.activityTypes)
        break
      case 'compute_statistics':
        computeStatistics(event.data.records, event.data.activityTypes)
        break
      case 'compute_trends':
        computeTrends(event.data.records, event.data.activityTypes)
        break
      case 'compute_correlations':
        computeCorrelations(event.data.records, event.data.activityTypes)
        break
      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    postMessage({ type: 'error', error: errorMessage } satisfies AnalyticsWorkerResponse)
  }
}

const postProgress = (message: string, percent: number) => {
  postMessage({ type: 'progress', message, percent } satisfies AnalyticsWorkerResponse)
}

const computeAll = (records: PiyologRecord[], activityTypes: ActivityType[]) => {
  postProgress('統計計算中...', 10)
  const statistics = calculateAllStatistics(records, activityTypes)

  postProgress('トレンド分析中...', 40)
  const allTrends: ReturnType<typeof analyzeAllTrends> = []
  activityTypes.forEach((activityType) => {
    const trends = analyzeAllTrends(records, activityType)
    allTrends.push(...trends)
  })

  postProgress('相関分析中...', 70)
  const correlations = calculateAllCorrelations(records, activityTypes)

  postProgress('外れ値検出中...', 90)
  const allOutliers: Array<{ activityType: string; outlier: any }> = []
  activityTypes.forEach((activityType) => {
    const durationOutliers = detectAllOutliers(records, activityType, 'duration')
    const quantityOutliers = detectAllOutliers(records, activityType, 'quantity')
    durationOutliers.forEach((outlier) => {
      allOutliers.push({ activityType, outlier })
    })
    quantityOutliers.forEach((outlier) => {
      allOutliers.push({ activityType, outlier })
    })
  })

  postProgress('完了', 100)
  postMessage({
    type: 'all_result',
    statistics,
    trends: allTrends,
    correlations,
    outliers: allOutliers,
  } satisfies AnalyticsWorkerResponse)
}

const computeStatistics = (records: PiyologRecord[], activityTypes: ActivityType[]) => {
  postProgress('統計計算中...', 50)
  const result = calculateAllStatistics(records, activityTypes)
  postProgress('完了', 100)
  postMessage({ type: 'statistics_result', result } satisfies AnalyticsWorkerResponse)
}

const computeTrends = (records: PiyologRecord[], activityTypes: ActivityType[]) => {
  postProgress('トレンド分析中...', 50)
  const allTrends: ReturnType<typeof analyzeAllTrends> = []
  activityTypes.forEach((activityType, index) => {
    const trends = analyzeAllTrends(records, activityType)
    allTrends.push(...trends)
    postProgress(
      `トレンド分析中 (${index + 1}/${activityTypes.length})`,
      50 + (50 * (index + 1)) / activityTypes.length
    )
  })
  postMessage({ type: 'trends_result', result: allTrends } satisfies AnalyticsWorkerResponse)
}

const computeCorrelations = (records: PiyologRecord[], activityTypes: ActivityType[]) => {
  postProgress('相関分析中...', 50)
  const result = calculateAllCorrelations(records, activityTypes)
  postProgress('完了', 100)
  postMessage({ type: 'correlations_result', result } satisfies AnalyticsWorkerResponse)
}
