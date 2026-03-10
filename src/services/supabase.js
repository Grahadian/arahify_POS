// ============================================================
// MSME GROW POS - Supabase Service
// ============================================================
// Semua operasi database: auth, clients, users, payments
// Install: npm install @supabase/supabase-js
// ============================================================

import { createClient } from '@supabase/supabase-js'

// ── Supabase Client ──────────────────────────────────────────
// Ganti dengan kredensial project Supabase Anda
// Settings → API → Project URL & anon public key
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ============================================================
// AUTH — Login & Session
// ============================================================

/**
 * Login user: cek username+password di tabel users,
 * verifikasi password dengan bcrypt di sisi server (via RPC),
 * return user object + client info jika berhasil.
 *
 * Karena Supabase Auth pakai email, kita buat custom login
 * via Supabase RPC (stored function di PostgreSQL).
 */
export const loginUser = async (username, password) => {
  const { data, error } = await supabase.rpc('login_user', {
    p_username : username.trim(),
    p_password : password,
  })

  if (error) throw new Error(error.message)
  if (!data || !data.success) throw new Error(data?.message || 'Username atau password salah.')

  return data.user // { id, username, email, full_name, role, client_id, client_info, ... }
}

/**
 * Ambil profil user berdasarkan ID (untuk restore session)
 */
export const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, username, email, full_name, role, is_active, client_id,
      clients (
        id, business_name, owner_name, status, plan,
        gs_web_app_url, gs_connected, gs_last_sync,
        plan_ends_at, trial_ends_at
      )
    `)
    .eq('id', userId)
    .eq('is_active', true)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ============================================================
// REGISTRATION — Self-Service Client Signup
// ============================================================

/**
 * Cek apakah email atau username sudah terdaftar
 */
export const checkAvailability = async (email, username) => {
  const [emailCheck, usernameCheck] = await Promise.all([
    supabase.from('users').select('id').eq('email', email).maybeSingle(),
    supabase.from('users').select('id').eq('username', username).maybeSingle(),
  ])
  return {
    emailTaken    : !!emailCheck.data,
    usernameTaken : !!usernameCheck.data,
  }
}

/**
 * Buat registration request (sebelum bayar)
 * Mengembalikan registration_id yang dipakai untuk payment
 */
export const createRegistrationRequest = async (formData) => {
  const { data, error } = await supabase.rpc('create_registration', {
    p_business_name    : formData.businessName,
    p_owner_name       : formData.ownerName,
    p_email            : formData.email,
    p_whatsapp         : formData.whatsapp,
    p_business_type    : formData.businessType,
    p_address          : formData.address,
    p_desired_username : formData.username,
    p_password         : formData.password,
  })

  if (error) throw new Error(error.message)
  return data // { registration_id, client_id (null dulu), order_id }
}

/**
 * Aktivasi client setelah pembayaran sukses
 * Dipanggil dari Midtrans webhook atau setelah payment confirmed
 */
export const activateClientAfterPayment = async (registrationId, midtransOrderId) => {
  const { data, error } = await supabase.rpc('activate_client', {
    p_registration_id  : registrationId,
    p_midtrans_order_id: midtransOrderId,
  })

  if (error) throw new Error(error.message)
  return data // { success, client_id, username }
}

// ============================================================
// CLIENTS — CRUD untuk Superadmin
// ============================================================

/**
 * Ambil semua clients dengan pagination
 */
export const getAllClients = async ({ page = 1, limit = 20, status = null, search = null } = {}) => {
  let query = supabase
    .from('clients')
    .select('*, users(id, username, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`business_name.ilike.%${search}%,email.ilike.%${search}%,owner_name.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { clients: data, total: count }
}

/**
 * Ambil 1 client by ID
 */
export const getClientById = async (clientId) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*, users(*)')
    .eq('id', clientId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Update client (status, gs_web_app_url, plan, dll)
 */
export const updateClient = async (clientId, updates) => {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Update GS Web App URL untuk client (setelah Anda setup GAS)
 */
export const updateClientGSUrl = async (clientId, gsWebAppUrl) => {
  return updateClient(clientId, {
    gs_web_app_url : gsWebAppUrl,
    gs_connected   : false, // reset, user harus connect ulang dari app
  })
}

/**
 * Suspend / aktifkan kembali client
 */
export const setClientStatus = async (clientId, status) => {
  return updateClient(clientId, { status })
}

// ============================================================
// USERS — CRUD untuk Superadmin & Admin Client
// ============================================================

/**
 * Ambil semua user milik satu client
 */
export const getUsersByClient = async (clientId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, full_name, role, is_active, created_at, last_login_at')
    .eq('client_id', clientId)
    .order('role')

  if (error) throw new Error(error.message)
  return data
}

/**
 * Tambah user baru ke client (admin tambah kasir)
 */
export const addUserToClient = async (clientId, userData) => {
  const { data, error } = await supabase.rpc('add_user_to_client', {
    p_client_id : clientId,
    p_username  : userData.username,
    p_email     : userData.email,
    p_password  : userData.password,
    p_full_name : userData.fullName,
    p_role      : userData.role || 'kasir',
  })

  if (error) throw new Error(error.message)
  return data
}

/**
 * Nonaktifkan / aktifkan user
 */
export const setUserActive = async (userId, isActive) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ============================================================
// PAYMENTS — Midtrans Integration
// ============================================================

/**
 * Buat payment record di DB + request token ke Midtrans
 * Mengembalikan snap_token untuk Midtrans Snap popup
 */
export const createPaymentRequest = async ({ clientId, registrationId, plan, durationMonths = 1 }) => {
  // Direct fetch bypass schema cache
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/create_payment_request`, {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'apikey'       : supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      p_client_id       : clientId       ?? null,
      p_registration_id : registrationId ?? null,
      p_plan            : plan           ?? 'pro',
      p_duration_months : durationMonths ?? 1,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.hint || `HTTP ${res.status}`)
  }

  const data = await res.json()
  if (!data || !data.midtrans_order_id) throw new Error('Response tidak valid dari server.')

  // data.midtrans_order_id dan data.amount sudah siap
  // Lanjut ke Midtrans untuk dapat snap_token
  const snapToken = await getMidtransSnapToken({
    orderId    : data.midtrans_order_id,
    amount     : data.amount,
    clientName : data.owner_name,
    clientEmail: data.email,
  })

  return {
    ...data,
    snap_token     : snapToken,
    payment_record : data,
  }
}

/**
 * Request Snap Token dari Midtrans
 * Catatan: di production, ini harus via backend (Node/GAS) 
 * untuk menyembunyikan Server Key. Ini simulasi flow-nya.
 */
export const getMidtransSnapToken = async ({ orderId, amount, clientName, clientEmail }) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const res = await fetch(`${supabaseUrl}/functions/v1/create-midtrans-token`, {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey'      : supabaseKey,
    },
    body: JSON.stringify({
      order_id      : orderId,
      gross_amount  : amount,
      customer_name : clientName  || 'Pelanggan',
      customer_email: clientEmail || 'customer@example.com',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error('Gagal membuat payment token: ' + (err.error || `HTTP ${res.status}`))
  }

  const data = await res.json()
  if (!data.token) throw new Error('Token tidak diterima dari Midtrans.')
  return data.token
}

/**
 * Verifikasi status pembayaran dari Midtrans
 */
export const verifyPaymentStatus = async (orderId) => {
  const { data, error } = await supabase.rpc('verify_payment', {
    p_midtrans_order_id: orderId,
  })

  if (error) throw new Error(error.message)
  return data // { status, client_id, activated }
}

/**
 * Ambil riwayat pembayaran client
 */
export const getPaymentHistory = async (clientId) => {
  const { data, error } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ============================================================
// STATS — untuk Super Admin Dashboard
// ============================================================

export const getSuperAdminStats = async () => {
  const [
    { count: totalClients },
    { count: activeClients },
    { count: pendingClients },
    { data: recentPayments },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).in('status', ['pending', 'trial']),
    supabase.from('subscription_payments')
      .select('amount, paid_at, clients(business_name)')
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(10),
  ])

  const totalRevenue = (recentPayments || []).reduce((s, p) => s + (p.amount || 0), 0)

  return {
    totalClients  : totalClients || 0,
    activeClients : activeClients || 0,
    pendingClients: pendingClients || 0,
    totalRevenue,
    recentPayments: recentPayments || [],
  }
}