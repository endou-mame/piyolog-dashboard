// Date range filter component
import React, { useState } from 'react'

type Props = {
  startDate: string | undefined
  endDate: string | undefined
  onChange: (startDate: string | undefined, endDate: string | undefined) => void
  minDate?: string
  maxDate?: string
}

type Preset = {
  label: string
  days: number
}

const presets: Preset[] = [
  { label: '過去7日間', days: 7 },
  { label: '過去30日間', days: 30 },
  { label: '過去90日間', days: 90 },
]

export const DateRangeFilter: React.FC<Props> = ({
  startDate,
  endDate,
  onChange,
  minDate,
  maxDate,
}) => {
  const [localStartDate, setLocalStartDate] = useState(startDate || '')
  const [localEndDate, setLocalEndDate] = useState(endDate || '')

  const handleApply = () => {
    onChange(
      localStartDate || undefined,
      localEndDate || undefined
    )
  }

  const handlePreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    setLocalStartDate(startStr)
    setLocalEndDate(endStr)
    onChange(startStr, endStr)
  }

  const handleClear = () => {
    setLocalStartDate('')
    setLocalEndDate('')
    onChange(undefined, undefined)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">期間</h3>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.days}
            onClick={() => handlePreset(preset.days)}
            className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          すべて
        </button>
      </div>

      {/* Custom date inputs */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">開始日</label>
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => setLocalStartDate(e.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">終了日</label>
          <input
            type="date"
            value={localEndDate}
            onChange={(e) => setLocalEndDate(e.target.value)}
            min={minDate || localStartDate}
            max={maxDate}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(localStartDate || localEndDate) && (
          <button
            onClick={handleApply}
            className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            適用
          </button>
        )}
      </div>

      {/* Current selection display */}
      {(startDate || endDate) && (
        <div className="text-xs text-gray-600 pt-2 border-t">
          {startDate && endDate
            ? `${startDate} 〜 ${endDate}`
            : startDate
              ? `${startDate} 以降`
              : `${endDate} 以前`}
        </div>
      )}
    </div>
  )
}
