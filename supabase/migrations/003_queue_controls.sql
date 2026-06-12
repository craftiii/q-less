-- Queue open/close toggle
ALTER TABLE providers ADD COLUMN IF NOT EXISTS queue_open BOOLEAN DEFAULT true;
