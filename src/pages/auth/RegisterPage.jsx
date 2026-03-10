// ============================================================
// MSME GROW POS - Register Page
// OTP via Email (Supabase Edge Function)
// No. Telepon wajib (tanpa OTP)
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { createRegistrationRequest, createPaymentRequest, verifyPaymentStatus } from '@/services/supabase'
import AppLogo from '@/assets/AppLogo'

const BUSINESS_TYPES = [
  'Kuliner / F&B','Fashion & Pakaian','Elektronik','Kecantikan & Perawatan',
  'Kesehatan','Pendidikan','Jasa & Servis','Pertanian','Kerajinan',
  'Furniture','Retail Umum','Lainnya',
]
const PRO_PRICE    = 149000
const PRO_FEATURES = [
  'POS Register kasir lengkap','Manajemen produk & inventori',
  'Riwayat transaksi + cetak struk','Dashboard & laporan bisnis',
  'Integrasi Google Sheets','Multi kasir tak terbatas',
  'Fitur Member pelanggan','Support via WhatsApp',
]
const STEPS = ['Info Bisnis', 'Akun Login', 'Pembayaran']

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

// ─────────────────────────────────────────────────────────────

const RegisterPage = ({ onGoLogin }) => {
  const [step,      setStep]      = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [regData,   setRegData]   = useState(null)
  const [payStatus, setPayStatus] = useState(null)

  // ── Step 0: Info Bisnis ──
  const [businessName, setBusinessName] = useState('')
  const [ownerName,    setOwnerName]    = useState('')
  const [email,        setEmail]        = useState('')
  const [phone,        setPhone]        = useState('')
  const [businessType, setBusinessType] = useState('')
  const [address,      setAddress]      = useState('')

  // ── OTP Email ──
  const [otpSent,     setOtpSent]     = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpCode,     setOtpCode]     = useState(['','','','','',''])
  const [otpTimer,    setOtpTimer]    = useState(0)
  const [otpExpiry,   setOtpExpiry]   = useState(null)
  const [otpLoading,  setOtpLoading]  = useState(false)
  const [otpError,    setOtpError]    = useState('')
  const [demoOtp,     setDemoOtp]     = useState('')
  const otpRefs = useRef([])

  // ── Step 1: Akun ──
  const [username,     setUsername]     = useState('')
  const [password,     setPassword]     = useState('')
  const [passwordConf, setPasswordConf] = useState('')
  const [showPass,     setShowPass]     = useState(false)

  // Timer countdown OTP
  useEffect(() => {
    if (!otpExpiry) return
    const iv = setInterval(() => {
      const r = Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000))
      setOtpTimer(r)
      if (r === 0) clearInterval(iv)
    }, 1000)
    return () => clearInterval(iv)
  }, [otpExpiry])

  // Load Midtrans Snap
  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    s.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '')
    document.head.appendChild(s)
    return () => { try { document.head.removeChild(s) } catch {} }
  }, [])

  // ── Validasi ──
  const validate0 = () => {
    if (!businessName.trim()) return 'Nama bisnis wajib diisi.'
    if (!ownerName.trim())    return 'Nama pemilik wajib diisi.'
    if (!email.trim() || !email.includes('@')) return 'Email tidak valid.'
    if (!otpVerified)         return 'Verifikasi email terlebih dahulu.'
    if (!phone.trim())        return 'Nomor telepon wajib diisi.'
    if (!businessType)        return 'Pilih jenis usaha.'
    return null
  }
  const validate1 = () => {
    if (!username.trim() || username.length < 4) return 'Username minimal 4 karakter.'
    if (/\s/.test(username))  return 'Username tidak boleh ada spasi.'
    if (!password || password.length < 6) return 'Password minimal 6 karakter.'
    if (password !== passwordConf) return 'Konfirmasi password tidak cocok.'
    return null
  }

  // ── OTP Handlers ──
  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes('@')) {
      setOtpError('Masukkan email yang valid terlebih dahulu.')
      return
    }
    setOtpLoading(true); setOtpError(''); setDemoOtp('')
    try {
      const res = await callEdge('send-otp-email', { action: 'send', email })
      if (res.demo && res.demo_otp) setDemoOtp(res.demo_otp)
      setOtpCode(['','','','','',''])
      setOtpSent(true)
      setOtpExpiry(Date.now() + 3 * 60 * 1000)
      setOtpTimer(180)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (e) {
      setOtpError(e.message || 'Gagal mengirim OTP. Coba lagi.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOtpChange = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...otpCode]; next[idx] = v; setOtpCode(next)
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus()
  }
  const handleOtpKey   = (idx, e) => {
    if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!p) return
    setOtpCode(p.split('').concat(['','','','','','']).slice(0, 6))
    otpRefs.current[Math.min(p.length, 5)]?.focus()
  }

  const handleVerifyOTP = async () => {
    const entered = otpCode.join('')
    if (entered.length !== 6) { setOtpError('Masukkan 6 digit OTP.'); return }
    if (otpTimer === 0)       { setOtpError('Kode kadaluarsa. Kirim ulang.'); return }
    setOtpLoading(true); setOtpError('')
    try {
      await callEdge('send-otp-email', { action: 'verify', email, code: entered })
      setOtpVerified(true)
    } catch (e) {
      setOtpError(e.message || 'Kode OTP salah.')
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Navigasi Step ──
  const handleNext0 = () => {
    const e = validate0()
    if (e) { setError(e); return }
    setError(''); setStep(1)
  }

  const handleSubmit1 = async () => {
    const e = validate1()
    if (e) { setError(e); return }
    setError(''); setLoading(true)
    try {
      const result = await createRegistrationRequest({
        businessName, ownerName, email,
        whatsapp: phone, businessType, address,
        username, password,
      })
      setRegData(result); setStep(2)
    } catch (err) {
      console.warn('[Register] fallback demo:', err.message)
      setRegData({ registration_id: `demo_${Date.now()}`, business_name: businessName })
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!regData) return
    setError(''); setLoading(true)
    try {
      const payment = await createPaymentRequest({
        clientId: null, registrationId: regData.registration_id,
        plan: 'pro', durationMonths: 1,
      })
      setLoading(false)
      window.snap.pay(payment.snap_token, {
        onSuccess: async () => {
          try { await verifyPaymentStatus(payment.midtrans_order_id) } catch {}
          setPayStatus('paid')
        },
        onPending: () => setPayStatus('pending'),
        onError  : (err) => { setPayStatus('failed'); setError('Pembayaran gagal: ' + (err?.status_message || 'Coba lagi.')) },
        onClose  : () => {},
      })
    } catch (e) {
      setLoading(false); setError(e.message)
    }
  }

  // ── Styles ──
  const inp      = { width: '100%', padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 11, fontSize: 14, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box', transition: 'all 0.18s' }
  const lbl      = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
  const focusIn  = e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }
  const focusOut = e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none' }

  // ── Success Screen ──
  if (payStatus === 'paid') return (
    <div style={outerStyle}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 36px' }}>
          <div style={{ width: 80, height: 80, background: '#F0FDF4', border: '3px solid #BBF7D0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 38 }}>🎉</div>
          <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 900, color: '#111827' }}>Pembayaran Berhasil!</h2>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: '#6B7280' }}>Akun <strong style={{ color: '#2563EB' }}>{email}</strong> sudah aktif.</p>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: '#9CA3AF' }}>Login menggunakan email & password yang sudah dibuat.</p>
          <button onClick={onGoLogin} style={{ ...btnPrimary, width: '100%', padding: '15px' }}>Masuk Sekarang →</button>
        </div>
      </div>
    </div>
  )

  const StepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < step ? '#2563EB' : i === step ? '#EFF6FF' : '#F9FAFB',
              border: `2px solid ${i < step ? '#2563EB' : i === step ? '#2563EB' : '#E5E7EB'}`,
              fontWeight: 800, fontSize: 12,
              color: i < step ? '#fff' : i === step ? '#2563EB' : '#9CA3AF',
              transition: 'all 0.3s',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: i === step ? '#2563EB' : i < step ? '#2563EB' : '#9CA3AF', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
          {i < 2 && <div style={{ flex: 1, height: 2, background: i < step ? '#2563EB' : '#E5E7EB', margin: '0 8px', marginBottom: 22, transition: 'background 0.3s' }} />}
        </div>
      ))}
    </div>
  )

  return (
    <div style={outerStyle}>
      <div style={{ width: '100%', maxWidth: 540 }}>

        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
          <AppLogo size={38} showText={false} variant="color" />
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 17, color: '#111827' }}>MSME Grow POS</p>
            <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>Daftar akun baru</p>
          </div>
        </div>

        <div style={cardStyle}>
          <StepBar />

          {/* Error Banner */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>⚠️</span>
              <span style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          )}

          {/* ═══════════════════════ STEP 0 ═══════════════════════ */}
          {step === 0 && (
            <div>
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 900, color: '#111827' }}>Informasi Bisnis Anda</h3>

              {/* Nama Bisnis & Pemilik */}
              {[
                { label: 'Nama Bisnis / Toko *', val: businessName, set: setBusinessName, ph: 'e.g. Warung Bu Sari' },
                { label: 'Nama Pemilik *',        val: ownerName,    set: setOwnerName,    ph: 'Nama lengkap Anda'  },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <label style={lbl}>{f.label}</label>
                  <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inp} onFocus={focusIn} onBlur={focusOut} />
                </div>
              ))}

              {/* Email + OTP Verifikasi */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>
                  Email *{' '}
                  {otpVerified && (
                    <span style={{ color: '#16A34A', textTransform: 'none', fontWeight: 700, fontSize: 11 }}>
                      ✓ Terverifikasi
                    </span>
                  )}
                </label>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                      setOtpVerified(false)
                      setOtpSent(false)
                      setOtpCode(['','','','','',''])
                      setDemoOtp('')
                      setOtpError('')
                    }}
                    placeholder="email@bisnis.com"
                    disabled={otpVerified}
                    style={{
                      ...inp, flex: 1,
                      background  : otpVerified ? '#F0FDF4' : '#FAFAFA',
                      borderColor : otpVerified ? '#BBF7D0' : '#E5E7EB',
                    }}
                    onFocus={e => !otpVerified && focusIn(e)}
                    onBlur={e => !otpVerified && focusOut(e)}
                  />
                  {!otpVerified ? (
                    <button
                      onClick={handleSendOTP}
                      disabled={otpLoading || (otpSent && otpTimer > 0)}
                      style={{
                        padding: '12px 14px', borderRadius: 11,
                        border: '1.5px solid #BFDBFE', background: '#EFF6FF',
                        color: (otpLoading || (otpSent && otpTimer > 0)) ? '#93C5FD' : '#2563EB',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        whiteSpace: 'nowrap', fontFamily: 'inherit',
                      }}
                    >
                      {otpLoading ? '...' : otpSent && otpTimer > 0 ? `${otpTimer}s` : otpSent ? 'Kirim Ulang' : 'Kirim OTP'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 11 }}>
                      <span style={{ color: '#16A34A', fontSize: 18 }}>✓</span>
                    </div>
                  )}
                </div>

                {/* OTP Input Box */}
                {otpSent && !otpVerified && (
                  <div style={{ marginTop: 10, padding: '18px', background: '#F8FAFC', borderRadius: 14, border: '1.5px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>
                        📧 Masukkan kode dari email Anda
                      </p>
                      <span style={{ fontSize: 12, color: otpTimer <= 30 ? '#EF4444' : '#9CA3AF', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {otpTimer > 0
                          ? `${Math.floor(otpTimer / 60)}:${String(otpTimer % 60).padStart(2, '0')}`
                          : 'Kadaluarsa'}
                      </span>
                    </div>

                    {/* Demo mode banner */}
                    {demoOtp && (
                      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px', marginBottom: 12, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#92400E' }}>
                          🧑‍💻 <strong>Demo Mode</strong> — RESEND_API_KEY belum diset<br />
                          OTP: <strong style={{ fontSize: 16, letterSpacing: 4, fontVariantNumeric: 'tabular-nums' }}>{demoOtp}</strong>
                        </p>
                      </div>
                    )}

                    {/* 6-digit input */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }} onPaste={handleOtpPaste}>
                      {otpCode.map((d, idx) => (
                        <input
                          key={idx}
                          ref={el => otpRefs.current[idx] = el}
                          value={d}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          onKeyDown={e => handleOtpKey(idx, e)}
                          maxLength={1}
                          inputMode="numeric"
                          style={{
                            width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 900,
                            border: `2px solid ${d ? '#2563EB' : '#E5E7EB'}`,
                            borderRadius: 10, outline: 'none',
                            background: d ? '#EFF6FF' : '#fff',
                            color: '#111827', fontFamily: 'inherit', transition: 'all 0.15s',
                          }}
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#EF4444', textAlign: 'center' }}>{otpError}</p>
                    )}

                    <button
                      onClick={handleVerifyOTP}
                      disabled={otpCode.join('').length !== 6 || otpTimer === 0 || otpLoading}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: (otpCode.join('').length === 6 && otpTimer > 0 && !otpLoading) ? '#2563EB' : '#F3F4F6',
                        color: (otpCode.join('').length === 6 && otpTimer > 0 && !otpLoading) ? '#fff' : '#9CA3AF',
                        fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >
                      {otpLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}
                    </button>

                    <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
                      Tidak menerima email? Cek folder spam atau{' '}
                      <button
                        onClick={handleSendOTP}
                        disabled={otpTimer > 0}
                        style={{ background: 'none', border: 'none', cursor: otpTimer > 0 ? 'not-allowed' : 'pointer', color: otpTimer > 0 ? '#9CA3AF' : '#2563EB', fontSize: 11, fontWeight: 700, padding: 0, fontFamily: 'inherit' }}
                      >
                        kirim ulang
                      </button>
                    </p>
                  </div>
                )}
              </div>

              {/* Nomor Telepon — wajib, tanpa OTP */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Nomor Telepon *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                  style={inp}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </div>

              {/* Jenis Usaha */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Jenis Usaha *</label>
                <select
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  style={{ ...inp, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                  onFocus={focusIn}
                  onBlur={focusOut}
                >
                  <option value="">-- Pilih jenis usaha --</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Alamat — opsional */}
              <div style={{ marginBottom: 24 }}>
                <label style={lbl}>
                  Alamat Bisnis{' '}
                  <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'none', fontWeight: 400 }}>— opsional</span>
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Jl. Contoh No.1, Kota"
                  rows={2}
                  style={{ ...inp, resize: 'none' }}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </div>

              <button onClick={handleNext0} style={{ ...btnPrimary, width: '100%', padding: '14px' }}>
                Lanjut ke Akun Login →
              </button>
            </div>
          )}

          {/* ═══════════════════════ STEP 1 ═══════════════════════ */}
          {step === 1 && (
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#111827' }}>Buat Akun Login</h3>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>
                Login menggunakan <strong style={{ color: '#2563EB' }}>{email}</strong> + password.
              </p>

              {/* Username */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>
                  Username Admin *{' '}
                  <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'none', fontWeight: 400 }}>— tidak bisa diubah</span>
                </label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="min. 4 karakter, tanpa spasi"
                  style={inp}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                  💡 Username hanya sebagai identitas akun admin bisnis Anda.
                </p>
              </div>

              {/* Password */}
              {[
                { label: 'Password *',            val: password,     set: setPassword,     ph: 'min. 6 karakter' },
                { label: 'Konfirmasi Password *', val: passwordConf, set: setPasswordConf, ph: 'ulangi password'  },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <label style={lbl}>{f.label}</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.ph}
                    style={inp}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </div>
              ))}

              <div onClick={() => setShowPass(!showPass)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${showPass ? '#2563EB' : '#D1D5DB'}`, borderRadius: 5, background: showPass ? '#2563EB' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {showPass && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Tampilkan password</span>
              </div>

              {/* Info box */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 22 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
                  🔐 <strong>Login utama:</strong> Email + Password<br />
                  👤 <strong>Username:</strong> Identitas admin bisnis saja (bukan untuk login)
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep(0); setError('') }} style={{ ...btnSecondary, flex: 1, padding: '13px' }}>← Kembali</button>
                <button onClick={handleSubmit1} disabled={loading} style={{ ...btnPrimary, flex: 2, padding: '13px' }}>
                  {loading ? 'Memproses...' : 'Lanjut ke Pembayaran →'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════ STEP 2 ═══════════════════════ */}
          {step === 2 && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 900, color: '#111827' }}>Aktivasi Pro Plan</h3>

              {/* Fitur */}
              <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 16, padding: '20px', marginBottom: 16, border: '1.5px solid #BFDBFE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>MSME Grow POS</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#111827' }}>Pro Plan</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#2563EB' }}>Rp {PRO_PRICE.toLocaleString('id-ID')}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>/ bulan</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
                  {PRO_FEATURES.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#2563EB', fontSize: 11, fontWeight: 700 }}>✓</span>
                      <span style={{ fontSize: 11, color: '#374151' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ringkasan */}
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid #E5E7EB' }}>
                {[['Nama Bisnis', businessName], ['Pemilik', ownerName], ['Email', email], ['Username', username], ['Paket', 'Pro Plan — 1 Bulan']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Total</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#2563EB' }}>Rp {PRO_PRICE.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {payStatus === 'pending' && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>⏳ Pembayaran diproses. Akun aktif setelah konfirmasi.</p>
                </div>
              )}

              <button onClick={handlePay} disabled={loading} style={{ ...btnPrimary, width: '100%', padding: '14px' }}>
                {loading ? 'Menyiapkan...' : `💳 Bayar Sekarang — Rp ${PRO_PRICE.toLocaleString('id-ID')}`}
              </button>
              <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 11, color: '#9CA3AF' }}>
                🔒 Pembayaran aman via Midtrans · QRIS · Transfer · Kartu Kredit
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onGoLogin}
          style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9CA3AF', fontFamily: 'inherit', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#2563EB'}
          onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
        >
          ← Sudah punya akun? Login di sini
        </button>
      </div>
      <style>{`input::placeholder,textarea::placeholder{color:#D1D5DB;}select option{background:#fff;}`}</style>
    </div>
  )
}

const outerStyle   = { minHeight: '100vh', overflowY: 'auto', background: '#F8FAFC', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }
const cardStyle    = { background: '#fff', borderRadius: 20, border: '1px solid #E5E7EB', padding: '28px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }
const btnPrimary   = { borderRadius: 11, border: 'none', cursor: 'pointer', background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }
const btnSecondary = { borderRadius: 11, border: '1.5px solid #E5E7EB', cursor: 'pointer', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s' }

export default RegisterPage
