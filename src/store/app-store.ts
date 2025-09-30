// Application state management with Zustand
// Functional programming style - pure state transformations

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { PiyologRecord, RecordQueryFilters } from '../types/database'
import type { APIClientConfig, APIError } from '../lib/api-client'
import { createAPIClient, formatAPIError } from '../lib/api-client'
import { parseCSVFile } from '../lib/csv-worker-client'
import type { CSVParseError } from '../lib/csv-parser'

// Application state type
export type AppState = {
  // Data
  records: PiyologRecord[]
  filteredRecords: PiyologRecord[]

  // Filters
  filters: RecordQueryFilters

  // UI state
  isLoading: boolean
  error: string | null

  // Import state
  importProgress: {
    isImporting: boolean
    currentFile: string | null
    parseErrors: CSVParseError[]
    totalRows: number
    successRows: number
  }

  // API configuration
  apiConfig: APIClientConfig | null
}

// Application actions type
export type AppActions = {
  // Configuration
  setAPIConfig: (config: APIClientConfig) => void

  // Data loading
  fetchRecords: () => Promise<void>
  clearData: () => Promise<void>

  // Import
  importCSV: (file: File) => Promise<void>

  // Filters
  setFilters: (filters: Partial<RecordQueryFilters>) => void
  resetFilters: () => void

  // Error handling
  clearError: () => void
}

// Combined store type
export type AppStore = AppState & AppActions

// Initial state
const initialState: AppState = {
  records: [],
  filteredRecords: [],
  filters: {},
  isLoading: false,
  error: null,
  importProgress: {
    isImporting: false,
    currentFile: null,
    parseErrors: [],
    totalRows: 0,
    successRows: 0,
  },
  apiConfig: null,
}

// Create store
export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Set API configuration
      setAPIConfig: (config) => {
        set({ apiConfig: config }, false, 'setAPIConfig')
      },

      // Fetch records from API
      fetchRecords: async () => {
        const { apiConfig, filters } = get()

        if (!apiConfig) {
          set({ error: 'API configuration is not set' }, false, 'fetchRecords/error')
          return
        }

        set({ isLoading: true, error: null }, false, 'fetchRecords/start')

        const client = createAPIClient(apiConfig)
        const result = await client.getRecords(filters)

        if (result.success) {
          set(
            {
              records: result.data.records,
              filteredRecords: result.data.records,
              isLoading: false,
            },
            false,
            'fetchRecords/success'
          )
        } else {
          set(
            {
              isLoading: false,
              error: formatAPIError(result.error),
            },
            false,
            'fetchRecords/error'
          )
        }
      },

      // Clear all records
      clearData: async () => {
        const { apiConfig } = get()

        if (!apiConfig) {
          set({ error: 'API configuration is not set' }, false, 'clearData/error')
          return
        }

        set({ isLoading: true, error: null }, false, 'clearData/start')

        const client = createAPIClient(apiConfig)
        const result = await client.deleteAllRecords()

        if (result.success) {
          set(
            {
              records: [],
              filteredRecords: [],
              isLoading: false,
            },
            false,
            'clearData/success'
          )
        } else {
          set(
            {
              isLoading: false,
              error: formatAPIError(result.error),
            },
            false,
            'clearData/error'
          )
        }
      },

      // Import CSV file
      importCSV: async (file: File) => {
        const { apiConfig } = get()

        if (!apiConfig) {
          set({ error: 'API configuration is not set' }, false, 'importCSV/error')
          return
        }

        // Start import
        set(
          {
            importProgress: {
              isImporting: true,
              currentFile: file.name,
              parseErrors: [],
            },
            error: null,
          },
          false,
          'importCSV/start'
        )

        // Parse CSV in Web Worker
        const parseResult = await parseCSVFile(file)

        if (!parseResult.success) {
          set(
            {
              error: `CSVファイルの解析に失敗しました: ${parseResult.error}`,
              importProgress: {
                isImporting: false,
                currentFile: null,
                parseErrors: [],
              },
            },
            false,
            'importCSV/parseError'
          )
          return
        }

        const { records, errors, totalRows, successRows } = parseResult.data

        // Update parse errors
        set(
          {
            importProgress: {
              isImporting: true,
              currentFile: file.name,
              parseErrors: errors,
              totalRows,
              successRows,
            },
          },
          false,
          'importCSV/parsed'
        )

        // If no valid records, stop here
        if (records.length === 0) {
          set(
            {
              error: `有効なレコードが見つかりませんでした (${totalRows}行中0行成功)`,
              importProgress: {
                isImporting: false,
                currentFile: null,
                parseErrors: errors,
              },
            },
            false,
            'importCSV/noValidRecords'
          )
          return
        }

        // Insert records via API
        const client = createAPIClient(apiConfig)
        const insertResult = await client.insertRecords({ records })

        if (insertResult.success) {
          const { insertedCount, errors: insertErrors } = insertResult.data

          // Refresh records
          await get().fetchRecords()

          // Success message
          const message =
            insertErrors.length > 0
              ? `${insertedCount}件のレコードをインポートしました (${insertErrors.length}件のエラー)`
              : `${insertedCount}件のレコードをインポートしました`

          set(
            {
              importProgress: {
                isImporting: false,
                currentFile: null,
                parseErrors: errors,
                totalRows,
                successRows: insertedCount,
              },
              error: insertErrors.length > 0 ? message : null,
            },
            false,
            'importCSV/success'
          )
        } else {
          set(
            {
              error: `レコードの保存に失敗しました: ${formatAPIError(insertResult.error)}`,
              importProgress: {
                isImporting: false,
                currentFile: null,
                parseErrors: errors,
              },
            },
            false,
            'importCSV/insertError'
          )
        }
      },

      // Set filters
      setFilters: (newFilters) => {
        const currentFilters = get().filters
        const updatedFilters = { ...currentFilters, ...newFilters }

        set({ filters: updatedFilters }, false, 'setFilters')

        // Re-fetch with new filters
        get().fetchRecords()
      },

      // Reset filters
      resetFilters: () => {
        set({ filters: {} }, false, 'resetFilters')

        // Re-fetch without filters
        get().fetchRecords()
      },

      // Clear error
      clearError: () => {
        set({ error: null }, false, 'clearError')
      },
    }),
    { name: 'PiyologDashboard' }
  )
)

// Selectors (pure getter functions)
export const selectRecords = (state: AppStore) => state.records
export const selectFilteredRecords = (state: AppStore) => state.filteredRecords
export const selectIsLoading = (state: AppStore) => state.isLoading
export const selectError = (state: AppStore) => state.error
export const selectFilters = (state: AppStore) => state.filters
export const selectImportProgress = (state: AppStore) => state.importProgress
export const selectIsImporting = (state: AppStore) => state.importProgress.isImporting
