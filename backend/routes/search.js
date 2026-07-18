const router = require('express').Router();
const { pool } = require('../config/db');

// GET /api/v1/search?q=koramangala&city=Bangalore&...
router.get('/', async (req, res) => {
  try {
    const {
      q, city, transaction_type, property_type, bhk,
      min_budget, max_budget, furnished, verified_only,
      lat, lng, radius_km = 5,
      sort = 'relevance', page = 1, limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['p.is_active = true'];
    const params = [];
    let i = 1;

    // Full-text search
    if (q) {
      conditions.push(`(p.title ILIKE $${i} OR p.locality ILIKE $${i} OR p.address ILIKE $${i} OR p.description ILIKE $${i})`);
      params.push(`%${q}%`); i++;
    }
    if (city)             { conditions.push(`p.city ILIKE $${i++}`);          params.push(`%${city}%`); }
    if (transaction_type) { conditions.push(`p.transaction_type = $${i++}`);  params.push(transaction_type); }
    if (property_type)    { conditions.push(`p.property_type = $${i++}`);     params.push(property_type); }
    if (bhk)              { conditions.push(`p.bhk = $${i++}`);               params.push(parseInt(bhk)); }
    if (furnished)        { conditions.push(`p.furnishing = $${i++}`);         params.push(furnished); }
    if (verified_only === 'true') { conditions.push(`p.verification_status = 'verified'`); }

    if (transaction_type === 'rent' || !transaction_type) {
      if (min_budget) { conditions.push(`p.rent_amount >= $${i++}`); params.push(min_budget); }
      if (max_budget) { conditions.push(`p.rent_amount <= $${i++}`); params.push(max_budget); }
    }
    if (transaction_type === 'sale') {
      if (min_budget) { conditions.push(`p.sale_price >= $${i++}`); params.push(min_budget); }
      if (max_budget) { conditions.push(`p.sale_price <= $${i++}`); params.push(max_budget); }
    }

    // Geo proximity filter (simple bounding box, no PostGIS needed)
    let distanceSelect = '';
    if (lat && lng) {
      const r = parseFloat(radius_km) || 5;
      const latDelta = r / 111;
      const lngDelta = r / (111 * Math.cos(parseFloat(lat) * Math.PI / 180));
      conditions.push(`p.latitude BETWEEN $${i} AND $${i+1}`);
      conditions.push(`p.longitude BETWEEN $${i+2} AND $${i+3}`);
      params.push(parseFloat(lat) - latDelta, parseFloat(lat) + latDelta,
                  parseFloat(lng) - lngDelta, parseFloat(lng) + lngDelta);
      i += 4;
    }

    const sortMap = {
      relevance:  'CASE WHEN p.verification_status = \'verified\' THEN 0 ELSE 1 END, p.created_at DESC',
      price_asc:  'COALESCE(p.rent_amount, p.sale_price) ASC',
      price_desc: 'COALESCE(p.rent_amount, p.sale_price) DESC',
      newest:     'p.created_at DESC',
      distance:   'p.created_at DESC'
    };

    const where = conditions.join(' AND ');
    const query = `
      SELECT p.id, p.title, p.property_type, p.transaction_type,
             p.locality, p.city, p.bhk, p.carpet_area_sqft,
             p.floor_number, p.furnishing, p.rent_amount, p.sale_price,
             p.deposit_amount, p.photos, p.verification_status,
             p.available_from, p.created_at,
             u.name AS owner_name, u.rating AS owner_rating
             ${distanceSelect}
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      WHERE ${where}
      ORDER BY ${sortMap[sort] || sortMap.relevance}
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
      query: q || '',
      data: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countRows[0].count) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/search/suggestions?q=kora
router.get('/suggestions', async (req, res) => {
  try {
    const { q, city } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });

    const { rows } = await pool.query(`
      SELECT DISTINCT locality, city, COUNT(*) AS listing_count
      FROM properties
      WHERE is_active = true
        AND (locality ILIKE $1 OR city ILIKE $1)
        ${city ? 'AND city ILIKE $2' : ''}
      GROUP BY locality, city
      ORDER BY listing_count DESC
      LIMIT 8
    `, city ? [`%${q}%`, `%${city}%`] : [`%${q}%`]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;