-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create usage_records table
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    service VARCHAR(255) NOT NULL,
    service_code VARCHAR(255) NOT NULL,
    units_consumed INTEGER NOT NULL CHECK (units_consumed > 0),
    price_per_unit DECIMAL(10, 4) NOT NULL CHECK (price_per_unit > 0),
    request_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on request_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_records_request_id ON usage_records(request_id);

-- Create index on customer_id for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_records_customer_id ON usage_records(customer_id);

-- Insert sample customer data
INSERT INTO customers (name) VALUES
    ('Alice'),
    ('Bob'),
    ('Taylor')
ON CONFLICT (id) DO NOTHING;
