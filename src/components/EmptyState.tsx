// Empty state component for when no data is available
import React from 'react'
import { useNavigate } from 'react-router-dom'

type Props = {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<Props> = ({
  title = 'データがありません',
  message = 'まずはぴよログからエクスポートしたCSVファイルを取り込んでください。',
  actionLabel = 'データを取り込む',
  onAction,
}) => {
  const navigate = useNavigate()

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else {
      navigate('/import')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-6">📭</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-600 text-center mb-8 max-w-md">{message}</p>
      <button
        onClick={handleAction}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        {actionLabel}
      </button>

      {/* Quick guide */}
      <div className="mt-12 max-w-2xl w-full">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">💡</span>
            クイックガイド
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>ぴよログアプリを開く</li>
            <li>「設定」→「データをエクスポート」を選択</li>
            <li>CSV形式でデータを保存</li>
            <li>このダッシュボードの「データ取り込み」ページでファイルをアップロード</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
