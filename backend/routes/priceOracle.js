const router = require('express').Router();
const { pool } = require('../config/db');

// Rule-based price estimator (replace with ML model in Phase 2)
const estimatePrice = ({ city, locality, bhk, carpet_area_sqft, furnishing, floor_number, age_years }) => {
  // Base price per sqft by city (rent/month)
  const baseRentPerSqft = {
    'Bangalore': { 'Koramangala': 65, 'HSR Layout': 60, 'Whitefield': 50, 'Indiranagar': 70, 'default': 45 },
    'Hyderabad': { 'Banjara Hills': 55, 'Madhapur': 50, 'Gachibowli': 48, 'default': 35 },
    'Pune':      { 'Koregaon Park': 52, 'Viman Nagar': 45, 'Hinjewadi': 40, 'default': 32 },
    'default':   { 'default': 30 }
  };

  const baseSalePricePerSqft = {
    'Bangalore': { 'Koramangala': 12000, 'HSR Layout': 10000, 'Whitefield': 8000, 'Indiranagar': 13000, 'default': 7000 },
    'Hyderabad': { 'Banjara Hills': 10000, 'Madhapur': 9000, 'Gachibowli': 8500, 'default': 6000 },
    'Pune':      { 'Koregaon Park': 9000, 'Viman Nagar': 7500, 'Hinjewadi': 6500, 'default': 5500 },
    'default':   { 'default': 5000 }
  };

  const cityRent = baseRentPerSqft[city] || baseRentPerSqft['default'];
  const localityRentRate = cityRent[locality] || cityRent['default'];

  const citySale = baseSalePricePerSqft[city] || baseSalePricePerSqft['default'];
  const localitySaleRate = citySale[locality] || citySale['default'];

  let baseRent = (carpet_area_sqft || bhk * 350) * localityRentRate;
  let baseSale = (carpet_area_sqft || bhk * 350) * localitySaleRate;

  // Furnishing multiplier
  const furnishMultiplier = { 'fully_furnished': 1.3, 'semi_furnished': 1.15, 'unfurnished': 1.0 };
  const fm = furnishMultiplier[furnishing] || 1.0;
  baseRent *= fm;

  // Floor premium (above 3rd floor in buildings with lift)
  const floorPremium = floor_number > 3 ? 1.05 : 1.0;
  baseRent *= floorPremium;
  baseSale *= floorPremium;

  // Age depreciation (for sale price)
  const ageFactor = Math.max(0.7, 1 - (age_years || 0) * 0.01);
  baseSale *= ageFactor;

  const confidence = carpet_area_sqft ? 0.75 : 0.55;

  return {
    estimated_rent:      Math.round(baseRent / 500) * 500,
    estimated_sale:      Math.round(baseSale / 100000) * 100000,
    price_per_sqft_rent: Math.round(localityRentRate * fm * floorPremium),
    price_per_sqft_sale: Math.round(localitySaleRate * floorPremium * ageFactor),
    confidence_score:    confidence,
    factors: {
      location_premium: localityRentRate > (cityRent['default'] || 30) ? 'above_average' : 'average',
      furnishing_impact: fm > 1 ? `+${Math.round((fm - 1) * 100)}%` : 'none',
      floor_impact:      floorPremium > 1 ? '+5%' : 'none',
      age_impact:        ageFactor < 1 ? `-${Math.round((1 - ageFactor) * 100)}%` : 'none'
    },
    model_version: 'rule_v1',
    disclaimer: 'Estimate based on micro-market data. Actual prices may vary ±20%.'
  };
};

// GET /api/v1/price-oracle/estimate?city=Bangalore&locality=Koramangala&bhk=2&carpet_area_sqft=900
router.get('/estimate', async (req, res) => {
  try {
    const { property_id, city, locality, bhk, carpet_area_sqft, furnishing, floor_number, age_years } = req.query;

    let params = { city, locality, bhk: parseInt(bhk), carpet_area_sqft: parseInt(carpet_area_sqft), furnishing, floor_number: parseInt(floor_number), age_years: parseInt(age_years) };

    if (property_id) {
      const { rows } = await pool.query('SELECT * FROM properties WHERE id = $1', [property_id]);
      if (rows.length) {
        const p = rows[0];
        params = { city: p.city, locality: p.locality, bhk: p.bhk, carpet_area_sqft: p.carpet_area_sqft, furnishing: p.furnishing, floor_number: p.floor_number, age_years: p.age_years };
      }
    }

    const estimate = estimatePrice(params);
    res.json({ success: true, data: estimate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/price-oracle/trends?locality=Koramangala&city=Bangalore
router.get('/trends', async (req, res) => {
  try {
    const { locality, city } = req.query;

    const { rows } = await pool.query(`
      SELECT
        DATE_TRUNC('month', created_at) AS month,
        AVG(rent_amount) AS avg_rent,
        AVG(sale_price) AS avg_sale_price,
        COUNT(*) AS listing_count
      FROM properties
      WHERE is_active = true
        AND city ILIKE $1
        ${locality ? 'AND locality ILIKE $2' : ''}
        AND created_at > NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `, locality ? [`%${city}%`, `%${locality}%`] : [`%${city}%`]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
