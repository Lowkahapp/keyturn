const { v4: uuidv4 } = require('uuid');

// Varied apartment photos from Unsplash (free, no auth)
const photoSets = [
  ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
  ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800','https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'],
  ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800','https://images.unsplash.com/photo-1615873968403-89e068629265?w=800','https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800'],
  ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800','https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
  ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800','https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800','https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800'],
  ['https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=800','https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800','https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800'],
  ['https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800','https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800'],
  ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800','https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800','https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800'],
];
let photoIdx = 0;
const nextPhotos = () => JSON.stringify(photoSets[photoIdx++ % photoSets.length]);

const seed = async (client) => {
  await client.query('BEGIN');
  try {
    // ─── USERS ───────────────────────────────────────────────────────────────
    const owners = [
      { id: uuidv4(), phone: '+919777777777', name: 'Anitha Kumar',    email: 'anitha@example.com'  },
      { id: uuidv4(), phone: '+919666666666', name: 'Suresh Reddy',    email: 'suresh@example.com'  },
      { id: uuidv4(), phone: '+919555555555', name: 'Priya Sharma',    email: 'priya@example.com'   },
      { id: uuidv4(), phone: '+919444444444', name: 'Mohammed Farhan', email: 'farhan@example.com'  },
      { id: uuidv4(), phone: '+919333333333', name: 'Deepa Nair',      email: 'deepa@example.com'   },
    ];

    await client.query(`
      INSERT INTO users (id, phone, name, user_type, kyc_status)
      VALUES (gen_random_uuid(), '+919999999999', 'Admin User', 'admin', 'verified')
      ON CONFLICT (phone) DO NOTHING
    `);
    await client.query(`
      INSERT INTO users (id, phone, name, user_type, kyc_status)
      VALUES (gen_random_uuid(), '+919888888888', 'Ravi Scout', 'scout', 'verified')
      ON CONFLICT (phone) DO NOTHING
    `);

    for (const o of owners) {
      await client.query(`
        INSERT INTO users (id, phone, name, user_type, kyc_status, email)
        VALUES ($1,$2,$3,'owner','verified',$4)
        ON CONFLICT (phone) DO UPDATE SET id = EXCLUDED.id RETURNING id
      `, [o.id, o.phone, o.name, o.email]);
    }

    // Re-fetch actual owner IDs from DB (handles conflicts correctly)
    const { rows: ownerRows } = await client.query(
      `SELECT id FROM users WHERE phone = ANY($1)`,
      [owners.map(o => o.phone)]
    );
    const ownerIds = ownerRows.map(r => r.id);

    const pick = () => ownerIds[Math.floor(Math.random() * ownerIds.length)];

    // ─── BANGALORE RENTALS ───────────────────────────────────────────────────
    const bangaloreRentals = [
      { bhk:2, locality:'Koramangala',      rent:35000, deposit:70000,  furnishing:'fully_furnished', area:950,  floor:4, pincode:'560034' },
      { bhk:1, locality:'HSR Layout',       rent:18000, deposit:36000,  furnishing:'semi_furnished',  area:550,  floor:2, pincode:'560102' },
      { bhk:3, locality:'Whitefield',       rent:42000, deposit:84000,  furnishing:'unfurnished',     area:1400, floor:6, pincode:'560066' },
      { bhk:2, locality:'Indiranagar',      rent:38000, deposit:76000,  furnishing:'fully_furnished', area:1000, floor:3, pincode:'560038' },
      { bhk:1, locality:'BTM Layout',       rent:14000, deposit:28000,  furnishing:'semi_furnished',  area:480,  floor:1, pincode:'560076' },
      { bhk:2, locality:'Jayanagar',        rent:28000, deposit:56000,  furnishing:'semi_furnished',  area:900,  floor:3, pincode:'560041' },
      { bhk:3, locality:'Electronic City',  rent:32000, deposit:64000,  furnishing:'unfurnished',     area:1350, floor:5, pincode:'560100' },
      { bhk:2, locality:'Marathahalli',     rent:24000, deposit:48000,  furnishing:'semi_furnished',  area:850,  floor:2, pincode:'560037' },
      { bhk:4, locality:'Sadashivanagar',   rent:75000, deposit:150000, furnishing:'fully_furnished', area:2200, floor:1, pincode:'560080' },
      { bhk:1, locality:'Rajajinagar',      rent:16000, deposit:32000,  furnishing:'unfurnished',     area:500,  floor:2, pincode:'560010' },
    ];

    for (const p of bangaloreRentals) {
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, rent_amount, deposit_amount,
          verification_status, amenities, photos, available_from)
        VALUES ($1,$2,$3,'apartment','rent',$4,$5,'Bangalore','Karnataka',$6,$7,$8,$9,10,$10,$11,$12,'verified',
          '["lift","gym","security","parking","power_backup"]'::jsonb, $13::jsonb, NOW() + INTERVAL '7 days')
      `, [uuidv4(), pick(),
          `${p.bhk}BHK ${p.furnishing.replace(/_/g,' ')} in ${p.locality}`,
          `${p.area}, ${p.locality} Main Road, Bangalore`,
          p.locality, p.pincode, p.bhk, p.area, p.floor, p.furnishing, p.rent, p.deposit, nextPhotos()]);
    }

    // ─── BANGALORE SALES ─────────────────────────────────────────────────────
    const bangaloreSales = [
      { bhk:2, locality:'JP Nagar',          price:6500000,  area:1050, furnishing:'unfurnished',    pincode:'560078' },
      { bhk:3, locality:'Hebbal',            price:9800000,  area:1500, furnishing:'semi_furnished', pincode:'560024' },
      { bhk:2, locality:'Sarjapur Road',     price:7200000,  area:1100, furnishing:'unfurnished',    pincode:'560035' },
      { bhk:4, locality:'Bannerghatta Road', price:14500000, area:2400, furnishing:'fully_furnished',pincode:'560083' },
      { bhk:1, locality:'Yelahanka',         price:3800000,  area:580,  furnishing:'unfurnished',    pincode:'560064' },
    ];

    for (const p of bangaloreSales) {
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, sale_price, verification_status, amenities, photos)
        VALUES ($1,$2,$3,'apartment','sale',$4,$5,'Bangalore','Karnataka',$6,$7,$8,$9,12,$10,$11,'verified',
          '["lift","gym","security","parking"]'::jsonb, $12::jsonb)
      `, [uuidv4(), pick(),
          `${p.bhk}BHK for Sale in ${p.locality}`,
          `${p.area}, ${p.locality}, Bangalore`,
          p.locality, p.pincode, p.bhk, p.area,
          Math.floor(Math.random() * 8) + 1, p.furnishing, p.price, nextPhotos()]);
    }

    // ─── MUMBAI RENTALS ──────────────────────────────────────────────────────
    const mumbaiRentals = [
      { bhk:1, locality:'Andheri West', rent:45000,  deposit:90000,  furnishing:'fully_furnished', area:550,  pincode:'400058' },
      { bhk:2, locality:'Powai',        rent:65000,  deposit:130000, furnishing:'semi_furnished',  area:950,  pincode:'400076' },
      { bhk:1, locality:'Malad West',   rent:32000,  deposit:64000,  furnishing:'semi_furnished',  area:480,  pincode:'400064' },
      { bhk:3, locality:'Bandra West',  rent:120000, deposit:240000, furnishing:'fully_furnished', area:1500, pincode:'400050' },
      { bhk:2, locality:'Thane West',   rent:38000,  deposit:76000,  furnishing:'unfurnished',     area:850,  pincode:'400601' },
      { bhk:1, locality:'Borivali East',rent:28000,  deposit:56000,  furnishing:'semi_furnished',  area:500,  pincode:'400066' },
    ];

    for (const p of mumbaiRentals) {
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, rent_amount, deposit_amount,
          verification_status, amenities, photos, available_from)
        VALUES ($1,$2,$3,'apartment','rent',$4,$5,'Mumbai','Maharashtra',$6,$7,$8,$9,15,$10,$11,$12,'verified',
          '["lift","security","parking","power_backup"]'::jsonb, $13::jsonb, NOW() + INTERVAL '14 days')
      `, [uuidv4(), pick(),
          `${p.bhk}BHK in ${p.locality}`,
          `${p.area}, ${p.locality}, Mumbai`,
          p.locality, p.pincode, p.bhk, p.area,
          Math.floor(Math.random() * 12) + 1, p.furnishing, p.rent, p.deposit, nextPhotos()]);
    }

    // ─── HYDERABAD RENTALS ───────────────────────────────────────────────────
    const hyderabadRentals = [
      { bhk:2, locality:'Gachibowli',    rent:28000, deposit:56000,  furnishing:'semi_furnished',  area:950,  pincode:'500032' },
      { bhk:3, locality:'Hitech City',   rent:45000, deposit:90000,  furnishing:'fully_furnished', area:1400, pincode:'500081' },
      { bhk:1, locality:'Madhapur',      rent:18000, deposit:36000,  furnishing:'semi_furnished',  area:550,  pincode:'500081' },
      { bhk:2, locality:'Kondapur',      rent:24000, deposit:48000,  furnishing:'unfurnished',     area:900,  pincode:'500084' },
      { bhk:3, locality:'Jubilee Hills', rent:55000, deposit:110000, furnishing:'fully_furnished', area:1800, pincode:'500033' },
      { bhk:2, locality:'Banjara Hills', rent:40000, deposit:80000,  furnishing:'semi_furnished',  area:1100, pincode:'500034' },
    ];

    for (const p of hyderabadRentals) {
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, rent_amount, deposit_amount,
          verification_status, amenities, photos, available_from)
        VALUES ($1,$2,$3,'apartment','rent',$4,$5,'Hyderabad','Telangana',$6,$7,$8,$9,12,$10,$11,$12,'verified',
          '["lift","gym","security","parking","power_backup"]'::jsonb, $13::jsonb, NOW() + INTERVAL '10 days')
      `, [uuidv4(), pick(),
          `${p.bhk}BHK in ${p.locality}`,
          `${p.area}, ${p.locality}, Hyderabad`,
          p.locality, p.pincode, p.bhk, p.area,
          Math.floor(Math.random() * 10) + 1, p.furnishing, p.rent, p.deposit, nextPhotos()]);
    }

    // ─── PUNE RENTALS ────────────────────────────────────────────────────────
    const puneRentals = [
      { bhk:2, locality:'Kothrud',       rent:22000, deposit:44000, furnishing:'semi_furnished',  area:900,  pincode:'411038' },
      { bhk:1, locality:'Wakad',         rent:14000, deposit:28000, furnishing:'unfurnished',     area:500,  pincode:'411057' },
      { bhk:3, locality:'Kalyani Nagar', rent:38000, deposit:76000, furnishing:'fully_furnished', area:1500, pincode:'411006' },
      { bhk:2, locality:'Hinjewadi',     rent:20000, deposit:40000, furnishing:'semi_furnished',  area:850,  pincode:'411057' },
    ];

    for (const p of puneRentals) {
      await client.query(`
        INSERT INTO properties (id, owner_id, title, property_type, transaction_type,
          address, locality, city, state, pincode, bhk, carpet_area_sqft,
          floor_number, total_floors, furnishing, rent_amount, deposit_amount,
          verification_status, amenities, photos, available_from)
        VALUES ($1,$2,$3,'apartment','rent',$4,$5,'Pune','Maharashtra',$6,$7,$8,$9,10,$10,$11,$12,'verified',
          '["lift","security","parking","power_backup"]'::jsonb, $13::jsonb, NOW() + INTERVAL '5 days')
      `, [uuidv4(), pick(),
          `${p.bhk}BHK in ${p.locality}`,
          `${p.area}, ${p.locality}, Pune`,
          p.locality, p.pincode, p.bhk, p.area,
          Math.floor(Math.random() * 8) + 1, p.furnishing, p.rent, p.deposit, nextPhotos()]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete — 31 properties across Bangalore, Mumbai, Hyderabad & Pune');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
};

module.exports = { seed };