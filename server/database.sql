
-- PostgreSQL Database Schema for Silent Excel Vault

-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE silent_excel_vault;

-- Excel imports table
CREATE TABLE IF NOT EXISTS excel_imports (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan orders table
CREATE TABLE IF NOT EXISTS scan_orders (
    id SERIAL PRIMARY KEY,
    auftragsnummer VARCHAR(100) NOT NULL,
    prioritaet INTEGER CHECK (prioritaet IN (1, 2)) NOT NULL,
    zeitstempel TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    zusatz_daten JSONB DEFAULT '{}'
);

-- Excel settings table
CREATE TABLE IF NOT EXISTS excel_settings (
    id SERIAL PRIMARY KEY,
    settings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Column settings table
CREATE TABLE IF NOT EXISTS column_settings (
    id SERIAL PRIMARY KEY,
    settings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_orders_auftragsnummer ON scan_orders(auftragsnummer);
CREATE INDEX IF NOT EXISTS idx_scan_orders_zeitstempel ON scan_orders(zeitstempel);
CREATE INDEX IF NOT EXISTS idx_excel_imports_created_at ON excel_imports(created_at);
