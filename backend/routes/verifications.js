const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/v1/verifications/pending — admin sees all pending
router.get('/pending', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT v.*, p.title, p.address, p.city, p.locality, p.bhk, p.property_type,
             u.name AS owner_name, u.phone AS owner_phone,
             s.name AS scout_name
      FROM verifications v
      JOIN properties p ON v.property_id = p.id
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN users s ON v.scout_id = s.id
      WHERE v.status IN ('assigned', 'submitted')
      ORDER BY v.created_at ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/verifications/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT v.*, p.title, p.address, p.owner_id,
             u.name AS scout_name
      FROM verifications v
      JOIN properties p ON v.property_id = p.id
      LEFT JOIN users u ON v.scout_id = u.id
      WHERE v.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Verification not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
