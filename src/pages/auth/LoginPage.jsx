// ============================================================
// MSME GROW POS - Login Page — Floating card, split layout
// Tema konsisten dengan AppLayout (#1E293B navy + #3B82F6 blue)
// ============================================================
import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { useUsers } from '@/hooks/useUsers'
import AppLogo from '@/assets/AppLogo'

const CONTACT = {
  wa:    'https://wa.me/6281234567890',
  ig:    'https://instagram.com/msmegrow.id',
  email: 'mailto:hello@msmegrow.id',
}

// ── Slide data dengan warna tema app ──────────────────────────
const SLIDES = [
  {
    gradient: 'linear-gradient(145deg, #0F172A 0%, #1E3A5F 60%, #1D4ED8 100%)',
    badge: 'POS & Kasir',
    title: 'Transaksi Cepat\ndi Ujung Jari',
    desc: 'Proses penjualan, struk digital, dan laporan shift kasir dalam satu layar.',
    color: '#60A5FA',
    visual: (
      <svg viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:260}}>
        <rect x="20" y="20" width="220" height="140" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
        <rect x="36" y="38" width="90" height="8" rx="4" fill="rgba(255,255,255,0.25)"/>
        <rect x="36" y="54" width="55" height="6" rx="3" fill="rgba(96,165,250,0.4)"/>
        {[0,1,2,3].map(i => (
          <rect key={i} x={36+i*52} y={78} width={44} height={44} rx="10"
            fill={`rgba(96,165,250,${0.08+i*0.04})`}
            stroke="rgba(96,165,250,0.25)" strokeWidth="1.2"/>
        ))}
        {[0,1,2,3].map(i => (
          <rect key={i} x={46+i*52} y={94} width={24} height={5} rx="2.5" fill="rgba(255,255,255,0.3)"/>
        ))}
        {[0,1,2,3].map(i => (
          <rect key={i} x={46+i*52} y={104} width={16} height={4} rx="2" fill="rgba(255,255,255,0.15)"/>
        ))}
        <rect x="36" y="140" width="188" height="8" rx="4" fill="rgba(37,99,235,0.5)"/>
      </svg>
    ),
  },
  {
    gradient: 'linear-gradient(145deg, #0F172A 0%, #064E3B 60%, #059669 100%)',
    badge: 'Laporan Bisnis',
    title: 'Pantau Omset\nReal-Time',
    desc: 'Dashboard laporan harian, mingguan, bulanan — profit & loss langsung terlihat.',
    color: '#34D399',
    visual: (
      <svg viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:260}}>
        <rect x="20" y="20" width="220" height="140" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
        <rect x="36" y="38" width="80" height="8" rx="4" fill="rgba(255,255,255,0.25)"/>
        <rect x="36" y="54" width="50" height="6" rx="3" fill="rgba(52,211,153,0.4)"/>
        {[0,1,2,3,4,5].map((i) => (
          <rect key={i} x={40+i*30} y={170-[55,80,45,100,65,88][i]} width={20} height={[55,80,45,100,65,88][i]-30}
            rx="5" fill={`rgba(52,211,153,${0.2+i*0.06})`} stroke="rgba(52,211,153,0.4)" strokeWidth="1"/>
        ))}
        <polyline points="50,115 80,90 110,105 140,65 170,88 200,72"
          stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        {[50,80,110,140,170,200].map((x,i) => (
          <circle key={i} cx={x} cy={[115,90,105,65,88,72][i]} r="3.5" fill="rgba(52,211,153,0.9)"/>
        ))}
      </svg>
    ),
  },
  {
    gradient: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 60%, #7C3AED 100%)',
    badge: 'Inventori Cerdas',
    title: 'Stok Terkontrol\nOtomatis',
    desc: 'Alert stok menipis, purchase order, dan stock opname — semua terintegrasi.',
    color: '#A78BFA',
    visual: (
      <svg viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:260}}>
        <rect x="20" y="20" width="100" height="65" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(167,139,250,0.2)" strokeWidth="1.2"/>
        <rect x="140" y="20" width="100" height="65" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(167,139,250,0.2)" strokeWidth="1.2"/>
        <rect x="20" y="100" width="100" height="60" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(167,139,250,0.2)" strokeWidth="1.2"/>
        <rect x="140" y="100" width="100" height="60" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(167,139,250,0.2)" strokeWidth="1.2"/>
        <rect x="32" y="34" width="50" height="6" rx="3" fill="rgba(255,255,255,0.3)"/>
        <rect x="32" y="48" width="35" height="14" rx="5" fill="rgba(167,139,250,0.35)"/>
        <rect x="32" y="68" width="70" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>
        <rect x="152" y="34" width="50" height="6" rx="3" fill="rgba(255,255,255,0.3)"/>
        <rect x="152" y="48" width="35" height="14" rx="5" fill="rgba(52,211,153,0.3)"/>
        <rect x="152" y="68" width="70" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>
        <rect x="32" y="114" width="50" height="6" rx="3" fill="rgba(255,255,255,0.3)"/>
        <rect x="32" y="126" width="76" height="4" rx="2" fill="rgba(255,255,255,0.08)"/>
        <rect x="32" y="126" width="50" height="4" rx="2" fill="rgba(167,139,250,0.5)"/>
        <rect x="32" y="136" width="76" height="4" rx="2" fill="rgba(255,255,255,0.08)"/>
        <rect x="32" y="136" width="35" height="4" rx="2" fill="rgba(239,68,68,0.6)"/>
        <rect x="152" y="114" width="50" height="6" rx="3" fill="rgba(255,255,255,0.3)"/>
        <rect x="152" y="128" width="76" height="26" rx="8" fill="rgba(167,139,250,0.15)" stroke="rgba(167,139,250,0.3)" strokeWidth="1"/>
        <rect x="160" y="137" width="48" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>
      </svg>
    ),
  },
]

