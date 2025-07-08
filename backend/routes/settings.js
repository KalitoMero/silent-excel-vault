const express = require('express');
const db = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// GET /api/excel-settings
router.get('/excel-settings', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM excel_settings ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.json({ 
        success: false, 
        error: 'No Excel settings found' 
      });
    }

    res.json({ 
      success: true, 
      settings: result.rows[0] 
    });
  } catch (error) {
    logger.error('Get Excel settings failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/excel-settings
router.post('/excel-settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings.auftragsnummer_column !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid settings with auftragsnummer_column are required' 
      });
    }

    const result = await db.query(
      'INSERT INTO excel_settings (auftragsnummer_column) VALUES ($1) RETURNING id',
      [settings.auftragsnummer_column]
    );

    logger.info('Excel settings saved', { id: result.rows[0].id });
    
    res.json({ 
      success: true, 
      id: result.rows[0].id 
    });
  } catch (error) {
    logger.error('Save Excel settings failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/column-settings
router.get('/column-settings', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM column_settings ORDER BY column_number ASC'
    );

    res.json({ 
      success: true, 
      settings: result.rows 
    });
  } catch (error) {
    logger.error('Get column settings failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/column-settings
router.post('/column-settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Settings must be an array' 
      });
    }

    // Delete existing settings
    await db.query('DELETE FROM column_settings');

    // Insert new settings
    for (const setting of settings) {
      await db.query(
        'INSERT INTO column_settings (title, column_number) VALUES ($1, $2)',
        [setting.title, setting.column_number]
      );
    }

    logger.info('Column settings saved', { count: settings.length });
    
    res.json({ 
      success: true 
    });
  } catch (error) {
    logger.error('Save column settings failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;