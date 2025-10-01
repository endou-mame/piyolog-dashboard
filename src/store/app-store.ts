// Application state management with Zustand
// Functional programming style - pure state transformations

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { PiyologRecord, RecordQueryFilters } from '../types/database'
import { parsePiyologText } from '../lib/piyolog-text-parser'
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
}

// Application actions type
export type AppActions = {
  // Import
  importFile: (file: File) => Promise<void>

  // Data management
  clearData: () => void

  // Filters
  setFilters: (filters: Partial<RecordQueryFilters>) => void
  resetFilters: () => void
  applyFilters: () => void

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
}

// Create store
export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Clear all records
      clearData: () => {
        set(
          {
            records: [],
            filteredRecords: [],
            error: null,
          },
          false,
          'clearData'
        )
      },

      // Import text file
      importFile: async (file: File) => {
        // Start import
        set(
          {
            importProgress: {
              isImporting: true,
              currentFile: file.name,
              parseErrors: [],
              totalRows: 0,
              successRows: 0,
            },
            error: null,
          },
          false,
          'importCSV/start'
        )

        try {
          // Read file as text
          const text = await file.text()

          // Parse Piyolog text format
          const parseResult = parsePiyologText(text, file.name)
          const { records, errors, totalLines, parsedEvents } = parseResult

          // Convert errors to CSVParseError format
          const parseErrors: CSVParseError[] = errors.map((e) => ({
            row: e.line,
            message: e.message,
            values: e.rawText ? [e.rawText] : [],
          }))

          // Update parse errors
          set(
            {
              importProgress: {
                isImporting: true,
                currentFile: file.name,
                parseErrors,
                totalRows: totalLines,
                successRows: parsedEvents,
              },
            },
            false,
            'importCSV/parsed'
          )

          // If no valid records, stop here
          if (records.length === 0) {
            set(
              {
                error: `有効なレコードが見つかりませんでした (${totalLines}行中0件成功)`,
                importProgress: {
                  isImporting: false,
                  currentFile: null,
                  parseErrors,
                  totalRows: totalLines,
                  successRows: 0,
                },
              },
              false,
              'importCSV/noValidRecords'
            )
            return
          }

          // Add IDs to records
          const recordsWithIds: PiyologRecord[] = records.map((r, i) => ({
            ...r,
            id: Date.now() + i,
          }))

          // Get existing records from store
          const existingRecords = get().records
          const allRecords = [...existingRecords, ...recordsWithIds]

          // Update state with new records
          set(
            {
              records: allRecords,
              filteredRecords: allRecords,
              importProgress: {
                isImporting: false,
                currentFile: null,
                parseErrors,
                totalRows: totalLines,
                successRows: parsedEvents,
              },
              error: null,
            },
            false,
            'importCSV/success'
          )
        } catch (error) {
          set(
            {
              error: `ファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
              importProgress: {
                isImporting: false,
                currentFile: null,
                parseErrors: [],
                totalRows: 0,
                successRows: 0,
              },
            },
            false,
            'importCSV/error'
          )
        }
      },

      // Apply filters to records
      applyFilters: () => {
        const { records, filters } = get()

        let filtered = records

        // Apply activity type filter
        if (filters.activityType) {
          filtered = filtered.filter((r) => r.activityType === filters.activityType)
        }

        // Apply date range filter
        if (filters.startDate) {
          const startDate = new Date(filters.startDate)
          filtered = filtered.filter((r) => new Date(r.timestamp) >= startDate)
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate)
          filtered = filtered.filter((r) => new Date(r.timestamp) <= endDate)
        }

        set({ filteredRecords: filtered }, false, 'applyFilters')
      },

      // Set filters
      setFilters: (newFilters) => {
        const currentFilters = get().filters
        const updatedFilters = { ...currentFilters, ...newFilters }

        set({ filters: updatedFilters }, false, 'setFilters')

        // Apply filters
        get().applyFilters()
      },

      // Reset filters
      resetFilters: () => {
        set({ filters: {} }, false, 'resetFilters')

        // Apply filters (which will show all records)
        get().applyFilters()
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
