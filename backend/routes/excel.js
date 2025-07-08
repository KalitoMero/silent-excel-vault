const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// POST /api/excel-import
router.post('/excel-import', async (req, res) => {
  try {
    const { filename, data } = req.body;
    
    if (!filename || !data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Filename and data are required' 
      });
    }

    const result = await db.query(
      'INSERT INTO excel_data (filename, data) VALUES ($1, $2) RETURNING id',
      [filename, JSON.stringify(data)]
    );

    logger.info('Excel data imported', { filename, id: result.rows[0].id });
    
    res.json({ 
      success: true, 
      id: result.rows[0].id 
    });
  } catch (error) {
    logger.error('Excel import failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/excel-data
router.get('/excel-data', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT filename, data FROM excel_data ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.json({ 
        success: false, 
        error: 'No Excel data found' 
      });
    }

    const row = result.rows[0];
    res.json({ 
      success: true, 
      filename: row.filename,
      data: row.data 
    });
  } catch (error) {
    logger.error('Get Excel data failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;