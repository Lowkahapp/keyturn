const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/v1/payments/create-order — generic payment order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount, purpose, reference_id } = req.body;

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency: 'INR',
      receipt:  reference_id || uuidv4(),
      notes:    { purpose, reference_id, user_id: req.user.id }
    });

    const paymentId = uuidv4();
    await pool.query(`
      INSERT INTO payments (id, user_id, purpose, reference_id, amount, razorpay_order_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [paymentId, req.user.id, purpose, reference_id, amount, order.id]);

    res.json({ success: true, order: { id: order.id, amount: order.amount, currency: order.currency, paymentId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/payments/verify — verify and record payment
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const { rows } = await pool.query(`
      UPDATE payments
      SET status = 'captured', razorpay_payment_id = $1, razorpay_signature = $2
      WHERE razorpay_order_id = $3 AND user_id = $4
      RETURNING *
    `, [razorpay_payment_id, razorpay_signature, razorpay_order_id, req.user.id]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Payment record not found' });

    const payment = rows[0];

    // Handle post-payment actions based on purpose
    if (payment.purpose === 'verification_fee') {
      await pool.query(`UPDATE verifications SET fee_paid = true WHERE id = $1`, [payment.reference_id]);
    }

    res.json({ success: true, payment: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/payments/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
