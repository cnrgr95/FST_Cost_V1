-- Drop Cost Management Tables
-- This script removes all cost-related tables

-- Drop dependent tables first (due to foreign key constraints)
DROP TABLE IF EXISTS cost_variable_formulas CASCADE;
DROP TABLE IF EXISTS cost_prices CASCADE;
DROP TABLE IF EXISTS cost_periods CASCADE;

-- Drop main costs table
DROP TABLE IF EXISTS costs CASCADE;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS costs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS cost_periods_id_seq CASCADE;
DROP SEQUENCE IF EXISTS cost_prices_id_seq CASCADE;
DROP SEQUENCE IF EXISTS cost_variable_formulas_id_seq CASCADE;

