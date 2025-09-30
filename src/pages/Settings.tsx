// Settings page
import React from 'react'
import { DataManagement } from '../components/DataManagement'

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">設定</h1>

      {/* Authentication and password management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">🔐</span>
          認証・パスワード管理
        </h2>
        <div className="space-y-4">
          {/* Authentication status */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-900 mb-2">認証ステータス</h3>
            <p className="text-sm text-green-700">
              ブラウザに認証情報が保存されています。API呼び出し時に自動的に使用されます。
            </p>
          </div>

          {/* Password change instructions */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">パスワードの変更方法</h3>
            <p className="text-sm text-blue-700 mb-3">
              パスワードはCloudflare Workersの環境変数で管理されています。変更するには以下の手順を実行してください：
            </p>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
              <li>Cloudflare Dashboardにログイン</li>
              <li>Workers & Pagesセクションに移動</li>
              <li>該当するWorkerを選択</li>
              <li>Settings → Variables → Edit variablesをクリック</li>
              <li>DASHBOARD_PASSWORD環境変数を更新</li>
              <li>Saveをクリックして変更を保存</li>
            </ol>
          </div>

          {/* Logout instructions */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">ログアウト（認証情報のクリア）</h3>
            <p className="text-sm text-gray-700 mb-3">
              ブラウザに保存された認証情報をクリアするには、以下の手順を実行してください：
            </p>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Chrome/Edge:</strong> 設定 → プライバシーとセキュリティ → Cookie とサイトデータ → すべてのサイトデータと権限を表示 → 該当サイトを検索して削除</p>
              <p><strong>Firefox:</strong> 設定 → プライバシーとセキュリティ → Cookie とサイトデータ → データを管理 → 該当サイトを検索して削除</p>
              <p><strong>Safari:</strong> Safari → 環境設定 → プライバシー → Webサイトデータを管理 → 該当サイトを検索して削除</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              注: 認証情報をクリアすると、次回API呼び出し時に再度パスワード入力が必要になります。
            </p>
          </div>

          {/* 401 Error handling */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-900 mb-2">認証エラー（401 Unauthorized）</h3>
            <p className="text-sm text-yellow-700 mb-2">
              API呼び出しで認証エラーが発生した場合の対処法：
            </p>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>ブラウザに保存された認証情報が古い可能性があります</li>
              <li>上記の手順で認証情報をクリアしてください</li>
              <li>ページをリロードすると、パスワード入力ダイアログが表示されます</li>
              <li>正しいパスワードを入力してください</li>
            </ul>
          </div>

          {/* Multi-user access */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-medium text-purple-900 mb-2">複数デバイス・ユーザーでの利用</h3>
            <p className="text-sm text-purple-700">
              このダッシュボードは複数のユーザー・デバイスで同じデータにアクセスできます。
              全員が同じパスワードを使用してください。データはCloudflare D1データベースに保存され、すべてのユーザーで共有されます。
            </p>
          </div>
        </div>
      </div>

      <DataManagement />
    </div>
  )
}
