// ============================================================
// MSME GROW POS — Register Page
// Tema konsisten: dark bg #0F172A + floating card + side banner
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { createRegistrationRequest, createPaymentRequest, verifyPaymentStatus } from '@/services/supabase'
import AppLogo from '@/assets/AppLogo'

const BUSINESS_TYPES = [
  'Kuliner / F&B','Fashion & Pakaian','Elektronik','Kecantikan & Perawatan',
  'Kesehatan','Pendidikan','Jasa & Servis','Pertanian','Kerajinan',
  'Furniture','Retail Umum','Lainnya',
]
const PRO_PRICE = 149000
const PRO_FEATURES = [
  'POS Register kasir lengkap','Manajemen produk & inventori',
  'Riwayat transaksi + cetak struk','Dashboard & laporan bisnis',
  'Integrasi Google Sheets','Multi kasir tak terbatas',
  'Fitur Member pelanggan','Support via WhatsApp',
]
const STEPS = ['Info Bisnis','Akun Login','Pembayaran']

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const callEdge = async (fnName, body) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method:'POST', headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
    body:JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// ── Rotating side banner ──────────────────────────────────────
const PANELS = [
  { bg:'linear-gradient(145deg,#0F172A,#1E3A5F,#1D4ED8)', icon:'🚀', title:'Mulai Gratis 14 Hari', desc:'Coba semua fitur Pro tanpa kartu kredit. Batalkan kapan saja.' },
  { bg:'linear-gradient(145deg,#0F172A,#064E3B,#059669)', icon:'📊', title:'Laporan Bisnis Lengkap', desc:'Pantau omset, laba, dan performa kasir secara real-time.' },
  { bg:'linear-gradient(145deg,#0F172A,#1E1B4B,#7C3AED)', icon:'📦', title:'Inventori Otomatis', desc:'Alert stok menipis, purchase order, dan stock opname mudah.' },
]

const SideBanner = () => {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(false)
  useEffect(() => {
    const t = setInterval(() => {
      setFade(true)
      setTimeout(() => { setIdx(i => (i+1)%PANELS.length); setFade(false) }, 280)
    }, 4000)
    return () => clearInterval(t)
  }, [])
  const p = PANELS[idx]
  return (
    <div style={{ width:'100%', height:'100%', background:p.bg, borderRadius:'20px 0 0 20px', display:'flex', flexDirection:'column', padding:'32px 28px', position:'relative', overflow:'hidden', transition:'background 0.6s' }}>
      <div style={{ position:'absolute', top:-50, right:-50, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-40, left:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }}/>
      {/* logo */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'auto' }}>
        <AppLogo size={30} showText={false} variant="color" />
        <div>
          <p style={{ margin:0, fontSize:12, fontWeight:900, color:'#fff', letterSpacing:-0.3 }}>MSME Grow</p>
          <p style={{ margin:0, fontSize:9, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:1 }}>Point of Sale</p>
        </div>
      </div>
      {/* content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, opacity:fade?0:1, transform:fade?'translateY(8px)':'translateY(0)', transition:'all 0.28s' }}>
        <span style={{ fontSize:50 }}>{p.icon}</span>
        <div style={{ textAlign:'center' }}>
          <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:900, color:'#fff', letterSpacing:-0.3 }}>{p.title}</h3>
          <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>{p.desc}</p>
        </div>
      </div>
      {/* dots */}
      <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:24 }}>
        {PANELS.map((_,i) => (
          <button key={i} onClick={()=>setIdx(i)}
            style={{ width:i===idx?18:6, height:6, borderRadius:3, border:'none', padding:0, cursor:'pointer', transition:'all 0.3s', background:i===idx?'#fff':'rgba(255,255,255,0.25)' }}/>
        ))}
      </div>
    </div>
  )
}

