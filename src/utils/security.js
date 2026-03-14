// ============================================================
// MSME GROW POS - Security Utilities
// Proteksi: brute force, XSS, input sanitization, CSRF-like token
// ============================================================

// ── 1. RATE LIMITER LOGIN ────────────────────────────────────
// Maks 5 percobaan dalam 15 menit per identifier
const ATTEMPT_KEY  = 'msme_login_attempts'
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000  // 15 menit
const LOCKOUT_MS   = 30 * 60 * 1000  // 30 menit lockout

export const checkLoginRateLimit = (identifier) => {
  const id = (identifier || '').toLowerCase().trim()
  try {
    const raw  = sessionStorage.getItem(ATTEMPT_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const entry = data[id] || { count: 0, firstAt: Date.now(), lockedUntil: 0 }
    const now = Date.now()

    // Masih di-lockout?
    if (entry.lockedUntil && now < entry.lockedUntil) {
      const sisa = Math.ceil((entry.lockedUntil - now) / 60000)
      return { allowed: false, reason: `Terlalu banyak percobaan. Coba lagi dalam ${sisa} menit.` }
    }

    // Window sudah lewat → reset
    if (now - entry.firstAt > WINDOW_MS) {
      data[id] = { count: 0, firstAt: now, lockedUntil: 0 }
      sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(data))
      return { allowed: true }
    }

    // Masih dalam window
    if (entry.count >= MAX_ATTEMPTS) {
      data[id] = { ...entry, lockedUntil: now + LOCKOUT_MS }
      sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(data))
      return { allowed: false, reason: 'Akun terkunci 30 menit karena terlalu banyak percobaan gagal.' }
    }

    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}

export const recordLoginFailure = (identifier) => {
  const id = (identifier || '').toLowerCase().trim()
  try {
    const raw  = sessionStorage.getItem(ATTEMPT_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const entry = data[id] || { count: 0, firstAt: Date.now(), lockedUntil: 0 }
    data[id] = { ...entry, count: entry.count + 1 }
    sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(data))
  } catch {}
}

export const clearLoginAttempts = (identifier) => {
  const id = (identifier || '').toLowerCase().trim()
  try {
    const raw  = sessionStorage.getItem(ATTEMPT_KEY)
    const data = raw ? JSON.parse(raw) : {}
    delete data[id]
    sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(data))
  } catch {}
}

export const getRemainingAttempts = (identifier) => {
  const id = (identifier || '').toLowerCase().trim()
  try {
    const raw  = sessionStorage.getItem(ATTEMPT_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const entry = data[id]
    if (!entry) return MAX_ATTEMPTS
    const now = Date.now()
    if (now - entry.firstAt > WINDOW_MS) return MAX_ATTEMPTS
    return Math.max(0, MAX_ATTEMPTS - entry.count)
  } catch {
    return MAX_ATTEMPTS
  }
}


// ── 2. INPUT SANITIZATION ────────────────────────────────────
// Hapus karakter berbahaya untuk mencegah XSS & injection

/** Strip semua HTML tags dan encode entitas berbahaya */
export const sanitizeText = (str) => {
  if (typeof str !== 'string') return str
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/** Bersihkan input teks biasa — hapus tag HTML tapi biarkan teks */
export const stripHtml = (str) => {
  if (typeof str !== 'string') return str
  return str.replace(/<[^>]*>/g, '').trim()
}

/** Validasi dan bersihkan username/identifier login */
export const sanitizeIdentifier = (str) => {
  if (typeof str !== 'string') return ''
  return str.replace(/[^a-zA-Z0-9@._\-+]/g, '').slice(0, 100).trim()
}

/** Validasi panjang password */
export const validatePassword = (pw) => {
  if (!pw || pw.length < 6)  return 'Password minimal 6 karakter.'
  if (pw.length > 128)       return 'Password terlalu panjang.'
  return null
}

/** Cek apakah string mengandung karakter SQL injection umum */
export const hasSqlInjection = (str) => {
  const patterns = [/'\s*(or|and)\s*'1'\s*=\s*'1/i, /;\s*(drop|delete|insert|update)\s/i, /--/, /\/\*.*\*\//]
  return patterns.some(p => p.test(str))
}


// ── 3. SESSION INTEGRITY ─────────────────────────────────────
// Tandai session dengan fingerprint sederhana

const FP_KEY = 'msme_sfp'

const getFingerprint = () => {
  const parts = [
    navigator.userAgent || '',
    navigator.language  || '',
    screen.width + 'x' + screen.height,
  ]
  // Hash sederhana (bukan kriptografi, hanya tambahan lapisan)
  let hash = 0
  const str = parts.join('|')
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export const bindSessionFingerprint = () => {
  try { sessionStorage.setItem(FP_KEY, getFingerprint()) } catch {}
}

export const validateSessionFingerprint = () => {
  try {
    const stored = sessionStorage.getItem(FP_KEY)
    if (!stored) return true // belum di-bind, izinkan
    return stored === getFingerprint()
  } catch {
    return true
  }
}


// ── 4. CONTENT SECURITY ──────────────────────────────────────
// Validasi file upload

export const validateImageFile = (file) => {
  if (!file) return { valid: false, error: 'Tidak ada file.' }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' }
  }

  const MAX_SIZE = 2 * 1024 * 1024 // 2MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Ukuran file maksimal 2MB.' }
  }

  return { valid: true }
}

/** Validasi base64 image string */
export const isValidBase64Image = (str) => {
  if (!str || typeof str !== 'string') return false
  return /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(str)
}


// ── 5. ACTIVITY LOG ──────────────────────────────────────────
// Log aksi penting (login gagal, dll) di sessionStorage

const LOG_KEY = 'msme_sec_log'
const MAX_LOG = 50

export const secLog = (event, detail = {}) => {
  try {
    const raw  = sessionStorage.getItem(LOG_KEY)
    const logs = raw ? JSON.parse(raw) : []
    logs.unshift({ ts: new Date().toISOString(), event, ...detail })
    if (logs.length > MAX_LOG) logs.length = MAX_LOG
    sessionStorage.setItem(LOG_KEY, JSON.stringify(logs))
  } catch {}
}

export const getSecLogs = () => {
  try {
    const raw = sessionStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
