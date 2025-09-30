// Filter panel component with activity type and date range filters
import React, { useState, useMemo } from 'react'
import { ActivityTypeFilter } from './ActivityTypeFilter'
import { DateRangeFilter } from './DateRangeFilter'
import type { ActivityType } from '../../types/database'
import type { RecordQueryFilters } from '../../types/database'

type Props = {
  filters: RecordQueryFilters
  availableActivityTypes: ActivityType[]
  onFiltersChange: (filters: RecordQueryFilters) => void
  onReset: () => void
  minDate?: string
  maxDate?: string
  isMobile?: boolean
}

export const FilterPanel: React.FC<Props> = ({
  filters,
  availableActivityTypes,
  onFiltersChange,
  onReset,
  minDate,
  maxDate,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(!isMobile)

  const selectedActivityTypes = useMemo(() => {
    if (!filters.activityType) return availableActivityTypes
    return [filters.activityType]
  }, [filters.activityType, availableActivityTypes])

  const handleActivityTypesChange = (types: ActivityType[]) => {
    onFiltersChange({
      ...filters,
      activityType: types.length === availableActivityTypes.length ? undefined : types[0],
    })
  }

  const handleDateRangeChange = (startDate: string | undefined, endDate: string | undefined) => {
    onFiltersChange({
      ...filters,
      startDate,
      endDate,
    })
  }

  const hasActiveFilters = !!(
    filters.activityType ||
    filters.startDate ||
    filters.endDate
  )

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">🔍</span>
            フィルター
          </h2>
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                リセット
              </button>
            )}
            {isMobile && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-500 hover:text-gray-700"
                aria-label={isOpen ? '閉じる' : '開く'}
              >
                {isOpen ? '▲' : '▼'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter content */}
      {isOpen && (
        <div className="px-6 py-4 space-y-6">
          {/* Activity Type Filter */}
          <ActivityTypeFilter
            selectedTypes={selectedActivityTypes}
            availableTypes={availableActivityTypes}
            onChange={handleActivityTypesChange}
          />

          <div className="border-t border-gray-200 pt-6">
            {/* Date Range Filter */}
            <DateRangeFilter
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={handleDateRangeChange}
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>
        </div>
      )}

      {/* Active filters summary (when collapsed on mobile) */}
      {isMobile && !isOpen && hasActiveFilters && (
        <div className="px-6 py-3 text-sm text-gray-600">
          フィルター適用中
        </div>
      )}
    </div>
  )
}
