// Main App component with routing
import React, { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { LoadingOverlay } from './components/LoadingOverlay'
import { useAppStore, selectIsLoading } from './store/app-store'
import { registerChartComponents } from './lib/chart-config'

// Lazy load page components
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Import = lazy(() => import('./pages/Import').then(m => ({ default: m.Import })))
const Statistics = lazy(() => import('./pages/Statistics').then(m => ({ default: m.Statistics })))
const Trends = lazy(() => import('./pages/Trends').then(m => ({ default: m.Trends })))
const Correlations = lazy(() => import('./pages/Correlations').then(m => ({ default: m.Correlations })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))

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
          <Suspense fallback={<LoadingOverlay isLoading={true} />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/import" element={<Import />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/correlations" element={<Correlations />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </Layout>
        <LoadingOverlay isLoading={isLoading} />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
