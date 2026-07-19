const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [users, properties, transactions, verifications] = await Promise.all([
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE user_type='owner') owners,
                  COUNT(*) FILTER (WHERE user_type='seeker') seekers,
                  COUNT(*) FILTER (WHERE user_type='scout') scouts
                  FROM users`),
      pool.query(`SELECT COUNT(*) total,
                  COUNT(*) FILTER (WHERE verification_status='verified') verified,
                  COUNT(*) FILTER (WHERE verification_status='unverified') unverified,
                  COUNT(*) FILTER (WHERE transaction_type='rent') rentals,
                  COUNT(*) FILTER (WHERE transaction_type='sale') sales
                  FROM properties WHERE is_active=true`),
      pool.query(`SELECT COUNT(*) total,
                  COUNT(*) FILTER (WHERE status='completed') completed,
                  COUNT(*) FILTER (WHERE status='interest_shown') active
                  FROM transactions`),
      pool.query(`SELECT COUNT(*) total,
                  COUNT(*) FILTER (WHERE status='submitted') pending
                  FROM verifications`),
    ]);
    res.json({
      success: true,
      data: {
        users: users.rows[0],
        properties: properties.rows[0],
        transactions: transactions.rows[0],
        verifications: verifications.rows[0],
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, user_type, search } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let i = 1;

    if (user_type) { conditions.push(`user_type = $${i++}`); params.push(user_type); }
    if (search)    { conditions.push(`(name ILIKE $${i} OR phone ILIKE $${i} OR email ILIKE $${i})`); params.push(`%${search}%`); i++; }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await pool.query(
      `SELECT id, phone, email, name, user_type, kyc_status, rating, is_active, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params);
    res.json({ success: true, data: rows, total: parseInt(count) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { is_active, kyc_status, user_type } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET
        is_active  = COALESCE($1, is_active),
        kyc_status = COALESCE($2, kyc_status),
        user_type  = COALESCE($3, user_type),
        updated_at = NOW()
       WHERE id = $4 RETURNING id, name, phone, user_type, kyc_status, is_active`,
      [is_active, kyc_status, user_type, req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PROPERTIES ───────────────────────────────────────────────────────────────
router.get('/properties', async (req, res) => {
  try {
    const { page = 1, limit = 20, verification_status, city, search } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let i = 1;

    if (verification_status) { conditions.push(`p.verification_status = $${i++}`); params.push(verification_status); }
    if (city)                { conditions.push(`p.city ILIKE $${i++}`); params.push(`%${city}%`); }
    if (search)              { conditions.push(`(p.title ILIKE $${i} OR p.locality ILIKE $${i})`); params.push(`%${search}%`); i++; }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await pool.query(
      `SELECT p.id, p.title, p.locality, p.city, p.bhk, p.transaction_type,
              p.rent_amount, p.sale_price, p.verification_status, p.is_active,
              p.photos, p.created_at, u.name AS owner_name, u.phone AS owner_phone
       FROM properties p JOIN users u ON p.owner_id = u.id
       ${where} ORDER BY p.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM properties p ${where}`, params
    );
    res.json({ success: true, data: rows, total: parseInt(count) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/properties/:id', async (req, res) => {
  try {
    const { verification_status, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE properties SET
        verification_status = COALESCE($1, verification_status),
        is_active           = COALESCE($2, is_active),
        verified_at         = CASE WHEN $1 = 'verified' THEN NOW() ELSE verified_at END,
        updated_at          = NOW()
       WHERE id = $3 RETURNING id, title, verification_status, is_active`,
      [verification_status, is_active, req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── VERIFICATIONS ────────────────────────────────────────────────────────────
router.get('/verifications', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const conditions = status ? [`v.status = $1`] : [];
    const params = status ? [status] : [];
    let i = params.length + 1;

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await pool.query(
      `SELECT v.id, v.status, v.scheduled_at, v.completed_at,
              p.title AS property_title, p.locality, p.city,
              u.name AS scout_name, u.phone AS scout_phone
       FROM verifications v
       JOIN properties p ON v.property_id = p.id
       LEFT JOIN users u ON v.scout_id = u.id
       ${where} ORDER BY v.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM verifications v ${where}`, params
    );
    res.json({ success: true, data: rows, total: parseInt(count) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const conditions = status ? [`t.status = $1`] : [];
    const params = status ? [status] : [];
    let i = params.length + 1;

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await pool.query(
      `SELECT t.id, t.status, t.transaction_type, t.agreed_rent, t.agreed_sale_price,
              t.keyturn_fee, t.created_at,
              p.title AS property_title, p.city,
              o.name AS owner_name, s.name AS seeker_name
       FROM transactions t
       JOIN properties p ON t.property_id = p.id
       JOIN users o ON t.owner_id = o.id
       JOIN users s ON t.seeker_id = s.id
       ${where} ORDER BY t.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM transactions t ${where}`, params
    );
    res.json({ success: true, data: rows, total: parseInt(count) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;