-- Vehicle Contracts Table
-- Stores basic contract information for vehicle companies

CREATE TABLE IF NOT EXISTS vehicle_contracts (
    id SERIAL PRIMARY KEY,
    vehicle_company_id INTEGER NOT NULL REFERENCES vehicle_companies(id) ON DELETE CASCADE,
    contract_code VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT unique_contract_code_per_company UNIQUE (vehicle_company_id, contract_code)
);

-- Vehicle Contract Routes Table
-- Stores routes and prices for each contract
CREATE TABLE IF NOT EXISTS vehicle_contract_routes (
    id SERIAL PRIMARY KEY,
    vehicle_contract_id INTEGER NOT NULL REFERENCES vehicle_contracts(id) ON DELETE CASCADE,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    vip_mini_price DECIMAL(10, 2) DEFAULT NULL,
    mini_price DECIMAL(10, 2) DEFAULT NULL,
    midi_price DECIMAL(10, 2) DEFAULT NULL,
    bus_price DECIMAL(10, 2) DEFAULT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_route_per_contract UNIQUE (vehicle_contract_id, from_location, to_location)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicle_contracts_company ON vehicle_contracts(vehicle_company_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_contracts_dates ON vehicle_contracts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_contracts_code ON vehicle_contracts(contract_code);

CREATE INDEX IF NOT EXISTS idx_vehicle_contract_routes_contract ON vehicle_contract_routes(vehicle_contract_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_contract_routes_from ON vehicle_contract_routes(from_location);
CREATE INDEX IF NOT EXISTS idx_vehicle_contract_routes_to ON vehicle_contract_routes(to_location);

-- Comments for documentation
COMMENT ON TABLE vehicle_contracts IS 'Stores basic vehicle company contract information';
COMMENT ON COLUMN vehicle_contracts.contract_code IS 'Unique contract code per vehicle company';
COMMENT ON COLUMN vehicle_contracts.start_date IS 'Contract start date';
COMMENT ON COLUMN vehicle_contracts.end_date IS 'Contract end date';

COMMENT ON TABLE vehicle_contract_routes IS 'Stores routes and pricing for vehicle contracts';
COMMENT ON COLUMN vehicle_contract_routes.from_location IS 'Starting location (Nereden)';
COMMENT ON COLUMN vehicle_contract_routes.to_location IS 'Destination location (Nereye)';
COMMENT ON COLUMN vehicle_contract_routes.vip_mini_price IS 'Price for VIP Mini vehicle type';
COMMENT ON COLUMN vehicle_contract_routes.mini_price IS 'Price for Mini vehicle type';
COMMENT ON COLUMN vehicle_contract_routes.midi_price IS 'Price for Midi vehicle type';
COMMENT ON COLUMN vehicle_contract_routes.bus_price IS 'Price for Bus vehicle type';
