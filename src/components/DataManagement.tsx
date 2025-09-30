// Data management component
import React, { useState, useMemo } from 'react'
import { useAppStore, selectRecords } from '../store/app-store'

export const DataManagement: React.FC = () => {
  const records = useAppStore(selectRecords)
  const clearData = useAppStore((state) => state.clearData)
  const fetchRecords = useAppStore((state) => state.fetchRecords)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleClearData = async () => {
    setIsClearing(true)
    await clearData()
    setIsClearing(false)
    setShowConfirmDialog(false)
  }

  const estimatedStorageSize = useMemo(() => {
    // Rough estimate: ~200 bytes per record
    const sizeInBytes = records.length * 200
    if (sizeInBytes < 1024) return `${sizeInBytes} B`
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
  }, [records])

  const dateRange = useMemo(() => {
    if (records.length === 0) return null
    const dates = records.map((r) => r.timestamp.getTime())
    return {
      earliest: new Date(Math.min(...dates)),
      latest: new Date(Math.max(...dates)),
    }
  }, [records])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Current data summary */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          現在のデータ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">総レコード数</p>
            <p className="text-2xl font-bold text-blue-900">
              {records.length.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">推定データサイズ</p>
            <p className="text-2xl font-bold text-green-900">{estimatedStorageSize}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 mb-1">データ期間</p>
            <p className="text-lg font-bold text-purple-900">
              {dateRange
                ? `${dateRange.earliest.toLocaleDateString('ja-JP')} 〜 ${dateRange.latest.toLocaleDateString('ja-JP')}`
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">⚙️</span>
          データ操作
        </h2>
        <div className="space-y-4">
          {/* Refresh data */}
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">データを更新</h3>
              <p className="text-sm text-gray-600">
                サーバーから最新のデータを取得します
              </p>
            </div>
            <button
              onClick={fetchRecords}
              className="ml-4 px-4 py-3 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
            >
              🔄 更新
            </button>
          </div>

          {/* Clear data */}
          <div className="flex items-start justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-1">
              <h3 className="font-medium text-red-900 mb-1">すべてのデータを削除</h3>
              <p className="text-sm text-red-700">
                サーバー上のすべてのレコードを完全に削除します。この操作は取り消せません。
              </p>
            </div>
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={records.length === 0}
              className="ml-4 px-4 py-3 text-sm md:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              🗑️ 削除
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              データ削除の確認
            </h3>
            <p className="text-gray-700 mb-6">
              本当にすべてのデータを削除しますか？この操作は取り消せません。
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
              <p className="text-sm text-red-800">
                <strong>{records.length.toLocaleString()}件</strong>
                のレコードが削除されます
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isClearing}
                className="flex-1 px-4 py-3 text-sm md:text-base bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors disabled:opacity-50 touch-manipulation"
              >
                キャンセル
              </button>
              <button
                onClick={handleClearData}
                disabled={isClearing}
                className="flex-1 px-4 py-3 text-sm md:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 touch-manipulation"
              >
                {isClearing ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
