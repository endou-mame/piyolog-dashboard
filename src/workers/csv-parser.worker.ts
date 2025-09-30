// CSV Parser Web Worker
// Runs CSV parsing in background thread to avoid blocking UI

import { parseCSV, formatParseErrors } from '../lib/csv-parser'
import type { CSVParseResult } from '../lib/csv-parser'

// Worker message types
export type WorkerRequest = {
  type: 'parse'
  payload: {
    csvContent: string
    filename: string
  }
}

export type WorkerResponse =
  | {
      type: 'success'
      payload: CSVParseResult
    }
  | {
      type: 'error'
      payload: {
        message: string
        formattedErrors?: string
      }
    }

// Message handler
self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data

  if (type === 'parse') {
    try {
      const result = await parseCSV(payload.csvContent, payload.filename)

      const response: WorkerResponse = {
        type: 'success',
        payload: result,
      }

      self.postMessage(response)
    } catch (error) {
      const response: WorkerResponse = {
        type: 'error',
        payload: {
          message: error instanceof Error ? error.message : 'Unknown parsing error',
        },
      }

      self.postMessage(response)
    }
  }
})

// Signal that worker is ready
self.postMessage({ type: 'ready' })
