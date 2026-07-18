-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable PostGIS for geo queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TYPE user_type_enum AS ENUM ('owner', 'seeker', 'scout', 'admin', 'concierge');
CREATE TYPE kyc_status_enum AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone          VARCHAR(15) UNIQUE NOT NULL,
    email          VARCHAR(255) UNIQUE,
    name           VARCHAR(100),
    user_type      user_type_enum NOT NULL DEFAULT 'seeker',
    kyc_status     kyc_status_enum NOT NULL DEFAULT 'pending',
    aadhaar_hash   VARCHAR(64),
    profile_photo  VARCHAR(500),
    rating         DECIMAL(3,2) DEFAULT 0,
    rating_count   INTEGER DEFAULT 0,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);

-- OTP store (simple, replace with Redis in production)
CREATE TABLE otp_store (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone      VARCHAR(15) NOT NULL,
    otp        VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used       BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── PROPERTIES ───────────────────────────────────────────────────────────────
CREATE TYPE property_type_enum AS ENUM ('apartment', 'villa', 'independent_house', 'pg', 'commercial', 'plot');
CREATE TYPE transaction_type_enum AS ENUM ('rent', 'sale');
CREATE TYPE furnishing_enum AS ENUM ('unfurnished', 'semi_furnished', 'fully_furnished');
CREATE TYPE verification_status_enum AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'expired');

