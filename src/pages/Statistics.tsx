// Statistics page
import React, { useMemo } from 'react'
import { useAppStore, selectRecords, selectFilters } from '../store/app-store'
import { EmptyState } from '../components/EmptyState'
import { FilterPanel } from '../components/filters/FilterPanel'
import { StatsSummary } from '../components/StatsSummary'
import { ActivityFrequencyChart } from '../components/charts/ActivityFrequencyChart'
import { ActivityDistributionChart } from '../components/charts/ActivityDistributionChart'
import { getUniqueActivityTypes, filterByDateRange } from '../lib/analytics/statistics'
import { useIsMobile } from '../hooks/useMediaQuery'

export const Statistics: React.FC = () => {
  const records = useAppStore(selectRecords)
  const filters = useAppStore(selectFilters)
  const setFilters = useAppStore((state) => state.setFilters)
  const resetFilters = useAppStore((state) => state.resetFilters)
  const isMobile = useIsMobile()

  // Apply filters to records
  const filteredRecords = useMemo(() => {
    let filtered = records

    // Date range filter
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined
    filtered = filterByDateRange(filtered, startDate, endDate)

    // Activity type filter
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

  if (records.length === 0) {
    return <EmptyState />
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">統計分析</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Filter sidebar */}
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filters}
            availableActivityTypes={availableActivityTypes}
            onFiltersChange={setFilters}
            onReset={resetFilters}
            minDate={dateRange.min}
            maxDate={dateRange.max}
            isMobile={isMobile}
          />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
              <div className="text-4xl md:text-6xl mb-4">🔍</div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                該当するデータがありません
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                フィルター条件を変更してください
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                フィルターをリセット
              </button>
            </div>
          ) : (
            <>
              <StatsSummary records={filteredRecords} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <ActivityFrequencyChart records={filteredRecords} height={isMobile ? 250 : 300} />
                </div>
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <ActivityDistributionChart records={filteredRecords} height={isMobile ? 250 : 300} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
