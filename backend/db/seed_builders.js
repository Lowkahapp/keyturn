require('dotenv').config();
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Real Bangalore builder projects (public knowledge)
const BUILDER_PROJECTS = [

  // ─── PRESTIGE GROUP ───────────────────────────────────────────────────────
  {
    builder: 'Prestige Group',
    projects: [
      {
        name: 'Prestige Song of the South',
        locality: 'Begur', city: 'Bangalore', state: 'Karnataka', pincode: '560068',
        bhk_options: [1,2,3], base_price: 6500000, price_per_sqft: 6800,
        area_range: [650, 1800], floors: 30,
        amenities: ['pool','gym','clubhouse','security','lift','parking','garden','jogging_track'],
        photos: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800',
        ],
        description: 'Prestige Song of the South is a premium residential township spread over 120 acres in South Bangalore. Features world-class amenities and excellent connectivity to Electronic City.',
      },
      {
        name: 'Prestige Lakeside Habitat',
        locality: 'Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066',
        bhk_options: [2,3,4], base_price: 9800000, price_per_sqft: 8200,
        area_range: [1200, 2800], floors: 28,
        amenities: ['pool','gym','clubhouse','security','lift','parking','lake_view','spa'],
        photos: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
          'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        ],
        description: 'Prestige Lakeside Habitat is a sprawling 102-acre integrated township with lakeside views in Whitefield. Modern amenities and proximity to IT corridors.',
      },
      {
        name: 'Prestige Primrose Hills',
        locality: 'Kanakapura Road', city: 'Bangalore', state: 'Karnataka', pincode: '560062',
        bhk_options: [1,2,3], base_price: 5200000, price_per_sqft: 5900,
        area_range: [600, 1600], floors: 22,
        amenities: ['pool','gym','clubhouse','security','lift','parking','amphitheatre'],
        photos: [
          'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800',
          'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=800',
          'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
        ],
        description: 'Prestige Primrose Hills on Kanakapura Road offers lush green surroundings with metro connectivity. Ideal for families seeking a peaceful yet connected lifestyle.',
      },
      {
        name: 'Prestige Falcon City',
        locality: 'Kanakapura Road', city: 'Bangalore', state: 'Karnataka', pincode: '560062',
        bhk_options: [2,3,4], base_price: 8500000, price_per_sqft: 7400,
        area_range: [1100, 2400], floors: 35,
        amenities: ['pool','gym','clubhouse','security','lift','parking','tennis_court','kids_play'],
        photos: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        ],
        description: 'Prestige Falcon City is a 72-acre integrated township with retail, hospitality and residential zones. One of South Bangalore\'s most iconic addresses.',
      },
    ]
  },

  // ─── SOBHA GROUP ──────────────────────────────────────────────────────────
  {
    builder: 'Sobha Limited',
    projects: [
      {
        name: 'Sobha Dream Acres',
        locality: 'Panathur', city: 'Bangalore', state: 'Karnataka', pincode: '560087',
        bhk_options: [1,2], base_price: 4800000, price_per_sqft: 6200,
        area_range: [580, 1100], floors: 25,
        amenities: ['pool','gym','clubhouse','security','lift','parking','badminton','power_backup'],
        photos: [
          'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800',
          'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800',
          'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
        ],
        description: 'Sobha Dream Acres in Panathur offers premium 1 & 2 BHK apartments with Sobha\'s signature quality construction. Excellent connectivity to Outer Ring Road and IT parks.',
      },
      {
        name: 'Sobha City',
        locality: 'Thanisandra', city: 'Bangalore', state: 'Karnataka', pincode: '560077',
        bhk_options: [2,3,4], base_price: 11500000, price_per_sqft: 9800,
        area_range: [1300, 3200], floors: 40,
        amenities: ['pool','gym','clubhouse','security','lift','parking','spa','concierge','helipad'],
        photos: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800',
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
        ],
        description: 'Sobha City is North Bangalore\'s most prestigious address — a 81-acre township with ultra-luxury residences, retail and hospitality. Adjacent to Hebbal flyover.',
      },
      {
        name: 'Sobha Silicon Oasis',
        locality: 'Hosa Road', city: 'Bangalore', state: 'Karnataka', pincode: '560100',
        bhk_options: [2,3], base_price: 7200000, price_per_sqft: 7100,
        area_range: [1000, 1800], floors: 20,
        amenities: ['pool','gym','clubhouse','security','lift','parking','jogging_track','yoga'],
        photos: [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
          'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        ],
        description: 'Sobha Silicon Oasis near Electronic City offers premium apartments with Sobha\'s renowned build quality. Excellent rental yield potential in the IT corridor.',
      },
      {
        name: 'Sobha Indraprastha',
        locality: 'Hebbal', city: 'Bangalore', state: 'Karnataka', pincode: '560024',
        bhk_options: [3,4], base_price: 14500000, price_per_sqft: 11200,
        area_range: [1800, 3500], floors: 32,
        amenities: ['pool','gym','clubhouse','security','lift','parking','lake_view','theatre','spa'],
        photos: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
          'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800',
          'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800',
        ],
        description: 'Sobha Indraprastha in Hebbal is a luxury high-rise with panoramic views of Hebbal Lake. Premium finishes, concierge services, and elite community living.',
      },
    ]
  },

  // ─── PURAVANKARA ──────────────────────────────────────────────────────────
  {
    builder: 'Puravankara Limited',
    projects: [
      {
        name: 'Purva Atmosphere',
        locality: 'Hebbal', city: 'Bangalore', state: 'Karnataka', pincode: '560024',
        bhk_options: [2,3,4], base_price: 10200000, price_per_sqft: 8900,
        area_range: [1200, 2600], floors: 30,
        amenities: ['pool','gym','clubhouse','security','lift','parking','sky_deck','business_centre'],
        photos: [
          'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800',
          'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
          'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800',
        ],
        description: 'Purva Atmosphere is a sky-high luxury project in Hebbal with stunning views. Features a rooftop sky deck, infinity pool, and business centre — a landmark in North Bangalore.',
      },
      {
        name: 'Purva Silversands',
        locality: 'Marathahalli', city: 'Bangalore', state: 'Karnataka', pincode: '560037',
        bhk_options: [2,3], base_price: 6800000, price_per_sqft: 6500,
        area_range: [1000, 1700], floors: 18,
        amenities: ['pool','gym','clubhouse','security','lift','parking','amphitheatre','kids_play'],
        photos: [
          'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        ],
        description: 'Purva Silversands in Marathahalli is a premium gated community with resort-style amenities. Walking distance from Outer Ring Road and major IT parks.',
      },
      {
        name: 'Purva Seasons',
        locality: 'Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066',
        bhk_options: [2,3,4], base_price: 8900000, price_per_sqft: 7800,
        area_range: [1150, 2400], floors: 24,
        amenities: ['pool','gym','clubhouse','security','lift','parking','tennis_court','spa'],
        photos: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        ],
        description: 'Purva Seasons in Whitefield offers contemporary living with four themed gardens. Close to ITPL, Vydehi Hospital, and Whitefield railway station.',
      },
    ]
  },

  // ─── BRIGADE GROUP ────────────────────────────────────────────────────────
  {
    builder: 'Brigade Group',
    projects: [
      {
        name: 'Brigade Cornerstone Utopia',
        locality: 'Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066',
        bhk_options: [2,3,4], base_price: 9500000, price_per_sqft: 8100,
        area_range: [1200, 2800], floors: 26,
        amenities: ['pool','gym','clubhouse','security','lift','parking','cricket_net','squash'],
        photos: [
          'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=800',
          'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
          'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800',
        ],
        description: 'Brigade Cornerstone Utopia is a 43-acre integrated development in Whitefield with residential, retail and hospitality. One of East Bangalore\'s finest addresses.',
      },
      {
        name: 'Brigade Meadows',
        locality: 'Kanakapura Road', city: 'Bangalore', state: 'Karnataka', pincode: '560062',
        bhk_options: [1,2,3], base_price: 5500000, price_per_sqft: 5800,
        area_range: [600, 1700], floors: 20,
        amenities: ['pool','gym','clubhouse','security','lift','parking','garden','jogging_track'],
        photos: [
          'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800',
          'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800',
          'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800',
        ],
        description: 'Brigade Meadows is a 135-acre township on Kanakapura Road with 5000+ apartments, schools, hospitals and retail within the campus. Metro accessible.',
      },
      {
        name: 'Brigade Xanadu',
        locality: 'Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066',
        bhk_options: [3,4,5], base_price: 16000000, price_per_sqft: 12500,
        area_range: [2000, 4500], floors: 38,
        amenities: ['pool','gym','clubhouse','security','lift','parking','theatre','wine_cellar','concierge'],
        photos: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
          'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800',
          'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800',
        ],
        description: 'Brigade Xanadu is ultra-luxury living in Whitefield — spacious sky villas with private pools, wine cellars, and concierge services. For the truly discerning buyer.',
      },
    ]
  },

  // ─── SJR GROUP ────────────────────────────────────────────────────────────
  {
    builder: 'SJR Group',
    projects: [
      {
        name: 'SJR Verity',
        locality: 'Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066',
        bhk_options: [2,3], base_price: 7500000, price_per_sqft: 6900,
        area_range: [980, 1800], floors: 22,
        amenities: ['pool','gym','clubhouse','security','lift','parking','yoga','kids_play'],
        photos: [
          'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
          'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
        ],
        description: 'SJR Verity in Whitefield offers premium apartments with contemporary design. Close to ITPL and Whitefield station with excellent investment potential.',
      },
      {
        name: 'SJR Watermark',
        locality: 'Bellandur', city: 'Bangalore', state: 'Karnataka', pincode: '560103',
        bhk_options: [2,3,4], base_price: 8800000, price_per_sqft: 7600,
        area_range: [1100, 2200], floors: 24,
        amenities: ['pool','gym','clubhouse','security','lift','parking','lake_view','amphitheatre'],
        photos: [
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
          'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800',
          'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800',
        ],
        description: 'SJR Watermark by Bellandur Lake offers stunning water views and premium finishes. Strategic location between Outer Ring Road and Sarjapur Road.',
      },
      {
        name: 'SJR Palazza City',
        locality: 'Electronic City', city: 'Bangalore', state: 'Karnataka', pincode: '560100',
        bhk_options: [1,2,3], base_price: 4500000, price_per_sqft: 5400,
        area_range: [560, 1500], floors: 18,
        amenities: ['pool','gym','clubhouse','security','lift','parking','power_backup'],
        photos: [
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        ],
        description: 'SJR Palazza City in Electronic City Phase 1 is ideal for IT professionals. Affordable pricing, good rental returns, and proximity to major tech companies.',
      },
    ]
  },
];