CREATE TABLE properties (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    property_type       property_type_enum NOT NULL,
    transaction_type    transaction_type_enum NOT NULL,
    address             TEXT NOT NULL,
    locality            VARCHAR(100),
    city                VARCHAR(50) NOT NULL,
    state               VARCHAR(50) NOT NULL,
    pincode             VARCHAR(6),
    geo_location        GEOGRAPHY(POINT, 4326),
    bhk                 SMALLINT,
    carpet_area_sqft    INTEGER,
    super_builtup_sqft  INTEGER,
    floor_number        SMALLINT,
    total_floors        SMALLINT,
    age_years           SMALLINT,
    furnishing          furnishing_enum,
    rent_amount         DECIMAL(12,2),
    deposit_amount      DECIMAL(12,2),
    sale_price          DECIMAL(15,2),
    maintenance_amount  DECIMAL(10,2),
    available_from      DATE,
    amenities           JSONB DEFAULT '[]',
    photos              JSONB DEFAULT '[]',
    video_url           VARCHAR(500),
    verification_status verification_status_enum DEFAULT 'unverified',
    verified_at         TIMESTAMP,
    is_active           BOOLEAN DEFAULT true,
    views_count         INTEGER DEFAULT 0,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_geo ON properties USING GIST(geo_location);
CREATE INDEX idx_properties_verification ON properties(verification_status);
CREATE INDEX idx_properties_type ON properties(transaction_type, property_type);

-- ─── VERIFICATIONS ────────────────────────────────────────────────────────────
CREATE TYPE verification_task_status AS ENUM ('assigned', 'scout_en_route', 'in_progress', 'submitted', 'approved', 'rejected', 'disputed');

CREATE TABLE verifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id         UUID REFERENCES properties(id) ON DELETE CASCADE,
    scout_id            UUID REFERENCES users(id),
    assigned_by         UUID REFERENCES users(id),
    status              verification_task_status DEFAULT 'assigned',
    scheduled_at        TIMESTAMP,
    arrived_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    scout_notes         TEXT,
    actual_carpet_area  INTEGER,
    condition_rating    SMALLINT CHECK (condition_rating BETWEEN 1 AND 5),
    ownership_verified  BOOLEAN DEFAULT false,
    rera_compliant      BOOLEAN,
    photos              JSONB DEFAULT '[]',
    video_url           VARCHAR(500),
    checklist           JSONB DEFAULT '{}',
    admin_notes         TEXT,
    rejection_reason    TEXT,
    verification_fee    DECIMAL(8,2) DEFAULT 199,
    scout_payout        DECIMAL(8,2) DEFAULT 300,
    fee_paid            BOOLEAN DEFAULT false,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ─── TRANSACTIONS (DEALS) ─────────────────────────────────────────────────────
CREATE TYPE deal_status AS ENUM (
    'interest_shown', 'negotiating', 'agreed',
    'escrow_initiated', 'escrow_funded', 'agreement_drafted',
    'agreement_signed', 'handover_scheduled', 'handover_done',
    'completed', 'disputed', 'cancelled'
);

CREATE TABLE transactions (
    id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id                  UUID REFERENCES properties(id),
    owner_id                     UUID REFERENCES users(id),
    seeker_id                    UUID REFERENCES users(id),
    concierge_id                 UUID REFERENCES users(id),
    transaction_type             transaction_type_enum NOT NULL,
    status                       deal_status DEFAULT 'interest_shown',
    agreed_rent                  DECIMAL(12,2),
    agreed_sale_price            DECIMAL(15,2),
    security_deposit             DECIMAL(12,2),
    lock_in_period_months        SMALLINT,
    keyturn_fee                  DECIMAL(12,2),
    keyturn_fee_paid             BOOLEAN DEFAULT false,
    escrow_amount                DECIMAL(15,2),
    escrow_reference             VARCHAR(100),
    agreement_url                VARCHAR(500),
    handover_photos              JSONB DEFAULT '[]',
    handover_confirmed_owner     BOOLEAN DEFAULT false,
    handover_confirmed_seeker    BOOLEAN DEFAULT false,
    dispute_reason               TEXT,
    cancellation_reason          TEXT,
    completed_at                 TIMESTAMP,
    created_at                   TIMESTAMP DEFAULT NOW(),
    updated_at                   TIMESTAMP DEFAULT NOW()
);

-- ─── ESCROW ACCOUNTS ──────────────────────────────────────────────────────────
CREATE TYPE escrow_status AS ENUM ('initiated', 'funded', 'held', 'released_to_owner', 'refunded_to_seeker', 'disputed');

CREATE TABLE escrow_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID REFERENCES transactions(id),
    amount          DECIMAL(15,2) NOT NULL,
    status          escrow_status DEFAULT 'initiated',
    razorpay_order_id   VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    funded_at       TIMESTAMP,
    released_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── VISITS ───────────────────────────────────────────────────────────────────
CREATE TYPE visit_status AS ENUM ('requested', 'confirmed', 'completed', 'cancelled', 'no_show');

CREATE TABLE visits (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id   UUID REFERENCES properties(id),
    seeker_id     UUID REFERENCES users(id),
    owner_id      UUID REFERENCES users(id),
    scheduled_at  TIMESTAMP NOT NULL,
    status        visit_status DEFAULT 'requested',
    visit_mode    VARCHAR(20) DEFAULT 'in_person', -- in_person, virtual
    notes         TEXT,
    feedback      TEXT,
    rating        SMALLINT CHECK (rating BETWEEN 1 AND 5),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ─── CHAT ROOMS ───────────────────────────────────────────────────────────────
CREATE TABLE chat_rooms (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id  UUID REFERENCES properties(id),
    owner_id     UUID REFERENCES users(id),
    seeker_id    UUID REFERENCES users(id),
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id      UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id    UUID REFERENCES users(id),
    message      TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file
    file_url     VARCHAR(500),
    is_read      BOOLEAN DEFAULT false,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- ─── PRICE ESTIMATES ──────────────────────────────────────────────────────────
CREATE TABLE price_estimates (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id        UUID REFERENCES properties(id),
    locality           VARCHAR(100),
    city               VARCHAR(50),
    bhk                SMALLINT,
    carpet_area_sqft   INTEGER,
    estimated_rent     DECIMAL(12,2),
    estimated_sale     DECIMAL(15,2),
    price_per_sqft     DECIMAL(10,2),
    confidence_score   DECIMAL(3,2),
    factors            JSONB DEFAULT '{}',
    model_version      VARCHAR(20) DEFAULT 'rule_v1',
    created_at         TIMESTAMP DEFAULT NOW()
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────
CREATE TYPE payment_purpose AS ENUM ('verification_fee', 'escrow_deposit', 'keyturn_success_fee', 'service_payment');
CREATE TYPE payment_status AS ENUM ('initiated', 'captured', 'failed', 'refunded');

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(id),
    purpose             payment_purpose NOT NULL,
    reference_id        UUID, -- property/transaction/verification id
    amount              DECIMAL(12,2) NOT NULL,
    currency            VARCHAR(3) DEFAULT 'INR',
    status              payment_status DEFAULT 'initiated',
    razorpay_order_id   VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature  VARCHAR(300),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ─── AGREEMENTS ───────────────────────────────────────────────────────────────
CREATE TABLE agreements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID REFERENCES transactions(id),
    template_type   VARCHAR(50) DEFAULT 'rental_agreement',
    content         TEXT,
    pdf_url         VARCHAR(500),
    owner_signed    BOOLEAN DEFAULT false,
    seeker_signed   BOOLEAN DEFAULT false,
    owner_signed_at TIMESTAMP,
    seeker_signed_at TIMESTAMP,
    stamp_duty_paid BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    body        TEXT NOT NULL,
    type        VARCHAR(50),
    reference_id UUID,
    is_read     BOOLEAN DEFAULT false,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─── REVIEWS ──────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id   UUID REFERENCES users(id),
    reviewee_id   UUID REFERENCES users(id),
    transaction_id UUID REFERENCES transactions(id),
    rating        SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
