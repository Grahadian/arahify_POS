import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import AppLayout from '@/components/layout/AppLayout'
import AppLogo from '@/assets/AppLogo'

import LoginPage           from '@/pages/auth/LoginPage'
import RegisterAuthPage    from '@/pages/auth/RegisterPage'
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard'
import DashboardPage       from '@/pages/admin/DashboardPage'
import ReportsPage         from '@/pages/admin/ReportsPage'
import SettingsPage        from '@/pages/admin/SettingsPage'
import KasirSettingsPage   from '@/pages/kasir/KasirSettingsPage'
import KasirOrdersPage     from '@/pages/kasir/KasirOrdersPage'
import KasirInventoryPage  from '@/pages/kasir/KasirInventoryPage'
import RegisterPOSPage     from '@/pages/kasir/RegisterPage'
import InventoryPage       from '@/pages/kasir/InventoryPage'
import MembersPage         from '@/pages/kasir/MembersPage'
import Lottie              from "lottie-react";
import loadingAnimation    from "@/assets/loading.json";


// ── Loadingscreen ────────────────────────────────────
const LoadingScreen = ({ message = "Menyiapkan sistem kasir..." }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <div style={{ width: 180 }}>
        <Lottie animationData={loadingAnimation} loop={true} />
      </div>

      <h2>MSME Grow POS</h2>
      <p>{message}</p>
    </div>
  );
};

