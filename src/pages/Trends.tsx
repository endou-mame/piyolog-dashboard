// Trends page
import React, { useMemo } from 'react'
import { useAppStore, selectRecords, selectFilters } from '../store/app-store'
import { EmptyState } from '../components/EmptyState'
import { FilterPanel } from '../components/filters/FilterPanel'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { getUniqueActivityTypes, filterByDateRange } from '../lib/analytics/statistics'
import { analyzeAllTrends, getSignificantTrends } from '../lib/analytics/trends'
import type { TrendAnalysis } from '../lib/analytics/trends'

export const Trends: React.FC = () => {
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

  // Analyze trends
  const trends = useMemo(() => {
    const allTrends: TrendAnalysis[] = []
    availableActivityTypes.forEach((activityType) => {
      const activityTrends = analyzeAllTrends(filteredRecords, activityType)
      allTrends.push(...activityTrends)
    })
    return allTrends
  }, [filteredRecords, availableActivityTypes])

  const significantTrends = useMemo(() => {
    return getSignificantTrends(trends)
  }, [trends])

  if (records.length === 0) {
    return <EmptyState />
  }

  const trendLabels: Record<string, string> = {
    increasing: '📈 増加傾向',
    decreasing: '📉 減少傾向',
    stable: '➡️ 安定',
  }

  const metricLabels: Record<string, string> = {
    frequency: '頻度',
    duration: '期間',
    quantity: '量',
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">トレンド分析</h1>

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
          {/* Significant trends summary */}
          {significantTrends.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">💡</span>
                注目のトレンド
              </h2>
              <div className="space-y-3">
                {significantTrends.slice(0, 5).map((trend, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-2xl">{trendLabels[trend.direction].split(' ')[0]}</span>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {trend.activityType} - {metricLabels[trend.metric]}
                      </p>
                      <p className="text-xs text-blue-700">
                        {trendLabels[trend.direction]} (変化率: {(trend.magnitude * 100).toFixed(1)}%/日)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time series charts for each activity */}
          {availableActivityTypes.map((activityType) => (
            <div key={activityType} className="bg-white rounded-lg shadow p-6">
              <TimeSeriesChart
                records={filteredRecords}
                activityType={activityType}
                height={300}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
