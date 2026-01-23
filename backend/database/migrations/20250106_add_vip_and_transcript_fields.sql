-- Migration: Add VIP and Transcript fields
-- Date: 2025-01-06
-- Description: Add VIP system fields to users table and transcript fields to voices table

-- Add VIP fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_level INT DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP;

-- Add transcript fields to voices table
ALTER TABLE voices ADD COLUMN IF NOT EXISTS with_transcript BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE voices ADD COLUMN IF NOT EXISTS transcript TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_vip_level ON users(vip_level);
CREATE INDEX IF NOT EXISTS idx_voices_with_transcript ON voices(with_transcript);
