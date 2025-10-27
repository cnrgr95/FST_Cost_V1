-- Migration Script for Vehicle Contracts
-- If you have an existing vehicle_contracts table with old structure, run this first

-- Step 1: Check if old table exists and migrate data
DO $$
BEGIN
    -- Check if old columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicle_contracts' 
        AND column_name = 'from_location'
    ) THEN
        -- Create routes table if it doesn't exist
        CREATE TABLE IF NOT EXISTS vehicle_contract_routes (
            id SERIAL PRIMARY KEY,
            vehicle_contract_id INTEGER NOT NULL,
            from_location VARCHAR(255) NOT NULL,
            to_location VARCHAR(255) NOT NULL,
            vip_mini_price DECIMAL(10, 2) DEFAULT NULL,
            mini_price DECIMAL(10, 2) DEFAULT NULL,
            midi_price DECIMAL(10, 2) DEFAULT NULL,
            bus_price DECIMAL(10, 2) DEFAULT NULL,
            currency VARCHAR(10) DEFAULT 'USD',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Migrate existing route data to routes table
        INSERT INTO vehicle_contract_routes (
            vehicle_contract_id, from_location, to_location,
            vip_mini_price, mini_price, midi_price, bus_price, currency, created_at
        )
        SELECT 
            id, from_location, to_location,
            vip_mini_price, mini_price, midi_price, bus_price, currency, created_at
        FROM vehicle_contracts
        WHERE from_location IS NOT NULL AND to_location IS NOT NULL
        ON CONFLICT DO NOTHING;
        
        -- Drop old columns from contracts table
        ALTER TABLE vehicle_contracts 
            DROP COLUMN IF EXISTS from_location,
            DROP COLUMN IF EXISTS to_location,
            DROP COLUMN IF EXISTS vip_mini_price,
            DROP COLUMN IF EXISTS mini_price,
            DROP COLUMN IF EXISTS midi_price,
            DROP COLUMN IF EXISTS bus_price,
            DROP COLUMN IF EXISTS currency;
    END IF;
END $$;

-- Step 2: Add foreign key constraint if routes table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_contract_routes') THEN
        -- Drop existing constraint if exists
        ALTER TABLE vehicle_contract_routes 
            DROP CONSTRAINT IF EXISTS vehicle_contract_routes_vehicle_contract_id_fkey;
        
        -- Add foreign key constraint
        ALTER TABLE vehicle_contract_routes 
            ADD CONSTRAINT vehicle_contract_routes_vehicle_contract_id_fkey 
            FOREIGN KEY (vehicle_contract_id) 
            REFERENCES vehicle_contracts(id) 
            ON DELETE CASCADE;
        
        -- Add unique constraint
        ALTER TABLE vehicle_contract_routes 
            DROP CONSTRAINT IF EXISTS unique_route_per_contract;
        
        ALTER TABLE vehicle_contract_routes 
            ADD CONSTRAINT unique_route_per_contract 
            UNIQUE (vehicle_contract_id, from_location, to_location);
    END IF;
END $$;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_contract_routes_contract ON vehicle_contract_routes(vehicle_contract_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_contract_routes_from ON vehicle_contract_routes(from_location);
CREATE INDEX IF NOT EXISTS idx_vehicle_contract_routes_to ON vehicle_contract_routes(to_location);

