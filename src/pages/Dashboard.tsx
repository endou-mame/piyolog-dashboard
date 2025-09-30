// Dashboard page
import React, { useEffect, useMemo } from 'react'
import { useAppStore, selectRecords } from '../store/app-store'
import { Onboarding } from '../components/Onboarding'
import { StatsSummary } from '../components/StatsSummary'
import { ActivityFrequencyChart } from '../components/charts/ActivityFrequencyChart'
import { ActivityDistributionChart } from '../components/charts/ActivityDistributionChart'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { getUniqueActivityTypes } from '../lib/analytics/statistics'

export const Dashboard: React.FC = () => {
  const records = useAppStore(selectRecords)
  const fetchRecords = useAppStore((state) => state.fetchRecords)
  const isFirstVisit = records.length === 0

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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <button
              onClick={fetchRecords}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🔄 更新
            </button>
          </div>

          {/* Statistics Summary */}
          <StatsSummary records={records} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Activity Frequency Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <ActivityFrequencyChart records={records} height={300} />
            </div>

            {/* Activity Distribution Doughnut Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <ActivityDistributionChart records={records} height={300} />
            </div>
          </div>

          {/* Time Series Chart */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <TimeSeriesChart
              records={records}
              activityType={primaryActivityType}
              height={350}
            />
          </div>
        </>
      )}
    </div>
  )
}
