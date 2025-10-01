// File upload component with drag-and-drop support
import React, { useRef, useState } from 'react'

type Props = {
  onFileSelect: (file: File) => void
  acceptedFormats?: string[]
  maxSizeBytes?: number
  isLoading?: boolean
}

export const FileUpload: React.FC<Props> = ({
  onFileSelect,
  acceptedFormats = ['.txt', '.csv', 'text/plain', 'text/csv'],
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const isValidType =
      acceptedFormats.includes(file.type) ||
      acceptedFormats.some((format) => file.name.toLowerCase().endsWith(format))

    if (!isValidType) {
      return `ファイル形式が無効です。テキストファイル(.txt)またはCSVファイル(.csv)を選択してください。`
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1)
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
      return `ファイルサイズが大きすぎます（${fileSizeMB}MB）。最大${maxSizeMB}MBまでです。`
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    onFileSelect(file)
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isLoading}
      />

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer
          transition-colors duration-200 touch-manipulation
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 active:border-blue-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Upload icon */}
        <div className="flex flex-col items-center space-y-4">
          <div className="text-5xl">
            {isLoading ? '⏳' : isDragging ? '📂' : '📥'}
          </div>

          {/* Instructions */}
          <div className="text-gray-700">
            {isLoading ? (
              <p className="text-lg font-medium">ファイルを処理中...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  {isDragging ? 'ここにドロップ' : 'ぴよログファイルをドラッグ＆ドロップ'}
                </p>
                <p className="text-sm text-gray-500 mb-4">または</p>
                <button
                  type="button"
                  className="px-6 py-3 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  disabled={isLoading}
                >
                  ファイルを選択
                </button>
              </>
            )}
          </div>

          {/* File requirements */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>対応形式: テキスト (.txt), CSV (.csv)</p>
            <p>最大サイズ: {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB</p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">エラー</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
