// Error boundary component for crash recovery
import React, { Component, ReactNode } from 'react'
import { logError, generateErrorReport, getBrowserInfo } from '../lib/error-logger'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with context
    logError(error, 'browser', {
      componentStack: errorInfo.componentStack,
      browserInfo: getBrowserInfo(),
    })

    this.setState({ errorInfo })

    console.error('Error boundary caught an error:', error, errorInfo)
  }

  handleCopyReport = () => {
    const report = generateErrorReport()
    navigator.clipboard.writeText(report).then(() => {
      alert('エラーレポートをクリップボードにコピーしました')
    }).catch(() => {
      alert('クリップボードへのコピーに失敗しました')
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-lg w-full">
            <div className="text-center mb-6">
              <div className="text-red-500 text-4xl md:text-5xl mb-4">⚠️</div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                エラーが発生しました
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
            </div>

            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                <p className="text-sm font-medium text-red-900 mb-2">エラー詳細:</p>
                <p className="text-xs md:text-sm text-red-800 font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {this.state.errorInfo && (
              <details className="mb-6">
                <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800 mb-2">
                  技術的な詳細を表示
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 text-white py-3 px-4 text-sm md:text-base rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
              >
                🔄 再試行
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 py-3 px-4 text-sm md:text-base rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation"
              >
                🔃 ページをリロード
              </button>
              <button
                onClick={this.handleCopyReport}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 text-sm md:text-base rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
              >
                📋 エラーレポートをコピー
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              問題が解決しない場合は、エラーレポートをコピーしてサポートにお問い合わせください。
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
