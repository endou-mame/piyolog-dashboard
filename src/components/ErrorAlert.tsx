// Error alert component with severity levels
import React from 'react'

export type ErrorSeverity = 'error' | 'warning' | 'info'

type Props = {
  severity?: ErrorSeverity
  title: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

const severityConfig: Record<
  ErrorSeverity,
  { bgColor: string; borderColor: string; textColor: string; icon: string }
> = {
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    icon: '❌',
  },
  warning: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    icon: '⚠️',
  },
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    icon: 'ℹ️',
  },
}

export const ErrorAlert: React.FC<Props> = ({
  severity = 'error',
  title,
  message,
  onRetry,
  onDismiss,
}) => {
  const config = severityConfig[severity]

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 md:p-6`}
      role="alert"
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3 flex-shrink-0">{config.icon}</span>
        <div className="flex-1">
          <h3 className={`text-base md:text-lg font-semibold ${config.textColor} mb-2`}>
            {title}
          </h3>
          <p className={`text-sm md:text-base ${config.textColor} whitespace-pre-wrap`}>
            {message}
          </p>

          {(onRetry || onDismiss) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 text-sm md:text-base bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                >
                  🔄 再試行
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-4 py-2 text-sm md:text-base text-gray-600 hover:text-gray-800 underline touch-manipulation"
                >
                  閉じる
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
