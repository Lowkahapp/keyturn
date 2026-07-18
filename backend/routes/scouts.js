const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/v1/scouts/tasks — scout sees their assigned verifications
router.get('/tasks', authenticate, requireRole('scout'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = ['v.scout_id = $1'];
    const params = [req.user.id];
    if (status) { conditions.push(`v.status = $2`); params.push(status); }

    const { rows } = await pool.query(`
      SELECT v.*, p.title, p.address, p.locality, p.city,
             p.bhk, p.property_type, p.photos AS existing_photos,
             u.name AS owner_name, u.phone AS owner_phone
      FROM verifications v
      JOIN properties p ON v.property_id = p.id
      JOIN users u ON p.owner_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY v.scheduled_at ASC NULLS LAST, v.created_at ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, parseInt(limit), parseInt(offset)]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/scouts/tasks/:id/checkin — scout arrives at property
router.post('/tasks/:id/checkin', authenticate, requireRole('scout'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const { rows } = await pool.query(`
      UPDATE verifications
      SET status = 'in_progress', arrived_at = NOW()
      WHERE id = $1 AND scout_id = $2 AND status IN ('assigned', 'scout_en_route')
      RETURNING *
    `, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Task not found or not yours' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/scouts/tasks/:id/complete — submit verification
router.post('/tasks/:id/complete', authenticate, requireRole('scout'), async (req, res) => {
  try {
    const {
      scout_notes, actual_carpet_area, condition_rating,
      ownership_verified, rera_compliant, checklist, photos, video_url
    } = req.body;

    if (!photos || photos.length < 5) {
      return res.status(400).json({ success: false, message: 'Minimum 5 photos required' });
    }
    if (!condition_rating || condition_rating < 1 || condition_rating > 5) {
      return res.status(400).json({ success: false, message: 'Condition rating (1-5) required' });
    }

    const { rows } = await pool.query(`
      UPDATE verifications SET
        status = 'submitted',
        completed_at = NOW(),
        scout_notes = $1,
        actual_carpet_area = $2,
        condition_rating = $3,
        ownership_verified = $4,
        rera_compliant = $5,
        checklist = $6,
        photos = $7,
        video_url = $8
      WHERE id = $9 AND scout_id = $10 AND status = 'in_progress'
      RETURNING *
    `, [
      scout_notes, actual_carpet_area, condition_rating,
      ownership_verified, rera_compliant,
      JSON.stringify(checklist || {}),
      JSON.stringify(photos),
      video_url, req.params.id, req.user.id
    ]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Task not in progress or not yours' });
    res.json({ success: true, message: 'Verification submitted for review', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: assign scout to verification
router.post('/assign', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { verification_id, scout_id, scheduled_at } = req.body;
    const { rows } = await pool.query(`
      UPDATE verifications SET scout_id = $1, scheduled_at = $2, status = 'assigned', assigned_by = $3
      WHERE id = $4 RETURNING *
    `, [scout_id, scheduled_at, req.user.id, verification_id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: approve/reject verification
router.put('/tasks/:id/review', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { action, admin_notes, rejection_reason } = req.body; // action: 'approve' | 'reject'
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { rows } = await pool.query(`
      UPDATE verifications SET status = $1, admin_notes = $2, rejection_reason = $3
      WHERE id = $4 AND status = 'submitted' RETURNING *
    `, [newStatus, admin_notes, rejection_reason, req.params.id]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Verification not found or not submitted' });

    if (action === 'approve') {
      await pool.query(`UPDATE properties SET verification_status = 'verified', verified_at = NOW() WHERE id = $1`, [rows[0].property_id]);
    } else {
      await pool.query(`UPDATE properties SET verification_status = 'rejected' WHERE id = $1`, [rows[0].property_id]);
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/scouts/earnings — scout earnings summary
router.get('/earnings', authenticate, requireRole('scout'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'approved') AS completed_count,
        SUM(scout_payout) FILTER (WHERE status = 'approved') AS total_earned,
        COUNT(*) FILTER (WHERE status IN ('assigned','in_progress','submitted')) AS pending_count,
        AVG(condition_rating) FILTER (WHERE status = 'approved') AS avg_rating
      FROM verifications WHERE scout_id = $1
    `, [req.user.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
