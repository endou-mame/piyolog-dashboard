// Import page
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUpload } from '../components/FileUpload'
import { ImportResult } from '../components/ImportResult'
import { useAppStore } from '../store/app-store'

export const Import: React.FC = () => {
  const navigate = useNavigate()
  const { importFile, importProgress } = useAppStore()
  const [showResult, setShowResult] = useState(false)

  const handleFileSelect = async (file: File) => {
    setShowResult(false)
    await importFile(file)
    setShowResult(true)
  }

  const handleCloseResult = () => {
    setShowResult(false)
  }

  const handleViewDashboard = () => {
    setShowResult(false)
    navigate('/')
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">データ取り込み</h1>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <span className="text-xl md:text-2xl mr-2">📋</span>
          インポート手順
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-xs md:text-sm text-blue-800">
          <li>ぴよログアプリから「データをエクスポート」でテキストファイルを出力</li>
          <li>下のエリアにテキストファイルをドラッグ＆ドロップ、または選択ボタンをクリック</li>
          <li>データが自動的に解析され、ダッシュボードに反映されます</li>
        </ol>
      </div>

      {/* File upload */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">ぴよログファイルを選択</h2>
        <FileUpload
          onFileSelect={handleFileSelect}
          isLoading={importProgress.isImporting}
        />
      </div>

      {/* Expected format guide */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">📄</span>
          ぴよログテキストフォーマット
        </h2>
        <div className="text-sm text-gray-700 space-y-3">
          <p>ぴよログから出力されるテキストファイルは以下の形式です：</p>
          <div className="bg-gray-50 rounded p-4 font-mono text-xs overflow-x-auto">
            <pre>
{`2025年10月1日
09:00 ミルク 150ml 20分
11:30 ねんね 90分
14:00 おむつ

2025年10月2日
09:15 ミルク 140ml 15分
...`}
            </pre>
          </div>
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">対応する活動</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
              <span>• ミルク / 母乳</span>
              <span>• ねんね</span>
              <span>• おむつ</span>
              <span>• 体重</span>
              <span>• 身長</span>
              <span>• 体温</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result modal */}
      {showResult && !importProgress.isImporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ImportResult
            recordCount={importProgress.successRows}
            totalRows={importProgress.totalRows}
            errors={importProgress.parseErrors}
            onClose={handleCloseResult}
            onViewDashboard={handleViewDashboard}
          />
        </div>
      )}
    </div>
  )
}
