require('dotenv').config();
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed admin user
    const adminId = uuidv4();
    await client.query(`
      INSERT INTO users (id, phone, name, user_type, kyc_status)
      VALUES ($1, '+919999999999', 'Admin User', 'admin', 'verified')
      ON CONFLICT (phone) DO NOTHING
    `, [adminId]);

    // Seed sample scout
    const scoutId = uuidv4();
    await client.query(`
      INSERT INTO users (id, phone, name, user_type, kyc_status)
      VALUES ($1, '+919888888888', 'Ravi Scout', 'scout', 'verified')
      ON CONFLICT (phone) DO NOTHING
    `, [scoutId]);

    // Seed sample owner
    const ownerId = uuidv4();
    await client.query(`
      INSERT INTO users (id, phone, name, user_type, kyc_status, email)
      VALUES ($1, '+919777777777', 'Anitha Kumar', 'owner', 'verified', 'anitha@example.com')
      ON CONFLICT (phone) DO NOTHING
    `, [ownerId]);

    // Seed sample properties in Bangalore
    const properties = [
      { bhk: 2, locality: 'Koramangala', rent: 35000, deposit: 70000, furnishing: 'fully_furnished' },
      { bhk: 1, locality: 'HSR Layout', rent: 18000, deposit: 36000, furnishing: 'semi_furnished' },
      { bhk: 3, locality: 'Whitefield', rent: 42000, deposit: 84000, furnishing: 'unfurnished' },
      { bhk: 2, locality: 'Indiranagar', rent: 38000, deposit: 76000, furnishing: 'fully_furnished' },
    ];

    for (const p of properties) {
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, rent_amount, deposit_amount,
          verification_status, amenities)
        VALUES ($1,$2,$3,'apartment','rent',$4,$5,'Bangalore','Karnataka','560034',$6,$7,$8,10,$9,$10,$11,'verified','["lift","gym","security","parking"]')
      `, [
        uuidv4(), ownerId,
        `${p.bhk}BHK Apartment in ${p.locality}`,
        `${p.bhk*400 + 500}, ${p.locality} Main Road, ${p.locality}, Bangalore`,
        p.locality, p.bhk, p.bhk * 400 + 300,
        Math.floor(Math.random() * 8) + 1,
        p.furnishing, p.rent, p.deposit
      ]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed data inserted');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
