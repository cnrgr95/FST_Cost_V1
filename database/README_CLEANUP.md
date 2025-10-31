# Database Cleanup Documentation

## Overview
This document describes the database cleanup process and identifies unused tables, columns, and indexes.

## Cleanup Script
File: `database/cleanup_unused_tables_columns.sql`

## What This Script Does

### 1. Removes Unused Columns
- **vehicle_contract_routes** table: Removes old individual price columns that were replaced by JSONB:
  - `vip_vito_price`
  - `vip_mini_price`
  - `vito_price`
  - `mini_price`
  - `midi_price`
  - `bus_price`
  
  These columns have been replaced by the `vehicle_type_prices` JSONB column for dynamic pricing.

### 2. Removes Unused Indexes
- `idx_countries_use_in_currency` - Index for `use_in_currency` column which was removed

### 3. Creates Missing Tables
The following tables are used in the code but were missing from the original schema:

- **tours**: Stores tour information
  - Columns: `id`, `sejour_tour_code`, `name`, `sub_region_id`, `merchant_id`, `vehicle_contract_id`, `created_at`, `updated_at`

- **tour_sub_regions**: Many-to-many relationship between tours and sub regions
  - Columns: `tour_id`, `sub_region_id` (composite primary key)

- **tour_contract_routes**: Links tours to specific contract routes by sub region
  - Columns: `id`, `tour_id`, `sub_region_id`, `vehicle_contract_route_id`, `created_at`, `updated_at`

- **costs**: Stores cost information
  - Columns: `id`, `cost_code`, `cost_name`, `country_id`, `region_id`, `city_id`, `created_at`, `updated_at`

### 4. Creates Indexes and Triggers
- Creates appropriate indexes for all new tables
- Creates triggers for `updated_at` timestamp updates

## How to Use

### Step 1: Backup Your Database
```sql
pg_dump -U postgres fst_cost_db > backup_before_cleanup.sql
```

### Step 2: Review the Script
Review `database/cleanup_unused_tables_columns.sql` to ensure it matches your needs.

### Step 3: Run the Cleanup Script
```sql
psql -U postgres -d fst_cost_db -f database/cleanup_unused_tables_columns.sql
```

### Step 4: Verify
Run the verification queries at the end of the script to confirm everything is correct.

## Schema Updates
The main schema file `database/create_database.sql` has been updated to include:
- Missing tables (tours, tour_sub_regions, tour_contract_routes, costs)
- Missing trigger for `vehicle_contract_routes.updated_at`
- All necessary indexes

## Notes
- Always backup before running cleanup scripts
- The script uses `IF EXISTS` and `IF NOT EXISTS` clauses for safety
- Old columns are only dropped if they exist
- New tables are only created if they don't exist
