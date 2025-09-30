// Correlations page
import React, { useMemo } from 'react'
import { useAppStore, selectRecords, selectFilters } from '../store/app-store'
import { EmptyState } from '../components/EmptyState'
import { FilterPanel } from '../components/filters/FilterPanel'
import { getUniqueActivityTypes, filterByDateRange } from '../lib/analytics/statistics'
import {
  calculateAllCorrelations,
  getSignificantCorrelations,
  generateCorrelationInsight,
  detectAllOutliers,
  generateOutlierInsight,
} from '../lib/analytics/correlations'

export const Correlations: React.FC = () => {
  const records = useAppStore(selectRecords)
  const filters = useAppStore(selectFilters)
  const setFilters = useAppStore((state) => state.setFilters)
  const resetFilters = useAppStore((state) => state.resetFilters)

  // Apply filters to records
  const filteredRecords = useMemo(() => {
    let filtered = records

    const startDate = filters.startDate ? new Date(filters.startDate) : undefined
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined
    filtered = filterByDateRange(filtered, startDate, endDate)

    if (filters.activityType) {
      filtered = filtered.filter((r) => r.activityType === filters.activityType)
    }

    return filtered
  }, [records, filters])

  const availableActivityTypes = useMemo(() => {
    return getUniqueActivityTypes(records)
  }, [records])

  const dateRange = useMemo(() => {
    if (records.length === 0) return { min: undefined, max: undefined }
    const dates = records.map((r) => r.timestamp.getTime())
    return {
      min: new Date(Math.min(...dates)).toISOString().split('T')[0],
      max: new Date(Math.max(...dates)).toISOString().split('T')[0],
    }
  }, [records])

  // Calculate correlations
  const correlations = useMemo(() => {
    return calculateAllCorrelations(filteredRecords, availableActivityTypes)
  }, [filteredRecords, availableActivityTypes])

  const significantCorrelations = useMemo(() => {
    return getSignificantCorrelations(correlations)
  }, [correlations])

  // Detect outliers for each activity type
  const outliers = useMemo(() => {
    const allOutliers: Array<{ activityType: string; outlier: any }> = []
    availableActivityTypes.forEach((activityType) => {
      const durationOutliers = detectAllOutliers(filteredRecords, activityType, 'duration')
      const quantityOutliers = detectAllOutliers(filteredRecords, activityType, 'quantity')

      durationOutliers.forEach((outlier) => {
        allOutliers.push({ activityType, outlier })
      })
      quantityOutliers.forEach((outlier) => {
        allOutliers.push({ activityType, outlier })
      })
    })
    return allOutliers.slice(0, 10) // Top 10 outliers
  }, [filteredRecords, availableActivityTypes])

  if (records.length === 0) {
    return <EmptyState />
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">相関分析</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter sidebar */}
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filters}
            availableActivityTypes={availableActivityTypes}
            onFiltersChange={setFilters}
            onReset={resetFilters}
            minDate={dateRange.min}
            maxDate={dateRange.max}
            isMobile={false}
          />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Correlations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🔗</span>
              活動間の相関関係
            </h2>
            {significantCorrelations.length === 0 ? (
              <p className="text-gray-600">
                有意な相関関係は見つかりませんでした。少なくとも7日分のデータが必要です。
              </p>
            ) : (
              <div className="space-y-4">
                {significantCorrelations.map((correlation, index) => {
                  const insight = generateCorrelationInsight(correlation)
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        insight.type === 'positive'
                          ? 'bg-green-50 border-green-200'
                          : insight.type === 'negative'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          {correlation.activityType1} ⟷ {correlation.activityType2}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-white">
                          {correlation.strength}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{insight.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        サンプル数: {correlation.sampleSize}日
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Outliers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">⚠️</span>
              外れ値・注目イベント
            </h2>
            {outliers.length === 0 ? (
              <p className="text-gray-600">外れ値は検出されませんでした。</p>
            ) : (
              <div className="space-y-3">
                {outliers.map(({ activityType, outlier }, index) => {
                  const insight = generateOutlierInsight(outlier)
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        insight.type === 'warning'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-xl">
                          {insight.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activityType}
                          </p>
                          <p className="text-sm text-gray-700">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
