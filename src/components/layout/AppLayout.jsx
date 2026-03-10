// ============================================================
// MSME GROW POS - AppLayout (logo hardcoded = tidak bisa diubah user)
// ============================================================
import { useState, useCallback, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { ROLES } from '@/config/constants'
import Icon from '@/components/ui/Icon'
import AppLogo from '@/assets/AppLogo'

const ADMIN_NAV = [
  { id:'dashboard', icon:'dashboard', label:'Dashboard' },
  { id:'reports',   icon:'reports',   label:'Laporan'   },
  { id:'register',  icon:'register',  label:'POS'       },
  { id:'inventory', icon:'inventory', label:'Inventori' },
  { id:'settings',  icon:'settings',  label:'Pengaturan'},
]
const KASIR_NAV = [
  { id:'register',  icon:'register',  label:'POS'      },
  { id:'reports',   icon:'reports',   label:'Laporan'  },
  { id:'settings',  icon:'settings',  label:'Setting'  },
]
const PAGE_TITLES = {
  dashboard:'Business Overview', reports:'Laporan & Analitik',
  register:'POS Register', orders:'Riwayat Transaksi',
  inventory:'Inventori & Produk', members:'Data Member', settings:'Pengaturan',
}

// Min/max cart width
const CART_MIN = 260
const CART_MAX = 480
const CART_DEFAULT = 300

const AppLayout = ({ children, isAdminMode = false, selectedMode = null }) => {
  const { user, settings, gsConfig, currentPage, navigate } = useApp()
  const isAdmin  = isAdminMode
  const navItems = isAdmin ? ADMIN_NAV : KASIR_NAV
  const isPOS    = currentPage === 'register'

  // Resizable cart panel state
  const [cartWidth, setCartWidth] = useState(CART_DEFAULT)
  const dragging   = useRef(false)
  const startX     = useRef(0)
  const startWidth = useRef(CART_DEFAULT)

  const onMouseDownDivider = useCallback((e) => {
    dragging.current   = true
    startX.current     = e.clientX
    startWidth.current = cartWidth
    document.body.style.userSelect   = 'none'
    document.body.style.cursor       = 'col-resize'

    const onMouseMove = (ev) => {
      if (!dragging.current) return
      const delta  = startX.current - ev.clientX  // drag left = bigger cart
      const newW   = Math.min(CART_MAX, Math.max(CART_MIN, startWidth.current + delta))
      setCartWidth(newW)
    }
    const onMouseUp = () => {
      dragging.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor     = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
  }, [cartWidth])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#F8FAFC', overflow:'hidden' }}>

      {/* ── Top Bar ── */}
      <header style={{ background:'#fff', borderBottom:'1px solid #F1F5F9', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.04)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Hardcoded brand logo — cannot be changed by user */}
          <AppLogo size={38} showText={false} variant="color" />
          <div>
            <p style={{ margin:0, fontWeight:800, fontSize:14, color:'#111827', lineHeight:1.2 }}>
              MSME Grow
            </p>
            <p style={{ margin:0, fontSize:11, color:'#9CA3AF', lineHeight:1.2 }}>
              {PAGE_TITLES[currentPage] || 'POS System'}
            </p>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* GS Status */}
          <div onClick={() => navigate('settings')} style={{ display:'flex', alignItems:'center', gap:5, background:gsConfig.connected?'#F0FDF4':'#FFF7ED', border:`1px solid ${gsConfig.connected?'#BBF7D0':'#FED7AA'}`, borderRadius:8, padding:'5px 10px', cursor:'pointer' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:gsConfig.connected?(gsConfig.syncing?'#F97316':'#22C55E'):'#9CA3AF' }} />
            <Icon name="spreadsheet" size={13} color={gsConfig.connected?'#166534':'#C2410C'} />
            <span style={{ fontSize:11, fontWeight:700, color:gsConfig.connected?'#166834':'#C2410C' }}>{gsConfig.syncing?'Syncing...':'Sheets'}</span>
          </div>

          {/* User badge */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:10, padding:'6px 12px' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:isAdmin?'linear-gradient(135deg,#2563EB,#7C3AED)':'linear-gradient(135deg,#22C55E,#16A34A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="user" size={14} color="#fff" />
            </div>
            <div>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#111827', lineHeight:1.2 }}>{user?.name?.split(' ')[0]}</p>
              <p style={{ margin:0, fontSize:10, fontWeight:700, lineHeight:1.2, textTransform:'uppercase', color:isAdmin?'#2563EB':'#22C55E' }}>{isAdmin?'Admin':'Kasir'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ flex:1, overflow:'auto', position:'relative', scrollbarWidth:'thin', scrollbarColor:'#CBD5E1 transparent' }}>
        {children}
      </main>

      {/* ── Bottom Nav ── */}
      <nav style={{ background:'#fff', borderTop:'1px solid #F1F5F9', display:'flex', flexShrink:0, boxShadow:'0 -2px 8px rgba(0,0,0,0.06)', zIndex:100 }}>
        {navItems.map(item => {
          const active = currentPage === item.id
          return (
            <button key={item.id} onClick={() => navigate(item.id)} style={{ flex:1, padding:'10px 4px 8px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, color:active?'#2563EB':'#9CA3AF', fontFamily:'inherit', transition:'color 0.15s', position:'relative' }}>
              {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:32, height:3, background:'#2563EB', borderRadius:'0 0 4px 4px' }} />}
              <Icon name={item.icon} size={21} color={active?'#2563EB':'#9CA3AF'} strokeWidth={active?2.2:1.8} />
              <span style={{ fontSize:10, fontWeight:active?800:500, textTransform:'uppercase', letterSpacing:0.5 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Global scrollbar styles */}
      <style>{`
        main::-webkit-scrollbar { width: 6px; height: 6px; }
        main::-webkit-scrollbar-track { background: transparent; }
        main::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        main::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        * { box-sizing: border-box; }
        html, body { overflow: auto; }
      `}</style>
    </div>
  )
}

export default AppLayout
