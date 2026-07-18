# KeyTurn — India's Outcome-Guaranteed Property Platform

> "You don't pay until you get the keys."

## Project Structure

```
keyturn/
├── backend/          # Node.js + Express + PostgreSQL API
│   ├── config/       # DB, S3 config
│   ├── middleware/   # JWT auth
│   ├── routes/       # All API endpoints
│   ├── db/           # Schema + migrations + seed
│   └── server.js     # Entry point
│
└── frontend/         # React + Vite + TailwindCSS
    └── src/
        ├── api/      # Axios client + all API helpers
        ├── components/ # Reusable UI
        ├── context/  # Auth context
        └── pages/    # All screens
```

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env        # Fill in your credentials
createdb keyturn_db
node db/migrate.js           # Create schema
node db/seed.js              # Seed test data
npm run dev                  # Start API on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                  # Start on port 3000
```

## Test Users (after seed)
| Role   | Phone         | OTP    |
|--------|---------------|--------|
| Admin  | +919999999999 | any 6 digits |
| Scout  | +919888888888 | any 6 digits |
| Owner  | +919777777777 | any 6 digits |
| Seeker | Register new  | any 6 digits |

## MVP Features Covered
1. Phone OTP Auth (owner / seeker / scout roles)
2. Property listing with photos
3. Search with filters (geo, BHK, budget, verified-only)
4. Scout verification workflow (assign → check-in → submit → approve)
5. Verified badge system
6. In-app real-time chat (Socket.IO)
7. Visit scheduling (request → confirm → complete)
8. Rule-based Price Oracle
9. Digital agreement template
10. Razorpay payment (escrow, verification fee, success fee)

## Key APIs
```
POST /api/v1/auth/otp/send
POST /api/v1/auth/otp/verify
GET  /api/v1/search?city=Bangalore&transaction_type=rent&bhk=2
POST /api/v1/properties
POST /api/v1/properties/:id/verify-request
GET  /api/v1/scouts/tasks
POST /api/v1/scouts/tasks/:id/complete
POST /api/v1/transactions/initiate
POST /api/v1/transactions/:id/escrow/initiate
GET  /api/v1/price-oracle/estimate?city=Bangalore&locality=Koramangala&bhk=2
```

## What to Add in Phase 2
- Redis for OTP caching
- Twilio for real SMS OTPs
- AWS S3 for photo storage (multer-s3 already wired)
- ICICI Bank escrow API integration
- Aadhaar eSign for agreements
- ML Price Oracle (replace rule-based)
- PostGIS geo search (schema already has geo_location)
- Push notifications (FCM)
