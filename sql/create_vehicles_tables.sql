-- ============================================
-- VEHICLES TABLES
-- ============================================

DROP TABLE IF EXISTS vehicle_types CASCADE;
DROP TABLE IF EXISTS vehicle_companies CASCADE;

-- Vehicle Companies Table (Şehir bazlı)
CREATE TABLE IF NOT EXISTS vehicle_companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city_id INTEGER NOT NULL,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- Vehicle Types Table
CREATE TABLE IF NOT EXISTS vehicle_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    vehicle_company_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (vehicle_company_id) REFERENCES vehicle_companies(id) ON DELETE CASCADE
);

-- Vehicle Companies indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_companies_city_id ON vehicle_companies(city_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_companies_name ON vehicle_companies(name);

-- Vehicle Types indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_types_company_id ON vehicle_types(vehicle_company_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_types_name ON vehicle_types(name);

-- Trigger for auto-update updated_at
CREATE TRIGGER update_vehicle_companies_updated_at BEFORE UPDATE ON vehicle_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_types_updated_at BEFORE UPDATE ON vehicle_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

