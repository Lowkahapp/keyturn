const router = require('express').Router();
const { pool } = require('../config/db');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
// const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// In-memory OTP store (use Redis in production)
const otpCache = new Map();

// POST /api/v1/auth/otp/send
router.post('/otp/send', async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

    // Normalize: strip spaces, ensure +91 prefix
    phone = phone.replace(/\s/g, '');
    if (/^[6-9]\d{9}$/.test(phone)) phone = '+91' + phone;
    if (!/^\+91[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    // Fixed OTP for specific demo tester
    const DEMO_PHONE = '+919833279693';
    const otp = (phone === DEMO_PHONE && process.env.DEMO_OTP)
      ? process.env.DEMO_OTP
      : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpCache.set(phone, { otp, expiresAt, attempts: 0 });

    // In production: send via Twilio
    // await twilio.messages.create({ body: `Your KeyTurn OTP is ${otp}`, from: process.env.TWILIO_PHONE_NUMBER, to: phone });

    console.log(`[DEV] OTP for ${phone}: ${otp}`);

    res.json({ success: true, message: 'OTP sent successfully', expiresIn: 300 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/auth/otp/verify
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp, name, user_type = 'seeker' } = req.body;

    const cached = otpCache.get(phone);
    if (!cached) return res.status(400).json({ success: false, message: 'OTP not sent or expired' });
    if (Date.now() > cached.expiresAt) return res.status(400).json({ success: false, message: 'OTP expired' });
    if (cached.attempts >= 3) return res.status(429).json({ success: false, message: 'Too many attempts' });

    if (cached.otp !== otp) {
      cached.attempts++;
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    otpCache.delete(phone);

    // Upsert user
    let user;
    const existing = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);

    if (existing.rows.length) {
      user = existing.rows[0];
    } else {
      const result = await pool.query(
        'INSERT INTO users (id, phone, name, user_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [uuidv4(), phone, name || null, user_type]
      );
      user = result.rows[0];
    }

    const token = jwt.sign({ userId: user.id, userType: user.user_type }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, phone: user.phone, name: user.name, user_type: user.user_type, kyc_status: user.kyc_status }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/auth/me
const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/v1/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const { rows } = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING id, phone, name, email, user_type',
      [name, email, req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;