// Main App component with routing
import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { LoadingOverlay } from './components/LoadingOverlay'
import { Dashboard } from './pages/Dashboard'
import { Import } from './pages/Import'
import { Statistics } from './pages/Statistics'
import { Trends } from './pages/Trends'
import { Correlations } from './pages/Correlations'
import { Settings } from './pages/Settings'
import { useAppStore, selectIsLoading } from './store/app-store'
import { registerChartComponents } from './lib/chart-config'

export const App: React.FC = () => {
  const isLoading = useAppStore(selectIsLoading)

  // Register Chart.js components on mount
  useEffect(() => {
    registerChartComponents()
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<Import />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/correlations" element={<Correlations />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
        <LoadingOverlay isLoading={isLoading} />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
