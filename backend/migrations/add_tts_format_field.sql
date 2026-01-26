-- Add format field to tts_tasks table
-- This migration adds support for different TTS output formats (mp3, wav, pcm, opus)

ALTER TABLE tts_tasks ADD COLUMN IF NOT EXISTS format VARCHAR(10) DEFAULT 'mp3';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tts_tasks_format ON tts_tasks(format);

-- Add comment for documentation
COMMENT ON COLUMN tts_tasks.format IS 'Audio output format: mp3, wav, pcm, or opus';
