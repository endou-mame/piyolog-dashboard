// Piyolog text format parser
// Parses the native Piyolog export text format
// Functional programming style - pure functions

import type { ActivityType, PiyologRecord } from '../types/database'

export type PiyologTextParseResult = {
  records: Array<Omit<PiyologRecord, 'id'>>
  errors: PiyologTextParseError[]
  totalLines: number
  parsedEvents: number
}

export type PiyologTextParseError = {
  line: number
  message: string
  rawText?: string
}

// Regex patterns for parsing
const HEADER_PATTERN = /^【ぴよログ】(\d{4})年(\d{1,2})月$/
const DATE_PATTERN = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\([^)]+\)$/
const CHILD_INFO_PATTERN = /^(.+?)\s+\((\d+)か月(\d+)日\)$/
const EVENT_PATTERN = /^(\d{1,2}):(\d{2})\s+(.+)$/
const SEPARATOR = '----------'

// Activity type mapping from Japanese to internal type
const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  '母乳': 'feeding',
  'ミルク': 'feeding',
  '搾母乳': 'feeding',
  '睡眠': 'sleeping',
  'おしっこ': 'diaper',
  'うんち': 'diaper',
  '体重': 'weight',
  '身長': 'height',
  '体温': 'temperature',
  'お風呂': 'bath',
  '病院': 'hospital',
  'くすり': 'medicine',
  'その他': 'walk', // Map to 'walk' as a general activity
  '散歩': 'walk',
}

// Parse feeding duration (母乳)
const parseBreastFeeding = (text: string): { duration?: number; notes?: string } => {
  // Pattern: 左X分 ▶ 右X分 or 左X分 / 右X分 or 左X分 or 右X分
  const leftRightPattern = /左(\d+)分\s*[▶/]\s*右(\d+)分/
  const leftOnlyPattern = /左(\d+)分/
  const rightOnlyPattern = /右(\d+)分/

  const leftRightMatch = text.match(leftRightPattern)
  if (leftRightMatch) {
    const left = parseInt(leftRightMatch[1])
    const right = parseInt(leftRightMatch[2])
    return {
      duration: left + right,
      notes: `左${left}分 右${right}分`,
    }
  }

  const leftMatch = text.match(leftOnlyPattern)
  if (leftMatch) {
    const left = parseInt(leftMatch[1])
    return {
      duration: left,
      notes: `左${left}分`,
    }
  }

  const rightMatch = text.match(rightOnlyPattern)
  if (rightMatch) {
    const right = parseInt(rightMatch[1])
    return {
      duration: right,
      notes: `右${right}分`,
    }
  }

  return { notes: text }
}

// Parse milk quantity (ミルク/搾母乳)
const parseMilk = (text: string): { quantity?: number; notes?: string } => {
  const quantityPattern = /(\d+)ml/
  const match = text.match(quantityPattern)

  if (match) {
    return {
      quantity: parseInt(match[1]),
      notes: text,
    }
  }

  return { notes: text }
}

// Parse weight (体重)
const parseWeight = (text: string): { quantity?: number; notes?: string } => {
  const weightPattern = /(\d+\.?\d*)kg/
  const match = text.match(weightPattern)

  if (match) {
    return {
      quantity: parseFloat(match[1]),
      notes: text,
    }
  }

  return { notes: text }
}

// Parse height (身長)
const parseHeight = (text: string): { quantity?: number; notes?: string } => {
  const heightPattern = /(\d+\.?\d*)cm/
  const match = text.match(heightPattern)

  if (match) {
    return {
      quantity: parseFloat(match[1]),
      notes: text,
    }
  }

  return { notes: text }
}

// Parse temperature (体温)
const parseTemperature = (text: string): { quantity?: number; notes?: string } => {
  const tempPattern = /(\d+\.?\d*)°C/
  const match = text.match(tempPattern)

  if (match) {
    return {
      quantity: parseFloat(match[1]),
      notes: text,
    }
  }

  return { notes: text }
}

