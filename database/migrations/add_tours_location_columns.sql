-- Add location columns to tours table
-- Add country_id, region_id, city_id columns

ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tours_country_id ON tours(country_id);
CREATE INDEX IF NOT EXISTS idx_tours_region_id ON tours(region_id);
CREATE INDEX IF NOT EXISTS idx_tours_city_id ON tours(city_id);

