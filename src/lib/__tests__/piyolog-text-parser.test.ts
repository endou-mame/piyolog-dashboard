// Piyolog text parser unit tests
import { describe, it, expect } from 'vitest'
import { parsePiyologText, formatPiyologParseErrors } from '../piyolog-text-parser'

describe('PiyologTextParser', () => {
  describe('parsePiyologText', () => {
    it('should parse basic header and date', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:25   体重 2.64kg
11:25   身長 49.0cm
11:28   体温 36.9°C`

      const result = parsePiyologText(text, 'test.txt')

      expect(result.records).toHaveLength(3)
      expect(result.errors).toHaveLength(0)
      expect(result.parsedEvents).toBe(3)
    })

    it('should parse weight measurement correctly', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:25   体重 2.64kg`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('weight')
      expect(record.quantity).toBe(2.64)
      expect(record.notes).toBe('2.64kg')
      expect(record.timestamp.getHours()).toBe(11)
      expect(record.timestamp.getMinutes()).toBe(25)
    })

    it('should parse height measurement correctly', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:25   身長 49.0cm`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('height')
      expect(record.quantity).toBe(49.0)
      expect(record.notes).toBe('49.0cm')
    })

    it('should parse temperature measurement correctly', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:28   体温 36.9°C`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('temperature')
      expect(record.quantity).toBe(36.9)
      expect(record.notes).toBe('36.9°C')
    })

    it('should parse breast feeding with left and right duration', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:42   母乳 左10分 ▶ 右10分`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('feeding')
      expect(record.duration).toBe(20) // 10 + 10
      expect(record.notes).toBe('左10分 右10分')
    })

    it('should parse breast feeding with left only', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

12:00   母乳 左5分`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('feeding')
      expect(record.duration).toBe(5)
      expect(record.notes).toBe('左5分')
    })

    it('should parse breast feeding with right only', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

13:00   母乳 右8分`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('feeding')
      expect(record.duration).toBe(8)
      expect(record.notes).toBe('右8分')
    })

    it('should parse milk with quantity', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

14:00   ミルク 50ml`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('feeding')
      expect(record.quantity).toBe(50)
      expect(record.notes).toBe('50ml')
    })

    it('should parse sleeping activity', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

12:43   睡眠 開始`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('sleeping')
      expect(record.notes).toBe('開始')
    })

    it('should parse diaper change (urine)', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:40   おしっこ`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('diaper')
      expect(record.notes).toBe('おしっこ')
    })

    it('should parse diaper change (bowel)', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

13:00   うんち`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('diaper')
    })

    it('should parse bath activity', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

18:00   お風呂 完了`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('bath')
      expect(record.notes).toBe('完了')
    })

    it('should parse walk activity', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

15:00   散歩 30分`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      const record = result.records[0]
      expect(record.activityType).toBe('walk')
      expect(record.notes).toBe('30分')
    })

    it('should parse multiple events on same day', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:25   体重 2.64kg
11:25   身長 49.0cm
11:28   体温 36.9°C
11:40   おしっこ
11:42   母乳 左10分 ▶ 右10分
12:43   睡眠 開始`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(6)
      expect(result.errors).toHaveLength(0)
      expect(result.parsedEvents).toBe(6)

      // Verify timestamps are on the same day
      const firstDate = result.records[0].timestamp
      result.records.forEach((record) => {
        expect(record.timestamp.getFullYear()).toBe(firstDate.getFullYear())
        expect(record.timestamp.getMonth()).toBe(firstDate.getMonth())
        expect(record.timestamp.getDate()).toBe(firstDate.getDate())
      })
    })

    it('should parse multiple days', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:25   体重 2.64kg

----------
2025/4/11(金)
しゅん (0か月1日)

11:30   体重 2.68kg`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(2)
      expect(result.records[0].timestamp.getDate()).toBe(10)
      expect(result.records[1].timestamp.getDate()).toBe(11)
    })

    it('should skip summary lines', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:25   体重 2.64kg
母乳合計: 左150分 / 右135分
ミルク合計: 200ml
今日は良い日でした
メモ: 特に問題なし`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1) // Only weight measurement
      expect(result.records[0].activityType).toBe('weight')
    })

    it('should handle empty lines and separators', () => {
      const text = `【ぴよログ】2025年4月
----------

2025/4/10(木)

しゅん (0か月0日)


11:25   体重 2.64kg

----------`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(1)
      expect(result.records[0].activityType).toBe('weight')
    })

    it('should collect errors for unknown activity types', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:25   不明な活動 詳細`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Unknown activity type')
      expect(result.errors[0].rawText).toContain('不明な活動')
    })

    it('should handle files with no events', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)`

      const result = parsePiyologText(text)

      expect(result.records).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
      expect(result.parsedEvents).toBe(0)
    })

    it('should set correct metadata', () => {
      const text = `【ぴよログ】2025年4月
----------
2025/4/10(木)
しゅん (0か月0日)

11:25   体重 2.64kg`

      const result = parsePiyologText(text, 'my-file.txt')

      expect(result.records[0].metadata.importedFilename).toBe('my-file.txt')
      expect(result.records[0].metadata.importedAt).toBeInstanceOf(Date)
    })
  })

  describe('formatPiyologParseErrors', () => {
    it('should return empty string for no errors', () => {
      const formatted = formatPiyologParseErrors([])

      expect(formatted).toBe('')
    })

    it('should format single error', () => {
      const errors = [
        {
          line: 10,
          message: 'Unknown activity type',
          rawText: '11:25   不明な活動',
        },
      ]

      const formatted = formatPiyologParseErrors(errors)

      expect(formatted).toContain('Line 10')
      expect(formatted).toContain('Unknown activity type')
      expect(formatted).toContain('不明な活動')
    })

    it('should format multiple errors', () => {
      const errors = [
        {
          line: 10,
          message: 'Error 1',
          rawText: 'text 1',
        },
        {
          line: 15,
          message: 'Error 2',
          rawText: 'text 2',
        },
      ]

      const formatted = formatPiyologParseErrors(errors)

      expect(formatted).toContain('Line 10')
      expect(formatted).toContain('Line 15')
      expect(formatted).toContain('Error 1')
      expect(formatted).toContain('Error 2')
    })

    it('should limit errors to first 10 and show count', () => {
      const errors = Array.from({ length: 25 }, (_, i) => ({
        line: i + 1,
        message: `Error ${i + 1}`,
      }))

      const formatted = formatPiyologParseErrors(errors)

      expect(formatted).toContain('Line 1')
      expect(formatted).toContain('Line 10')
      expect(formatted).not.toContain('Line 11')
      expect(formatted).toContain('...and 15 more errors')
    })
  })
})
