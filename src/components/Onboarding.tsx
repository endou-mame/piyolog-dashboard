// Onboarding screen for first-time users
import React from 'react'
import { useNavigate } from 'react-router-dom'

type Props = {
  onGetStarted?: () => void
}

export const Onboarding: React.FC<Props> = ({ onGetStarted }) => {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted()
    } else {
      navigate('/import')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero section */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">👶</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Piyolog Dashboard へようこそ
        </h1>
        <p className="text-xl text-gray-600">
          赤ちゃんの記録を分析して、パターンやトレンドを可視化しましょう
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl mb-3">📥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            簡単データ取り込み
          </h3>
          <p className="text-sm text-gray-600">
            ぴよログからエクスポートしたCSVファイルをドラッグ&ドロップするだけ
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            自動データ分析
          </h3>
          <p className="text-sm text-gray-600">
            頻度、トレンド、相関関係を自動で計算し、わかりやすく表示
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl mb-3">📈</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            インタラクティブなグラフ
          </h3>
          <p className="text-sm text-gray-600">
            時系列グラフ、集計グラフで赤ちゃんの成長パターンを視覚化
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          使い方は簡単3ステップ
        </h2>
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                ぴよログからデータをエクスポート
              </h3>
              <p className="text-sm text-gray-600">
                ぴよログアプリで「設定」→「データをエクスポート」からCSVファイルを出力
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                CSVファイルをアップロード
              </h3>
              <p className="text-sm text-gray-600">
                「データ取り込み」ページでファイルを選択するかドラッグ&ドロップ
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                ダッシュボードで分析結果を確認
              </h3>
              <p className="text-sm text-gray-600">
                自動的に統計分析が行われ、グラフと洞察が表示されます
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={handleGetStarted}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          はじめる
        </button>
        <p className="text-sm text-gray-500 mt-4">
          まずはデータを取り込んでみましょう
        </p>
      </div>

      {/* Info boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center">
            <span className="text-xl mr-2">🔒</span>
            安全な家族共有
          </h3>
          <p className="text-sm text-green-800">
            パスワード保護により、家族内で安全にデータを共有できます。データはCloudflareの安全なサーバーに保存されます。
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
            <span className="text-xl mr-2">⚡</span>
            高速・軽量
          </h3>
          <p className="text-sm text-purple-800">
            エッジコンピューティングにより、世界中どこからでも高速アクセス。10,000件のレコードも3秒以内に処理します。
          </p>
        </div>
      </div>
    </div>
  )
}
