// Activity frequency bar chart component
import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { defaultChartOptions, chartColorsArray, rgbaColor } from '../../lib/chart-config'
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

export const ActivityFrequencyChart: React.FC<Props> = ({ records, height = 300 }) => {
  const chartData = useMemo((): ChartData<'bar'> => {
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
            rgbaColor(chartColorsArray[index % chartColorsArray.length], 0.8)
          ),
          borderColor: sorted.map((_, index) =>
            chartColorsArray[index % chartColorsArray.length]
          ),
          borderWidth: 2,
        },
      ],
    }
  }, [records])

  const options: ChartOptions<'bar'> = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '活動種別ごとの記録数',
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
      },
    },
  }

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
