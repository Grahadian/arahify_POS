// ============================================================
// MSME GROW POS - AppLayout v7.0
// Desktop/Tablet (≥640px): Left sidebar with hover expand
// Mobile (<640px): Bottom nav — optimized for small phones
// ============================================================
import { useState, useEffect, useRef } from 'react'
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

const SYS_NOTIFS = [
  {
    id: 'update_v7',
    title: 'Pembaruan: Layout Mobile Dioptimalkan',
    message: 'Bottom nav lebih compact, navigasi lebih mudah di HP kecil.',
    time: new Date().toISOString(),
    icon: 'zap', color: '#2563EB', bg: '#EFF6FF', read: false,
  },
  {
    id: 'msme_tip1',
    title: 'Tips MSME Grow: Pantau Laporan Harian',
    message: 'Cek laporan setiap hari untuk memantau tren penjualan dan produk terlaris.',
    time: new Date(Date.now() - 7200000).toISOString(),
    icon: 'reports', color: '#059669', bg: '#ECFDF5', read: false,
  },
  {
    id: 'msme_tip2',
    title: 'Tips MSME Grow: Aktifkan Poin Loyalitas',
    message: 'Program poin loyalitas meningkatkan repeat order. Aktifkan di Pengaturan.',
    time: new Date(Date.now() - 86400000).toISOString(),
    icon: 'loyalty', color: '#D97706', bg: '#FFFBEB', read: true,
  },
]

