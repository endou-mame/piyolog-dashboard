// Activity distribution doughnut chart component
import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { defaultChartOptions, chartColorsArray } from '../../lib/chart-config'
import type { PiyologRecord } from '../../types/database'

type Props = {
  records: PiyologRecord[]
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

export const ActivityDistributionChart: React.FC<Props> = ({ records, height = 300 }) => {
  const chartData = useMemo((): ChartData<'doughnut'> => {
    // Count by activity type
    const counts: Record<string, number> = {}
    records.forEach((record) => {
      counts[record.activityType] = (counts[record.activityType] || 0) + 1
    })

    // Sort by count descending
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a)

    return {
      labels: sorted.map(([type]) => activityLabels[type] || type),
      datasets: [
        {
          label: '記録数',
          data: sorted.map(([, count]) => count),
          backgroundColor: sorted.map((_, index) =>
            chartColorsArray[index % chartColorsArray.length]
          ),
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    }
  }, [records])

  const options: ChartOptions<'doughnut'> = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: '活動種別の割合',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((sum: number, val) =>
              sum + (typeof val === 'number' ? val : 0), 0
            )
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value}件 (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <div style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}
