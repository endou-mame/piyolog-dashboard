-- Piyolog Dashboard Database Schema
-- SQLite compatible schema for Cloudflare D1

-- Main records table for storing Piyolog activity data
CREATE TABLE IF NOT EXISTS piyolog_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,           -- ISO 8601 format: "2025-10-01T14:30:00Z"
  activity_type TEXT NOT NULL,        -- "feeding", "sleeping", "diaper", etc.
  duration_minutes INTEGER,           -- Nullable: only for activities with duration
  quantity_ml INTEGER,                -- Nullable: only for feeding activities
  notes TEXT,                         -- Optional user notes
  imported_at TEXT NOT NULL,          -- Import timestamp for tracking
  imported_filename TEXT              -- Source file name for reference
);

-- Performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_timestamp ON piyolog_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_type ON piyolog_records(activity_type);
CREATE INDEX IF NOT EXISTS idx_timestamp_activity ON piyolog_records(timestamp, activity_type);
CREATE INDEX IF NOT EXISTS idx_imported_at ON piyolog_records(imported_at);