// ── Banner Carousel ────────────────────────────────────────────
const BannerCarousel = () => {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true)
      setTimeout(() => { setIdx(i => (i + 1) % SLIDES.length); setFading(false) }, 300)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  const s = SLIDES[idx]
  return (
    <div style={{ width:'100%', height:'100%', background: s.gradient, borderRadius:'20px 0 0 20px', display:'flex', flexDirection:'column', padding:'36px 32px', position:'relative', overflow:'hidden', transition:'background 0.6s ease' }}>

      {/* decorative circles */}
      <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-40, left:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }}/>

      {/* badge */}
      <div style={{ alignSelf:'flex-start', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 12px', marginBottom:28 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:1 }}>{s.badge}</span>
      </div>

      {/* illustration */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', opacity: fading ? 0 : 1, transform: fading ? 'translateY(8px)' : 'translateY(0)', transition:'all 0.3s ease' }}>
        {s.visual}
      </div>

      {/* text */}
      <div style={{ opacity: fading ? 0 : 1, transition:'opacity 0.3s ease' }}>
        <h3 style={{ margin:'0 0 8px', fontSize:22, fontWeight:900, color:'#fff', letterSpacing:-0.5, lineHeight:1.3, whiteSpace:'pre-line' }}>{s.title}</h3>
        <p style={{ margin:'0 0 20px', fontSize:12.5, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>{s.desc}</p>
      </div>

      {/* dots */}
      <div style={{ display:'flex', gap:6 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{ width: i===idx ? 20 : 6, height:6, borderRadius:3, border:'none', padding:0, cursor:'pointer', transition:'all 0.3s', background: i===idx ? '#fff' : 'rgba(255,255,255,0.25)' }}/>
        ))}
      </div>
    </div>
  )
}

// ── Main LoginPage ─────────────────────────────────────────────
const LoginPage = ({ onGoRegister }) => {
  const { login } = useApp()
  const { authenticate } = useUsers()
  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [isLocked,   setIsLocked]   = useState(false)

  const handleLogin = async () => {
    setError(''); setIsLocked(false); setLoading(true)
    try {
      const u = await authenticate(identifier.trim(), password)
      login(u)
    } catch (e) {
      const msg = e.message || 'Username atau password salah.'
      if (msg.includes('terkunci') || msg.includes('Terlalu banyak')) setIsLocked(true)
      setError(msg)
    } finally { setLoading(false) }
  }

  const inp = {
    width:'100%', padding:'11px 14px', border:'1.5px solid #E2E8F0',
    borderRadius:10, fontSize:14, fontFamily:'inherit', outline:'none',
    background:'#F8FAFC', color:'#0F172A', boxSizing:'border-box', transition:'all 0.18s',
  }
  const onFocus = e => { e.target.style.borderColor='#3B82F6'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)' }
  const onBlur  = e => { e.target.style.borderColor='#E2E8F0'; e.target.style.background='#F8FAFC'; e.target.style.boxShadow='none' }

  return (
    <div style={{
      minHeight:'100vh',
      background:'#0F172A',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding:'24px 16px',
      fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",
      position:'relative',
      overflow:'hidden',
    }}>

      {/* background glow effects */}
      <div style={{ position:'absolute', top:-200, left:-200, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-150, right:-150, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* ── FLOATING CARD ── */}
      <div style={{
        width:'100%',
        maxWidth:860,
        height:540,
        borderRadius:24,
        boxShadow:'0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
        display:'flex',
        overflow:'hidden',
        position:'relative',
        zIndex:1,
      }}>

        {/* LEFT — Banner carousel */}
        <div className="login-banner" style={{ width:'48%', flexShrink:0, height:'100%' }}>
          <BannerCarousel />
        </div>

        {/* RIGHT — Login form */}
        <div style={{
          flex:1,
          background:'#fff',
          display:'flex',
          flexDirection:'column',
          justifyContent:'center',
          padding:'36px 32px',
          overflowY:'auto',
        }}>

          {/* Logo + brand — CENTER */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginBottom:28 }}>
            <AppLogo size={44} showText={false} variant="color" />
            <div style={{ textAlign:'center' }}>
              <p style={{ margin:0, fontSize:15, fontWeight:900, color:'#0F172A', letterSpacing:-0.3 }}>MSME Grow</p>
              <p style={{ margin:0, fontSize:10.5, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:0.8 }}>Point of Sale</p>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom:22 }}>
            <h1 style={{ margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#0F172A', letterSpacing:-0.5 }}>Masuk Akun</h1>
            <p style={{ margin:0, fontSize:13, color:'#64748B' }}>Selamat datang kembali 👋</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:isLocked?'#FFF7ED':'#FEF2F2', border:`1.5px solid ${isLocked?'#FED7AA':'#FECACA'}`, borderRadius:10, padding:'9px 12px', marginBottom:16, display:'flex', gap:8, alignItems:'flex-start' }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{isLocked?'🔒':'⚠️'}</span>
              <span style={{ color:isLocked?'#C2410C':'#DC2626', fontSize:12.5, flex:1, lineHeight:1.5 }}>{error}</span>
              <button onClick={() => { setError(''); setIsLocked(false) }} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:16, padding:0, lineHeight:1 }}>×</button>
            </div>
          )}

          {/* Username */}
          <div style={{ marginBottom:13 }}>
            <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Username / Email</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleLogin()}
              placeholder="admin atau admin@toko.com"
              autoComplete="username"
              style={inp} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <label style={{ fontSize:11.5, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.5 }}>Password</label>
              <button style={{ background:'none', border:'none', cursor:'pointer', color:'#3B82F6', fontSize:12, fontWeight:600, fontFamily:'inherit', padding:0 }}>
                Lupa Password?
              </button>
            </div>
            <div style={{ position:'relative' }}>
              <input
                type={showPass?'text':'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleLogin()}
                placeholder="Masukkan password"
                autoComplete="current-password"
                style={{ ...inp, paddingRight:82 }}
                onFocus={onFocus} onBlur={onBlur}
              />
              <button onClick={() => setShowPass(v=>!v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#64748B', fontSize:11.5, fontWeight:700, fontFamily:'inherit', padding:'3px 0' }}>
                {showPass?'Sembunyikan':'Tampilkan'}
              </button>
            </div>
          </div>

          {/* Login button — warna brand #1E293B seperti topbar */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width:'100%', marginTop:18, padding:'12px', background:loading?'#94A3B8':'#1E293B', color:'#fff', border:'none', borderRadius:11, fontSize:14, fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', transition:'background 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8, letterSpacing:-0.1 }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.background='#0F172A' }}
            onMouseLeave={e => { if(!loading) e.currentTarget.style.background='#1E293B' }}>
            {loading
              ? <><span style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'lspin 0.75s linear infinite', display:'inline-block' }}/> Masuk...</>
              : 'Masuk →'}
          </button>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0 14px' }}>
            <div style={{ flex:1, height:1, background:'#F1F5F9' }}/>
            <span style={{ fontSize:11, color:'#CBD5E1', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:0.6 }}>Hubungi kami</span>
            <div style={{ flex:1, height:1, background:'#F1F5F9' }}/>
          </div>

          {/* Contact — icon only, ganti src dengan link Imgur Anda */}
          {/* 📌 GANTI ICON: ubah nilai `icon` di bawah dengan URL gambar dari Imgur */}
          {/* Contoh: icon: 'https://i.imgur.com/XXXXX.png' */}
          <div style={{ display:'flex', gap:10 }}>
            {[
              { href:CONTACT.wa,    icon:'https://i.imgur.com/PLACEHOLDER_WA.png',  bg:'#F0FDF4', border:'#BBF7D0', fallback:'💬' },
              { href:CONTACT.ig,    icon:'https://i.imgur.com/PLACEHOLDER_IG.png',  bg:'#FDF4FF', border:'#E9D5FF', fallback:'📸' },
              { href:CONTACT.email, icon:'https://i.imgur.com/PLACEHOLDER_EM.png',  bg:'#FEF2F2', border:'#FECACA', fallback:'✉️' },
            ].map((s,i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'10px', background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, textDecoration:'none', transition:'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <img src={s.icon} alt="" width={24} height={24} style={{ objectFit:'contain' }}
                  onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='block' }}/>
                <span style={{ fontSize:20, display:'none' }}>{s.fallback}</span>
              </a>
            ))}
          </div>

          {/* Register */}
          {onGoRegister && (
            <p style={{ textAlign:'center', marginTop:16, fontSize:12.5, color:'#94A3B8', marginBottom:0 }}>
              Bisnis baru?{' '}
              <button onClick={onGoRegister} style={{ background:'none', border:'none', cursor:'pointer', color:'#3B82F6', fontWeight:700, fontFamily:'inherit', fontSize:12.5, padding:0 }}>
                Daftar Sekarang
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <p style={{ position:'absolute', bottom:16, left:0, right:0, textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.18)', margin:0 }}>
        © 2026 MSME Grow · Point of Sale System
      </p>

      <style>{`
        @media (max-width: 640px) {
          .login-banner { display: none !important; }
        }
        .login-banner { height: 100%; }
        @keyframes lspin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

export default LoginPage
