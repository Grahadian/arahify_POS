import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import AppLayout from '@/components/layout/AppLayout'
import AppLogo from '@/assets/AppLogo'
import Lottie from "lottie-react"
import loadingAnimation from "./assets/loading-animation.json"

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterAuthPage from '@/pages/auth/RegisterPage'
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard'
import DashboardPage from '@/pages/admin/DashboardPage'
import ReportsPage from '@/pages/admin/ReportsPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import ExpensePage from '@/pages/admin/ExpensePage'
import SupplierPage from '@/pages/admin/SupplierPage'
import PurchaseOrderPage from '@/pages/admin/PurchaseOrderPage'
import StockOpnamePage from '@/pages/admin/StockOpnamePage'
import TableManagementPage from '@/pages/admin/TableManagementPage'
import KasirSettingsPage from '@/pages/kasir/KasirSettingsPage'
import KasirOrdersPage from '@/pages/kasir/KasirOrdersPage'
import KasirInventoryPage from '@/pages/kasir/KasirInventoryPage'
import KasirProductTogglePage from '@/pages/kasir/KasirProductTogglePage'
import KasirDashboardPage from '@/pages/kasir/KasirDashboardPage'
import RegisterPOSPage from '@/pages/kasir/RegisterPage'
import InventoryPage from '@/pages/kasir/InventoryPage'
import MembersPage from '@/pages/kasir/MembersPage'
import ShiftPage           from '@/pages/kasir/ShiftPage'
import MemberPointsPage    from '@/pages/kasir/MemberPointsPage'

// ── 1. Komponen Loading Screen (Lottie) ─────────────────────────
const LoadingScreen = ({ message }) => (
  <div style={{ 
    height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', 
    alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#fff' 
  }}>
    <div style={{ width: 220, height: 220 }}>
      <Lottie animationData={loadingAnimation} loop={true} />
    </div>
    <p style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
      {message}
    </p>
  </div>
)

// ── 2. Shared Auth Components ───────────────────────────────────
const AuthBg = ({ children }) => (
  <div style={{
    minHeight:'100vh', background:'#0F172A',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'24px 16px', fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",
    position:'relative', overflow:'hidden',
  }}>
    <div style={{ position:'absolute', top:-200, left:-200, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 70%)', pointerEvents:'none' }}/>
    <div style={{ position:'absolute', bottom:-150, right:-150, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)', pointerEvents:'none' }}/>
    <div style={{ position:'relative', zIndex:1, width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>
      {children}
    </div>
    <p style={{ position:'absolute', bottom:14, left:0, right:0, textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.18)', margin:0 }}>
      © 2026 MSME Grow · Point of Sale System
    </p>
  </div>
)

const AUTH_PANELS = [
  { bg:'linear-gradient(145deg,#0F172A,#1E3A5F,#1D4ED8)', icon:'📊', title:'Laporan Real-Time', desc:'Omset, laba & performa kasir dalam satu dashboard' },
  { bg:'linear-gradient(145deg,#0F172A,#064E3B,#059669)', icon:'📦', title:'Inventori Pintar', desc:'Alert stok, purchase order & stock opname otomatis' },
  { bg:'linear-gradient(145deg,#0F172A,#1E1B4B,#7C3AED)', icon:'🧾', title:'POS Lengkap', desc:'Kasir cepat, struk digital & member loyalty terintegrasi' },
]

const SideBanner = ({ panelIdx = 0 }) => {
  const [idx, setIdx] = useState(panelIdx % AUTH_PANELS.length)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % AUTH_PANELS.length), 3500)
    return () => clearInterval(t)
  }, [])
  const p = AUTH_PANELS[idx]
  return (
    <div style={{ width:'100%', height:'100%', background:p.bg, borderRadius:'20px 0 0 20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'32px 28px', position:'relative', overflow:'hidden', transition:'background 0.6s' }}>
      <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }}/>
      <div style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:8 }}>
        <AppLogo size={30} showText={false} variant="color" />
        <div>
          <p style={{ margin:0, fontSize:12, fontWeight:900, color:'#fff', letterSpacing:-0.3 }}>MSME Grow</p>
          <p style={{ margin:0, fontSize:9, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:1 }}>Point of Sale</p>
        </div>
      </div>
      <div style={{ textAlign:'center', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <span style={{ fontSize:52 }}>{p.icon}</span>
        <div>
          <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:900, color:'#fff', letterSpacing:-0.4 }}>{p.title}</h3>
          <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>{p.desc}</p>
        </div>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {AUTH_PANELS.map((_,i) => (
          <button key={i} onClick={()=>setIdx(i)}
            style={{ width:i===idx?18:6, height:6, borderRadius:3, border:'none', padding:0, cursor:'pointer', transition:'all 0.3s', background:i===idx?'#fff':'rgba(255,255,255,0.25)' }}/>
        ))}
      </div>
    </div>
  )
}

