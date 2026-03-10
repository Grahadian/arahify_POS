// ============================================================
// MSME GROW POS - Login Page
// Login via Email, fitur Lupa Password & Lupa Akun
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { useUsers } from '@/hooks/useUsers'
import AppLogo from '@/assets/AppLogo'
import { PROMO_SLIDES } from '@/assets/images/imageAssets'

const CONTACT = {
  wa   : 'https://wa.me/6281234567890',
  ig   : 'https://instagram.com/msmegrow.id',
  email: 'mailto:hello@msmegrow.id',
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const callEdge = async (fnName, body) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
    body   : JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// ── Icons ───────────────────────────────────────────────────
const WaIcon = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#25D366"/>
    <path d="M22.9 9.1A9.6 9.6 0 0 0 7.2 20.4L6 26l5.8-1.5a9.6 9.6 0 0 0 11.1-15.4z" fill="#fff"/>
    <path d="M20.5 18.5c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1a8 8 0 0 1-2.3-1.4 8.5 8.5 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6c.1-.2.1-.3.2-.5 0-.2 0-.4-.1-.5-.1-.2-.7-1.6-.9-2.2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4A3 3 0 0 0 10 13c0 1.8 1.3 3.5 1.5 3.7.2.2 2.5 3.9 6.1 5.4 2.1.9 3 1 4 .8.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.5-.4z" fill="#25D366"/>
  </svg>
)
const IgIcon = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
    <defs>
      <radialGradient id="igGrad" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stopColor="#fdf497"/>
        <stop offset="45%" stopColor="#fd5949"/>
        <stop offset="60%" stopColor="#d6249f"/>
        <stop offset="90%" stopColor="#285AEB"/>
      </radialGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#igGrad)"/>
    <circle cx="16" cy="16" r="5.5" stroke="#fff" strokeWidth="2" fill="none"/>
    <circle cx="22.5" cy="9.5" r="1.5" fill="#fff"/>
    <rect x="5" y="5" width="22" height="22" rx="6" stroke="#fff" strokeWidth="2" fill="none"/>
  </svg>
)
const EmailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#EA4335"/>
    <path d="M6 10h20v14H6z" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M6 10l10 9 10-9" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
)

