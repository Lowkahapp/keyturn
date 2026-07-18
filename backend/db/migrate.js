require('dotenv').config();
const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = await pool.connect();
  try {
    // Run main schema (idempotent)
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Schema applied');

    // Column migrations — safe to re-run
    await client.query(`
      DO $$ BEGIN
        -- Replace geo_location with plain lat/lng if needed
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='properties' AND column_name='geo_location'
        ) THEN
          ALTER TABLE properties DROP COLUMN geo_location;
          RAISE NOTICE 'Dropped geo_location column';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='properties' AND column_name='latitude'
        ) THEN
          ALTER TABLE properties ADD COLUMN latitude DECIMAL(10,8);
          ALTER TABLE properties ADD COLUMN longitude DECIMAL(11,8);
          RAISE NOTICE 'Added latitude/longitude columns';
        END IF;
      END $$;
    `);
    console.log('✅ Column migrations applied');
    console.log('✅ Migration complete');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();