const seedBuilders = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let insertedCount = 0;

    for (const builder of BUILDER_PROJECTS) {
      // Create a user for this builder
      const builderId = uuidv4();
      const phone = `+91${Math.floor(8000000000 + Math.random() * 1999999999)}`;
      await client.query(`
        INSERT INTO users (id, phone, name, user_type, kyc_status, email)
        VALUES ($1, $2, $3, 'owner', 'verified', $4)
        ON CONFLICT (phone) DO NOTHING
      `, [builderId, phone, builder.builder, `info@${builder.builder.toLowerCase().replace(/\s+/g, '')}.com`]);

      // Get actual inserted ID (in case of conflict)
      const { rows: [user] } = await client.query(
        `SELECT id FROM users WHERE name = $1 AND user_type = 'owner' LIMIT 1`,
        [builder.builder]
      );
      const ownerId = user?.id || builderId;

      for (const project of builder.projects) {
        for (const bhk of project.bhk_options) {
          const areaMin = project.area_range[0];
          const areaMax = project.area_range[1];
          const area = Math.floor(areaMin + (areaMax - areaMin) * (bhk - 1) / Math.max(project.bhk_options.length - 1, 1));
          const price = Math.floor(project.base_price + (bhk - 1) * project.price_per_sqft * 300);
          const floor = Math.floor(Math.random() * (project.floors - 2)) + 2;

          await client.query(`
            INSERT INTO properties (
              id, owner_id, title, description, property_type, transaction_type,
              address, locality, city, state, pincode,
              bhk, carpet_area_sqft, floor_number, total_floors,
              furnishing, sale_price, verification_status,
              amenities, photos, available_from
            ) VALUES (
              $1,$2,$3,$4,'apartment','sale',
              $5,$6,$7,$8,$9,
              $10,$11,$12,$13,
              'unfurnished',$14,'verified',
              $15::jsonb,$16::jsonb, NOW() + INTERVAL '90 days'
            )
          `, [
            uuidv4(), ownerId,
            `${project.name} — ${bhk}BHK`,
            project.description,
            `${project.name}, ${project.locality}, ${project.city}`,
            project.locality, project.city, project.state, project.pincode,
            bhk, area, floor, project.floors,
            price,
            JSON.stringify(project.amenities),
            JSON.stringify(project.photos),
          ]);
          insertedCount++;
        }
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Builder seed complete — ${insertedCount} listings from Prestige, Sobha, Puravankara, Brigade & SJR`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Builder seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seedBuilders();