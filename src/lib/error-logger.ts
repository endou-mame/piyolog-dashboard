// Error logging and categorization
// Functional programming style

export type ErrorCategory =
  | 'parse'
  | 'api'
  | 'analytics'
  | 'browser'
  | 'network'
  | 'authentication'
  | 'unknown'

export type ErrorLogEntry = {
  timestamp: Date
  category: ErrorCategory
  message: string
  error: Error | unknown
  context?: Record<string, any>
  userAgent?: string
  url?: string
}

// In-memory error log (limited to last 50 errors)
const errorLog: ErrorLogEntry[] = []
const MAX_LOG_SIZE = 50

// Categorize error based on error message and context
export const categorizeError = (error: Error | unknown, context?: Record<string, any>): ErrorCategory => {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  // API errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('http')) {
    return 'api'
  }

  // Authentication errors
  if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
    return 'authentication'
  }

  // Network errors
  if (errorMessage.includes('timeout') || errorMessage.includes('connection') || errorMessage.includes('offline')) {
    return 'network'
  }

  // Parse errors
  if (errorMessage.includes('parse') || errorMessage.includes('csv') || errorMessage.includes('invalid format')) {
    return 'parse'
  }

  // Analytics errors
  if (errorMessage.includes('analytics') || errorMessage.includes('calculation') || errorMessage.includes('worker')) {
    return 'analytics'
  }

  // Browser compatibility errors
  if (errorMessage.includes('unsupported') || errorMessage.includes('not supported') || context?.browserError) {
    return 'browser'
  }

  return 'unknown'
}

// Log error with context
export const logError = (
  error: Error | unknown,
  category?: ErrorCategory,
  context?: Record<string, any>
): void => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const detectedCategory = category || categorizeError(error, context)

  const entry: ErrorLogEntry = {
    timestamp: new Date(),
    category: detectedCategory,
    message: errorMessage,
    error,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  }

  // Add to log
  errorLog.push(entry)

  // Trim log if too large
  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog.shift()
  }

  // Console log in development
  if (import.meta.env.DEV) {
    console.error(`[${detectedCategory.toUpperCase()}] ${errorMessage}`, {
      error,
      context,
    })
  }
}

// Get error log entries
export const getErrorLog = (): ErrorLogEntry[] => {
  return [...errorLog]
}

// Get errors by category
export const getErrorsByCategory = (category: ErrorCategory): ErrorLogEntry[] => {
  return errorLog.filter((entry) => entry.category === category)
}

// Clear error log
export const clearErrorLog = (): void => {
  errorLog.length = 0
}

// Generate error report for user feedback
export const generateErrorReport = (): string => {
  const report = errorLog.map((entry) => {
    return `[${entry.timestamp.toISOString()}] [${entry.category.toUpperCase()}] ${entry.message}`
  }).join('\n')

  const summary = `
=== Piyolog Dashboard Error Report ===
Generated: ${new Date().toISOString()}
Total Errors: ${errorLog.length}
User Agent: ${navigator.userAgent}

Errors:
${report}

Browser Info:
- Language: ${navigator.language}
- Online: ${navigator.onLine}
- Platform: ${navigator.platform}
`

  return summary.trim()
}

// Format user-friendly error message
export const formatErrorMessage = (error: Error | unknown, category?: ErrorCategory): string => {
  const detectedCategory = category || categorizeError(error)

  const categoryMessages: Record<ErrorCategory, string> = {
    parse: 'CSVファイルの解析中にエラーが発生しました。ファイル形式を確認してください。',
    api: 'サーバーとの通信中にエラーが発生しました。ネットワーク接続を確認してください。',
    analytics: 'データ分析中にエラーが発生しました。データを確認してください。',
    browser: 'お使いのブラウザはこの機能に対応していません。最新のブラウザをご利用ください。',
    network: 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。',
    authentication: '認証エラーが発生しました。パスワードを確認してください。',
    unknown: '予期しないエラーが発生しました。',
  }

  const baseMessage = categoryMessages[detectedCategory]
  const errorMessage = error instanceof Error ? error.message : String(error)

  return `${baseMessage}\n\n詳細: ${errorMessage}`
}

// Check browser compatibility
export const checkBrowserCompatibility = (): { supported: boolean; issues: string[] } => {
  const issues: string[] = []

  // Check Web Workers
  if (typeof Worker === 'undefined') {
    issues.push('Web Workers are not supported')
  }

  // Check Fetch API
  if (typeof fetch === 'undefined') {
    issues.push('Fetch API is not supported')
  }

  // Check LocalStorage
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
  } catch (e) {
    issues.push('LocalStorage is not available')
  }

  // Check ES6 features
  try {
    eval('const test = () => {}')
  } catch (e) {
    issues.push('ES6 arrow functions are not supported')
  }

  return {
    supported: issues.length === 0,
    issues,
  }
}

// Get browser info for debugging
export const getBrowserInfo = (): Record<string, any> => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  }
}
