-- Create the KV Store table for AlagaTrack
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS kv_store_c6a1b708 (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups by key
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_c6a1b708(key);

-- Create index for prefix searches (for getByPrefix queries)
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix ON kv_store_c6a1b708(key TEXT_PATTERN_OPS);

-- Add comment to table
COMMENT ON TABLE kv_store_c6a1b708 IS 'Key-Value store for AlagaTrack application data (users, passwords, tasks, etc)';

-- Grant appropriate permissions (adjust if needed)
GRANT INSERT, SELECT, UPDATE, DELETE ON kv_store_c6a1b708 TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON kv_store_c6a1b708 TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kv_store_c6a1b708_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE kv_store_c6a1b708_id_seq TO authenticated;