// ── Notification Bell ─────────────────────────────────────────
const NotifBell = ({ products, settings }) => {
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_notif_read') || '[]') }
    catch { return [] }
  })
  const ref = useRef(null)

  const lowStock = (products || [])
    .filter(p => p.active && p.stock != null && p.stock <= (settings?.lowStockThreshold || 5))
    .slice(0, 4)

  const stockNotifs = lowStock.map(p => ({
    id: `stk_${p.id}`,
    title: p.stock === 0 ? `⚠ Stok Habis: ${p.name}` : `Stok Menipis: ${p.name}`,
    message: p.stock === 0 ? 'Segera lakukan restock.' : `Sisa: ${p.stock} ${p.unit||'pcs'}`,
    time: new Date().toISOString(),
    icon: 'warning', color: p.stock===0?'#DC2626':'#D97706', bg: p.stock===0?'#FEF2F2':'#FFFBEB',
    read: readIds.includes(`stk_${p.id}`),
  }))

  const all = [...stockNotifs, ...SYS_NOTIFS.map(n => ({ ...n, read: readIds.includes(n.id)||n.read }))]
  const unread = all.filter(n => !n.read).length

  const markRead = (id) => {
    const next = [...new Set([...readIds, id])]
    setReadIds(next)
    localStorage.setItem('pos_notif_read', JSON.stringify(next))
  }
  const markAll = () => {
    const next = all.map(n => n.id)
    setReadIds(next)
    localStorage.setItem('pos_notif_read', JSON.stringify(next))
  }

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const fmtT = iso => {
    const d = Date.now() - new Date(iso).getTime()
    if (d < 60000) return 'Baru saja'
    if (d < 3600000) return `${Math.floor(d/60000)}m lalu`
    if (d < 86400000) return `${Math.floor(d/3600000)}j lalu`
    return `${Math.floor(d/86400000)}h lalu`
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(o=>!o)} style={{
        position:'relative', width:32, height:32,
        background:open?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.07)',
        border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        WebkitTapHighlightColor:'transparent', touchAction:'manipulation', flexShrink:0,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && <span style={{ position:'absolute', top:4, right:4, width:7, height:7, borderRadius:'50%', background:'#EF4444', border:'1.5px solid #1E293B' }} />}
      </button>

      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:299 }} />
          <div style={{
            position:'absolute', top:'calc(100% + 8px)', right:0,
            // On mobile, constrain to screen width
            width:'min(300px, calc(100vw - 24px))',
            background:'#fff', borderRadius:14,
            boxShadow:'0 8px 40px rgba(0,0,0,0.18)',
            zIndex:300, overflow:'hidden', maxHeight:'75dvh',
            display:'flex', flexDirection:'column',
          }}>
            <div style={{ padding:'12px 14px 10px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>Notifikasi</p>
                {unread > 0 && <span style={{ background:'#EF4444', color:'#fff', fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:20 }}>{unread}</span>}
              </div>
              {unread > 0 && <button onClick={markAll} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, fontWeight:700, color:'#2563EB', fontFamily:'inherit', padding:0, touchAction:'manipulation' }}>Tandai dibaca</button>}
            </div>
            <div style={{ overflowY:'auto', flex:1, WebkitOverflowScrolling:'touch' }}>
              {all.length === 0
                ? <div style={{ padding:'28px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Tidak ada notifikasi</div>
                : all.map(n => (
                  <div key={n.id} onClick={()=>markRead(n.id)}
                    style={{ display:'flex', gap:10, padding:'11px 14px', background:n.read?'#fff':'#F8FAFF', borderBottom:'1px solid #F8FAFC', cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#F1F5F9'}
                    onMouseLeave={e=>e.currentTarget.style.background=n.read?'#fff':'#F8FAFF'}
                  >
                    <div style={{ width:32, height:32, borderRadius:8, background:n.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon name={n.icon||'info'} size={14} color={n.color} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:'0 0 2px', fontSize:12, fontWeight:n.read?600:800, color:'#0F172A', lineHeight:1.4 }}>{n.title}</p>
                      <p style={{ margin:'0 0 3px', fontSize:11, color:'#64748B', lineHeight:1.4 }}>{n.message}</p>
                      <p style={{ margin:0, fontSize:10, color:'#94A3B8' }}>{fmtT(n.time)}</p>
                    </div>
                    {!n.read && <div style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', flexShrink:0, marginTop:5 }} />}
                  </div>
                ))
              }
            </div>
            <div style={{ padding:'8px 14px', borderTop:'1px solid #F1F5F9', flexShrink:0, textAlign:'center' }}>
              <p style={{ margin:0, fontSize:10, color:'#94A3B8' }}>Arahify POS</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Layout ───────────────────────────────────────────────
const AppLayout = ({ children, isAdminMode = false }) => {
  const { user, settings, products, gsConfig, currentPage, navigate } = useApp()
  const isAdmin = isAdminMode
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const isExpanded = pinned || hovered

  const navItems = isAdmin
    ? ADMIN_NAV.filter(n => n.id !== 'tables' || settings?.tableEnabled)
    : [
        ...KASIR_NAV_BASE,
        ...(settings?.tableEnabled ? [{id:'kasir-tables',icon:'table',label:'Meja'}] : []),
        {id:'settings',icon:'settings',label:'Setting'},
      ]

  // Mobile: show 4 items max + More button (better for small phones)
  const MAX_MOBILE = 4
  const visibleNav = navItems.slice(0, MAX_MOBILE)
  const moreNav    = navItems.slice(MAX_MOBILE)
  const isInMore   = moreNav.some(n => n.id === currentPage)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#F1F5F9', overflow:'hidden' }}>

      {/* ── Top Bar ── */}
      <header style={{
        background:'#1E293B', padding:'0 10px 0 12px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0, height:48, zIndex:200,
        paddingTop:'env(safe-area-inset-top, 0px)',
      }}>
        {/* Left */}
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0, flex:1 }}>
          <button onClick={()=>setPinned(p=>!p)} className="sidebar-toggle"
            style={{ display:'none', background:'none', border:'none', cursor:'pointer', padding:4, color:'#64748B', flexShrink:0, borderRadius:6 }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <AppLogo size={24} showText={false} variant="white" />
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:12, color:'#F1F5F9', lineHeight:1.2 }}>Arahify POS</p>
            <p style={{ margin:0, fontSize:9, color:'#64748B', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{PAGE_TITLES[currentPage]||'POS System'}</p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          {/* Sheets - hide label on mobile */}
          <button onClick={()=>navigate('settings')} style={{
            display:'flex', alignItems:'center', gap:4,
            background:gsConfig.connected?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.07)',
            border:`1px solid ${gsConfig.connected?'rgba(34,197,94,0.3)':'rgba(255,255,255,0.1)'}`,
            borderRadius:7, padding:'4px 7px', cursor:'pointer', fontFamily:'inherit', flexShrink:0,
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:gsConfig.connected?(gsConfig.syncing?'#F97316':'#22C55E'):'#475569', flexShrink:0 }} />
            <span className="hide-mobile-xs" style={{ fontSize:10, fontWeight:700, color:gsConfig.connected?'#86EFAC':'#64748B' }}>
              {gsConfig.syncing?'Sync':'Sheets'}
            </span>
          </button>

          <NotifBell products={products} settings={settings} />

          {/* User pill — compact on mobile */}
          <button onClick={()=>navigate('settings')} style={{
            display:'flex', alignItems:'center', gap:5,
            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:8, padding:'4px 8px', cursor:'pointer', fontFamily:'inherit',
            WebkitTapHighlightColor:'transparent',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
          >
            <div style={{
              width:22, height:22, borderRadius:'50%',
              background:isAdmin?'linear-gradient(135deg,#3B82F6,#8B5CF6)':'linear-gradient(135deg,#10B981,#059669)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <Icon name="user" size={10} color="#fff" />
            </div>
            <div className="hide-mobile-xs">
              <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#F1F5F9', lineHeight:1.2, maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name?.split(' ')[0]||'User'}</p>
              <p style={{ margin:0, fontSize:9, fontWeight:700, lineHeight:1.2, textTransform:'uppercase', letterSpacing:0.5, color:isAdmin?'#93C5FD':'#6EE7B7' }}>{isAdmin?'Admin':'Kasir'}</p>
            </div>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        {/* ── Left Sidebar (desktop/tablet only) ── */}
        <aside
          className="desktop-sidebar"
          onMouseEnter={()=>!pinned && setHovered(true)}
          onMouseLeave={()=>setHovered(false)}
          style={{
            display:'none', flexDirection:'column',
            background:'#1E293B',
            borderRight:'1px solid rgba(255,255,255,0.06)',
            flexShrink:0, zIndex:150,
            transition:'width 0.2s cubic-bezier(0.4,0,0.2,1)',
            overflow:'hidden',
          }}
        >
          <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 6px', scrollbarWidth:'none' }}>
            {navItems.map(item => {
              const active = currentPage === item.id
              return (
                <button key={item.id} onClick={()=>navigate(item.id)} title={!isExpanded ? item.label : undefined}
                  style={{
                    width:'100%', display:'flex', alignItems:'center',
                    gap:isExpanded?10:0, justifyContent:isExpanded?'flex-start':'center',
                    padding:isExpanded?'10px 12px':'12px 0',
                    borderRadius:10, border:'none', cursor:'pointer',
                    background:active?'rgba(59,130,246,0.18)':'transparent',
                    color:active?'#60A5FA':'#64748B',
                    fontFamily:'inherit', fontSize:12, fontWeight:active?700:500,
                    textAlign:'left', transition:'all 0.15s', marginBottom:3,
                    whiteSpace:'nowrap', overflow:'hidden',
                    WebkitTapHighlightColor:'transparent',
                  }}
                  onMouseEnter={e=>{ if(!active){e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.color='#94A3B8'} }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=active?'rgba(59,130,246,0.18)':'transparent';e.currentTarget.style.color=active?'#60A5FA':'#64748B' }}
                >
                  {active && isExpanded && <div style={{ width:3, height:18, borderRadius:2, background:'#3B82F6', flexShrink:0, marginRight:-2 }} />}
                  <Icon name={item.icon} size={isExpanded?17:20} color={active?'#60A5FA':'#64748B'} strokeWidth={active?2.2:1.8} />
                  {isExpanded && <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>}
                </button>
              )
            })}
          </nav>
          {isExpanded && (
            <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
              <button onClick={()=>navigate('settings')} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:10, background:'rgba(255,255,255,0.05)', width:'100%', border:'none', cursor:'pointer', fontFamily:'inherit', WebkitTapHighlightColor:'transparent' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              >
                <div style={{ width:28, height:28, borderRadius:'50%', background:isAdmin?'linear-gradient(135deg,#3B82F6,#8B5CF6)':'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon name="user" size={12} color="#fff" />
                </div>
                <div style={{ minWidth:0, textAlign:'left' }}>
                  <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#E2E8F0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name||'User'}</p>
                  <p style={{ margin:0, fontSize:9, color:isAdmin?'#93C5FD':'#6EE7B7', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{isAdmin?'Admin':'Kasir'}</p>
                </div>
              </button>
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <main style={{
          flex:1, minHeight:0, minWidth:0,
          overflow: currentPage==='register'?'hidden':'auto',
          overflowX:'hidden',
          scrollbarWidth:'thin', scrollbarColor:'#CBD5E1 transparent',
          WebkitOverflowScrolling:'touch',
        }}>
          {children}
        </main>
      </div>

      {/* ── Bottom Nav (mobile only) ── */}
      <nav className="mobile-bottom-nav" style={{
        background:'#1E293B', borderTop:'1px solid rgba(255,255,255,0.08)',
        display:'flex', flexShrink:0, zIndex:100,
        paddingBottom:'env(safe-area-inset-bottom, 0px)',
      }}>
        {visibleNav.map(item => {
          const active = currentPage===item.id
          return (
            <button key={item.id} onClick={()=>navigate(item.id)} style={{
              flex:1, padding:'7px 2px 5px', background:'none', border:'none', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              color:active?'#60A5FA':'#64748B', fontFamily:'inherit', position:'relative',
              minWidth:0, minHeight:48,
              WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
            }}>
              {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:20, height:2.5, background:'#3B82F6', borderRadius:'0 0 3px 3px' }} />}
              <Icon name={item.icon} size={19} color={active?'#60A5FA':'#64748B'} strokeWidth={active?2.3:1.7} />
              <span style={{ fontSize:9, fontWeight:active?800:500, textTransform:'uppercase', letterSpacing:0.2, lineHeight:1, maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>
            </button>
          )
        })}
        {moreNav.length > 0 && (
          <div style={{ position:'relative', flex:1, display:'flex' }}>
            <MoreMenu items={moreNav} currentPage={currentPage} navigate={navigate} isInMore={isInMore} />
          </div>
        )}
      </nav>

      <style>{`
        main::-webkit-scrollbar{width:4px;height:4px}
        main::-webkit-scrollbar-track{background:transparent}
        main::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}
        aside nav::-webkit-scrollbar{display:none}
        *{box-sizing:border-box}

        /* Desktop/tablet: show sidebar */
        @media(min-width:640px){
          .desktop-sidebar{
            display:flex!important;
            width:${`${isExpanded?'210px':'56px'}`};
          }
          .mobile-bottom-nav{display:none!important}
          .sidebar-toggle{display:flex!important}
        }

        /* Mobile: hide sidebar, show bottom nav */
        @media(max-width:639px){
          .desktop-sidebar{display:none!important}
          .mobile-bottom-nav{display:flex!important}
          .sidebar-toggle{display:none!important}
        }

        /* Very small phones (< 360px): hide name/sheets text */
        @media(max-width:359px){
          .hide-mobile-xs{display:none!important}
        }

        /* Phones 360px+ can show name */
        @media(min-width:360px){
          .hide-mobile-xs{display:block}
        }

        @media(max-width:400px){.hide-xs{display:none!important}}
      `}</style>
    </div>
  )
}

// ── More Menu ─────────────────────────────────────────────────
const MoreMenu = ({ items, currentPage, navigate, isInMore }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={()=>setOpen(o=>!o)} style={{
        flex:1, padding:'7px 2px 5px', background:'none', border:'none', cursor:'pointer',
        display:'flex', flexDirection:'column', alignItems:'center', gap:2,
        color:isInMore||open?'#60A5FA':'#64748B',
        fontFamily:'inherit', position:'relative', minWidth:0, minHeight:48,
        WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
      }}>
        {(isInMore||open) && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:20, height:2.5, background:'#3B82F6', borderRadius:'0 0 3px 3px' }} />}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5" cy="5" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="19" cy="5" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="19" cy="19" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
        <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:0.2, lineHeight:1 }}>Lainnya</span>
      </button>

      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:199 }} />
          {/* Bottom sheet style for more menu */}
          <div style={{
            position:'fixed', bottom:0, left:0, right:0,
            background:'#1E293B', borderRadius:'20px 20px 0 0',
            border:'1px solid rgba(255,255,255,0.1)',
            boxShadow:'0 -8px 40px rgba(0,0,0,0.5)',
            zIndex:200, padding:'12px 8px 16px',
            paddingBottom:'calc(16px + env(safe-area-inset-bottom, 0px))',
            maxHeight:'70dvh', overflowY:'auto',
          }}>
            {/* Drag handle */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
              <div style={{ width:36, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2 }} />
            </div>
            <p style={{ margin:'0 0 8px 12px', fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:0.8 }}>Menu Lainnya</p>
            {/* Grid layout for items on mobile */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:4 }}>
              {items.map(item => {
                const active = currentPage===item.id
                return (
                  <button key={item.id} onClick={()=>{ navigate(item.id); setOpen(false) }} style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    padding:'12px 6px', borderRadius:12, border:'none', cursor:'pointer',
                    background:active?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.06)',
                    color:active?'#60A5FA':'#94A3B8',
                    fontFamily:'inherit', fontSize:10, fontWeight:active?700:500,
                    textAlign:'center', WebkitTapHighlightColor:'transparent',
                    touchAction:'manipulation',
                  }}>
                    <Icon name={item.icon} size={20} color={active?'#60A5FA':'#94A3B8'} strokeWidth={active?2.2:1.7} />
                    <span style={{ lineHeight:1.2, fontSize:10 }}>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default AppLayout
