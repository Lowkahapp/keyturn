require('dotenv').config();
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── USERS ───────────────────────────────────────────────────────────────

    const adminId = uuidv4();
    await client.query(`
      INSERT INTO users (id, phone, name, user_type, kyc_status)
      VALUES ($1, '+919999999999', 'Admin User', 'admin', 'verified')
      ON CONFLICT (phone) DO NOTHING
    `, [adminId]);

    const scoutId = uuidv4();
    await client.query(`
      INSERT INTO users (id, phone, name, user_type, kyc_status)
      VALUES ($1, '+919888888888', 'Ravi Scout', 'scout', 'verified')
      ON CONFLICT (phone) DO NOTHING
    `, [scoutId]);

    // Multiple owners across cities
    const owners = [
      { id: uuidv4(), phone: '+919777777777', name: 'Anitha Kumar',   email: 'anitha@example.com'   },
      { id: uuidv4(), phone: '+919666666666', name: 'Suresh Reddy',   email: 'suresh@example.com'   },
      { id: uuidv4(), phone: '+919555555555', name: 'Priya Sharma',   email: 'priya@example.com'    },
      { id: uuidv4(), phone: '+919444444444', name: 'Mohammed Farhan',email: 'farhan@example.com'   },
      { id: uuidv4(), phone: '+919333333333', name: 'Deepa Nair',     email: 'deepa@example.com'    },
    ];

    for (const o of owners) {
      await client.query(`
        INSERT INTO users (id, phone, name, user_type, kyc_status, email)
        VALUES ($1,$2,$3,'owner','verified',$4)
        ON CONFLICT (phone) DO NOTHING
      `, [o.id, o.phone, o.name, o.email]);
    }

    // ─── BANGALORE RENTALS ───────────────────────────────────────────────────

    const bangaloreRentals = [
      { bhk:2, locality:'Koramangala',     rent:35000, deposit:70000,  furnishing:'fully_furnished', area:950,  floor:4, amenities:'["lift","gym","security","parking","power_backup"]', pincode:'560034' },
      { bhk:1, locality:'HSR Layout',      rent:18000, deposit:36000,  furnishing:'semi_furnished',  area:550,  floor:2, amenities:'["security","parking","power_backup"]',              pincode:'560102' },
      { bhk:3, locality:'Whitefield',      rent:42000, deposit:84000,  furnishing:'unfurnished',     area:1400, floor:6, amenities:'["lift","gym","security","parking","pool"]',          pincode:'560066' },
      { bhk:2, locality:'Indiranagar',     rent:38000, deposit:76000,  furnishing:'fully_furnished', area:1000, floor:3, amenities:'["lift","security","parking","power_backup"]',        pincode:'560038' },
      { bhk:1, locality:'BTM Layout',      rent:14000, deposit:28000,  furnishing:'semi_furnished',  area:480,  floor:1, amenities:'["security","power_backup"]',                         pincode:'560076' },
      { bhk:2, locality:'Jayanagar',       rent:28000, deposit:56000,  furnishing:'semi_furnished',  area:900,  floor:3, amenities:'["lift","security","parking"]',                      pincode:'560041' },
      { bhk:3, locality:'Electronic City', rent:32000, deposit:64000,  furnishing:'unfurnished',     area:1350, floor:5, amenities:'["lift","gym","security","parking","clubhouse"]',    pincode:'560100' },
      { bhk:2, locality:'Marathahalli',    rent:24000, deposit:48000,  furnishing:'semi_furnished',  area:850,  floor:2, amenities:'["security","parking","power_backup"]',              pincode:'560037' },
      { bhk:4, locality:'Sadashivanagar',  rent:75000, deposit:150000, furnishing:'fully_furnished', area:2200, floor:1, amenities:'["garden","security","parking","power_backup"]',     pincode:'560080' },
      { bhk:1, locality:'Rajajinagar',     rent:16000, deposit:32000,  furnishing:'unfurnished',     area:500,  floor:2, amenities:'["security","power_backup"]',                         pincode:'560010' },
    ];

    for (const p of bangaloreRentals) {
      const owner = owners[Math.floor(Math.random() * owners.length)];
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, rent_amount, deposit_amount,
          verification_status, amenities, available_from)
        VALUES ($1,$2,$3,'apartment','rent',$4,$5,'Bangalore','Karnataka',$6,$7,$8,$9,10,$10,$11,$12,'verified',$13::jsonb, NOW() + INTERVAL '7 days')
        ON CONFLICT DO NOTHING
      `, [
        uuidv4(), owner.id,
        `${p.bhk}BHK ${p.furnishing.replace(/_/g,' ')} in ${p.locality}`,
        `${p.area}, ${p.locality} Main Road, ${p.locality}, Bangalore`,
        p.locality, p.pincode, p.bhk, p.area, p.floor,
        p.furnishing, p.rent, p.deposit, p.amenities
      ]);
    }

    // ─── BANGALORE SALE PROPERTIES ───────────────────────────────────────────

    const bangaloreSales = [
      { bhk:2, locality:'JP Nagar',       price:6500000,  area:1050, furnishing:'unfurnished',    amenities:'["lift","security","parking","gym"]',          pincode:'560078' },
      { bhk:3, locality:'Hebbal',         price:9800000,  area:1500, furnishing:'semi_furnished', amenities:'["lift","gym","pool","security","parking"]',   pincode:'560024' },
      { bhk:2, locality:'Sarjapur Road',  price:7200000,  area:1100, furnishing:'unfurnished',    amenities:'["lift","security","parking","power_backup"]', pincode:'560035' },
      { bhk:4, locality:'Bannerghatta Road', price:14500000, area:2400, furnishing:'fully_furnished', amenities:'["lift","gym","pool","security","parking","clubhouse"]', pincode:'560083' },
      { bhk:1, locality:'Yelahanka',      price:3800000,  area:580,  furnishing:'unfurnished',    amenities:'["security","parking"]',                       pincode:'560064' },
    ];

    for (const p of bangaloreSales) {
      const owner = owners[Math.floor(Math.random() * owners.length)];
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, sale_price,
          verification_status, amenities)
        VALUES ($1,$2,$3,'apartment','sale',$4,$5,'Bangalore','Karnataka',$6,$7,$8,$9,12,$10,$11,'verified',$12::jsonb)
        ON CONFLICT DO NOTHING
      `, [
        uuidv4(), owner.id,
        `${p.bhk}BHK Apartment for Sale in ${p.locality}`,
        `${p.area}, ${p.locality}, Bangalore`,
        p.locality, p.pincode, p.bhk, p.area,
        Math.floor(Math.random() * 8) + 1,
        p.furnishing, p.price, p.amenities
      ]);
    }

    // ─── MUMBAI RENTALS ──────────────────────────────────────────────────────

    const mumbaiRentals = [
      { bhk:1, locality:'Andheri West',  rent:45000, deposit:90000,  furnishing:'fully_furnished', area:550,  pincode:'400058' },
      { bhk:2, locality:'Powai',         rent:65000, deposit:130000, furnishing:'semi_furnished',  area:950,  pincode:'400076' },
      { bhk:1, locality:'Malad West',    rent:32000, deposit:64000,  furnishing:'semi_furnished',  area:480,  pincode:'400064' },
      { bhk:3, locality:'Bandra West',   rent:120000,deposit:240000, furnishing:'fully_furnished', area:1500, pincode:'400050' },
      { bhk:2, locality:'Thane West',    rent:38000, deposit:76000,  furnishing:'unfurnished',     area:850,  pincode:'400601' },
      { bhk:1, locality:'Borivali East', rent:28000, deposit:56000,  furnishing:'semi_furnished',  area:500,  pincode:'400066' },
    ];

    for (const p of mumbaiRentals) {
      const owner = owners[Math.floor(Math.random() * owners.length)];
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, rent_amount, deposit_amount,
          verification_status, amenities, available_from)
        VALUES ($1,$2,$3,'apartment','rent',$4,$5,'Mumbai','Maharashtra',$6,$7,$8,$9,15,$10,$11,$12,'verified','["lift","security","parking","power_backup"]'::jsonb, NOW() + INTERVAL '14 days')
        ON CONFLICT DO NOTHING
      `, [
        uuidv4(), owner.id,
        `${p.bhk}BHK in ${p.locality}`,
        `${p.area}, ${p.locality}, Mumbai`,
        p.locality, p.pincode, p.bhk, p.area,
        Math.floor(Math.random() * 12) + 1,
        p.furnishing, p.rent, p.deposit
      ]);
    }

    // ─── HYDERABAD RENTALS ───────────────────────────────────────────────────

    const hyderabadRentals = [
      { bhk:2, locality:'Gachibowli',     rent:28000, deposit:56000,  furnishing:'semi_furnished',  area:950,  pincode:'500032' },
      { bhk:3, locality:'Hitech City',    rent:45000, deposit:90000,  furnishing:'fully_furnished', area:1400, pincode:'500081' },
      { bhk:1, locality:'Madhapur',       rent:18000, deposit:36000,  furnishing:'semi_furnished',  area:550,  pincode:'500081' },
      { bhk:2, locality:'Kondapur',       rent:24000, deposit:48000,  furnishing:'unfurnished',     area:900,  pincode:'500084' },
      { bhk:3, locality:'Jubilee Hills',  rent:55000, deposit:110000, furnishing:'fully_furnished', area:1800, pincode:'500033' },
      { bhk:2, locality:'Banjara Hills',  rent:40000, deposit:80000,  furnishing:'semi_furnished',  area:1100, pincode:'500034' },
    ];

    for (const p of hyderabadRentals) {
      const owner = owners[Math.floor(Math.random() * owners.length)];
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, rent_amount, deposit_amount,
          verification_status, amenities, available_from)
        VALUES ($1,$2,$3,'apartment','rent',$4,$5,'Hyderabad','Telangana',$6,$7,$8,$9,12,$10,$11,$12,'verified','["lift","gym","security","parking","power_backup"]'::jsonb, NOW() + INTERVAL '10 days')
        ON CONFLICT DO NOTHING
      `, [
        uuidv4(), owner.id,
        `${p.bhk}BHK in ${p.locality}`,
        `${p.area}, ${p.locality}, Hyderabad`,
        p.locality, p.pincode, p.bhk, p.area,
        Math.floor(Math.random() * 10) + 1,
        p.furnishing, p.rent, p.deposit
      ]);
    }

    // ─── PUNE RENTALS ────────────────────────────────────────────────────────

    const puneRentals = [
      { bhk:2, locality:'Kothrud',       rent:22000, deposit:44000, furnishing:'semi_furnished',  area:900,  pincode:'411038' },
      { bhk:1, locality:'Wakad',         rent:14000, deposit:28000, furnishing:'unfurnished',     area:500,  pincode:'411057' },
      { bhk:3, locality:'Kalyani Nagar', rent:38000, deposit:76000, furnishing:'fully_furnished', area:1500, pincode:'411006' },
      { bhk:2, locality:'Hinjewadi',     rent:20000, deposit:40000, furnishing:'semi_furnished',  area:850,  pincode:'411057' },
    ];

    for (const p of puneRentals) {
      const owner = owners[Math.floor(Math.random() * owners.length)];
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, rent_amount, deposit_amount,
          verification_status, amenities, available_from)
        VALUES ($1,$2,$3,'apartment','rent',$4,$5,'Pune','Maharashtra',$6,$7,$8,$9,10,$10,$11,$12,'verified','["lift","security","parking","power_backup"]'::jsonb, NOW() + INTERVAL '5 days')
        ON CONFLICT DO NOTHING
      `, [
        uuidv4(), owner.id,
        `${p.bhk}BHK in ${p.locality}`,
        `${p.area}, ${p.locality}, Pune`,
        p.locality, p.pincode, p.bhk, p.area,
        Math.floor(Math.random() * 8) + 1,
        p.furnishing, p.rent, p.deposit
      ]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete — 31 properties across Bangalore, Mumbai, Hyderabad & Pune');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();