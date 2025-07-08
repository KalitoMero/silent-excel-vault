const express = require('express');
const db = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// GET /api/departments
router.get('/departments', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM departments ORDER BY name ASC'
    );

    res.json({ 
      success: true, 
      departments: result.rows 
    });
  } catch (error) {
    logger.error('Get departments failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/departments
router.post('/departments', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid department name is required' 
      });
    }

    const result = await db.query(
      'INSERT INTO departments (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );

    logger.info('Department created', { name: name.trim(), id: result.rows[0].id });
    
    res.json({ 
      success: true, 
      department: result.rows[0] 
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ 
        success: false, 
        error: 'Department with this name already exists' 
      });
    }
    logger.error('Create department failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE /api/departments/:id
router.delete('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM departments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Department not found' 
      });
    }

    logger.info('Department deleted', { id });
    
    res.json({ 
      success: true 
    });
  } catch (error) {
    logger.error('Delete department failed', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;