// ── Promo Carousel ───────────────────────────────────────────
const PromoCarousel = () => {
  const [active,    setActive]    = useState(0)
  const [animating, setAnimating] = useState(false)
  const total = PROMO_SLIDES.length

  const goTo = useCallback((idx) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => { setActive(idx); setAnimating(false) }, 250)
  }, [animating])

  useEffect(() => {
    const t = setInterval(() => goTo((active + 1) % total), 4500)
    return () => clearInterval(t)
  }, [active, total, goTo])

  const slide = PROMO_SLIDES[active]

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px 60px', background: slide.bg, opacity: animating ? 0 : 1, transform: animating ? 'translateY(8px)' : 'translateY(0)', transition: animating ? 'opacity 0.2s,transform 0.2s' : 'opacity 0.35s,transform 0.35s,background 0.5s' }}>
        {slide.image ? (
          <img src={slide.image} alt={slide.title} style={{ width: '100%', maxWidth: 320, height: 210, objectFit: 'cover', borderRadius: 20, marginBottom: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
        ) : (
          <div style={{ width: 160, height: 160, borderRadius: 28, background: 'rgba(255,255,255,0.75)', border: `2px solid ${slide.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, fontSize: 72, boxShadow: `0 12px 40px ${slide.accent}18`, backdropFilter: 'blur(8px)' }}>
            {slide.icon}
          </div>
        )}
        <div style={{ background: `${slide.accent}15`, border: `1px solid ${slide.accent}30`, borderRadius: 100, padding: '5px 14px', marginBottom: 14, fontSize: 12, fontWeight: 700, color: slide.accent }}>{slide.badge}</div>
        <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 900, color: '#111827', textAlign: 'center', lineHeight: 1.25, letterSpacing: -0.5, whiteSpace: 'pre-line' }}>{slide.title}</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 1.65, maxWidth: 300 }}>{slide.subtitle}</p>
      </div>
      <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
        {PROMO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 100, border: 'none', cursor: 'pointer', background: i === active ? slide.accent : `${slide.accent}35`, transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>
      {['←', '→'].map((arrow, di) => (
        <button key={arrow} onClick={() => goTo((active + (di === 0 ? -1 : 1) + total) % total)}
          style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [di === 0 ? 'left' : 'right']: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: `1px solid ${slide.accent}20`, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {arrow}
        </button>
      ))}
    </div>
  )
}

// ── Modal: Lupa Password ─────────────────────────────────────
const ForgotPasswordModal = ({ onClose }) => {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const [demoInfo, setDemoInfo] = useState(null) // { token, link }

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) { setError('Masukkan email yang valid.'); return }
    setLoading(true); setError('')
    try {
      const res = await callEdge('reset-password', { action: 'forgot-password', email })
      if (res.demo_token) setDemoInfo({ token: res.demo_token, link: res.demo_link })
      setSent(true)
    } catch (e) {
      setError(e.message || 'Gagal mengirim email. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const inp     = { width: '100%', padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 11, fontSize: 14, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', transition: 'all 0.18s' }
  const focusIn  = e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }
  const focusOut = e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none' }

  return (
    <div style={modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#111827' }}>🔐 Lupa Password</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Masukkan email akun Anda</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 22, padding: 0, lineHeight: 1, marginTop: 2 }}>×</button>
        </div>

        {!sent ? (
          <>
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#DC2626' }}>
                ⚠️ {error}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Terdaftar</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="email@bisnis.com"
                style={inp}
                onFocus={focusIn}
                onBlur={focusOut}
                autoFocus
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
            >
              {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 64, height: 64, background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30 }}>📧</div>
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#111827' }}>Email Terkirim!</h4>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
              Link reset password dikirim ke<br />
              <strong style={{ color: '#2563EB' }}>{email}</strong><br />
              Berlaku selama <strong>30 menit</strong>. Cek inbox & folder spam.
            </p>

            {/* Demo mode info */}
            {demoInfo && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 14px', marginBottom: 16, textAlign: 'left' }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#92400E' }}>🧑‍💻 Demo Mode — RESEND_API_KEY belum diset</p>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#92400E' }}>Token: <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 4, fontSize: 10 }}>{demoInfo.token}</code></p>
                <p style={{ margin: 0, fontSize: 11, color: '#92400E', wordBreak: 'break-all' }}>
                  Link: <a href={demoInfo.link} style={{ color: '#2563EB' }}>{demoInfo.link}</a>
                </p>
              </div>
            )}

            <button onClick={onClose} style={{ width: '100%', padding: '12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
              Kembali ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal: Lupa Akun ─────────────────────────────────────────
const ForgotAccountModal = ({ onClose }) => {
  const [email,        setEmail]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [sent,         setSent]         = useState(false)
  const [error,        setError]        = useState('')
  const [demoUsername, setDemoUsername] = useState('')

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) { setError('Masukkan email yang valid.'); return }
    setLoading(true); setError('')
    try {
      const res = await callEdge('reset-password', { action: 'forgot-account', email })
      if (res.demo_username) setDemoUsername(res.demo_username)
      setSent(true)
    } catch (e) {
      setError(e.message || 'Gagal mengirim email. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const inp     = { width: '100%', padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 11, fontSize: 14, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', transition: 'all 0.18s' }
  const focusIn  = e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }
  const focusOut = e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none' }

  return (
    <div style={modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#111827' }}>👤 Lupa Akun</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Temukan username akun Anda</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 22, padding: 0, lineHeight: 1, marginTop: 2 }}>×</button>
        </div>

        {!sent ? (
          <>
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#DC2626' }}>
                ⚠️ {error}
              </div>
            )}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
                ℹ️ Masukkan email yang terdaftar. Kami akan mengirimkan info username akun Anda ke email tersebut.
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Terdaftar</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="email@bisnis.com"
                style={inp}
                onFocus={focusIn}
                onBlur={focusOut}
                autoFocus
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
            >
              {loading ? 'Mencari...' : 'Kirim Info Akun ke Email'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 64, height: 64, background: '#EFF6FF', border: '2px solid #BFDBFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30 }}>📧</div>
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#111827' }}>Email Terkirim!</h4>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
              Info akun dikirim ke<br />
              <strong style={{ color: '#2563EB' }}>{email}</strong><br />
              Cek inbox & folder spam Anda.
            </p>

            {/* Demo mode info */}
            {demoUsername && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#92400E' }}>🧑‍💻 Demo Mode</p>
                <p style={{ margin: 0, fontSize: 13, color: '#92400E' }}>
                  Username: <strong style={{ fontSize: 16, color: '#2563EB' }}>{demoUsername}</strong>
                </p>
              </div>
            )}

            <button onClick={onClose} style={{ width: '100%', padding: '12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
              Kembali ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal: Reset Password (dari link email) ──────────────────
const ResetPasswordModal = ({ token, onClose }) => {
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [passConf,    setPassConf]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState('')
  const [tokenValid,  setTokenValid]  = useState(null) // null=loading, true, false

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await callEdge('reset-password', { action: 'verify-reset-token', token })
        setEmail(res.email)
        setTokenValid(true)
      } catch {
        setTokenValid(false)
      }
    }
    if (token) verifyToken()
  }, [token])

  const handleReset = async () => {
    if (!password || password.length < 6) { setError('Password minimal 6 karakter.'); return }
    if (password !== passConf) { setError('Konfirmasi password tidak cocok.'); return }
    setLoading(true); setError('')
    try {
      await callEdge('reset-password', { action: 'do-reset-password', token, new_password: password })
      setSuccess(true)
    } catch (e) {
      setError(e.message || 'Gagal mengubah password. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const inp      = { width: '100%', padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 11, fontSize: 14, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', transition: 'all 0.18s' }
  const focusIn  = e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }
  const focusOut = e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none' }

  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        {tokenValid === null && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #BFDBFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'lSpin 0.8s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Memverifikasi link...</p>
          </div>
        )}

        {tokenValid === false && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 64, height: 64, background: '#FEF2F2', border: '2px solid #FECACA', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30 }}>❌</div>
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#111827' }}>Link Tidak Valid</h4>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
              Link reset password sudah kadaluarsa atau tidak valid.<br />Silakan minta link baru.
            </p>
            <button onClick={onClose} style={{ width: '100%', padding: '12px', background: '#2563EB', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#fff' }}>
              Kembali ke Login
            </button>
          </div>
        )}

        {tokenValid === true && !success && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#111827' }}>🔑 Buat Password Baru</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>untuk akun <strong style={{ color: '#2563EB' }}>{email}</strong></p>
            </div>
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#DC2626' }}>
                ⚠️ {error}
              </div>
            )}
            {[
              { label: 'Password Baru *',        val: password, set: setPassword, ph: 'min. 6 karakter' },
              { label: 'Konfirmasi Password *',   val: passConf, set: setPassConf, ph: 'ulangi password'  },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
                <input type={showPass ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inp} onFocus={focusIn} onBlur={focusOut} />
              </div>
            ))}
            <div onClick={() => setShowPass(!showPass)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', userSelect: 'none' }}>
              <div style={{ width: 18, height: 18, border: `2px solid ${showPass ? '#2563EB' : '#D1D5DB'}`, borderRadius: 5, background: showPass ? '#2563EB' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                {showPass && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Tampilkan password</span>
            </div>
            <button onClick={handleReset} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </>
        )}

        {success && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 64, height: 64, background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30 }}>✅</div>
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#111827' }}>Password Berhasil Diubah!</h4>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>Silakan login dengan password baru Anda.</p>
            <button onClick={onClose} style={{ width: '100%', padding: '13px', background: '#2563EB', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              Masuk Sekarang →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main LoginPage ───────────────────────────────────────────
const LoginPage = ({ onGoRegister }) => {
  const { login }        = useApp()
  const { authenticate } = useUsers()

  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  // Modals
  const [showForgotPass,    setShowForgotPass]    = useState(false)
  const [showForgotAccount, setShowForgotAccount] = useState(false)
  const [resetToken,        setResetToken]        = useState(null)

  // Cek query param ?action=reset-password&token=xxx saat mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'reset-password' && params.get('token')) {
      setResetToken(params.get('token'))
      // Bersihkan URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleLogin = async () => {
    setError('')
    if (!identifier.trim()) { setError('Email wajib diisi.'); return }
    if (!password)          { setError('Password wajib diisi.'); return }
    setLoading(true)
    try {
      const u = await authenticate(identifier.trim(), password)
      login(u)
    } catch (e) {
      setError(e.message || 'Email atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  const inp      = { width: '100%', padding: '13px 16px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#FAFAFA', color: '#111827', boxSizing: 'border-box', transition: 'all 0.2s' }
  const onFocus  = e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }
  const onBlur   = e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>

      {/* LEFT — Carousel */}
      <div className="login-left-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRight: '1px solid #F1F5F9', minHeight: '100vh' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '18px 24px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AppLogo size={32} showText={false} variant="color" />
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 14, color: '#111827', lineHeight: 1.1 }}>MSME Grow</p>
            <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>Point of Sale</p>
          </div>
        </div>
        <PromoCarousel />
      </div>

      {/* RIGHT — Form */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 44px', overflowY: 'auto', minHeight: '100vh', boxSizing: 'border-box' }}>

        {/* Mobile brand */}
        <div className="login-mobile-brand" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <AppLogo size={36} showText={false} variant="color" />
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#111827' }}>MSME Grow</p>
            <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>Point of Sale System</p>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 900, color: '#111827', letterSpacing: -0.5 }}>Selamat Datang 👋</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>Masuk untuk mengelola bisnis Anda</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>⚠️</span>
            <span style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 }}>Email</label>
          <input
            type="email"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="email@bisnis.com"
            autoComplete="email"
            style={inp}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>
            Admin bisnis: gunakan email · Superadmin: gunakan username
          </p>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Masukkan password"
              autoComplete="current-password"
              style={{ ...inp, paddingRight: 46 }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
              {showPass
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Lupa password & lupa akun links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22, gap: 8 }}>
          <button
            onClick={() => setShowForgotPass(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Lupa password?
          </button>
          <button
            onClick={() => setShowForgotAccount(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Lupa akun / username?
          </button>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', padding: '14px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}
          onMouseEnter={e => !loading && (e.currentTarget.style.background = '#1D4ED8')}
          onMouseLeave={e => !loading && (e.currentTarget.style.background = '#2563EB')}
        >
          {loading
            ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'lSpin 0.8s linear infinite' }} />Memverifikasi...</>
            : 'Masuk ke Dashboard →'
          }
        </button>

        {/* Register Button */}
        {onGoRegister && (
          <button
            onClick={onGoRegister}
            style={{ width: '100%', padding: '13px', background: '#fff', border: '2px solid #E5E7EB', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#374151', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 28 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.background = '#EFF6FF' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = '#fff' }}
          >
            🚀 Daftar Sekarang — Rp 149.000/bulan
          </button>
        )}

        {/* Contact */}
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20 }}>
          <p style={{ margin: '0 0 14px', fontSize: 11, color: '#9CA3AF', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Hubungi Kami</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <a href={CONTACT.wa}    target="_blank" rel="noreferrer" title="WhatsApp"  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', border: '1.5px solid #BBF7D0', transition: 'all 0.15s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}><WaIcon /></a>
            <a href={CONTACT.ig}    target="_blank" rel="noreferrer" title="Instagram" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: '#FDF4FF', border: '1.5px solid #E9D5FF', transition: 'all 0.15s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}><IgIcon /></a>
            <a href={CONTACT.email} target="_blank" rel="noreferrer" title="Email"     style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', border: '1.5px solid #FECACA', transition: 'all 0.15s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}><EmailIcon /></a>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showForgotPass    && <ForgotPasswordModal onClose={() => setShowForgotPass(false)} />}
      {showForgotAccount && <ForgotAccountModal  onClose={() => setShowForgotAccount(false)} />}
      {resetToken        && <ResetPasswordModal  token={resetToken} onClose={() => setResetToken(null)} />}

      <style>{`
        @keyframes lSpin { to { transform: rotate(360deg); } }
        input::placeholder { color: #D1D5DB; }
        @media (max-width: 768px) {
          .login-left-panel   { display: none !important; }
          .login-mobile-brand { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: '16px', backdropFilter: 'blur(4px)',
  fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
}
const modalCard = {
  background: '#fff', borderRadius: 20, padding: '28px 28px',
  width: '100%', maxWidth: 420,
  boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
  border: '1px solid #E5E7EB',
}

export default LoginPage
