// Import page
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUpload } from '../components/FileUpload'
import { ImportResult } from '../components/ImportResult'
import { useAppStore } from '../store/app-store'

export const Import: React.FC = () => {
  const navigate = useNavigate()
  const { importCSV, importProgress } = useAppStore()
  const [showResult, setShowResult] = useState(false)

  const handleFileSelect = async (file: File) => {
    setShowResult(false)
    await importCSV(file)
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
          <li>ぴよログアプリから「データをエクスポート」でCSVファイルを出力</li>
          <li>下のエリアにCSVファイルをドラッグ＆ドロップ、または選択ボタンをクリック</li>
          <li>データが自動的に解析され、ダッシュボードに反映されます</li>
        </ol>
      </div>

      {/* File upload */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">CSVファイルを選択</h2>
        <FileUpload
          onFileSelect={handleFileSelect}
          isLoading={importProgress.isImporting}
        />
      </div>

      {/* Expected format guide */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">📄</span>
          CSVフォーマット
        </h2>
        <div className="text-sm text-gray-700 space-y-3">
          <p>ぴよログから出力されるCSVファイルは以下の形式です：</p>
          <div className="bg-gray-50 rounded p-4 font-mono text-xs overflow-x-auto">
            <pre>
{`timestamp,activity_type,duration_minutes,quantity_ml,notes
2025-10-01T09:00:00Z,feeding,20,150,朝のミルク
2025-10-01T11:30:00Z,sleeping,90,,お昼寝
2025-10-01T14:00:00Z,diaper,,,おむつ交換`}
            </pre>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">必須項目</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>timestamp（日時）</li>
                <li>activity_type（活動種別）</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">任意項目</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>duration_minutes（時間）</li>
                <li>quantity_ml（量）</li>
                <li>notes（メモ）</li>
              </ul>
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
