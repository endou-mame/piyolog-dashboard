// Dashboard page
import React, { useEffect, useMemo } from 'react'
import { useAppStore, selectRecords } from '../store/app-store'
import { Onboarding } from '../components/Onboarding'
import { StatsSummary } from '../components/StatsSummary'
import { ActivityFrequencyChart } from '../components/charts/ActivityFrequencyChart'
import { ActivityDistributionChart } from '../components/charts/ActivityDistributionChart'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { getUniqueActivityTypes } from '../lib/analytics/statistics'
import { useIsMobile } from '../hooks/useMediaQuery'

export const Dashboard: React.FC = () => {
  const records = useAppStore(selectRecords)
  const fetchRecords = useAppStore((state) => state.fetchRecords)
  const isFirstVisit = records.length === 0
  const isMobile = useIsMobile()

  // Get most frequent activity type for time series chart
  const primaryActivityType = useMemo(() => {
    if (records.length === 0) return 'feeding'
    const activityTypes = getUniqueActivityTypes(records)
    return activityTypes[0] || 'feeding'
  }, [records])

  // Fetch records on mount if apiConfig is set
  useEffect(() => {
    const apiConfig = useAppStore.getState().apiConfig
    if (apiConfig && records.length === 0) {
      fetchRecords()
    }
  }, [])

  return (
    <div>
      {isFirstVisit ? (
        <Onboarding />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <button
              onClick={fetchRecords}
              className="px-3 py-2 md:px-4 text-xs md:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🔄 更新
            </button>
          </div>

          {/* Statistics Summary */}
          <StatsSummary records={records} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
            {/* Activity Frequency Bar Chart */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <ActivityFrequencyChart records={records} height={isMobile ? 250 : 300} />
            </div>

            {/* Activity Distribution Doughnut Chart */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <ActivityDistributionChart records={records} height={isMobile ? 250 : 300} />
            </div>
          </div>

          {/* Time Series Chart */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-4 md:mt-6">
            <TimeSeriesChart
              records={records}
              activityType={primaryActivityType}
              height={isMobile ? 250 : 350}
            />
          </div>
        </>
      )}
    </div>
  )
}