const FloatCard = ({ children, banelIdx, wide = false }) => (
  <div style={{ width:'100%', maxWidth: wide ? 820 : 720, borderRadius:24, boxShadow:'0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)', display:'flex', overflow:'hidden', minHeight:480 }}>
    <div className="auth-banner" style={{ width:'42%', flexShrink:0 }}>
      <SideBanner panelIdx={banelIdx||0} />
    </div>
    <div style={{ flex:1, background:'#fff', display:'flex', flexDirection:'column', justifyContent:'center', padding:'36px 32px', overflowY:'auto' }}>
      {children}
    </div>
  </div>
)

// ── 3. Screen Components ─────────────────────────────────────────
const AdminLoginScreen = ({ onSuccess, onCancel }) => {
  const { authenticate, login } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async () => {
    if (!username || !password) { setError('Username dan password wajib diisi'); return }
    setLoading(true); setError('')
    try {
      const userData = await authenticate(username, password)
      if (userData?.role === 'admin') { login(userData); onSuccess() }
      else setError('Username/password salah atau bukan akun Admin')
    } catch (e) { setError(e?.message || 'Login gagal, coba lagi') }
    setLoading(false)
  }

  const inp = { width:'100%', padding:'11px 14px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:14, outline:'none', background:'#F8FAFC', color:'#0F172A', boxSizing:'border-box' }

  return (
    <AuthBg>
      <div style={{ width:'100%', maxWidth:420, background:'#fff', borderRadius:24, boxShadow:'0 32px 80px rgba(0,0,0,0.5)', padding:'36px 32px' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginBottom:24 }}>
          <AppLogo size={44} showText={false} variant="color" />
          <div style={{ textAlign:'center' }}>
            <p style={{ margin:0, fontSize:14, fontWeight:900 }}>MSME Grow</p>
            <p style={{ margin:0, fontSize:10, color:'#64748B' }}>Admin Access</p>
          </div>
        </div>
        {error && <div style={{ color:'red', fontSize:12, marginBottom:10 }}>{error}</div>}
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username Admin" style={{...inp, marginBottom:12}} />
        <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" style={{...inp, marginBottom:16}} />
        <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', padding:12, background:'#1E293B', color:'#fff', borderRadius:10, cursor:'pointer' }}>
          {loading ? 'Memverifikasi...' : 'Masuk sebagai Admin →'}
        </button>
        <button onClick={onCancel} style={{ width:'100%', marginTop:10, background:'none', border:'none', color:'#64748B', cursor:'pointer' }}>← Kembali</button>
      </div>
    </AuthBg>
  )
}

const KasirPinScreen = ({ onSuccess, onCancel, savedPin }) => {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const verify = (code) => {
    const correct = savedPin || '123456'
    if (code === correct) onSuccess()
    else { setError('PIN Salah'); setPin('') }
  }
  const handleDigit = (d) => {
    if (pin.length >= 6) return
    const next = pin + d; setPin(next)
    if (next.length === 6) setTimeout(() => verify(next), 120)
  }
  return (
    <AuthBg>
      <div style={{ width:'100%', maxWidth:360, background:'#fff', borderRadius:24, padding:'36px 28px', textAlign:'center' }}>
        <AppLogo size={44} showText={false} variant="color" />
        <h2 style={{ fontSize:21, margin:'10px 0' }}>Masukkan PIN</h2>
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:20 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ width:13, height:13, borderRadius:'50%', background:i<pin.length?'#059669':'#E2E8F0' }}/>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(d => (
            <button key={d} onClick={()=> d==='⌫' ? setPin(p=>p.slice(0,-1)) : d==='C'? setPin('') : handleDigit(d)}
              style={{ padding:15, fontSize:20, borderRadius:10, border:'1px solid #E2E8F0', cursor:'pointer' }}>{d}</button>
          ))}
        </div>
        <button onClick={onCancel} style={{ marginTop:20, background:'none', border:'none', color:'#64748B', cursor:'pointer' }}>← Kembali</button>
      </div>
    </AuthBg>
  )
}

