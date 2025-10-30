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
    -- Whether this country participates in currency management
    use_in_currency BOOLEAN DEFAULT FALSE,
    -- Optional local/base currency code for this country (e.g., TRY for Turkey)
    local_currency_code VARCHAR(3),
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

-- Currencies master table (ISO-like codes)
CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Country-currency settings (which foreign currencies are relevant per country, optional unit name override)
CREATE TABLE IF NOT EXISTS country_currencies (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code) ON DELETE RESTRICT,
    unit_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_id, currency_code)
);

-- Exchange rates per country and currency. If end_date is set, the rate applies inclusively from rate_date to end_date.
CREATE TABLE IF NOT EXISTS exchange_rates (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code) ON DELETE RESTRICT,
    rate_date DATE NOT NULL,
    end_date DATE,
    rate NUMERIC(18,6) NOT NULL CHECK (rate > 0),
    source VARCHAR(10) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','cbrt')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_id, currency_code, rate_date)
);

-- ============================================
-- INDEXES
-- ============================================

-- Countries indexes
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_use_in_currency ON countries(use_in_currency);

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

-- Currencies indexes
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_name ON currencies(name);

-- Country currencies indexes
CREATE INDEX IF NOT EXISTS idx_country_currencies_country_id ON country_currencies(country_id);
CREATE INDEX IF NOT EXISTS idx_country_currencies_currency_code ON country_currencies(currency_code);

-- Exchange rates indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_country_date ON exchange_rates(country_id, rate_date);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_date ON exchange_rates(currency_code, rate_date);

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

CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_currencies_updated_at BEFORE UPDATE ON country_currencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates
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

-- ============================================
-- OPTIONAL: UNUSED COLUMN CLEANUP (ADVANCED)
-- ============================================
-- This block identifies columns that are not part of any PK/FK and offers
-- an optional drop step. Review carefully before enabling execution.
-- If you want to use it right after creation, run this section separately.

-- 1) List candidate columns (read-only)
/*
WITH pk_cols AS (
  SELECT tc.table_name, kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema='public' AND tc.constraint_type='PRIMARY KEY'
),
fk_cols AS (
  SELECT kcu.table_name AS table_name, kcu.column_name AS column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
  UNION
  SELECT ccu.table_name, ccu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema   = tc.table_schema
  WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
)
SELECT c.table_name, c.column_name, c.data_type, c.is_nullable
FROM information_schema.columns c
LEFT JOIN pk_cols p  ON p.table_name=c.table_name  AND p.column_name=c.column_name
LEFT JOIN fk_cols fk ON fk.table_name=c.table_name AND fk.column_name=c.column_name
WHERE c.table_schema='public'
  AND p.column_name IS NULL
  AND fk.column_name IS NULL
  AND c.column_name NOT IN (
    'name','code','created_at','updated_at','status','email','phone','symbol','location_url',
    'authorized_person','authorized_email','authorized_phone','contact_person','contact_email','contact_phone',
    'operasyon_name','operasyon_email','operasyon_phone','unit_name','rate','rate_date','end_date','source','is_active'
  )
ORDER BY c.table_name, c.ordinal_position;
*/

-- 2) Execute drops (disable by default; set exec_drops := true to enable)
/*
DO $$
DECLARE
  exec_drops boolean := false; -- CHANGE TO true AFTER REVIEW
  r record;
BEGIN
  FOR r IN (
    WITH pk_cols AS (
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema='public' AND tc.constraint_type='PRIMARY KEY'
    ),
    fk_cols AS (
      SELECT kcu.table_name AS table_name, kcu.column_name AS column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
      UNION
      SELECT ccu.table_name, ccu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema   = tc.table_schema
      WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
    )
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    LEFT JOIN pk_cols p  ON p.table_name=c.table_name  AND p.column_name=c.column_name
    LEFT JOIN fk_cols fk ON fk.table_name=c.table_name AND fk.column_name=c.column_name
    WHERE c.table_schema='public'
      AND p.column_name IS NULL
      AND fk.column_name IS NULL
      AND c.column_name NOT IN (
        'name','code','created_at','updated_at','status','email','phone','symbol','location_url',
        'authorized_person','authorized_email','authorized_phone','contact_person','contact_email','contact_phone',
        'operasyon_name','operasyon_email','operasyon_phone','unit_name','rate','rate_date','end_date','source','is_active'
      )
    ORDER BY c.table_name, c.ordinal_position
  ) LOOP
    RAISE NOTICE 'Candidate to drop: %.% ', r.table_name, r.column_name;
    IF exec_drops THEN
      EXECUTE format('ALTER TABLE %I DROP COLUMN %I', r.table_name, r.column_name);
    END IF;
  END LOOP;
END $$;
*/