// ── Admin Re-Login Screen ────────────────────────────────────
const AdminLoginScreen = ({ onSuccess, onCancel }) => {
  const { login, authenticate } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)

  const handleSubmit = async () => {
    if (!username || !password) { setError('Username dan password wajib diisi'); return }
    setLoading(true); setError('')
    try {
      const userData = await authenticate(username, password)
      if (userData?.role === 'admin') {
        login(userData)
        onSuccess()
      } else {
        setError('Username/password salah atau bukan akun Admin')
      }
    } catch (e) {
      setError(e?.message || 'Login gagal, coba lagi')
    }
    setLoading(false)
  }

  const inp = { width:'100%', padding:'12px 14px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#FAFAFA' }

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ width:'100%', maxWidth:400, background:'#fff', borderRadius:20, padding:32, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', border:'1px solid #F1F5F9' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:56, height:56, background:'#EFF6FF', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:900, color:'#111827' }}>Konfirmasi Admin</h2>
          <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>Masukkan kredensial Admin untuk melanjutkan</p>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="username admin" onKeyDown={e=>e.key==='Enter'&&handleSubmit()} style={inp} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Password</label>
          <div style={{ position:'relative' }}>
            <input value={password} onChange={e=>setPassword(e.target.value)} type={showPw?'text':'password'} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&handleSubmit()} style={{ ...inp, paddingRight:42 }} />
            <button onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:2 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{showPw?<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
            </button>
          </div>
        </div>
        {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 12px', marginBottom:14, fontSize:12, color:'#DC2626', fontWeight:600 }}>⚠ {error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', padding:'13px', background:loading?'#93C5FD':'#2563EB', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', marginBottom:10 }}>
          {loading ? 'Memverifikasi...' : '🔓 Masuk sebagai Admin →'}
        </button>
        <button onClick={onCancel} style={{ width:'100%', padding:'11px', background:'none', color:'#6B7280', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          Batal
        </button>
      </div>
    </div>
  )
}

// ── Kasir PIN Screen ─────────────────────────────────────────
const KasirPinScreen = ({ onSuccess, onCancel, savedPin }) => {
  const [pin,   setPin]   = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const verify = (code) => {
    const correct = savedPin && savedPin.length === 6 ? savedPin : '123456'
    if (code === correct) { onSuccess() }
    else {
      setError(savedPin && savedPin.length === 6 ? 'PIN salah, coba lagi' : 'PIN default: 123456 (atur di Pengaturan → Pajak & Kasir)')
      setShake(true)
      setTimeout(() => { setShake(false); setPin('') }, 700)
    }
  }

  const handleDigit = (d) => {
    if (pin.length >= 6) return
    const next = pin + d
    setPin(next); setError('')
    if (next.length === 6) setTimeout(() => verify(next), 120)
  }

  const handleDel = () => setPin(p => p.slice(0, -1))
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ width:'100%', maxWidth:340, background:'#fff', borderRadius:20, padding:'32px 28px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', border:'1px solid #F1F5F9' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:56, height:56, background:'#ECFDF5', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:900, color:'#111827' }}>PIN Kasir</h2>
          <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>Masukkan 6 digit PIN untuk masuk</p>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:8, animation:shake?'pinShake 0.5s ease':'none' }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ width:16, height:16, borderRadius:'50%', border:'2px solid', borderColor:i<pin.length?'#059669':'#E5E7EB', background:i<pin.length?'#059669':'transparent', transition:'all 0.15s' }} />
          ))}
        </div>
        {error ? <p style={{ textAlign:'center', fontSize:12, color:'#DC2626', fontWeight:600, margin:'8px 0 16px' }}>{error}</p> : <div style={{ height:32 }} />}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {digits.map((d, i) => {
            if (d === '') return <div key={i} />
            const isDel = d === '⌫'
            return (
              <button key={i} onClick={() => isDel ? handleDel() : handleDigit(d)}
                style={{ padding:'16px', background:isDel?'#FEF2F2':'#F9FAFB', border:'1.5px solid', borderColor:isDel?'#FECACA':'#E5E7EB', borderRadius:12, fontSize:isDel?18:22, fontWeight:700, color:isDel?'#DC2626':'#111827', cursor:'pointer', fontFamily:'inherit', transition:'all 0.1s' }}
                onMouseDown={e=>e.currentTarget.style.transform='scale(0.93)'}
                onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
                {d}
              </button>
            )
          })}
        </div>
        <button onClick={onCancel} style={{ width:'100%', marginTop:18, padding:'11px', background:'none', color:'#6B7280', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          Batal
        </button>
      </div>
      <style>{`@keyframes pinShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
    </div>
  )
}

// ── Role Select Screen ───────────────────────────────────────
const RoleSelectScreen = ({ user, onSelectAdmin, onSelectKasir }) => {
  const roles = [
    { key:'admin', icon:'🏢', title:'Admin / Manajer', desc:'Akses penuh: Dashboard, Laporan, Inventori, Pengaturan & Kasir', color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE' },
    { key:'kasir', icon:'🛒', title:'Kasir',            desc:'Akses terbatas: POS, Laporan transaksi & Produk (lihat saja)', color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
  ]
  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ width:'100%', maxWidth:480 }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><AppLogo size={52} showText={false} variant="color" /></div>
          <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:900, color:'#111827', letterSpacing:-0.5 }}>Halo, {user?.name||user?.username}! 👋</h1>
          <p style={{ margin:0, fontSize:14, color:'#6B7280' }}>Pilih mode akses untuk sesi ini</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:24 }}>
          {roles.map(r => (
            <button key={r.key} onClick={() => r.key==='admin' ? onSelectAdmin() : onSelectKasir()}
              style={{ width:'100%', padding:'20px 22px', textAlign:'left', background:r.bg, border:`2px solid ${r.border}`, borderRadius:16, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', gap:16 }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px ${r.color}22`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
              <div style={{ width:52, height:52, borderRadius:14, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0, border:`1.5px solid ${r.border}` }}>{r.icon}</div>
              <div style={{ flex:1 }}>
                <p style={{ margin:'0 0 4px', fontSize:16, fontWeight:800, color:r.color }}>{r.title}</p>
                <p style={{ margin:0, fontSize:12, color:'#6B7280', lineHeight:1.5 }}>{r.desc}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'#9CA3AF' }}>Anda bisa berpindah mode kapan saja dengan logout</p>
      </div>
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────
const App = () => {
  const { isAuthenticated, user, currentPage, initialized, navigate, settings } = useApp()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function initApp() {

    // delay supaya animasi selesai
    await new Promise(resolve => setTimeout(resolve, 3500));

    setLoading(false);
  }

  initApp();
}, []);

  const prevAuthRef   = useRef(false)
  const [showLoader,  setShowLoader]  = useState(false)
  const [loaderMsg,   setLoaderMsg]   = useState('Memuat...')
  const [screen,      setScreen]      = useState('role') // 'role'|'adminLogin'|'kasirPin'|'app'
  const [selectedMode,setSelectedMode]= useState(null)

  const showLoad = (msg, ms, cb) => {
    setLoaderMsg(msg); setShowLoader(true)
    setTimeout(() => { setShowLoader(false); cb?.() }, ms)
  }

  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current) {
      const role = user?.role
      if (role === 'admin')       showLoad('Memuat akun...', 800, () => setScreen('role'))
      else if (role === 'kasir')  showLoad('Memuat akun...', 800, () => setScreen('kasirPin'))
      else                        showLoad('Memuat...', 900, () => setScreen('app'))
    }
    if (!isAuthenticated) { setScreen('role'); setSelectedMode(null) }
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated, user])

  if (!initialized) return <LoadingScreen message="Memuat aplikasi..." />
  if (showLoader)   return <LoadingScreen message={loaderMsg} />

  if (!isAuthenticated) {
    if (currentPage === 'register') return <RegisterAuthPage onGoLogin={() => navigate('login')} />
    return <LoginPage onGoRegister={() => navigate('register')} />
  }

  if (user?.role === 'superadmin') return <SuperAdminDashboard />

  if (screen === 'role') {
    return <RoleSelectScreen user={user}
      onSelectAdmin={() => setScreen('adminLogin')}
      onSelectKasir={() => setScreen('kasirPin')} />
  }

  if (screen === 'adminLogin') {
    return <AdminLoginScreen
      onSuccess={() => showLoad('Membuka dashboard admin...', 900, () => { setSelectedMode('admin'); setScreen('app') })}
      onCancel={() => setScreen('role')} />
  }

  if (screen === 'kasirPin') {
    return <KasirPinScreen
      savedPin={settings?.kasirPin || ''}
      onSuccess={() => showLoad('Menyiapkan kasir POS...', 900, () => { setSelectedMode('kasir'); setScreen('app') })}
      onCancel={() => setScreen('role')} />
  }

  const isAdminMode = selectedMode === 'admin'

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard' : return isAdminMode ? <DashboardPage />  : <RegisterPOSPage />
      case 'reports'   : return isAdminMode ? <ReportsPage />    : <KasirOrdersPage />
      case 'register'  : return <RegisterPOSPage />
      case 'orders'    : return isAdminMode ? <ReportsPage />    : <KasirOrdersPage />
      case 'inventory' : return isAdminMode ? <InventoryPage />   : <KasirInventoryPage />
      case 'members'   : return isAdminMode ? <MembersPage />    : <RegisterPOSPage />
      case 'settings'  : return isAdminMode ? <SettingsPage />        : <KasirSettingsPage />
      default          : return isAdminMode ? <DashboardPage />  : <RegisterPOSPage />
    }
  }

  return <AppLayout isAdminMode={isAdminMode} selectedMode={selectedMode}>{renderPage()}</AppLayout>
}

export default App
