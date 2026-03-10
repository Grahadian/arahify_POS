-- ============================================================
-- MSME GROW POS - Supabase RPC Functions
-- ============================================================
-- Jalankan di Supabase SQL Editor SETELAH schema.sql
-- ============================================================

-- Butuh extension pgcrypto untuk bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- RPC: login_user
-- Verifikasi username + password, return user + client info
-- ============================================================
CREATE OR REPLACE FUNCTION login_user(p_username TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user    users%ROWTYPE;
  v_client  clients%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM users
  WHERE (username = p_username OR email = p_username)
    AND is_active = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Username atau password salah.');
  END IF;

  -- Verifikasi bcrypt password
  IF NOT (v_user.password_hash = crypt(p_password, v_user.password_hash)) THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Username atau password salah.');
  END IF;

  -- Update last_login_at
  UPDATE users SET last_login_at = NOW() WHERE id = v_user.id;

  -- Ambil info client jika bukan superadmin
  IF v_user.client_id IS NOT NULL THEN
    SELECT * INTO v_client FROM clients WHERE id = v_user.client_id;

    -- Cek apakah client aktif
    IF v_client.status NOT IN ('active', 'trial') THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', CASE v_client.status
          WHEN 'pending'   THEN 'Akun belum aktif. Selesaikan pembayaran untuk mulai menggunakan MSME Grow POS.'
          WHEN 'suspended' THEN 'Akun Anda ditangguhkan. Hubungi MSME Grow untuk informasi lebih lanjut.'
          WHEN 'cancelled' THEN 'Langganan telah berakhir. Hubungi MSME Grow untuk perpanjangan.'
          ELSE 'Status akun tidak valid.'
        END
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'user', jsonb_build_object(
      'id',           v_user.id,
      'username',     v_user.username,
      'email',        v_user.email,
      'full_name',    v_user.full_name,
      'role',         v_user.role,
      'client_id',    v_user.client_id,
      'client_info',  CASE WHEN v_client.id IS NOT NULL THEN
        jsonb_build_object(
          'id',              v_client.id,
          'business_name',   v_client.business_name,
          'owner_name',      v_client.owner_name,
          'status',          v_client.status,
          'plan',            v_client.plan,
          'gs_web_app_url',  v_client.gs_web_app_url,
          'gs_connected',    v_client.gs_connected,
          'plan_ends_at',    v_client.plan_ends_at,
          'trial_ends_at',   v_client.trial_ends_at
        )
      ELSE NULL END
    )
  );
END;
$$;

