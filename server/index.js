
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'silent_excel_vault',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Test database connection
pool.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Database connection error:', err));

// Routes

// Excel data import
app.post('/api/excel-import', async (req, res) => {
  try {
    const { filename, data } = req.body;
    
    const query = `
      INSERT INTO excel_imports (filename, data, created_at) 
      VALUES ($1, $2, NOW()) 
      RETURNING id
    `;
    
    const result = await pool.query(query, [filename, JSON.stringify(data)]);
    
    res.json({ 
      success: true, 
      id: result.rows[0].id,
      message: 'Excel data imported successfully' 
    });
  } catch (error) {
    console.error('Excel import error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import Excel data' 
    });
  }
});

// Get Excel data
app.get('/api/excel-data', async (req, res) => {
  try {
    const query = 'SELECT * FROM excel_imports ORDER BY created_at DESC LIMIT 1';
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      res.json({
        success: true,
        data: JSON.parse(result.rows[0].data),
        filename: result.rows[0].filename,
        created_at: result.rows[0].created_at
      });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error) {
    console.error('Get Excel data error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve Excel data' 
    });
  }
});

// Save scan order
app.post('/api/scan-orders', async (req, res) => {
  try {
    const { auftragsnummer, prioritaet, zusatzDaten } = req.body;
    
    const query = `
      INSERT INTO scan_orders (auftragsnummer, prioritaet, zeitstempel, zusatz_daten) 
      VALUES ($1, $2, NOW(), $3) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      auftragsnummer, 
      prioritaet, 
      JSON.stringify(zusatzDaten || {})
    ]);
    
    res.json({ 
      success: true, 
      order: result.rows[0],
      message: 'Scan order saved successfully' 
    });
  } catch (error) {
    console.error('Save scan order error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save scan order' 
    });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const query = 'SELECT * FROM scan_orders ORDER BY zeitstempel DESC';
    const result = await pool.query(query);
    
    const orders = result.rows.map(row => ({
      id: row.id,
      auftragsnummer: row.auftragsnummer,
      prioritaet: row.prioritaet,
      zeitstempel: row.zeitstempel,
      zusatzDaten: JSON.parse(row.zusatz_daten || '{}')
    }));
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve orders' 
    });
  }
});

// Get Excel settings
app.get('/api/excel-settings', async (req, res) => {
  try {
    const query = 'SELECT * FROM excel_settings ORDER BY created_at DESC LIMIT 1';
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      res.json({
        success: true,
        settings: JSON.parse(result.rows[0].settings)
      });
    } else {
      res.json({ 
        success: true, 
        settings: { auftragsnummerColumn: 1 } 
      });
    }
  } catch (error) {
    console.error('Get Excel settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve Excel settings' 
    });
  }
});

// Save Excel settings
app.post('/api/excel-settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    const query = `
      INSERT INTO excel_settings (settings, created_at) 
      VALUES ($1, NOW()) 
      RETURNING id
    `;
    
    const result = await pool.query(query, [JSON.stringify(settings)]);
    
    res.json({ 
      success: true, 
      id: result.rows[0].id,
      message: 'Excel settings saved successfully' 
    });
  } catch (error) {
    console.error('Save Excel settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save Excel settings' 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
