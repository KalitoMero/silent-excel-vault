const express = require('express');
const db = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// GET /api/additional-infos
router.get('/additional-infos', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ai.*, d.name as department_name 
      FROM additional_infos ai 
      LEFT JOIN departments d ON ai.department_id = d.id 
      ORDER BY ai.name ASC
    `);

    res.json({ 
      success: true, 
      additionalInfos: result.rows 
    });
  } catch (error) {
    logger.error('Get additional infos failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/additional-infos
router.post('/additional-infos', async (req, res) => {
  try {
    const { name, department_id } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid name is required' 
      });
    }

    if (!department_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Department ID is required' 
      });
    }

    const result = await db.query(
      'INSERT INTO additional_infos (name, department_id) VALUES ($1, $2) RETURNING *',
      [name.trim(), department_id]
    );

    logger.info('Additional info created', { name: name.trim(), department_id, id: result.rows[0].id });
    
    res.json({ 
      success: true, 
      additionalInfo: result.rows[0] 
    });
  } catch (error) {
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid department ID' 
      });
    }
    logger.error('Create additional info failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE /api/additional-infos/:id
router.delete('/additional-infos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM additional_infos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Additional info not found' 
      });
    }

    logger.info('Additional info deleted', { id });
    
    res.json({ 
      success: true 
    });
  } catch (error) {
    logger.error('Delete additional info failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;