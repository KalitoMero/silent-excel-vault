const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/media');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// POST /api/media
router.post('/media', upload.single('file'), async (req, res) => {
  try {
    const { auftragsnummer, file_type, content } = req.body;
    let file_path = '';

    if (req.file) {
      file_path = `/uploads/media/${req.file.filename}`;
    }
    
    if (!auftragsnummer || !file_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Auftragsnummer and file_type are required' 
      });
    }

    const result = await db.query(
      'INSERT INTO order_media (auftragsnummer, file_path, file_type, content) VALUES ($1, $2, $3, $4) RETURNING id',
      [auftragsnummer, file_path, file_type, content]
    );

    logger.info('Media saved', { auftragsnummer, file_type, id: result.rows[0].id });
    
    res.json({ 
      success: true, 
      id: result.rows[0].id 
    });
  } catch (error) {
    logger.error('Save media failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/media
router.get('/media', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM order_media ORDER BY created_at DESC'
    );

    res.json({ 
      success: true, 
      media: result.rows 
    });
  } catch (error) {
    logger.error('Get media failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/media/:auftragsnummer
router.get('/media/:auftragsnummer', async (req, res) => {
  try {
    const { auftragsnummer } = req.params;
    
    const result = await db.query(
      'SELECT * FROM order_media WHERE auftragsnummer = $1 ORDER BY created_at DESC',
      [auftragsnummer]
    );

    res.json({ 
      success: true, 
      media: result.rows 
    });
  } catch (error) {
    logger.error('Get media by auftragsnummer failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;