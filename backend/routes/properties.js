const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../config/s3');
const { v4: uuidv4 } = require('uuid');

// GET /api/v1/properties — list with filters
router.get('/', async (req, res) => {
  try {
    const { city, locality, transaction_type, property_type, bhk, min_rent, max_rent, min_price, max_price, furnished, verified_only, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = ['p.is_active = true'];
    const params = [];
    let i = 1;

    if (city)             { conditions.push(`p.city ILIKE $${i++}`);             params.push(`%${city}%`); }
    if (locality)         { conditions.push(`p.locality ILIKE $${i++}`);         params.push(`%${locality}%`); }
    if (transaction_type) { conditions.push(`p.transaction_type = $${i++}`);     params.push(transaction_type); }
    if (property_type)    { conditions.push(`p.property_type = $${i++}`);        params.push(property_type); }
    if (bhk)              { conditions.push(`p.bhk = $${i++}`);                  params.push(parseInt(bhk)); }
    if (min_rent)         { conditions.push(`p.rent_amount >= $${i++}`);          params.push(min_rent); }
    if (max_rent)         { conditions.push(`p.rent_amount <= $${i++}`);          params.push(max_rent); }
    if (min_price)        { conditions.push(`p.sale_price >= $${i++}`);           params.push(min_price); }
    if (max_price)        { conditions.push(`p.sale_price <= $${i++}`);           params.push(max_price); }
    if (furnished)        { conditions.push(`p.furnishing = $${i++}`);            params.push(furnished); }
    if (verified_only === 'true') { conditions.push(`p.verification_status = 'verified'`); }

    const where = conditions.join(' AND ');
    const query = `
      SELECT p.*, u.name AS owner_name, u.phone AS owner_phone,
             u.rating AS owner_rating
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      WHERE ${where}
      ORDER BY
        CASE WHEN p.verification_status = 'verified' THEN 0 ELSE 1 END,
        p.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const countQuery = `SELECT COUNT(*) FROM properties p WHERE ${where}`;
    const [{ rows }, { rows: countRows }] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    res.json({
      success: true,
      data: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countRows[0].count) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/properties/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.name AS owner_name, u.rating AS owner_rating,
             v.status AS verification_task_status, v.completed_at AS verified_date,
             v.actual_carpet_area, v.condition_rating, v.ownership_verified
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN verifications v ON v.property_id = p.id AND v.status = 'approved'
      WHERE p.id = $1
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Property not found' });

    // Increment view count
    pool.query('UPDATE properties SET views_count = views_count + 1 WHERE id = $1', [req.params.id]);

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/properties — create listing
router.post('/', authenticate, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const {
      title, description, property_type, transaction_type,
      address, locality, city, state, pincode,
      latitude, longitude,
      bhk, carpet_area_sqft, super_builtup_sqft,
      floor_number, total_floors, age_years, furnishing,
      rent_amount, deposit_amount, sale_price, maintenance_amount,
      available_from, amenities
    } = req.body;

    const id = uuidv4();
    const geoVal = latitude && longitude
      ? `ST_GeogFromText('SRID=4326;POINT(${longitude} ${latitude})')`
      : null;

    const query = `
      INSERT INTO properties (
        id, owner_id, title, description, property_type, transaction_type,
        address, locality, city, state, pincode,
        ${geoVal ? 'geo_location,' : ''}
        bhk, carpet_area_sqft, super_builtup_sqft,
        floor_number, total_floors, age_years, furnishing,
        rent_amount, deposit_amount, sale_price, maintenance_amount,
        available_from, amenities
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        ${geoVal ? `${geoVal},` : ''}
        $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *
    `;

    const params = [
      id, req.user.id, title, description, property_type, transaction_type,
      address, locality, city, state, pincode,
      bhk, carpet_area_sqft, super_builtup_sqft,
      floor_number, total_floors, age_years, furnishing,
      rent_amount, deposit_amount, sale_price, maintenance_amount,
      available_from, JSON.stringify(amenities || [])
    ];

    const { rows } = await pool.query(query, params);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/properties/:id/photos — upload photos
router.post('/:id/photos', authenticate, (req, res, next) => {
  req.uploadFolder = `properties/${req.params.id}`;
  next();
}, upload.array('photos', 20), async (req, res) => {
  try {
    const urls = req.files.map(f => f.location);
    const { rows } = await pool.query(
      `UPDATE properties SET photos = photos || $1::jsonb WHERE id = $2 AND owner_id = $3 RETURNING photos`,
      [JSON.stringify(urls), req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, photos: rows[0].photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/properties/:id/verify-request — request verification
router.post('/:id/verify-request', authenticate, requireRole('owner'), async (req, res) => {
  try {
    const prop = await pool.query('SELECT * FROM properties WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
    if (!prop.rows.length) return res.status(404).json({ success: false, message: 'Property not found' });

    const existing = await pool.query(
      `SELECT id FROM verifications WHERE property_id = $1 AND status NOT IN ('rejected')`,
      [req.params.id]
    );
    if (existing.rows.length) return res.status(400).json({ success: false, message: 'Verification already in progress or completed' });

    const verif = await pool.query(
      `INSERT INTO verifications (id, property_id, status) VALUES ($1, $2, 'assigned') RETURNING id`,
      [uuidv4(), req.params.id]
    );

    await pool.query(`UPDATE properties SET verification_status = 'pending' WHERE id = $1`, [req.params.id]);

    res.json({ success: true, message: 'Verification requested. A scout will visit within 24-48 hours.', verificationId: verif.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/properties/owner/my-listings
router.get('/owner/my-listings', authenticate, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM properties WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/properties/:id — update
router.put('/:id', authenticate, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const fields = ['title','description','rent_amount','deposit_amount','sale_price','furnishing','available_from','amenities'];
    const updates = [];
    const params = [];
    let i = 1;
    fields.forEach(f => {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }
    });
    if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    params.push(req.params.id, req.user.id);
    const { rows } = await pool.query(
      `UPDATE properties SET ${updates.join(', ')} WHERE id = $${i++} AND owner_id = $${i++} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/properties/:id
router.delete('/:id', authenticate, requireRole('owner', 'admin'), async (req, res) => {
  try {
    await pool.query('UPDATE properties SET is_active = false WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Listing removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
