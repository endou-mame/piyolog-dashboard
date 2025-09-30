// Loading overlay component
import React from 'react'

type Props = {
  isLoading: boolean
  message?: string
}

export const LoadingOverlay: React.FC<Props> = ({ isLoading, message = '読み込み中...' }) => {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 text-center">{message}</p>
        </div>
      </div>
    </div>
  )
}
