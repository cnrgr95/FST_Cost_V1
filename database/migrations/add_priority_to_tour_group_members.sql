-- Add priority column to tour_group_members table
-- This migration should be run if tour_group_members table already exists without priority column

ALTER TABLE tour_group_members 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN tour_group_members.priority IS 'Önem sırası (0 = en önemli, yüksek sayı = daha az önemli)';

