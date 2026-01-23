-- Add isPinned column to voices table
ALTER TABLE voices ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Add emotion column to tts_tasks table
ALTER TABLE tts_tasks ADD COLUMN IF NOT EXISTS emotion VARCHAR(50);

-- Create index on is_pinned for better query performance
CREATE INDEX IF NOT EXISTS idx_voices_is_pinned ON voices(is_pinned);
