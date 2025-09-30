// Time series line chart component
import React, { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { defaultChartOptions, chartColors, rgbaColor } from '../../lib/chart-config'
import type { PiyologRecord, ActivityType } from '../../types/database'
import { groupRecordsByDate } from '../../lib/analytics/trends'

type Props = {
  records: PiyologRecord[]
  activityType: ActivityType
  height?: number
}

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

export const TimeSeriesChart: React.FC<Props> = ({ records, activityType, height = 300 }) => {
  const chartData = useMemo((): ChartData<'line'> => {
    // Filter by activity type
    const filtered = records.filter((r) => r.activityType === activityType)

    // Group by date
    const grouped = groupRecordsByDate(filtered)

    // Create sorted date array
    const dates = Array.from(grouped.keys()).sort()

    // Count records per day
    const counts = dates.map((date) => grouped.get(date)?.length || 0)

    return {
      labels: dates.map((date) => {
        const d = new Date(date)
        return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
      }),
      datasets: [
        {
          label: activityLabels[activityType] || activityType,
          data: counts,
          borderColor: chartColors.primary,
          backgroundColor: rgbaColor(chartColors.primary, 0.1),
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }
  }, [records, activityType])

  const options: ChartOptions<'line'> = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: `${activityLabels[activityType] || activityType} - 日別推移`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        title: {
          display: true,
          text: '記録数',
        },
      },
      x: {
        title: {
          display: true,
          text: '日付',
        },
      },
    },
  }

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
