-- Create merchant_contracts table for merchant contract management
-- Contract Code Format: FST-03-******

CREATE TABLE IF NOT EXISTS public.merchant_contracts (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL,
    tour_id INTEGER,
    contract_code VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT merchant_contracts_merchant_id_fkey FOREIGN KEY (merchant_id) 
        REFERENCES public.merchants(id) ON DELETE CASCADE,
    CONSTRAINT merchant_contracts_tour_id_fkey FOREIGN KEY (tour_id) 
        REFERENCES public.tours(id) ON DELETE SET NULL,
    CONSTRAINT merchant_contracts_dates_check CHECK (end_date >= start_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchant_contracts_merchant_id ON public.merchant_contracts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_contracts_tour_id ON public.merchant_contracts(tour_id);
CREATE INDEX IF NOT EXISTS idx_merchant_contracts_contract_code ON public.merchant_contracts(contract_code);
CREATE INDEX IF NOT EXISTS idx_merchant_contracts_dates ON public.merchant_contracts(start_date, end_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_merchant_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_merchant_contracts_updated_at
    BEFORE UPDATE ON public.merchant_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_merchant_contracts_updated_at();

-- Add comment to table
COMMENT ON TABLE public.merchant_contracts IS 'Stores contracts for merchants with FST-03-****** format contract codes';

