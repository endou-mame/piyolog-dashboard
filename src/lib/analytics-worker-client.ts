// Analytics Worker client wrapper
// Functional programming style

import type { PiyologRecord, ActivityType } from '../types/database'
import type { AnalyticsWorkerMessage, AnalyticsWorkerResponse } from '../workers/analytics.worker'

export type AnalyticsProgress = {
  message: string
  percent: number
}

export type AnalyticsResult = {
  statistics?: any
  trends?: any
  correlations?: any
  outliers?: any
}

export type AnalyticsComputeOptions = {
  records: PiyologRecord[]
  activityTypes: ActivityType[]
  onProgress?: (progress: AnalyticsProgress) => void
  timeout?: number
}

// Create worker instance
const createAnalyticsWorker = (): Worker => {
  return new Worker(new URL('../workers/analytics.worker.ts', import.meta.url), {
    type: 'module',
  })
}

// Generic worker message handler
const sendWorkerMessage = <T>(
  worker: Worker,
  message: AnalyticsWorkerMessage,
  onProgress?: (progress: AnalyticsProgress) => void,
  timeout: number = 30000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      worker.terminate()
      reject(new Error('Analytics computation timed out'))
    }, timeout)

    worker.onmessage = (event: MessageEvent<AnalyticsWorkerResponse>) => {
      const response = event.data

      switch (response.type) {
        case 'progress':
          onProgress?.({ message: response.message, percent: response.percent })
          break

        case 'error':
          clearTimeout(timeoutId)
          worker.terminate()
          reject(new Error(response.error))
          break

        case 'statistics_result':
        case 'trends_result':
        case 'correlations_result':
        case 'all_result':
          clearTimeout(timeoutId)
          worker.terminate()
          resolve(response as T)
          break

        default:
          clearTimeout(timeoutId)
          worker.terminate()
          reject(new Error('Unknown response type'))
      }
    }

    worker.onerror = (error) => {
      clearTimeout(timeoutId)
      worker.terminate()
      reject(new Error(`Worker error: ${error.message}`))
    }

    worker.postMessage(message)
  })
}

// Compute all analytics in worker
export const computeAllAnalytics = async (
  options: AnalyticsComputeOptions
): Promise<AnalyticsResult> => {
  const worker = createAnalyticsWorker()

  try {
    const response = await sendWorkerMessage<AnalyticsWorkerResponse>(
      worker,
      {
        type: 'compute_all',
        records: options.records,
        activityTypes: options.activityTypes,
      },
      options.onProgress,
      options.timeout
    )

    if (response.type === 'all_result') {
      return {
        statistics: response.statistics,
        trends: response.trends,
        correlations: response.correlations,
        outliers: response.outliers,
      }
    }

    throw new Error('Unexpected response type')
  } catch (error) {
    throw error
  }
}

// Compute statistics only
export const computeStatistics = async (
  options: AnalyticsComputeOptions
): Promise<any> => {
  const worker = createAnalyticsWorker()

  try {
    const response = await sendWorkerMessage<AnalyticsWorkerResponse>(
      worker,
      {
        type: 'compute_statistics',
        records: options.records,
        activityTypes: options.activityTypes,
      },
      options.onProgress,
      options.timeout
    )

    if (response.type === 'statistics_result') {
      return response.result
    }

    throw new Error('Unexpected response type')
  } catch (error) {
    throw error
  }
}

// Compute trends only
export const computeTrends = async (
  options: AnalyticsComputeOptions
): Promise<any> => {
  const worker = createAnalyticsWorker()

  try {
    const response = await sendWorkerMessage<AnalyticsWorkerResponse>(
      worker,
      {
        type: 'compute_trends',
        records: options.records,
        activityTypes: options.activityTypes,
      },
      options.onProgress,
      options.timeout
    )

    if (response.type === 'trends_result') {
      return response.result
    }

    throw new Error('Unexpected response type')
  } catch (error) {
    throw error
  }
}

// Compute correlations only
export const computeCorrelations = async (
  options: AnalyticsComputeOptions
): Promise<any> => {
  const worker = createAnalyticsWorker()

  try {
    const response = await sendWorkerMessage<AnalyticsWorkerResponse>(
      worker,
      {
        type: 'compute_correlations',
        records: options.records,
        activityTypes: options.activityTypes,
      },
      options.onProgress,
      options.timeout
    )

    if (response.type === 'correlations_result') {
      return response.result
    }

    throw new Error('Unexpected response type')
  } catch (error) {
    throw error
  }
}

// Check if Web Workers are supported
export const isWebWorkerSupported = (): boolean => {
  return typeof Worker !== 'undefined'
}
