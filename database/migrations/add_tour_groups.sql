-- Create tour_groups table
CREATE TABLE IF NOT EXISTS tour_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tour_group_members table (Many-to-Many relationship between tours and tour groups)
CREATE TABLE IF NOT EXISTS tour_group_members (
    tour_group_id INTEGER NOT NULL REFERENCES tour_groups(id) ON DELETE CASCADE,
    tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0, -- Önem sırası (0 = en önemli, yüksek sayı = daha az önemli)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tour_group_id, tour_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tour_groups_name ON tour_groups(name);
CREATE INDEX IF NOT EXISTS idx_tour_group_members_group_id ON tour_group_members(tour_group_id);
CREATE INDEX IF NOT EXISTS idx_tour_group_members_tour_id ON tour_group_members(tour_id);