-- ============================================================
-- RPC: create_registration
-- Buat registration request + hash password
-- ============================================================
CREATE OR REPLACE FUNCTION create_registration(
  p_business_name    TEXT,
  p_owner_name       TEXT,
  p_email            TEXT,
  p_whatsapp         TEXT,
  p_business_type    TEXT,
  p_address          TEXT,
  p_desired_username TEXT,
  p_password         TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_reg_id    UUID;
  v_order_id  TEXT;
  v_amount    INTEGER := 149000; -- Rp 149.000/bulan Pro Plan
BEGIN
  -- Cek duplikat email
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Email sudah terdaftar.');
  END IF;
  IF EXISTS (SELECT 1 FROM registration_requests WHERE email = p_email AND status != 'failed') THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Email sedang dalam proses pendaftaran.');
  END IF;

  -- Cek duplikat username
  IF EXISTS (SELECT 1 FROM users WHERE username = p_desired_username) THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Username sudah digunakan.');
  END IF;

  -- Buat order ID unik
  v_order_id := 'MSME-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));

  -- Simpan registration request
  INSERT INTO registration_requests (
    business_name, owner_name, email, whatsapp,
    business_type, address, desired_username, password_hash, status
  ) VALUES (
    p_business_name, p_owner_name, p_email, p_whatsapp,
    p_business_type, p_address, p_desired_username,
    crypt(p_password, gen_salt('bf', 10)),
    'pending_payment'
  ) RETURNING id INTO v_reg_id;

  RETURN jsonb_build_object(
    'success',         TRUE,
    'registration_id', v_reg_id,
    'midtrans_order_id', v_order_id,
    'amount',          v_amount,
    'owner_name',      p_owner_name,
    'email',           p_email,
    'message',         'Pendaftaran berhasil. Lanjutkan ke pembayaran.'
  );
END;
$$;

-- ============================================================
-- RPC: activate_client
-- Dipanggil setelah Midtrans konfirmasi pembayaran sukses
-- Membuat: client record + admin user + kasir default
-- ============================================================
CREATE OR REPLACE FUNCTION activate_client(
  p_registration_id   UUID,
  p_midtrans_order_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_reg       registration_requests%ROWTYPE;
  v_client_id UUID;
  v_user_id   UUID;
BEGIN
  -- Ambil registration request
  SELECT * INTO v_reg FROM registration_requests WHERE id = p_registration_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Registration tidak ditemukan.');
  END IF;
  IF v_reg.status = 'completed' THEN
    RETURN jsonb_build_object('success', TRUE, 'message', 'Sudah aktif.', 'client_id', v_reg.client_id);
  END IF;

  -- Buat client baru
  INSERT INTO clients (
    business_name, owner_name, email, whatsapp,
    business_type, address, status, plan,
    plan_starts_at, plan_ends_at
  ) VALUES (
    v_reg.business_name, v_reg.owner_name, v_reg.email, v_reg.whatsapp,
    v_reg.business_type, v_reg.address, 'active', 'pro',
    NOW(), NOW() + INTERVAL '1 month'
  ) RETURNING id INTO v_client_id;

  -- Buat admin user untuk client ini
  INSERT INTO users (
    client_id, username, email, password_hash,
    full_name, role, is_active
  ) VALUES (
    v_client_id,
    v_reg.desired_username,
    v_reg.email,
    v_reg.password_hash,
    v_reg.owner_name,
    'admin',
    TRUE
  ) RETURNING id INTO v_user_id;

  -- Update registration status
  UPDATE registration_requests
  SET status = 'completed', client_id = v_client_id
  WHERE id = p_registration_id;

  -- Update payment record
  UPDATE subscription_payments
  SET status = 'paid', paid_at = NOW()
  WHERE midtrans_order_id = p_midtrans_order_id;

  RETURN jsonb_build_object(
    'success',   TRUE,
    'client_id', v_client_id,
    'user_id',   v_user_id,
    'username',  v_reg.desired_username,
    'message',   'Akun berhasil diaktifkan! Silakan login.'
  );
END;
$$;

-- ============================================================
-- RPC: add_user_to_client
-- Admin tambah kasir baru (password di-hash server-side)
-- ============================================================
CREATE OR REPLACE FUNCTION add_user_to_client(
  p_client_id UUID,
  p_username  TEXT,
  p_email     TEXT,
  p_password  TEXT,
  p_full_name TEXT,
  p_role      TEXT DEFAULT 'kasir'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_user_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Username sudah digunakan.');
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Email sudah digunakan.');
  END IF;

  INSERT INTO users (client_id, username, email, password_hash, full_name, role)
  VALUES (p_client_id, p_username, p_email, crypt(p_password, gen_salt('bf', 10)), p_full_name, p_role::user_role)
  RETURNING id INTO v_user_id;

  RETURN jsonb_build_object('success', TRUE, 'user_id', v_user_id);
END;
$$;

-- ============================================================
-- RPC: create_payment_request
-- Buat record payment di DB, return data untuk Midtrans
-- ============================================================
CREATE OR REPLACE FUNCTION create_payment_request(
  p_client_id       UUID,
  p_registration_id UUID,
  p_plan            TEXT DEFAULT 'pro',
  p_duration_months INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_reg        registration_requests%ROWTYPE;
  v_amount     INTEGER;
  v_order_id   TEXT;
  v_pay_id     UUID;
BEGIN
  -- Harga Pro Plan
  v_amount := 149000 * p_duration_months;

  -- Ambil data dari registration jika ada
  IF p_registration_id IS NOT NULL THEN
    SELECT * INTO v_reg FROM registration_requests WHERE id = p_registration_id;
  END IF;

  -- Generate order ID
  v_order_id := 'MSME-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));

  -- Simpan ke DB
  INSERT INTO subscription_payments (
    client_id, midtrans_order_id, amount, plan, duration_months, status
  ) VALUES (
    p_client_id, v_order_id, v_amount, p_plan::plan_type, p_duration_months, 'pending'
  ) RETURNING id INTO v_pay_id;

  -- Update registration dengan payment ID
  IF p_registration_id IS NOT NULL THEN
    UPDATE registration_requests SET payment_id = v_pay_id WHERE id = p_registration_id;
  END IF;

  RETURN jsonb_build_object(
    'success',           TRUE,
    'payment_id',        v_pay_id,
    'midtrans_order_id', v_order_id,
    'amount',            v_amount,
    'owner_name',        COALESCE(v_reg.owner_name, ''),
    'email',             COALESCE(v_reg.email, '')
  );
END;
$$;
