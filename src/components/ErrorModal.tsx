// Error modal for critical errors
import React from 'react'
import type { ErrorSeverity } from './ErrorAlert'

type Props = {
  isOpen: boolean
  severity?: ErrorSeverity
  title: string
  message: string
  details?: string
  onRetry?: () => void
  onClose: () => void
}

const severityConfig: Record<ErrorSeverity, { icon: string; titleColor: string }> = {
  error: {
    icon: '❌',
    titleColor: 'text-red-900',
  },
  warning: {
    icon: '⚠️',
    titleColor: 'text-yellow-900',
  },
  info: {
    icon: 'ℹ️',
    titleColor: 'text-blue-900',
  },
}

export const ErrorModal: React.FC<Props> = ({
  isOpen,
  severity = 'error',
  title,
  message,
  details,
  onRetry,
  onClose,
}) => {
  if (!isOpen) return null

  const config = severityConfig[severity]

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start mb-4">
            <span className="text-3xl mr-3 flex-shrink-0">{config.icon}</span>
            <h2 className={`text-xl md:text-2xl font-bold ${config.titleColor} flex-1`}>
              {title}
            </h2>
          </div>

          {/* Message */}
          <div className="mb-4">
            <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap">{message}</p>
          </div>

          {/* Details (collapsible) */}
          {details && (
            <details className="mb-4">
              <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                詳細を表示
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                {details}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-end">
            {onRetry && (
              <button
                onClick={() => {
                  onRetry()
                  onClose()
                }}
                className="px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
              >
                🔄 再試行
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm md:text-base bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
