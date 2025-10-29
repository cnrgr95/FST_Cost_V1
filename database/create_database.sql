-- FST Cost Management Database Schema
-- PostgreSQL Database Creation Script

-- ============================================
-- DATABASE CREATION
-- ============================================
-- Note: Run this as PostgreSQL superuser (postgres)
-- CREATE DATABASE fst_cost_db;
-- \c fst_cost_db;

-- ============================================
-- TABLES CREATION
-- ============================================

-- Countries Table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Regions Table
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, country_id)
);

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, region_id)
);

-- Sub Regions Table
CREATE TABLE IF NOT EXISTS sub_regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, city_id)
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, city_id)
);

-- Positions Table
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, department_id)
);

-- Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    official_title VARCHAR(255),
    sub_region_id INTEGER REFERENCES sub_regions(id) ON DELETE CASCADE,
    authorized_person VARCHAR(255),
    authorized_email VARCHAR(255),
    authorized_phone VARCHAR(50),
    operasyon_name VARCHAR(255),
    operasyon_email VARCHAR(255),
    operasyon_phone VARCHAR(50),
    location_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, sub_region_id)
);

-- Vehicle Companies Table
CREATE TABLE IF NOT EXISTS vehicle_companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, city_id)
);

-- Vehicle Types Table
CREATE TABLE IF NOT EXISTS vehicle_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vehicle_company_id INTEGER REFERENCES vehicle_companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, vehicle_company_id)
);

-- Vehicle Contracts Table
CREATE TABLE IF NOT EXISTS vehicle_contracts (
    id SERIAL PRIMARY KEY,
    vehicle_company_id INTEGER REFERENCES vehicle_companies(id) ON DELETE CASCADE,
    contract_code VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contract_code)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL,
    city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Countries indexes
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);

-- Regions indexes
CREATE INDEX IF NOT EXISTS idx_regions_country_id ON regions(country_id);
CREATE INDEX IF NOT EXISTS idx_regions_name ON regions(name);

-- Cities indexes
CREATE INDEX IF NOT EXISTS idx_cities_region_id ON cities(region_id);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

-- Sub Regions indexes
CREATE INDEX IF NOT EXISTS idx_sub_regions_city_id ON sub_regions(city_id);
CREATE INDEX IF NOT EXISTS idx_sub_regions_name ON sub_regions(name);

-- Departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_city_id ON departments(city_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- Positions indexes
CREATE INDEX IF NOT EXISTS idx_positions_department_id ON positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_name ON positions(name);

-- Merchants indexes
CREATE INDEX IF NOT EXISTS idx_merchants_sub_region_id ON merchants(sub_region_id);
CREATE INDEX IF NOT EXISTS idx_merchants_name ON merchants(name);

-- Vehicle Companies indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_companies_city_id ON vehicle_companies(city_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_companies_name ON vehicle_companies(name);

-- Vehicle Types indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_types_company_id ON vehicle_types(vehicle_company_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_types_name ON vehicle_types(name);

-- Vehicle Contracts indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_contracts_company_id ON vehicle_contracts(vehicle_company_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_contracts_code ON vehicle_contracts(contract_code);
CREATE INDEX IF NOT EXISTS idx_vehicle_contracts_dates ON vehicle_contracts(start_date, end_date);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_position_id ON users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_city_id ON users(city_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_regions_updated_at BEFORE UPDATE ON sub_regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_companies_updated_at BEFORE UPDATE ON vehicle_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_types_updated_at BEFORE UPDATE ON vehicle_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_contracts_updated_at BEFORE UPDATE ON vehicle_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================

-- Uncomment below to insert sample data for testing

/*
-- Sample Countries
INSERT INTO countries (name, code) VALUES 
('Turkey', 'TR'),
('Germany', 'DE'),
('France', 'FR')
ON CONFLICT (name) DO NOTHING;

-- Sample Regions (assuming country_id = 1 for Turkey)
INSERT INTO regions (name, country_id) VALUES 
('Marmara', 1),
('Aegean', 1),
('Mediterranean', 1)
ON CONFLICT (name, country_id) DO NOTHING;

-- Sample Cities (assuming region_id = 1 for Marmara)
INSERT INTO cities (name, region_id) VALUES 
('Istanbul', 1),
('Bursa', 1),
('Izmir', 2)
ON CONFLICT (name, region_id) DO NOTHING;

-- Sample Departments (assuming city_id = 1 for Istanbul)
INSERT INTO departments (name, city_id) VALUES 
('IT Department', 1),
('HR Department', 1),
('Finance Department', 1)
ON CONFLICT (name, city_id) DO NOTHING;
*/

-- ============================================
-- VERIFICATION
-- ============================================

-- Uncomment to verify tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

