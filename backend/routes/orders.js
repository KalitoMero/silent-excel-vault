const express = require('express');
const db = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// POST /api/scan-orders
router.post('/scan-orders', async (req, res) => {
  try {
    const { auftragsnummer, prioritaet, zeitstempel, abteilung, zusatzinfo, zusatzDaten } = req.body;
    
    if (!auftragsnummer || !prioritaet || !zeitstempel) {
      return res.status(400).json({ 
        success: false, 
        error: 'Auftragsnummer, prioritaet, and zeitstempel are required' 
      });
    }

    const result = await db.query(
      `INSERT INTO scan_orders (auftragsnummer, prioritaet, zeitstempel, abteilung, zusatzinfo, zusatz_daten) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [auftragsnummer, prioritaet, zeitstempel, abteilung, zusatzinfo, JSON.stringify(zusatzDaten || {})]
    );

    logger.info('Scan order created', { auftragsnummer, prioritaet });
    
    res.json({ 
      success: true, 
      order: result.rows[0] 
    });
  } catch (error) {
    logger.error('Create scan order failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/orders
router.get('/orders', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM scan_orders ORDER BY created_at DESC'
    );

    res.json({ 
      success: true, 
      orders: result.rows 
    });
  } catch (error) {
    logger.error('Get orders failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/complete-order
router.post('/complete-order', async (req, res) => {
  try {
    const { auftragsnummer } = req.body;
    
    if (!auftragsnummer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Auftragsnummer is required' 
      });
    }

    const result = await db.query(
      'UPDATE scan_orders SET completed = TRUE, updated_at = NOW() WHERE auftragsnummer = $1 RETURNING *',
      [auftragsnummer]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    logger.info('Order completed', { auftragsnummer });
    
    res.json({ 
      success: true 
    });
  } catch (error) {
    logger.error('Complete order failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;