// Parse event line
const parseEventLine = (
  line: string,
  currentDate: Date,
  lineNumber: number
): { record: Omit<PiyologRecord, 'id'> | null; error: PiyologTextParseError | null } => {
  const match = line.match(EVENT_PATTERN)
  if (!match) {
    return { record: null, error: null } // Not an event line
  }

  const [, hourStr, minuteStr, eventText] = match
  const hour = parseInt(hourStr)
  const minute = parseInt(minuteStr)

  // Create timestamp
  const timestamp = new Date(currentDate)
  timestamp.setHours(hour, minute, 0, 0)

  // Parse event type and details
  // Try to split by multiple spaces first, if that doesn't work, try single space
  let parts = eventText.split(/\s{2,}/)
  if (parts.length === 1) {
    // No multiple spaces, try splitting by first space after activity type
    const firstSpaceIndex = eventText.search(/\s/)
    if (firstSpaceIndex > 0) {
      const eventType = eventText.substring(0, firstSpaceIndex).trim()
      const details = eventText.substring(firstSpaceIndex + 1).trim()
      parts = [eventType, details]
    } else {
      parts = [eventText.trim()]
    }
  }
  const eventType = parts[0].trim()
  const details = parts.slice(1).join(' ').trim()

  // Determine activity type
  let activityType: ActivityType | null = null
  for (const [japanese, type] of Object.entries(ACTIVITY_TYPE_MAP)) {
    if (eventType.includes(japanese)) {
      activityType = type
      break
    }
  }

  if (!activityType) {
    return {
      record: null,
      error: {
        line: lineNumber,
        message: `Unknown activity type: ${eventType}`,
        rawText: line,
      },
    }
  }

  // Parse details based on activity type
  let duration: number | undefined
  let quantity: number | undefined
  let notes: string | undefined

  if (eventType.includes('母乳')) {
    const parsed = parseBreastFeeding(details)
    duration = parsed.duration
    notes = parsed.notes
  } else if (eventType.includes('ミルク') || eventType.includes('搾母乳')) {
    const parsed = parseMilk(details)
    quantity = parsed.quantity
    notes = parsed.notes
  } else if (eventType.includes('体重')) {
    const parsed = parseWeight(details)
    quantity = parsed.quantity
    notes = parsed.notes
    activityType = 'weight'
  } else if (eventType.includes('身長')) {
    const parsed = parseHeight(details)
    quantity = parsed.quantity
    notes = parsed.notes
    activityType = 'height'
  } else if (eventType.includes('体温')) {
    const parsed = parseTemperature(details)
    quantity = parsed.quantity
    notes = parsed.notes
    activityType = 'temperature'
  } else {
    notes = details || eventType
  }

  const record: Omit<PiyologRecord, 'id'> = {
    timestamp,
    activityType,
    duration,
    quantity,
    notes,
    metadata: {
      importedAt: new Date(),
      importedFilename: 'piyolog.txt',
    },
  }

  return { record, error: null }
}

// Main parser function
export const parsePiyologText = (
  textContent: string,
  filename: string = 'piyolog.txt'
): PiyologTextParseResult => {
  const lines = textContent.split('\n')
  const records: Array<Omit<PiyologRecord, 'id'>> = []
  const errors: PiyologTextParseError[] = []

  let currentDate: Date | null = null
  let currentYear: number | null = null
  let currentMonth: number | null = null
  let parsedEvents = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNumber = i + 1

    // Skip empty lines and separators
    if (!line || line === SEPARATOR) {
      continue
    }

    // Parse header
    const headerMatch = line.match(HEADER_PATTERN)
    if (headerMatch) {
      currentYear = parseInt(headerMatch[1])
      currentMonth = parseInt(headerMatch[2])
      continue
    }

    // Parse date
    const dateMatch = line.match(DATE_PATTERN)
    if (dateMatch) {
      const year = parseInt(dateMatch[1])
      const month = parseInt(dateMatch[2])
      const day = parseInt(dateMatch[3])
      currentDate = new Date(year, month - 1, day)
      continue
    }

    // Parse child info (skip)
    if (line.match(CHILD_INFO_PATTERN)) {
      continue
    }

    // Skip summary lines
    if (
      line.includes('合計') ||
      line.includes('今日は') ||
      line.includes('メモ')
    ) {
      continue
    }

    // Parse event line
    if (currentDate) {
      const { record, error } = parseEventLine(line, currentDate, lineNumber)
      if (record) {
        records.push({
          ...record,
          metadata: {
            ...record.metadata,
            importedFilename: filename,
          },
        })
        parsedEvents++
      }
      if (error) {
        errors.push(error)
      }
    }
  }

  return {
    records,
    errors,
    totalLines: lines.length,
    parsedEvents,
  }
}

// Format parse errors for display
export const formatPiyologParseErrors = (errors: PiyologTextParseError[]): string => {
  if (errors.length === 0) {
    return ''
  }

  const errorLines = errors.slice(0, 10).map((error) => {
    let message = `Line ${error.line}: ${error.message}`
    if (error.rawText) {
      message += `\n  "${error.rawText}"`
    }
    return message
  })

  let result = errorLines.join('\n\n')

  if (errors.length > 10) {
    result += `\n\n...and ${errors.length - 10} more errors`
  }

  return result
}
