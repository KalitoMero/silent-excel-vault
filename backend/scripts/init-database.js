require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const createTables = async () => {
  try {
    console.log('🗃️  Creating database schema...');

    // Create departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create additional_infos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS additional_infos (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create column_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS column_settings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        column_number INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create excel_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS excel_settings (
        id SERIAL PRIMARY KEY,
        auftragsnummer_column INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create excel_data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS excel_data (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create scan_orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scan_orders (
        id SERIAL PRIMARY KEY,
        auftragsnummer VARCHAR(255) NOT NULL,
        prioritaet INTEGER NOT NULL CHECK (prioritaet IN (1, 2)),
        zeitstempel TIMESTAMP WITH TIME ZONE NOT NULL,
        abteilung VARCHAR(255),
        zusatzinfo TEXT,
        zusatz_daten JSONB DEFAULT '{}',
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create order_media table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_media (
        id SERIAL PRIMARY KEY,
        auftragsnummer VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create function for updating timestamps
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers for timestamp updates
    await pool.query(`
      DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
      CREATE TRIGGER update_departments_updated_at
        BEFORE UPDATE ON departments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_additional_infos_updated_at ON additional_infos;
      CREATE TRIGGER update_additional_infos_updated_at
        BEFORE UPDATE ON additional_infos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_scan_orders_updated_at ON scan_orders;
      CREATE TRIGGER update_scan_orders_updated_at
        BEFORE UPDATE ON scan_orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_additional_infos_department_id ON additional_infos(department_id);
      CREATE INDEX IF NOT EXISTS idx_scan_orders_auftragsnummer ON scan_orders(auftragsnummer);
      CREATE INDEX IF NOT EXISTS idx_scan_orders_completed ON scan_orders(completed);
      CREATE INDEX IF NOT EXISTS idx_scan_orders_prioritaet ON scan_orders(prioritaet);
      CREATE INDEX IF NOT EXISTS idx_order_media_auftragsnummer ON order_media(auftragsnummer);
    `);

    console.log('✅ Database schema created successfully!');
    console.log('🎯 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error creating database schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

createTables();