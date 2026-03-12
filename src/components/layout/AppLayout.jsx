// ============================================================
// MSME GROW POS - AppLayout v3.0 — Professional, no emoji
// ============================================================
import { useState, useCallback, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import Icon from '@/components/ui/Icon'
import AppLogo from '@/assets/AppLogo'

const ADMIN_NAV = [
 { id:'dashboard', icon:'dashboard', label:'Dashboard' },
 { id:'reports', icon:'reports', label:'Laporan' },
 { id:'register', icon:'register', label:'POS' },
 { id:'inventory', icon:'inventory', label:'Inventori' },
 { id:'members', icon:'members', label:'Member' },
 { id:'expense', icon:'expense', label:'Pengeluaran' },
 { id:'supplier', icon:'supplier', label:'Supplier' },
 { id:'purchase-order', icon:'po', label:'Pembelian' },
 { id:'stock-opname', icon:'opname', label:'Stok Opname' },
 { id:'tables', icon:'table', label:'Meja' },
 { id:'settings', icon:'settings', label:'Pengaturan' },
]
const KASIR_NAV = [
 { id:'kasir-dashboard', icon:'dashboard', label:'Dashboard' },
 { id:'register', icon:'register', label:'POS' },
 { id:'shift', icon:'shift', label:'Shift' },
 { id:'kasir-orders', icon:'orders', label:'Transaksi' },
 { id:'member-points', icon:'loyalty', label:'Poin' },
 { id:'settings', icon:'settings', label:'Setting' },
]
const PAGE_TITLES = {
 dashboard:'Business Overview', reports:'Laporan & Analitik',
 register:'POS Register', inventory:'Inventori & Produk',
 members:'Data Member', expense:'Pengeluaran',
 shift:'Shift Kasir', settings:'Pengaturan',
 supplier:'Data Supplier', 'purchase-order':'Purchase Order',
 'stock-opname':'Stock Opname', tables:'Manajemen Meja',
 'kasir-dashboard':'Dashboard Kasir', 'kasir-orders':'Riwayat Transaksi',
 'kasir-tables':'Manajemen Meja',
 'member-points':'Riwayat Poin Member',
}

const CART_MIN = 260, CART_MAX = 480, CART_DEFAULT = 300

const AppLayout = ({ children, isAdminMode = false }) => {
 const { user, settings, gsConfig, currentPage, navigate } = useApp()
 const isAdmin = isAdminMode

 const navItems = isAdmin
 ? ADMIN_NAV.filter(n => n.id !== 'tables' || settings?.tableEnabled)
 : [...KASIR_NAV.filter(n => n.id !== 'kasir-tables'), ...(settings?.tableEnabled ? [{ id:'kasir-tables', icon:'table', label:'Meja' }] : [])]

 const [cartWidth, setCartWidth] = useState(CART_DEFAULT)
 const dragging = useRef(false)
 const startX = useRef(0)
 const startWidth = useRef(CART_DEFAULT)

 const onMouseDownDivider = useCallback((e) => {
 dragging.current = true; startX.current = e.clientX; startWidth.current = cartWidth
 document.body.style.userSelect = 'none'; document.body.style.cursor = 'col-resize'
 const onMouseMove = (ev) => { if (!dragging.current) return; setCartWidth(Math.min(CART_MAX, Math.max(CART_MIN, startWidth.current + (startX.current - ev.clientX)))) }
 const onMouseUp = () => { dragging.current = false; document.body.style.userSelect = ''; document.body.style.cursor = ''; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
 document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp)
 }, [cartWidth])

 return (
 <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#F8FAFC', overflow:'hidden', fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>

 {/* Top Bar */}
 <header style={{ background:'#fff', borderBottom:'1px solid #E9EEF4', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, height:54, zIndex:100 }}>
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <AppLogo size={30} showText={false} variant="color" />
 <div>
 <p style={{ margin:0, fontWeight:800, fontSize:13, color:'#0F172A', lineHeight:1.2 }}>MSME Grow</p>
 <p style={{ margin:0, fontSize:11, color:'#94A3B8', lineHeight:1.2 }}>{PAGE_TITLES[currentPage] || 'POS System'}</p>
 </div>
 </div>

 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
 <button onClick={() => navigate('settings')} style={{ display:'flex', alignItems:'center', gap:6, background: gsConfig.connected ? '#F0FDF4' : '#F9FAFB', border:`1px solid ${gsConfig.connected ? '#BBF7D0' : '#E5E7EB'}`, borderRadius:8, padding:'5px 10px', cursor:'pointer', fontFamily:'inherit' }}>
 <span style={{ width:6, height:6, borderRadius:'50%', background: gsConfig.connected ? (gsConfig.syncing ? '#F97316' : '#22C55E') : '#CBD5E1', flexShrink:0 }} />
 <Icon name="spreadsheet" size={12} color={gsConfig.connected ? '#166534' : '#94A3B8'} />
 <span style={{ fontSize:11, fontWeight:700, color: gsConfig.connected ? '#166534' : '#64748B' }}>{gsConfig.syncing ? 'Syncing...' : 'Sheets'}</span>
 </button>

 <div style={{ display:'flex', alignItems:'center', gap:8, background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:10, padding:'5px 11px' }}>
 <div style={{ width:26, height:26, borderRadius:'50%', background: isAdmin ? 'linear-gradient(135deg,#2563EB,#7C3AED)' : 'linear-gradient(135deg,#059669,#047857)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <Icon name="user" size={12} color="#fff" />
 </div>
 <div>
 <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#0F172A', lineHeight:1.2 }}>{user?.name?.split(' ')[0] || 'User'}</p>
 <p style={{ margin:0, fontSize:10, fontWeight:700, lineHeight:1.2, textTransform:'uppercase', letterSpacing:0.4, color: isAdmin ? '#2563EB' : '#059669' }}>{isAdmin ? 'Admin' : 'Kasir'}</p>
 </div>
 </div>
 </div>
 </header>

 {/* Main */}
 <main style={{ flex:1, overflow:'auto', scrollbarWidth:'thin', scrollbarColor:'#CBD5E1 transparent' }}>
 {children}
 </main>

 {/* Bottom Nav */}
 <nav style={{ background:'#fff', borderTop:'1px solid #E9EEF4', display:'flex', flexShrink:0, zIndex:100 }}>
 {navItems.map(item => {
 const active = currentPage === item.id
 return (
 <button key={item.id} onClick={() => navigate(item.id)} style={{ flex:1, padding:'9px 2px 7px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, color: active ? '#2563EB' : '#94A3B8', fontFamily:'inherit', transition:'color 0.15s', position:'relative' }}>
 {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:28, height:2.5, background:'#2563EB', borderRadius:'0 0 3px 3px' }} />}
 <Icon name={item.icon} size={19} color={active ? '#2563EB' : '#94A3B8'} strokeWidth={active ? 2.2 : 1.7} />
 <span style={{ fontSize:9.5, fontWeight: active ? 800 : 500, textTransform:'uppercase', letterSpacing:0.4 }}>{item.label}</span>
 </button>
 )
 })}
 </nav>

 <style>{`main::-webkit-scrollbar{width:5px;height:5px}main::-webkit-scrollbar-track{background:transparent}main::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}*{box-sizing:border-box}html,body{overflow:auto}`}</style>
 </div>
 )
}

export default AppLayout
