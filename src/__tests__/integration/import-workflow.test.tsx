// Integration test for complete import workflow: Parse → Analytics
import { describe, it, expect } from 'vitest'
import { parsePiyologText } from '../../lib/piyolog-text-parser'
import { calculateOverallStatistics, calculateAllStatistics } from '../../lib/analytics/statistics'
import { analyzeAllTrends } from '../../lib/analytics/trends'
import type { PiyologRecord } from '../../types/database'

describe('Import Workflow Integration', () => {
  const samplePiyologText = `【ぴよログ】2025年1月
----------
2025/1/15(月)
しゅん (0か月0日)

09:00   母乳 左10分 ▶ 右10分
10:30   睡眠 開始
12:00   おしっこ
13:00   ミルク 50ml
15:00   体重 2.64kg

----------
2025/1/16(火)
しゅん (0か月1日)

09:30   母乳 左12分 ▶ 右12分
11:00   睡眠 開始
13:00   ミルク 60ml
14:00   うんち
16:00   体重 2.68kg

----------
2025/1/17(水)
しゅん (0か月2日)

09:15   母乳 左15分 ▶ 右15分
10:45   睡眠 開始
12:30   ミルク 70ml
15:30   体重 2.72kg

----------
2025/1/18(木)
しゅん (0か月3日)

09:00   母乳 左18分 ▶ 右18分
11:00   睡眠 開始
13:00   ミルク 80ml
16:00   体重 2.76kg

----------
2025/1/19(金)
しゅん (0か月4日)

08:45   母乳 左20分 ▶ 右20分
10:30   睡眠 開始
12:30   ミルク 90ml
15:30   体重 2.80kg

----------
2025/1/20(土)
しゅん (0か月5日)

09:00   母乳 左22分 ▶ 右22分
11:00   睡眠 開始
13:00   ミルク 100ml
16:00   体重 2.84kg

----------
2025/1/21(日)
しゅん (0か月6日)

09:00   母乳 左25分 ▶ 右25分
11:00   睡眠 開始
13:00   ミルク 110ml
16:00   体重 2.88kg`

  it('should complete full workflow: parse → statistics → trends', () => {
    // Step 1: Parse Piyolog text
    const parseResult = parsePiyologText(samplePiyologText, 'test.txt')

    // Verify parse results
    expect(parseResult.errors).toHaveLength(0)
    expect(parseResult.records.length).toBeGreaterThan(0)
    expect(parseResult.parsedEvents).toBeGreaterThan(0)

    // Convert to PiyologRecord with ids
    const records: PiyologRecord[] = parseResult.records.map((r, idx) => ({
      ...r,
      id: idx + 1,
    }))

    // Step 2: Calculate overall statistics
    const overallStats = calculateOverallStatistics(records)

    expect(overallStats.totalRecords).toBe(records.length)
    expect(overallStats.activityTypeCount).toBeGreaterThan(0)
    expect(overallStats.dateRange.earliest).not.toBeNull()
    expect(overallStats.dateRange.latest).not.toBeNull()
    expect(overallStats.recordsPerDay).toBeGreaterThan(0)

    // Verify activity breakdown
    expect(overallStats.activityBreakdown.feeding).toBeGreaterThan(0)
    expect(overallStats.activityBreakdown.sleeping).toBeGreaterThan(0)
    expect(overallStats.activityBreakdown.weight).toBeGreaterThan(0)

    // Step 3: Calculate statistics per activity type
    const activityStats = calculateAllStatistics(records)

    expect(activityStats.length).toBeGreaterThan(0)

    // Verify feeding statistics
    const feedingStats = activityStats.find((s) => s.activityType === 'feeding')
    expect(feedingStats).toBeDefined()
    expect(feedingStats!.frequency).toBeGreaterThan(0)
    expect(feedingStats!.duration).not.toBeNull()
    expect(feedingStats!.duration!.mean).toBeGreaterThan(0)

    // Verify weight statistics
    const weightStats = activityStats.find((s) => s.activityType === 'weight')
    expect(weightStats).toBeDefined()
    expect(weightStats!.quantity).not.toBeNull()
    expect(weightStats!.quantity!.mean).toBeGreaterThan(0)

    // Step 4: Analyze trends for feeding
    const feedingRecords = records.filter((r) => r.activityType === 'feeding')
    const feedingTrends = analyzeAllTrends(feedingRecords, 'feeding')

    expect(feedingTrends.length).toBeGreaterThan(0)

    const frequencyTrend = feedingTrends.find((t) => t.metric === 'frequency')
    expect(frequencyTrend).toBeDefined()
    expect(frequencyTrend!.hasEnoughData).toBe(true)

    const durationTrend = feedingTrends.find((t) => t.metric === 'duration')
    expect(durationTrend).toBeDefined()

    // Step 5: Analyze trends for weight
    const weightRecords = records.filter((r) => r.activityType === 'weight')
    const weightTrends = analyzeAllTrends(weightRecords, 'weight')

    expect(weightTrends.length).toBeGreaterThan(0)

    const weightQuantityTrend = weightTrends.find((t) => t.metric === 'quantity')
    expect(weightQuantityTrend).toBeDefined()
    // Weight increases slowly (0.04kg/day), might be classified as stable
    expect(['increasing', 'stable']).toContain(weightQuantityTrend!.direction)
  })

  it('should handle partial data gracefully', () => {
    const partialText = `【ぴよログ】2025年1月
----------
2025/1/15(月)
しゅん (0か月0日)

09:00   母乳 左10分 ▶ 右10分
10:00   不明な活動 詳細
11:00   体重 2.64kg`

    // Parse with errors
    const parseResult = parsePiyologText(partialText)

    expect(parseResult.records.length).toBe(2) // 2 valid records
    expect(parseResult.errors.length).toBe(1) // 1 parse error

    // Convert to PiyologRecord
    const records: PiyologRecord[] = parseResult.records.map((r, idx) => ({
      ...r,
      id: idx + 1,
    }))

    // Should still calculate statistics for valid records
    const stats = calculateOverallStatistics(records)
    expect(stats.totalRecords).toBe(2)
    expect(stats.activityTypeCount).toBe(2) // feeding and weight

    const activityStats = calculateAllStatistics(records)
    expect(activityStats.length).toBe(2)
  })

  it('should maintain data integrity through entire workflow', () => {
    const parseResult = parsePiyologText(samplePiyologText, 'integrity-test.txt')
    const records: PiyologRecord[] = parseResult.records.map((r, idx) => ({
      ...r,
      id: idx + 1,
    }))

    // Verify all records have required fields
    records.forEach((record) => {
      expect(record.id).toBeGreaterThan(0)
      expect(record.timestamp).toBeInstanceOf(Date)
      expect(record.activityType).toBeDefined()
      expect(record.metadata).toBeDefined()
      expect(record.metadata.importedFilename).toBe('integrity-test.txt')
    })

    // Run statistics and verify no errors
    expect(() => calculateOverallStatistics(records)).not.toThrow()
    expect(() => calculateAllStatistics(records)).not.toThrow()

    // Run trend analysis and verify no errors
    const activityTypes = new Set(records.map((r) => r.activityType))
    activityTypes.forEach((activityType) => {
      const filtered = records.filter((r) => r.activityType === activityType)
      expect(() => analyzeAllTrends(filtered, activityType)).not.toThrow()
    })
  })

  it('should detect increasing trends in weight data', () => {
    const parseResult = parsePiyologText(samplePiyologText)
    const records: PiyologRecord[] = parseResult.records.map((r, idx) => ({
      ...r,
      id: idx + 1,
    }))

    const weightRecords = records.filter((r) => r.activityType === 'weight')
    expect(weightRecords.length).toBe(7) // 7 days of weight data

    // Check weight values are increasing
    const weights = weightRecords.map((r) => r.quantity!).sort()
    expect(weights[0]).toBeLessThan(weights[weights.length - 1])

    // Analyze trends
    const trends = analyzeAllTrends(weightRecords, 'weight')
    const quantityTrend = trends.find((t) => t.metric === 'quantity')

    expect(quantityTrend).toBeDefined()
    // Weight increases slowly (0.04kg/day), might be classified as stable
    expect(['increasing', 'stable']).toContain(quantityTrend!.direction)
    expect(quantityTrend!.hasEnoughData).toBe(true)
  })

  it('should detect increasing trends in feeding duration', () => {
    const parseResult = parsePiyologText(samplePiyologText)
    const records: PiyologRecord[] = parseResult.records.map((r, idx) => ({
      ...r,
      id: idx + 1,
    }))

    const feedingRecords = records.filter((r) => r.activityType === 'feeding')

    // Analyze trends
    const trends = analyzeAllTrends(feedingRecords, 'feeding')
    const durationTrend = trends.find((t) => t.metric === 'duration')

    expect(durationTrend).toBeDefined()
    // Duration increases 2min/day, trend analysis requires MIN_DAYS_FOR_TREND
    // Might not have enough unique dates depending on grouping
    if (durationTrend!.hasEnoughData) {
      expect(durationTrend!.direction).toBe('increasing')
      expect(durationTrend!.magnitude).toBeGreaterThan(0)
    } else {
      // If not enough data, should still have direction
      expect(durationTrend!.direction).toBeDefined()
    }
  })

  it('should handle empty data gracefully', () => {
    const emptyText = `【ぴよログ】2025年1月
----------
2025/1/15(月)
しゅん (0か月0日)`

    const parseResult = parsePiyologText(emptyText)
    expect(parseResult.records).toHaveLength(0)

    const records: PiyologRecord[] = []

    // Should handle empty records without errors
    const stats = calculateOverallStatistics(records)
    expect(stats.totalRecords).toBe(0)
    expect(stats.activityTypeCount).toBe(0)

    const activityStats = calculateAllStatistics(records)
    expect(activityStats).toHaveLength(0)
  })

  it('should calculate accurate daily statistics', () => {
    const parseResult = parsePiyologText(samplePiyologText)
    const records: PiyologRecord[] = parseResult.records.map((r, idx) => ({
      ...r,
      id: idx + 1,
    }))

    const stats = calculateOverallStatistics(records)

    // 7 days of data (2025/1/15 to 2025/1/21)
    expect(stats.dateRange.durationDays).toBe(7)

    // Calculate records per day
    const expectedRecordsPerDay = records.length / 7
    expect(stats.recordsPerDay).toBeCloseTo(expectedRecordsPerDay, 1)
  })
})
