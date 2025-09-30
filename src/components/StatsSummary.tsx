// Statistics summary display component
import React, { useMemo } from 'react'
import { StatsCard } from './StatsCard'
import { calculateOverallStatistics, calculateAllStatistics } from '../lib/analytics/statistics'
import type { PiyologRecord } from '../types/database'

type Props = {
  records: PiyologRecord[]
}

export const StatsSummary: React.FC<Props> = React.memo(({ records }) => {
  const overallStats = useMemo(() => {
    return calculateOverallStatistics(records)
  }, [records])

  const activityStats = useMemo(() => {
    return calculateAllStatistics(records)
  }, [records])

  // Format date range
  const formatDate = (date: Date | null): string => {
    if (!date) return '-'
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get top 3 activities
  const topActivities = useMemo(() => {
    return Object.entries(overallStats.activityBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
  }, [overallStats])

  // Activity type labels in Japanese
  const activityLabels: Record<string, string> = {
    feeding: '授乳・ミルク',
    sleeping: '睡眠',
    diaper: 'おむつ',
    temperature: '体温',
    weight: '体重',
    height: '身長',
    bath: 'お風呂',
    walk: 'お散歩',
    medicine: '薬',
    hospital: '病院',
  }

  return (
    <div>
      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="総レコード数"
          value={overallStats.totalRecords.toLocaleString()}
          icon="📊"
          color="blue"
          subtitle="件"
        />
        <StatsCard
          title="データ期間"
          value={overallStats.dateRange.durationDays}
          icon="📅"
          color="green"
          subtitle="日間"
        />
        <StatsCard
          title="活動種別"
          value={overallStats.activityTypeCount}
          icon="📝"
          color="purple"
          subtitle="種類"
        />
        <StatsCard
          title="1日平均"
          value={overallStats.recordsPerDay.toFixed(1)}
          icon="⏱️"
          color="orange"
          subtitle="記録/日"
        />
      </div>

      {/* Date range */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">データ期間</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">開始日</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatDate(overallStats.dateRange.earliest)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">最終日</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatDate(overallStats.dateRange.latest)}
            </p>
          </div>
        </div>
      </div>

      {/* Activity breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">活動種別の内訳</h3>
        <div className="space-y-4">
          {topActivities.map(([activityType, count]) => {
            const percentage = (count / overallStats.totalRecords) * 100
            return (
              <div key={activityType}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {activityLabels[activityType] || activityType}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count.toLocaleString()}件 ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
          {Object.keys(overallStats.activityBreakdown).length > 3 && (
            <p className="text-sm text-gray-500 mt-2">
              他 {Object.keys(overallStats.activityBreakdown).length - 3} 種類
            </p>
          )}
        </div>
      </div>
    </div>
  )
})
