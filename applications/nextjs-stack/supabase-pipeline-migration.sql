-- Migration: Create pipeline_runs table for daily affirmations publishing pipeline
-- Run this in your Supabase project SQL editor

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_date              DATE NOT NULL,
  day_of_month          SMALLINT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  category              TEXT NOT NULL,
  affirmation           TEXT,
  blog_post_title       TEXT,
  blog_post_content     TEXT,
  wordpress_post_id     INTEGER,
  wordpress_post_url    TEXT,
  wordpress_media_id    INTEGER,
  bigcartel_product_id  TEXT,
  image_url             TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message         TEXT,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate runs for the same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_runs_run_date
  ON pipeline_runs (run_date);

-- Fast lookup by status
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status
  ON pipeline_runs (status);

-- Fast lookup by most recent runs
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started_at
  ON pipeline_runs (started_at DESC);

-- Enable RLS — all access goes through the service role key which bypasses RLS
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

-- No public policies intentionally — only the service role key can read/write this table
