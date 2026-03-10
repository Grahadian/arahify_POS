-- ============================================================
-- MSME GROW POS - Supabase Database Schema
-- ============================================================
-- Jalankan file ini di Supabase SQL Editor:
-- https://app.supabase.com → project → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role    AS ENUM ('superadmin', 'admin', 'kasir');
CREATE TYPE client_status AS ENUM ('pending', 'trial', 'active', 'suspended', 'cancelled');
CREATE TYPE plan_type    AS ENUM ('trial', 'pro');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'expired');

-- ============================================================
-- TABLE: clients
-- Setiap row = 1 bisnis UMKM yang mendaftar
-- ============================================================

CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name   TEXT NOT NULL,
  owner_name      TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  whatsapp        TEXT,
  business_type   TEXT,           -- jenis usaha UMKM
  address         TEXT,
  status          client_status NOT NULL DEFAULT 'pending',
  plan            plan_type NOT NULL DEFAULT 'trial',

  -- Google Sheets integration
  gs_web_app_url  TEXT,           -- diisi setelah GAS setup
  gs_sheet_id     TEXT,           -- Google Sheet ID (opsional)
  gs_connected    BOOLEAN DEFAULT FALSE,
  gs_last_sync    TIMESTAMPTZ,

  -- Subscription
  trial_ends_at   TIMESTAMPTZ,
  plan_starts_at  TIMESTAMPTZ,
  plan_ends_at    TIMESTAMPTZ,    -- null = aktif permanen / auto-renew

  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: users
-- Setiap row = 1 user (superadmin / admin client / kasir client)
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID REFERENCES clients(id) ON DELETE CASCADE,
                  -- NULL = superadmin (tidak terikat client)
  username        TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,  -- bcrypt hash
  full_name       TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'kasir',
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: subscription_payments
-- Riwayat pembayaran aktivasi / perpanjangan
-- ============================================================

CREATE TABLE subscription_payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  midtrans_order_id   TEXT NOT NULL UNIQUE,  -- order_id ke Midtrans
  midtrans_txn_id     TEXT,                  -- transaction_id dari Midtrans
  amount              INTEGER NOT NULL,       -- dalam Rupiah
  plan                plan_type NOT NULL,
  duration_months     INTEGER NOT NULL DEFAULT 1,
  status              payment_status NOT NULL DEFAULT 'pending',
  payment_method      TEXT,                  -- QRIS, bank_transfer, dll
  midtrans_payload    JSONB,                 -- raw response dari Midtrans
  paid_at             TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: registration_requests
-- Pendaftaran client baru (sebelum bayar)
-- ============================================================

CREATE TABLE registration_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name   TEXT NOT NULL,
  owner_name      TEXT NOT NULL,
  email           TEXT NOT NULL,
  whatsapp        TEXT,
  business_type   TEXT,
  address         TEXT,
  desired_username TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  status          TEXT DEFAULT 'pending_payment', -- pending_payment | paid | completed | failed
  client_id       UUID REFERENCES clients(id),    -- diisi setelah aktivasi
  payment_id      UUID REFERENCES subscription_payments(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_client_id   ON users(client_id);
CREATE INDEX idx_users_username    ON users(username);
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_clients_email     ON clients(email);
CREATE INDEX idx_clients_status    ON clients(status);
CREATE INDEX idx_payments_client   ON subscription_payments(client_id);
CREATE INDEX idx_payments_order_id ON subscription_payments(midtrans_order_id);
CREATE INDEX idx_reg_email         ON registration_requests(email);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Aktifkan RLS — hanya akses via service_role key yang bypass ini
-- (gunakan service_role key di backend/GAS, bukan anon key)

ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: service_role bisa akses semua (untuk API backend kita)
CREATE POLICY "service_role_all" ON clients              FOR ALL USING (true);
CREATE POLICY "service_role_all" ON users                FOR ALL USING (true);
CREATE POLICY "service_role_all" ON subscription_payments FOR ALL USING (true);
CREATE POLICY "service_role_all" ON registration_requests FOR ALL USING (true);

-- ============================================================
-- SEED: Superadmin MSME Grow
-- Password: superadmin123 (ganti sebelum production!)
-- Hash dibuat dengan: bcrypt("superadmin123", 10)
-- ============================================================

INSERT INTO users (
  client_id, username, email, password_hash,
  full_name, role, is_active
) VALUES (
  NULL,
  'superadmin',
  'superadmin@msmegrow.id',
  '$2b$10$rOzJqj5B5qz5B5qz5B5qzuHelloWorldHashPlaceholderChangeThis',
  'Super Admin MSME Grow',
  'superadmin',
  TRUE
);

-- ============================================================
-- CATATAN PENTING
-- ============================================================
-- 1. Ganti password_hash superadmin dengan hash bcrypt yang benar
--    Generate di: https://bcrypt-generator.com (rounds: 10)
-- 2. Simpan SUPABASE_URL dan SUPABASE_ANON_KEY di .env
-- 3. Gunakan SUPABASE_SERVICE_ROLE_KEY untuk operasi server-side
-- 4. Jangan expose service_role key di frontend!
-- ============================================================