const RoleSelectScreen = ({ user, onSelectAdmin, onSelectKasir }) => {
  const initials = (user?.name || user?.username || '?').slice(0,2).toUpperCase()
  return (
    <AuthBg>
      <FloatCard wide>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <AppLogo size={44} showText={false} variant="color" />
          <h3>Halo, {user?.name}!</h3>
          <p style={{ color:'#64748B', fontSize:13 }}>Pilih mode akses untuk sesi ini</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <button onClick={onSelectAdmin} style={{ padding:20, borderRadius:16, border:'1.5px solid #BFDBFE', background:'#EFF6FF', cursor:'pointer' }}>
            <p style={{ fontWeight:900, color:'#1E40AF' }}>Admin</p>
            <span style={{ fontSize:10 }}>Dashboard & Laporan</span>
          </button>
          <button onClick={onSelectKasir} style={{ padding:20, borderRadius:16, border:'1.5px solid #A7F3D0', background:'#ECFDF5', cursor:'pointer' }}>
            <p style={{ fontWeight:900, color:'#065F46' }}>Kasir</p>
            <span style={{ fontSize:10 }}>Transaksi & POS</span>
          </button>
        </div>
      </FloatCard>
    </AuthBg>
  )
}

// ── 4. Main App Component ───────────────────────────────────────
const App = () => {
  const { isAuthenticated, user, currentPage, initialized, navigate, settings } = useApp()

  const [showLoader, setShowLoader] = useState(false)
  const [loaderMsg, setLoaderMsg] = useState('Memuat...')
  const [screen, setScreen] = useState('auth')
  const [selectedMode, setSelectedMode] = useState(null)
  const prevUserIdRef = useRef(null)

  const showLoad = (msg, ms, cb) => {
    setLoaderMsg(msg); setShowLoader(true)
    setTimeout(() => { setShowLoader(false); cb?.() }, ms)
  }

  useEffect(() => {
    if (!initialized) return
    if (!isAuthenticated) {
      setScreen('auth'); setSelectedMode(null); prevUserIdRef.current = null
      return
    }
    const uid = user?.id || user?.username
    if (uid === prevUserIdRef.current) return 
    prevUserIdRef.current = uid

    if (user?.role === 'superadmin') { setScreen('app'); setSelectedMode('superadmin'); return }
    setScreen('role')
  }, [initialized, isAuthenticated, user])

  // Logic Render Kondisional
  if (!initialized) return <LoadingScreen message="Menyiapkan sistem..." />
  if (showLoader)   return <LoadingScreen message={loaderMsg} />

  if (!isAuthenticated) {
    if (currentPage === 'register') return <RegisterAuthPage onGoLogin={() => navigate('login')} />
    return <LoginPage onGoRegister={() => navigate('register')} />
  }

  if (screen === 'auth') return <LoadingScreen message="Memuat profil..." />
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
      savedPin={settings?.kasirPin}
      onSuccess={() => showLoad('Menyiapkan kasir POS...', 700, () => { setSelectedMode('kasir'); setScreen('app') })}
      onCancel={() => setScreen('role')} />
  }

  const isAdminMode = selectedMode === 'admin'

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return isAdminMode ? <DashboardPage /> : <KasirDashboardPage />
      case 'kasir-dashboard': return <KasirDashboardPage />
      case 'reports' : return isAdminMode ? <ReportsPage /> : <KasirOrdersPage />
      case 'kasir-orders' : return <KasirOrdersPage />
      case 'register' : return <RegisterPOSPage />
      case 'inventory' : return isAdminMode ? <InventoryPage /> : <KasirProductTogglePage />
      case 'kasir-inventory': return <KasirInventoryPage />
      case 'kasir-products': return <KasirProductTogglePage />
      case 'members' : return isAdminMode ? <MembersPage /> : <RegisterPOSPage />
      case 'expense' : return isAdminMode ? <ExpensePage /> : <RegisterPOSPage />
      case 'supplier' : return isAdminMode ? <SupplierPage /> : <RegisterPOSPage />
      case 'purchase-order' : return isAdminMode ? <PurchaseOrderPage /> : <RegisterPOSPage />
      case 'stock-opname' : return isAdminMode ? <StockOpnamePage /> : <RegisterPOSPage />
      case 'tables' : return isAdminMode ? <TableManagementPage /> : <RegisterPOSPage />
      case 'kasir-tables'  : return <TableManagementPage />
      case 'member-points' : return <MemberPointsPage />
      case 'shift'         : return <ShiftPage />
      case 'settings' : return isAdminMode ? <SettingsPage /> : <KasirSettingsPage />
      default : return isAdminMode ? <DashboardPage /> : <KasirDashboardPage />
    }
  }

  return (
    <AppLayout isAdminMode={isAdminMode} selectedMode={selectedMode}>
      {renderPage()}
    </AppLayout>
  )
}

export default App