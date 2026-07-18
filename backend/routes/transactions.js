const router = require('express').Router();
const { pool, withTransaction } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/v1/transactions/initiate — seeker shows interest
router.post('/initiate', authenticate, requireRole('seeker'), async (req, res) => {
  try {
    const { property_id } = req.body;
    const prop = await pool.query('SELECT * FROM properties WHERE id = $1 AND is_active = true', [property_id]);
    if (!prop.rows.length) return res.status(404).json({ success: false, message: 'Property not found' });

    // Check no active transaction exists
    const existing = await pool.query(
      `SELECT id FROM transactions WHERE property_id = $1 AND seeker_id = $2 AND status NOT IN ('cancelled','completed')`,
      [property_id, req.user.id]
    );
    if (existing.rows.length) return res.status(400).json({ success: false, message: 'You already have an active interest on this property' });

    const p = prop.rows[0];
    const keyturnFee = p.transaction_type === 'rent'
      ? (p.rent_amount * 12 * 0.005)
      : (p.sale_price * 0.01);

    const { rows } = await pool.query(`
      INSERT INTO transactions (id, property_id, owner_id, seeker_id, transaction_type, status, keyturn_fee)
      VALUES ($1, $2, $3, $4, $5, 'interest_shown', $6) RETURNING *
    `, [uuidv4(), property_id, p.owner_id, req.user.id, p.transaction_type, keyturnFee]);

    // Auto-create chat room
    await pool.query(
      `INSERT INTO chat_rooms (id, property_id, owner_id, seeker_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [uuidv4(), property_id, p.owner_id, req.user.id]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/transactions — user's transactions
router.get('/', authenticate, async (req, res) => {
  try {
    const isOwner = req.user.user_type === 'owner';
    const condition = isOwner ? 'owner_id' : 'seeker_id';
    const { rows } = await pool.query(`
      SELECT t.*, p.title, p.address, p.locality, p.city, p.photos,
             p.bhk, p.property_type, p.rent_amount, p.sale_price,
             o.name AS owner_name, s.name AS seeker_name
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      JOIN users o ON t.owner_id = o.id
      JOIN users s ON t.seeker_id = s.id
      WHERE t.${condition} = $1
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/transactions/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, p.title, p.address, p.photos, p.amenities,
             o.name AS owner_name, o.phone AS owner_phone,
             s.name AS seeker_name, s.phone AS seeker_phone
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      JOIN users o ON t.owner_id = o.id
      JOIN users s ON t.seeker_id = s.id
      WHERE t.id = $1 AND (t.owner_id = $2 OR t.seeker_id = $2)
    `, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/transactions/:id/agree — both parties agree on terms
router.put('/:id/agree', authenticate, async (req, res) => {
  try {
    const { agreed_rent, agreed_sale_price, security_deposit, lock_in_period_months } = req.body;
    const { rows } = await pool.query(`
      UPDATE transactions SET
        status = 'agreed',
        agreed_rent = $1, agreed_sale_price = $2,
        security_deposit = $3, lock_in_period_months = $4
      WHERE id = $5 AND (owner_id = $6 OR seeker_id = $6) AND status IN ('interest_shown','negotiating')
      RETURNING *
    `, [agreed_rent, agreed_sale_price, security_deposit, lock_in_period_months, req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/transactions/:id/escrow/initiate — create Razorpay order for escrow
router.post('/:id/escrow/initiate', authenticate, requireRole('seeker'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND seeker_id = $2 AND status = \'agreed\'',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Transaction not found or not in agreed state' });

    const tx = rows[0];
    const escrowAmount = tx.transaction_type === 'rent'
      ? (tx.agreed_rent + tx.security_deposit) * 100 // paise
      : tx.agreed_sale_price * 0.1 * 100; // 10% token for sale

    const order = await razorpay.orders.create({
      amount:   escrowAmount,
      currency: 'INR',
      receipt:  tx.id,
      notes:    { purpose: 'escrow_deposit', transaction_id: tx.id }
    });

    await pool.query(`
      INSERT INTO escrow_accounts (id, transaction_id, amount, razorpay_order_id)
      VALUES ($1, $2, $3, $4)
    `, [uuidv4(), tx.id, escrowAmount / 100, order.id]);

    await pool.query(`UPDATE transactions SET status = 'escrow_initiated' WHERE id = $1`, [tx.id]);

    res.json({ success: true, order: { id: order.id, amount: order.amount, currency: order.currency } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/transactions/:id/escrow/confirm — verify Razorpay payment
router.post('/:id/escrow/confirm', authenticate, requireRole('seeker'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    await pool.query(`
      UPDATE escrow_accounts SET status = 'funded', razorpay_payment_id = $1, funded_at = NOW()
      WHERE razorpay_order_id = $2
    `, [razorpay_payment_id, razorpay_order_id]);

    await pool.query(`UPDATE transactions SET status = 'escrow_funded' WHERE id = $1`, [req.params.id]);

    res.json({ success: true, message: 'Escrow funded. Agreement will be generated now.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/transactions/:id/handover/confirm
router.post('/:id/handover/confirm', authenticate, async (req, res) => {
  try {
    const { photos } = req.body;
    const isOwner = req.user.user_type === 'owner';
    const field = isOwner ? 'handover_confirmed_owner' : 'handover_confirmed_seeker';

    await pool.query(`UPDATE transactions SET ${field} = true, handover_photos = $1 WHERE id = $2`, [JSON.stringify(photos || []), req.params.id]);

    // Check if both confirmed
    const { rows } = await pool.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    const tx = rows[0];

    if (tx.handover_confirmed_owner && tx.handover_confirmed_seeker) {
      await pool.query(`UPDATE transactions SET status = 'completed', completed_at = NOW() WHERE id = $1`, [tx.id]);
      // Mark property as rented/sold
      await pool.query(`UPDATE properties SET is_active = false WHERE id = $1`, [tx.property_id]);
      // Release escrow (in production: trigger bank transfer)
      await pool.query(`UPDATE escrow_accounts SET status = 'released_to_owner', released_at = NOW() WHERE transaction_id = $1`, [tx.id]);
    }

    res.json({ success: true, message: 'Handover confirmed', bothConfirmed: tx.handover_confirmed_owner && tx.handover_confirmed_seeker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/transactions/:id/cancel
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { cancellation_reason } = req.body;
    const { rows } = await pool.query(`
      UPDATE transactions SET status = 'cancelled', cancellation_reason = $1
      WHERE id = $2 AND (owner_id = $3 OR seeker_id = $3) AND status NOT IN ('completed','cancelled')
      RETURNING *
    `, [cancellation_reason, req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
