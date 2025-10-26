-- Complete Database Schema
-- Run this file to create all tables for FST Cost Management System

-- ============================================
-- LOCATIONS TABLES
-- ============================================

-- Drop existing tables
DROP TABLE IF EXISTS sub_regions CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

-- Countries Table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL
);

-- Regions Table
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
);

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE
);

-- Sub Regions Table
CREATE TABLE IF NOT EXISTS sub_regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- ============================================
-- POSITIONS TABLES
-- ============================================

DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- Positions Table
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- ============================================
-- MERCHANTS TABLE
-- ============================================

DROP TABLE IF EXISTS merchants CASCADE;

CREATE TABLE IF NOT EXISTS merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    official_title VARCHAR(255),
    sub_region_id INTEGER,
    authorized_person VARCHAR(255),
    authorized_email VARCHAR(255),
    authorized_phone VARCHAR(50),
    operasyon_name VARCHAR(255),
    operasyon_email VARCHAR(255),
    operasyon_phone VARCHAR(50),
    location_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (sub_region_id) REFERENCES sub_regions(id) ON DELETE SET NULL
);

-- ============================================
-- COSTS TABLE
-- ============================================

DROP TABLE IF EXISTS costs CASCADE;

CREATE TABLE IF NOT EXISTS costs (
    id SERIAL PRIMARY KEY,
    cost_code VARCHAR(50) NOT NULL UNIQUE,
    cost_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL
);

-- ============================================
-- TOURS TABLE
-- ============================================

DROP TABLE IF EXISTS tours CASCADE;

CREATE TABLE IF NOT EXISTS tours (
    id SERIAL PRIMARY KEY,
    sejour_tour_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    sub_region_id INTEGER,
    merchant_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (sub_region_id) REFERENCES sub_regions(id) ON DELETE SET NULL,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES
-- ============================================

-- Countries indexes
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);

-- Regions indexes
CREATE INDEX IF NOT EXISTS idx_regions_country_id ON regions(country_id);

-- Cities indexes
CREATE INDEX IF NOT EXISTS idx_cities_region_id ON cities(region_id);

-- Sub Regions indexes
CREATE INDEX IF NOT EXISTS idx_sub_regions_city_id ON sub_regions(city_id);

-- Departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_city_id ON departments(city_id);

-- Positions indexes
CREATE INDEX IF NOT EXISTS idx_positions_department_id ON positions(department_id);

-- Merchants indexes
CREATE INDEX IF NOT EXISTS idx_merchants_sub_region_id ON merchants(sub_region_id);

-- Costs indexes
CREATE INDEX IF NOT EXISTS idx_costs_cost_code ON costs(cost_code);
CREATE INDEX IF NOT EXISTS idx_costs_cost_name ON costs(cost_name);

-- Tours indexes
CREATE INDEX IF NOT EXISTS idx_tours_sejour_tour_code ON tours(sejour_tour_code);
CREATE INDEX IF NOT EXISTS idx_tours_sub_region_id ON tours(sub_region_id);
CREATE INDEX IF NOT EXISTS idx_tours_merchant_id ON tours(merchant_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function for auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sub_regions_updated_at BEFORE UPDATE ON sub_regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_costs_updated_at BEFORE UPDATE ON costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

