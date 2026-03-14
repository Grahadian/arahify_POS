// ============================================================
// MSME GROW POS - AppLayout v4.0 — Solid Professional
// ============================================================
import { useApp } from '@/context/AppContext'
import Icon from '@/components/ui/Icon'
import AppLogo from '@/assets/AppLogo'

const ADMIN_NAV = [
  { id:'dashboard',       icon:'dashboard',  label:'Dashboard'   },
  { id:'reports',         icon:'reports',    label:'Laporan'     },
  { id:'register',        icon:'register',   label:'POS'         },
  { id:'inventory',       icon:'inventory',  label:'Inventori'   },
  { id:'members',         icon:'members',    label:'Member'      },
  { id:'expense',         icon:'expense',    label:'Pengeluaran' },
  { id:'supplier',        icon:'supplier',   label:'Supplier'    },
  { id:'purchase-order',  icon:'po',         label:'Pembelian'   },
  { id:'stock-opname',    icon:'opname',     label:'Stok Opname' },
  { id:'tables',          icon:'table',      label:'Meja'        },
  { id:'settings',        icon:'settings',   label:'Pengaturan'  },
]

// Settings always last — built dynamically
const KASIR_NAV_BASE = [
  { id:'kasir-dashboard', icon:'dashboard',  label:'Dashboard' },
  { id:'register',        icon:'register',   label:'POS'       },
  { id:'shift',           icon:'shift',      label:'Shift'     },
  { id:'kasir-orders',    icon:'orders',     label:'Transaksi' },
  { id:'member-points',   icon:'loyalty',    label:'Poin'      },
  { id:'inventory',       icon:'inventory',  label:'Produk'    },
]

const PAGE_TITLES = {
  dashboard:'Business Overview', reports:'Laporan & Analitik',
  register:'POS Register', inventory:'Inventori & Produk',
  members:'Data Member', expense:'Pengeluaran',
  shift:'Shift Kasir', settings:'Pengaturan',
  supplier:'Data Supplier', 'purchase-order':'Purchase Order',
  'stock-opname':'Stock Opname', tables:'Manajemen Meja',
  'kasir-dashboard':'Dashboard Kasir', 'kasir-orders':'Riwayat Transaksi',
  'kasir-tables':'Manajemen Meja', 'member-points':'Riwayat Poin',
}

const AppLayout = ({ children, isAdminMode = false }) => {
  const { user, settings, gsConfig, currentPage, navigate } = useApp()
  const isAdmin = isAdminMode

  // Kasir: base nav + optional Meja + Settings always last
  const navItems = isAdmin
    ? ADMIN_NAV.filter(n => n.id !== 'tables' || settings?.tableEnabled)
    : [
        ...KASIR_NAV_BASE,
        ...(settings?.tableEnabled ? [{ id:'kasir-tables', icon:'table', label:'Meja' }] : []),
        { id:'settings', icon:'settings', label:'Setting' },
      ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#F1F5F9', overflow:'hidden' }}>

      {/* ── Top Bar ── */}
      <header style={{
        background:'#1E293B',
        padding:'0 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0, height:52, zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <AppLogo size={28} showText={false} variant="white" />
          <div>
            <p style={{ margin:0, fontWeight:800, fontSize:13, color:'#F1F5F9', lineHeight:1.2 }}>MSME Grow</p>
            <p style={{ margin:0, fontSize:10.5, color:'#64748B', lineHeight:1.2 }}>{PAGE_TITLES[currentPage] || 'POS System'}</p>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Sheets status */}
          <button onClick={() => navigate('settings')} style={{
            display:'flex', alignItems:'center', gap:5,
            background: gsConfig.connected ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${gsConfig.connected ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius:7, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit'
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background: gsConfig.connected ? (gsConfig.syncing ? '#F97316' : '#22C55E') : '#475569', flexShrink:0 }} />
            <span style={{ fontSize:11, fontWeight:700, color: gsConfig.connected ? '#86EFAC' : '#64748B' }}>
              {gsConfig.syncing ? 'Syncing' : 'Sheets'}
            </span>
          </button>

          {/* User pill */}
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:9, padding:'5px 11px'
          }}>
            <div style={{
              width:24, height:24, borderRadius:'50%',
              background: isAdmin ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'linear-gradient(135deg,#10B981,#059669)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
            }}>
              <Icon name="user" size={11} color="#fff" />
            </div>
            <div>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#F1F5F9', lineHeight:1.2 }}>{user?.name?.split(' ')[0] || 'User'}</p>
              <p style={{ margin:0, fontSize:9.5, fontWeight:700, lineHeight:1.2, textTransform:'uppercase', letterSpacing:0.5, color: isAdmin ? '#93C5FD' : '#6EE7B7' }}>
                {isAdmin ? 'Admin' : 'Kasir'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex:1, overflow:'auto', scrollbarWidth:'thin', scrollbarColor:'#CBD5E1 transparent' }}>
        {children}
      </main>

      {/* ── Bottom Nav ── */}
      <nav style={{ background:'#1E293B', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', flexShrink:0, zIndex:100 }}>
        {navItems.map(item => {
          const active = currentPage === item.id
          return (
            <button key={item.id} onClick={() => navigate(item.id)} style={{
              flex:1, padding:'9px 2px 7px', background:'none', border:'none', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              color: active ? '#60A5FA' : '#475569',
              fontFamily:'inherit', transition:'color 0.15s', position:'relative',
              minWidth:0,
            }}>
              {active && (
                <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:24, height:2, background:'#3B82F6', borderRadius:'0 0 2px 2px' }} />
              )}
              <Icon name={item.icon} size={18} color={active ? '#60A5FA' : '#475569'} strokeWidth={active ? 2.3 : 1.7} />
              <span style={{ fontSize:9, fontWeight: active ? 800 : 500, textTransform:'uppercase', letterSpacing:0.4, lineHeight:1 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <style>{`
        main::-webkit-scrollbar{width:5px;height:5px}
        main::-webkit-scrollbar-track{background:transparent}
        main::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}
        *{box-sizing:border-box}
        html,body{overflow:auto}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  )
}

export default AppLayout
