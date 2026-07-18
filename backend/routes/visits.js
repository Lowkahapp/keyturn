const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// POST /api/v1/visits — schedule a visit
router.post('/', authenticate, async (req, res) => {
  try {
    const { property_id, scheduled_at, visit_mode = 'in_person', notes } = req.body;
    const prop = await pool.query('SELECT owner_id FROM properties WHERE id = $1 AND is_active = true', [property_id]);
    if (!prop.rows.length) return res.status(404).json({ success: false, message: 'Property not found' });

    // Check seeker has no conflicting visit
    const conflict = await pool.query(`
      SELECT id FROM visits
      WHERE seeker_id = $1
        AND ABS(EXTRACT(EPOCH FROM (scheduled_at - $2::timestamptz))) < 3600
        AND status NOT IN ('cancelled','no_show')
    `, [req.user.id, scheduled_at]);
    if (conflict.rows.length) return res.status(400).json({ success: false, message: 'You have another visit scheduled around this time' });

    const { rows } = await pool.query(`
      INSERT INTO visits (id, property_id, seeker_id, owner_id, scheduled_at, visit_mode, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [uuidv4(), property_id, req.user.id, prop.rows[0].owner_id, scheduled_at, visit_mode, notes]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/visits — user's visits
router.get('/', authenticate, async (req, res) => {
  try {
    const isOwner = req.user.user_type === 'owner';
    const field = isOwner ? 'v.owner_id' : 'v.seeker_id';
    const { rows } = await pool.query(`
      SELECT v.*, p.title, p.address, p.locality, p.city, p.photos,
             o.name AS owner_name, o.phone AS owner_phone,
             s.name AS seeker_name, s.phone AS seeker_phone
      FROM visits v
      JOIN properties p ON v.property_id = p.id
      JOIN users o ON v.owner_id = o.id
      JOIN users s ON v.seeker_id = s.id
      WHERE ${field} = $1
      ORDER BY v.scheduled_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/visits/:id/confirm — owner confirms visit
router.put('/:id/confirm', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE visits SET status = 'confirmed' WHERE id = $1 AND owner_id = $2 AND status = 'requested' RETURNING *
    `, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Visit not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/visits/:id/cancel
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE visits SET status = 'cancelled'
      WHERE id = $1 AND (owner_id = $2 OR seeker_id = $2) AND status NOT IN ('completed','cancelled')
      RETURNING *
    `, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Visit not found' });
    res.json({ success: true, message: 'Visit cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/visits/:id/complete + feedback
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    const { rows } = await pool.query(`
      UPDATE visits SET status = 'completed', feedback = $1, rating = $2
      WHERE id = $3 AND seeker_id = $4 AND status = 'confirmed'
      RETURNING *
    `, [feedback, rating, req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Visit not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
