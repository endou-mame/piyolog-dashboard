// Import result display component
import React from 'react'
import type { CSVParseError } from '../lib/csv-parser'

type Props = {
  recordCount: number
  totalRows: number
  errors: CSVParseError[]
  onClose: () => void
  onViewDashboard?: () => void
}

export const ImportResult: React.FC<Props> = ({
  recordCount,
  totalRows,
  errors,
  onClose,
  onViewDashboard,
}) => {
  const hasErrors = errors.length > 0
  const successRate = totalRows > 0 ? (recordCount / totalRows) * 100 : 0

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center">
          <span className="text-4xl mr-3">
            {hasErrors ? (recordCount > 0 ? '⚠️' : '❌') : '✅'}
          </span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {hasErrors
                ? recordCount > 0
                  ? 'インポート完了（一部エラー）'
                  : 'インポート失敗'
                : 'インポート成功'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalRows}行中{recordCount}行のレコードをインポートしました
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="閉じる"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Success rate */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">成功率</span>
          <span className="text-sm font-medium text-gray-900">{successRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              successRate === 100 ? 'bg-green-500' : successRate > 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{recordCount}</p>
          <p className="text-xs text-green-600 mt-1">成功</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{errors.length}</p>
          <p className="text-xs text-red-600 mt-1">エラー</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalRows}</p>
          <p className="text-xs text-blue-600 mt-1">合計</p>
        </div>
      </div>

      {/* Error details */}
      {hasErrors && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">エラー詳細</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {errors.slice(0, 10).map((error, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium text-gray-700">
                    {error.row === 0 ? 'ヘッダー' : `${error.row}行目`}
                  </span>
                  {error.field && (
                    <span className="text-gray-600"> - {error.field}</span>
                  )}
                  <span className="text-gray-600">: {error.message}</span>
                </div>
              ))}
              {errors.length > 10 && (
                <p className="text-xs text-gray-500 mt-2">
                  ...他{errors.length - 10}件のエラー
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {recordCount > 0 && onViewDashboard && (
          <button
            onClick={onViewDashboard}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ダッシュボードを表示
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          {recordCount > 0 ? '閉じる' : '再試行'}
        </button>
      </div>

      {/* Help text */}
      {hasErrors && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 ヒント: エラーが発生した行を修正して、再度インポートしてください。
            すでにインポートされたレコードは保持されています。
          </p>
        </div>
      )}
    </div>
  )
}
