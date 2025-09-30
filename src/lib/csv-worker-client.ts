// CSV Parser Web Worker client
// Functional programming style - pure functions for worker communication

import type { CSVParseResult } from './csv-parser'
import type { WorkerRequest, WorkerResponse } from '../workers/csv-parser.worker'

// Worker client result type
export type WorkerParseResult =
  | {
      success: true
      data: CSVParseResult
    }
  | {
      success: false
      error: string
    }

// Create worker instance
export const createCSVWorker = (): Worker => {
  return new Worker(new URL('../workers/csv-parser.worker.ts', import.meta.url), {
    type: 'module',
  })
}

// Parse CSV using Web Worker
export const parseCSVInWorker = (
  csvContent: string,
  filename: string
): Promise<WorkerParseResult> => {
  return new Promise((resolve, reject) => {
    const worker = createCSVWorker()

    // Set timeout for worker operation (30 seconds)
    const timeout = setTimeout(() => {
      worker.terminate()
      reject(new Error('CSV parsing timed out after 30 seconds'))
    }, 30000)

    // Handle worker messages
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const response = event.data

      // Skip ready message
      if (response.type === 'ready') return

      clearTimeout(timeout)
      worker.terminate()

      if (response.type === 'success') {
        resolve({
          success: true,
          data: response.payload,
        })
      } else if (response.type === 'error') {
        resolve({
          success: false,
          error: response.payload.message,
        })
      }
    })

    // Handle worker errors
    worker.addEventListener('error', (error) => {
      clearTimeout(timeout)
      worker.terminate()
      reject(new Error(`Worker error: ${error.message}`))
    })

    // Send parse request
    const request: WorkerRequest = {
      type: 'parse',
      payload: {
        csvContent,
        filename,
      },
    }

    worker.postMessage(request)
  })
}

// Read file as text
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as text'))
      }
    }

    reader.onerror = () => {
      reject(new Error(`File read error: ${reader.error?.message || 'Unknown error'}`))
    }

    reader.readAsText(file, 'UTF-8')
  })
}

// High-level function: parse CSV file
export const parseCSVFile = async (file: File): Promise<WorkerParseResult> => {
  try {
    const csvContent = await readFileAsText(file)
    return await parseCSVInWorker(csvContent, file.name)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
