-- Add is_vat_category column to costs table
-- This column distinguishes between regular costs and VAT categories

-- Add the column with default value false (existing records are costs, not VAT categories)
ALTER TABLE costs 
ADD COLUMN IF NOT EXISTS is_vat_category BOOLEAN NOT NULL DEFAULT false;

-- Add a comment to explain the column
COMMENT ON COLUMN costs.is_vat_category IS 'Indicates whether this record is a VAT category (true) or a regular cost (false)';

-- Create an index for better query performance when filtering by is_vat_category
CREATE INDEX IF NOT EXISTS idx_costs_is_vat_category ON costs(is_vat_category);

-- Create a composite index for the unique constraint check (name + city_id + is_vat_category)
CREATE INDEX IF NOT EXISTS idx_costs_name_city_vat_category ON costs(LOWER(TRIM(name)), city_id, is_vat_category);