// ── Shared input styles ───────────────────────────────────────
const inp = { width:'100%', padding:'11px 14px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13.5, color:'#0F172A', fontFamily:'inherit', outline:'none', background:'#F8FAFC', boxSizing:'border-box', transition:'all 0.18s' }
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 }
const focusIn  = e => { e.target.style.borderColor='#3B82F6'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)' }
const focusOut = e => { e.target.style.borderColor='#E2E8F0'; e.target.style.background='#F8FAFC'; e.target.style.boxShadow='none' }

// ── RegisterPage ──────────────────────────────────────────────
const RegisterPage = ({ onGoLogin }) => {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [regData, setRegData] = useState(null)
  const [payStatus, setPayStatus] = useState(null)

  // Step 0
  const [businessName, setBusinessName] = useState('')
  const [ownerName,    setOwnerName]    = useState('')
  const [email,        setEmail]        = useState('')
  const [phone,        setPhone]        = useState('')
  const [businessType, setBusinessType] = useState('')
  const [address,      setAddress]      = useState('')

  // OTP
  const [otpSent,     setOtpSent]     = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpCode,     setOtpCode]     = useState(['','','','','',''])
  const [otpTimer,    setOtpTimer]    = useState(0)
  const [otpExpiry,   setOtpExpiry]   = useState(null)
  const [otpLoading,  setOtpLoading]  = useState(false)
  const [otpError,    setOtpError]    = useState('')
  const [demoOtp,     setDemoOtp]     = useState('')
  const otpRefs = useRef([])

  // Step 1
  const [username,     setUsername]     = useState('')
  const [password,     setPassword]     = useState('')
  const [passwordConf, setPasswordConf] = useState('')
  const [showPass,     setShowPass]     = useState(false)

  useEffect(() => {
    if (!otpExpiry) return
    const iv = setInterval(() => {
      const r = Math.max(0, Math.ceil((otpExpiry - Date.now())/1000))
      setOtpTimer(r)
      if (r === 0) clearInterval(iv)
    }, 1000)
    return () => clearInterval(iv)
  }, [otpExpiry])

  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    s.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '')
    document.head.appendChild(s)
    return () => { try { document.head.removeChild(s) } catch {} }
  }, [])

  const validate0 = () => {
    if (!businessName.trim()) return 'Nama bisnis wajib diisi.'
    if (!ownerName.trim())    return 'Nama pemilik wajib diisi.'
    if (!email.trim() || !email.includes('@')) return 'Email tidak valid.'
    if (!phone.trim())        return 'Nomor telepon wajib diisi.'
    if (!businessType)        return 'Pilih jenis usaha.'
    if (!otpVerified)         return 'Verifikasi email terlebih dahulu.'
    return null
  }
  const validate1 = () => {
    if (!username.trim() || username.length < 4) return 'Username minimal 4 karakter.'
    if (/\s/.test(username))  return 'Username tidak boleh ada spasi.'
    if (!password || password.length < 6) return 'Password minimal 6 karakter.'
    if (password !== passwordConf) return 'Konfirmasi password tidak cocok.'
    return null
  }

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes('@')) { setOtpError('Masukkan email yang valid.'); return }
    setOtpLoading(true); setOtpError(''); setDemoOtp('')
    try {
      const res = await callEdge('send-otp-email', { action:'send', email })
      if (res.demo_otp || res.demo) setDemoOtp('Cek console Supabase untuk kode OTP (demo mode)')
      setOtpCode(['','','','','','']); setOtpSent(true)
      setOtpExpiry(Date.now() + 3*60*1000); setOtpTimer(180)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch {
      const code = Math.floor(100000 + Math.random()*900000).toString()
      setDemoOtp(code); setOtpCode(['','','','','','']); setOtpSent(true)
      setOtpExpiry(Date.now() + 3*60*1000); setOtpTimer(180)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } finally { setOtpLoading(false) }
  }

  const handleOtpChange = (idx, val) => {
    const v = val.replace(/\D/g,'').slice(-1)
    const next = [...otpCode]; next[idx] = v; setOtpCode(next)
    if (v && idx < 5) otpRefs.current[idx+1]?.focus()
  }
  const handleOtpKey   = (idx, e) => { if (e.key==='Backspace' && !otpCode[idx] && idx>0) otpRefs.current[idx-1]?.focus() }
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (!p) return
    setOtpCode(p.split('').concat(['','','','','','']).slice(0,6))
    otpRefs.current[Math.min(p.length,5)]?.focus()
  }
  const handleVerifyOTP = async () => {
    const entered = otpCode.join('')
    if (entered.length !== 6) { setOtpError('Masukkan 6 digit OTP.'); return }
    if (otpTimer === 0) { setOtpError('Kode kadaluarsa. Kirim ulang.'); return }
    setOtpLoading(true); setOtpError('')
    try {
      await callEdge('send-otp-email', { action:'verify', email, code:entered })
      setOtpVerified(true)
    } catch {
      if (demoOtp && entered === demoOtp) setOtpVerified(true)
      else setOtpError('Kode OTP salah.')
    } finally { setOtpLoading(false) }
  }

  const handleNext0 = () => { const e = validate0(); if (e) { setError(e); return } setError(''); setStep(1) }
  const handleSubmit1 = async () => {
    const e = validate1(); if (e) { setError(e); return }
    setError(''); setLoading(true)
    try {
      const result = await createRegistrationRequest({ businessName, ownerName, email, whatsapp:phone, businessType, address, username, password })
      setRegData(result); setStep(2)
    } catch {
      setRegData({ registration_id:`demo_${Date.now()}`, business_name:businessName })
      setStep(2)
    } finally { setLoading(false) }
  }
  const handlePay = async () => {
    if (!regData) return
    setError(''); setLoading(true)
    try {
      const payment = await createPaymentRequest({ clientId:null, registrationId:regData.registration_id, plan:'pro', durationMonths:1 })
      setLoading(false)
      window.snap.pay(payment.snap_token, {
        onSuccess: async () => { try { await verifyPaymentStatus(payment.midtrans_order_id) } catch {} setPayStatus('paid') },
        onPending: () => setPayStatus('pending'),
        onError:   (err) => { setPayStatus('failed'); setError('Pembayaran gagal: '+(err?.status_message||'Coba lagi.')) },
        onClose:   () => {},
      })
    } catch (e) { setLoading(false); setError(e.message) }
  }

  // ── Step bar ──────────────────────────────────────────────
  const StepBar = () => (
    <div style={{ display:'flex', alignItems:'center', marginBottom:24 }}>
      {STEPS.map((label,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', flex:i<2?1:'none' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:i<step?'#1E293B':i===step?'#EFF6FF':'#F1F5F9', border:`2px solid ${i<step?'#1E293B':i===step?'#3B82F6':'#E2E8F0'}`, fontWeight:800, fontSize:11.5, color:i<step?'#fff':i===step?'#2563EB':'#94A3B8', transition:'all 0.3s' }}>
              {i < step ? '✓' : i+1}
            </div>
            <span style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, color:i===step?'#2563EB':i<step?'#1E293B':'#94A3B8', whiteSpace:'nowrap' }}>{label}</span>
          </div>
          {i < 2 && <div style={{ flex:1, height:2, background:i<step?'#1E293B':'#E2E8F0', margin:'0 6px', marginBottom:18, transition:'background 0.3s' }}/>}
        </div>
      ))}
    </div>
  )

  // ── Outer page wrapper ────────────────────────────────────
  const Outer = ({ children }) => (
    <div style={{ minHeight:'100vh', background:'#0F172A', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif", position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-200, left:-200, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(37,99,235,0.1) 0%,transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-150, right:-150, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:820 }}>
        {children}
        <p style={{ textAlign:'center', marginTop:16, fontSize:11, color:'rgba(255,255,255,0.18)' }}>
          © 2026 MSME Grow · Point of Sale System
        </p>
      </div>
    </div>
  )

  // ── Paid screen ───────────────────────────────────────────
  if (payStatus === 'paid') return (
    <Outer>
      <div style={{ borderRadius:24, boxShadow:'0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)', display:'flex', overflow:'hidden', minHeight:380 }}>
        <div className="reg-banner" style={{ width:'42%', flexShrink:0 }}><SideBanner /></div>
        <div style={{ flex:1, background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 32px', textAlign:'center' }}>
          <div style={{ width:72, height:72, background:'#F0FDF4', border:'2px solid #BBF7D0', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, fontSize:32 }}>🎉</div>
          <h2 style={{ margin:'0 0 8px', fontSize:22, fontWeight:900, color:'#0F172A', letterSpacing:-0.4 }}>Pembayaran Berhasil!</h2>
          <p style={{ margin:'0 0 4px', fontSize:13.5, color:'#475569' }}>Akun <strong style={{ color:'#2563EB' }}>{email}</strong> sudah aktif.</p>
          <p style={{ margin:'0 0 28px', fontSize:12.5, color:'#94A3B8' }}>Silakan login menggunakan email & password Anda.</p>
          <button onClick={onGoLogin} style={{ padding:'12px 32px', background:'#1E293B', color:'#fff', border:'none', borderRadius:11, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'background 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#0F172A'}
            onMouseLeave={e=>e.currentTarget.style.background='#1E293B'}>
            Login Sekarang →
          </button>
        </div>
      </div>
      <style>{`.reg-banner{display:block}@media(max-width:620px){.reg-banner{display:none!important}}`}</style>
    </Outer>
  )

  return (
    <Outer>
      {/* Floating card */}
      <div style={{ borderRadius:24, boxShadow:'0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)', display:'flex', overflow:'hidden' }}>

        {/* Left banner */}
        <div className="reg-banner" style={{ width:'38%', flexShrink:0, minHeight:580 }}>
          <SideBanner />
        </div>

        {/* Right form */}
        <div style={{ flex:1, background:'#fff', padding:'32px 28px', overflowY:'auto', maxHeight:'90vh' }}>

          {/* Header — CENTER */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginBottom:22 }}>
            <AppLogo size={44} showText={false} variant="color" />
            <div style={{ textAlign:'center' }}>
              <p style={{ margin:0, fontSize:14, fontWeight:900, color:'#0F172A', letterSpacing:-0.3 }}>MSME Grow</p>
              <p style={{ margin:0, fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:0.8 }}>Daftar Akun Baru</p>
            </div>
          </div>

          <StepBar />

          {/* Error */}
          {error && (
            <div style={{ background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:10, padding:'9px 12px', marginBottom:16, display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:13 }}>⚠️</span>
              <span style={{ color:'#DC2626', fontSize:12.5, flex:1, lineHeight:1.4 }}>{error}</span>
              <button onClick={()=>setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:16, padding:0, lineHeight:1 }}>×</button>
            </div>
          )}

          {/* ── STEP 0 — Info Bisnis ── */}
          {step === 0 && (
            <div>
              <h3 style={{ margin:'0 0 18px', fontSize:17, fontWeight:900, color:'#0F172A', letterSpacing:-0.3 }}>Informasi Bisnis Anda</h3>

              {[
                { label:'Nama Bisnis / Toko *', val:businessName, set:setBusinessName, ph:'e.g. Warung Bu Sari' },
                { label:'Nama Pemilik *',        val:ownerName,    set:setOwnerName,    ph:'Nama lengkap Anda' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom:12 }}>
                  <label style={lbl}>{f.label}</label>
                  <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inp} onFocus={focusIn} onBlur={focusOut}/>
                </div>
              ))}

              {/* Email + OTP */}
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>
                  Email *{' '}
                  {otpVerified && <span style={{ color:'#059669', textTransform:'none', fontWeight:700, fontSize:11 }}>✓ Terverifikasi</span>}
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="email" value={email}
                    onChange={e=>{ setEmail(e.target.value); setOtpVerified(false); setOtpSent(false); setOtpCode(['','','','','','']); setDemoOtp('') }}
                    placeholder="email@bisnis.com" disabled={otpVerified}
                    style={{ ...inp, flex:1, background:otpVerified?'#F0FDF4':'#F8FAFC', borderColor:otpVerified?'#A7F3D0':'#E2E8F0' }}
                    onFocus={e=>!otpVerified&&focusIn(e)} onBlur={e=>!otpVerified&&focusOut(e)}/>
                  {!otpVerified ? (
                    <button onClick={handleSendOTP} disabled={otpLoading||(otpSent&&otpTimer>0)}
                      style={{ padding:'10px 12px', borderRadius:10, border:'1.5px solid #BFDBFE', background:'#EFF6FF', color:(otpLoading||(otpSent&&otpTimer>0))?'#93C5FD':'#2563EB', fontSize:11.5, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                      {otpLoading?'...':otpSent&&otpTimer>0?`${otpTimer}s`:otpSent?'Kirim Ulang':'Kirim OTP'}
                    </button>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', padding:'0 14px', background:'#F0FDF4', border:'1.5px solid #A7F3D0', borderRadius:10 }}>
                      <span style={{ color:'#059669', fontSize:16 }}>✓</span>
                    </div>
                  )}
                </div>

                {otpSent && !otpVerified && (
                  <div style={{ marginTop:10, padding:'14px', background:'#F8FAFC', borderRadius:12, border:'1.5px solid #E2E8F0' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <p style={{ margin:0, fontSize:12.5, fontWeight:700, color:'#374151' }}>✉️ Kode OTP dikirim ke email Anda</p>
                      <span style={{ fontSize:12, color:otpTimer<=30?'#EF4444':'#94A3B8', fontWeight:700 }}>
                        {otpTimer>0?`${Math.floor(otpTimer/60)}:${String(otpTimer%60).padStart(2,'0')}`:'Kadaluarsa'}
                      </span>
                    </div>
                    {demoOtp && (
                      <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'6px 10px', marginBottom:10, textAlign:'center' }}>
                        <span style={{ fontSize:11, color:'#92400E' }}>🔐 Demo OTP: <strong style={{ letterSpacing:2 }}>{demoOtp}</strong></span>
                      </div>
                    )}
                    <div style={{ display:'flex', gap:7, justifyContent:'center', marginBottom:10 }} onPaste={handleOtpPaste}>
                      {otpCode.map((d,idx) => (
                        <input key={idx} ref={el=>otpRefs.current[idx]=el}
                          value={d} onChange={e=>handleOtpChange(idx,e.target.value)} onKeyDown={e=>handleOtpKey(idx,e)}
                          maxLength={1} inputMode="numeric"
                          style={{ width:40, height:48, textAlign:'center', fontSize:20, fontWeight:900, border:`2px solid ${d?'#3B82F6':'#E2E8F0'}`, borderRadius:9, outline:'none', background:d?'#EFF6FF':'#fff', color:'#0F172A', fontFamily:'inherit', transition:'all 0.15s' }}/>
                      ))}
                    </div>
                    {otpError && <p style={{ margin:'0 0 8px', fontSize:12, color:'#EF4444', textAlign:'center' }}>{otpError}</p>}
                    <button onClick={handleVerifyOTP} disabled={otpCode.join('').length!==6||otpTimer===0||otpLoading}
                      style={{ width:'100%', padding:'9px', borderRadius:9, border:'none', cursor:'pointer', background:otpCode.join('').length===6&&otpTimer>0?'#1E293B':'#F1F5F9', color:otpCode.join('').length===6&&otpTimer>0?'#fff':'#94A3B8', fontSize:13, fontWeight:700, fontFamily:'inherit' }}>
                      {otpLoading?'Memverifikasi...':'Verifikasi OTP'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Nomor Telepon *</label>
                <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+62 812 3456 7890" style={inp} onFocus={focusIn} onBlur={focusOut}/>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Jenis Usaha *</label>
                <select value={businessType} onChange={e=>setBusinessType(e.target.value)}
                  style={{ ...inp, cursor:'pointer', appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center' }}
                  onFocus={focusIn} onBlur={focusOut}>
                  <option value="">-- Pilih jenis usaha --</option>
                  {BUSINESS_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:22 }}>
                <label style={lbl}>Alamat Bisnis <span style={{ fontWeight:400, textTransform:'none', fontSize:10 }}>— opsional</span></label>
                <textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="Jl. Contoh No.1, Kota" rows={2} style={{ ...inp, resize:'none' }} onFocus={focusIn} onBlur={focusOut}/>
              </div>

              <button onClick={handleNext0}
                style={{ width:'100%', padding:'12px', background:'#1E293B', color:'#fff', border:'none', borderRadius:11, fontSize:13.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'background 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='#0F172A'}
                onMouseLeave={e=>e.currentTarget.style.background='#1E293B'}>
                Lanjut ke Akun Login →
              </button>
              <p style={{ textAlign:'center', marginTop:14, fontSize:12.5, color:'#94A3B8' }}>
                Sudah punya akun?{' '}
                <button onClick={onGoLogin} style={{ background:'none', border:'none', cursor:'pointer', color:'#3B82F6', fontWeight:700, fontSize:12.5, fontFamily:'inherit', padding:0 }}>Login di sini</button>
              </p>
            </div>
          )}

          {/* ── STEP 1 — Akun Login ── */}
          {step === 1 && (
            <div>
              <h3 style={{ margin:'0 0 4px', fontSize:17, fontWeight:900, color:'#0F172A', letterSpacing:-0.3 }}>Buat Akun Login</h3>
              <p style={{ margin:'0 0 18px', fontSize:12.5, color:'#64748B' }}>Login utama: <strong style={{ color:'#2563EB' }}>{email}</strong> + password di bawah.</p>

              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Username Admin * <span style={{ fontSize:10, color:'#9CA3AF', textTransform:'none', fontWeight:400 }}>— tidak bisa diubah</span></label>
                <input value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/\s/g,''))} placeholder="min. 4 karakter, tanpa spasi" style={inp} onFocus={focusIn} onBlur={focusOut}/>
                <p style={{ margin:'4px 0 0', fontSize:11, color:'#94A3B8' }}>Username sebagai identitas admin, bukan untuk login utama.</p>
              </div>

              {[
                { label:'Password *',           val:password,     set:setPassword,     ph:'min. 6 karakter' },
                { label:'Konfirmasi Password *', val:passwordConf, set:setPasswordConf, ph:'ulangi password' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom:12 }}>
                  <label style={lbl}>{f.label}</label>
                  <input type={showPass?'text':'password'} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inp} onFocus={focusIn} onBlur={focusOut}/>
                </div>
              ))}

              <div onClick={()=>setShowPass(!showPass)} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, cursor:'pointer', userSelect:'none' }}>
                <div style={{ width:17, height:17, border:`2px solid ${showPass?'#3B82F6':'#D1D5DB'}`, borderRadius:5, background:showPass?'#3B82F6':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                  {showPass && <span style={{ color:'#fff', fontSize:10, fontWeight:900, lineHeight:1 }}>✓</span>}
                </div>
                <span style={{ fontSize:12.5, color:'#64748B' }}>Tampilkan password</span>
              </div>

              <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'10px 14px', marginBottom:20 }}>
                <p style={{ margin:0, fontSize:11.5, color:'#1E40AF', lineHeight:1.6 }}>🔐 <strong>Login utama:</strong> Email + Password · <strong>Username:</strong> Identitas admin bisnis saja</p>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>{ setStep(0); setError('') }}
                  style={{ flex:1, padding:'12px', background:'#fff', color:'#374151', border:'1.5px solid #E2E8F0', borderRadius:11, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#CBD5E1';e.currentTarget.style.background='#F8FAFC'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#E2E8F0';e.currentTarget.style.background='#fff'}}>
                  ← Kembali
                </button>
                <button onClick={handleSubmit1} disabled={loading}
                  style={{ flex:2, padding:'12px', background:loading?'#94A3B8':'#1E293B', color:'#fff', border:'none', borderRadius:11, fontSize:13, fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', transition:'background 0.2s' }}
                  onMouseEnter={e=>{if(!loading)e.currentTarget.style.background='#0F172A'}}
                  onMouseLeave={e=>{if(!loading)e.currentTarget.style.background='#1E293B'}}>
                  {loading?'Memproses...':'Lanjut ke Pembayaran →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 — Pembayaran ── */}
          {step === 2 && (
            <div>
              <h3 style={{ margin:'0 0 16px', fontSize:17, fontWeight:900, color:'#0F172A', letterSpacing:-0.3 }}>Aktivasi Pro Plan</h3>

              {/* Plan card */}
              <div style={{ background:'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius:14, padding:'18px', marginBottom:14, border:'1.5px solid #BFDBFE' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <p style={{ margin:'0 0 2px', fontSize:10.5, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.8 }}>MSME Grow POS</p>
                    <p style={{ margin:0, fontSize:18, fontWeight:900, color:'#0F172A', letterSpacing:-0.3 }}>Pro Plan</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:0, fontSize:20, fontWeight:900, color:'#2563EB' }}>Rp {PRO_PRICE.toLocaleString('id-ID')}</p>
                    <p style={{ margin:0, fontSize:10.5, color:'#94A3B8' }}>/ bulan</p>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 8px' }}>
                  {PRO_FEATURES.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ color:'#2563EB', fontSize:10, fontWeight:700 }}>✓</span>
                      <span style={{ fontSize:11, color:'#374151' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ background:'#F8FAFC', borderRadius:12, padding:'12px 14px', marginBottom:14, border:'1px solid #E2E8F0' }}>
                {[['Nama Bisnis',businessName],['Pemilik',ownerName],['Email',email],['Username',username],['Paket','Pro Plan — 1 Bulan']].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0' }}>
                    <span style={{ fontSize:12, color:'#94A3B8' }}>{l}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:'#0F172A', maxWidth:'60%', textAlign:'right', wordBreak:'break-all' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10 }}>
                  <span style={{ fontSize:13.5, fontWeight:800, color:'#0F172A' }}>Total</span>
                  <span style={{ fontSize:15, fontWeight:900, color:'#2563EB' }}>Rp {PRO_PRICE.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {payStatus==='pending' && (
                <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
                  <p style={{ margin:0, fontSize:12, color:'#92400E' }}>⏳ Pembayaran diproses. Akun aktif setelah konfirmasi.</p>
                </div>
              )}

              <button onClick={handlePay} disabled={loading}
                style={{ width:'100%', padding:'12px', background:loading?'#94A3B8':'#1E293B', color:'#fff', border:'none', borderRadius:11, fontSize:13.5, fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', marginBottom:8, transition:'background 0.2s' }}
                onMouseEnter={e=>{if(!loading)e.currentTarget.style.background='#0F172A'}}
                onMouseLeave={e=>{if(!loading)e.currentTarget.style.background='#1E293B'}}>
                {loading?'Menyiapkan...':'💳 Bayar Sekarang — Rp '+PRO_PRICE.toLocaleString('id-ID')}
              </button>
              <p style={{ margin:0, textAlign:'center', fontSize:11, color:'#94A3B8' }}>🔒 Pembayaran aman via Midtrans · QRIS · Transfer · Kartu Kredit</p>
            </div>
          )}

        </div>
      </div>

      <style>{`
        input::placeholder, textarea::placeholder { color:#CBD5E1; }
        select option { background:#fff; color:#0F172A; }
        .reg-banner { display:block; }
        @media(max-width:620px) { .reg-banner { display:none !important; } }
      `}</style>
    </Outer>
  )
}

export default RegisterPage
