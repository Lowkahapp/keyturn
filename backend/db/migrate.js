require('dotenv').config();
const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Run main schema
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Schema applied');

    // Drop geo_location if exists, add lat/lng columns
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='properties' AND column_name='geo_location'
        ) THEN
          ALTER TABLE properties DROP COLUMN geo_location;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='properties' AND column_name='latitude'
        ) THEN
          ALTER TABLE properties ADD COLUMN latitude DECIMAL(10,8);
          ALTER TABLE properties ADD COLUMN longitude DECIMAL(11,8);
        END IF;
      END $$;
    `);
    console.log('✅ Column migrations applied');

    // Clear and re-seed properties to pick up photo changes
    await client.query('DELETE FROM properties');
    const { seed } = require('./seed');
    await seed(client);

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };