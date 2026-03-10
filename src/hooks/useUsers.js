// ============================================================
// MSME GROW POS - useUsers Hook
// ============================================================
// Jika VITE_SUPABASE_URL sudah diisi di .env → pakai Supabase
// Jika belum → pakai DEMO_USERS (mode offline/development)
// ============================================================

import { useCallback } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const USE_SUPABASE = SUPABASE_URL && !SUPABASE_URL.includes('YOUR_PROJECT')

// ── Demo users (aktif jika Supabase belum dikonfigurasi) ─────
const DEMO_USERS = [
  { id:'su1', username:'superadmin', password:'superadmin123', role:'superadmin', name:'Super Admin MSME Grow',  email:'superadmin@msmegrow.id', clientId:null,          clientBusinessName:'MSME Grow', gsWebAppUrl:'' },
  { id:'u1',  username:'admin',      password:'admin123',      role:'admin',      name:'Admin Demo',             email:'admin@msmegrow.id',       clientId:'client_demo', clientBusinessName:'Toko Demo MSME', gsWebAppUrl:'' },
  { id:'u2',  username:'kasir',      password:'kasir123',      role:'kasir',      name:'Budi Santoso',           email:'kasir@msmegrow.id',       clientId:'client_demo', clientBusinessName:'Toko Demo MSME', gsWebAppUrl:'' },
  { id:'u3',  username:'kasir2',     password:'kasir456',      role:'kasir',      name:'Siti Rahayu',            email:'kasir2@msmegrow.id',      clientId:'client_demo', clientBusinessName:'Toko Demo MSME', gsWebAppUrl:'' },
]

const demoAuthenticate = (username, password) => {
  const user = DEMO_USERS.find(
    u => (u.username === username || u.email === username) && u.password === password
  )
  if (!user) throw new Error('Username atau password salah.')
  const { password: _, ...safe } = user
  return safe
}

// ── Supabase authenticate (lazy import agar tidak crash jika belum setup) ──
const supabaseAuthenticate = async (username, password) => {
  const { loginUser } = await import('@/services/supabase')
  const user = await loginUser(username, password)
  return {
    id                 : user.id,
    username           : user.username,
    email              : user.email,
    name               : user.full_name,
    role               : user.role,
    clientId           : user.client_id,
    gsWebAppUrl        : user.client_info?.gs_web_app_url  || '',
    gsConnected        : user.client_info?.gs_connected     || false,
    clientBusinessName : user.client_info?.business_name    || '',
    clientStatus       : user.client_info?.status           || null,
    clientPlan         : user.client_info?.plan             || null,
    planEndsAt         : user.client_info?.plan_ends_at     || null,
    trialEndsAt        : user.client_info?.trial_ends_at    || null,
  }
}

const supabaseRefreshUser = async (userId) => {
  try {
    const { getUserById } = await import('@/services/supabase')
    const data = await getUserById(userId)
    if (!data) return null
    const c = data.clients
    return {
      id                 : data.id,
      username           : data.username,
      email              : data.email,
      name               : data.full_name,
      role               : data.role,
      clientId           : data.client_id,
      gsWebAppUrl        : c?.gs_web_app_url  || '',
      gsConnected        : c?.gs_connected     || false,
      clientBusinessName : c?.business_name    || '',
      clientStatus       : c?.status           || null,
      clientPlan         : c?.plan             || null,
      planEndsAt         : c?.plan_ends_at     || null,
      trialEndsAt        : c?.trial_ends_at    || null,
    }
  } catch {
    return null
  }
}

// ── Hook ──────────────────────────────────────────────────────
export const useUsers = () => {

  const authenticate = useCallback(async (username, password) => {
    if (USE_SUPABASE) {
      return await supabaseAuthenticate(username, password)
    }
    return demoAuthenticate(username, password)
  }, [])

  const refreshUser = useCallback(async (userId) => {
    if (USE_SUPABASE) {
      return await supabaseRefreshUser(userId)
    }
    // Demo mode: kembalikan dari session storage saja
    return null
  }, [])

  const isAdmin      = useCallback((u) => u?.role === 'admin',      [])
  const isKasir      = useCallback((u) => u?.role === 'kasir',      [])
  const isSuperAdmin = useCallback((u) => u?.role === 'superadmin', [])

  return { authenticate, refreshUser, isAdmin, isKasir, isSuperAdmin, isDemoMode: !USE_SUPABASE }
}
