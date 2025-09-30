// Activity type multi-select filter component
import React from 'react'
import type { ActivityType } from '../../types/database'

type Props = {
  selectedTypes: ActivityType[]
  availableTypes: ActivityType[]
  onChange: (types: ActivityType[]) => void
}

const activityLabels: Record<ActivityType, string> = {
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

export const ActivityTypeFilter: React.FC<Props> = ({
  selectedTypes,
  availableTypes,
  onChange,
}) => {
  const handleToggle = (type: ActivityType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((t) => t !== type))
    } else {
      onChange([...selectedTypes, type])
    }
  }

  const handleSelectAll = () => {
    onChange(availableTypes)
  }

  const handleClearAll = () => {
    onChange([])
  }

  const allSelected = selectedTypes.length === availableTypes.length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">活動種別</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            disabled={allSelected}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            すべて選択
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={handleClearAll}
            disabled={selectedTypes.length === 0}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            クリア
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {availableTypes.map((type) => (
          <label
            key={type}
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => handleToggle(type)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{activityLabels[type]}</span>
          </label>
        ))}
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t">
        {selectedTypes.length > 0
          ? `${selectedTypes.length}件選択中`
          : 'すべての活動種別を表示'}
      </div>
    </div>
  )
}
