// ============================================================
// MSME GROW POS - AppLayout v5.0 — Mobile Responsive
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

  const navItems = isAdmin
    ? ADMIN_NAV.filter(n => n.id !== 'tables' || settings?.tableEnabled)
    : [
        ...KASIR_NAV_BASE,
        ...(settings?.tableEnabled ? [{ id:'kasir-tables', icon:'table', label:'Meja' }] : []),
        { id:'settings', icon:'settings', label:'Setting' },
      ]

  // Admin has many nav items — split into "more" menu on mobile
  const MAX_VISIBLE_MOBILE = 5
  const visibleNav = navItems.slice(0, MAX_VISIBLE_MOBILE)
  const moreNav = navItems.slice(MAX_VISIBLE_MOBILE)
  const isInMore = moreNav.some(n => n.id === currentPage)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh', // dynamic viewport height — fixes iOS address bar issue
      background: '#F1F5F9',
      overflow: 'hidden',
    }}>

      {/* ── Top Bar ── */}
      <header style={{
        background: '#1E293B',
        padding: '0 12px 0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, height: 52, zIndex: 100,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <AppLogo size={26} showText={false} variant="white" />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 12, color: '#F1F5F9', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>MSME Grow</p>
            <p style={{ margin: 0, fontSize: 10, color: '#64748B', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{PAGE_TITLES[currentPage] || 'POS System'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Sheets status — hide label on very small screens */}
          <button onClick={() => navigate('settings')} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: gsConfig.connected ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${gsConfig.connected ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: gsConfig.connected ? (gsConfig.syncing ? '#F97316' : '#22C55E') : '#475569', flexShrink: 0 }} />
            <span className="hide-xs" style={{ fontSize: 10, fontWeight: 700, color: gsConfig.connected ? '#86EFAC' : '#64748B' }}>
              {gsConfig.syncing ? 'Sync' : 'Sheets'}
            </span>
          </button>

          {/* User pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 9, padding: '4px 9px'
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: isAdmin ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'linear-gradient(135deg,#10B981,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon name="user" size={10} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.2, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0] || 'User'}</p>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: 0.5, color: isAdmin ? '#93C5FD' : '#6EE7B7' }}>
                {isAdmin ? 'Admin' : 'Kasir'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        // POS Register needs overflow:hidden so internal flex scroll works
        // All other pages use overflow:auto for normal scroll
        overflow: currentPage === 'register' ? 'hidden' : 'auto',
        overflowX: 'hidden',
        minHeight: 0,
        scrollbarWidth: 'thin',
        scrollbarColor: '#CBD5E1 transparent',
        WebkitOverflowScrolling: 'touch',
      }}>
        {children}
      </main>

      {/* ── Bottom Nav ── */}
      <nav style={{
        background: '#1E293B',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexShrink: 0,
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)', // iPhone home bar
      }}>
        {/* On mobile: show only first MAX_VISIBLE_MOBILE items + More if admin has more */}
        {visibleNav.map(item => {
          const active = currentPage === item.id
          return (
            <button key={item.id} onClick={() => navigate(item.id)} style={{
              flex: 1,
              padding: '8px 2px 6px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              color: active ? '#60A5FA' : '#475569',
              fontFamily: 'inherit', transition: 'color 0.15s', position: 'relative',
              minWidth: 0,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              minHeight: 52,
            }}>
              {active && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: '#3B82F6', borderRadius: '0 0 2px 2px' }} />
              )}
              <Icon name={item.icon} size={18} color={active ? '#60A5FA' : '#475569'} strokeWidth={active ? 2.3 : 1.7} />
              <span style={{ fontSize: 8.5, fontWeight: active ? 800 : 500, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1, textAlign: 'center' }}>{item.label}</span>
            </button>
          )
        })}

        {/* "More" button for admin overflow items */}
        {moreNav.length > 0 && (
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <MoreMenu
              items={moreNav}
              currentPage={currentPage}
              navigate={navigate}
              isInMore={isInMore}
            />
          </div>
        )}
      </nav>

      <style>{`
        main::-webkit-scrollbar{width:4px;height:4px}
        main::-webkit-scrollbar-track{background:transparent}
        main::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:400px){
          .hide-xs{display:none!important}
        }
        /* Prevent horizontal scroll */
        main > *{max-width:100vw;overflow-x:hidden}
      `}</style>
    </div>
  )
}

// ── More Menu Component (overflow nav items) ─────────────────
import { useState } from 'react'

const MoreMenu = ({ items, currentPage, navigate, isInMore }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          flex: 1, padding: '8px 2px 6px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          color: isInMore || open ? '#60A5FA' : '#475569',
          fontFamily: 'inherit', position: 'relative',
          minWidth: 0, minHeight: 52,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        {(isInMore || open) && (
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: '#3B82F6', borderRadius: '0 0 2px 2px' }} />
        )}
        {/* Hamburger/grid icon */}
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
        <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1 }}>Lainnya</span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          />
          {/* Menu panel */}
          <div style={{
            position: 'absolute', bottom: '100%', right: 0,
            background: '#1E293B', borderRadius: '16px 16px 0 0',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            zIndex: 200, minWidth: 220, padding: '12px 8px 8px',
            maxHeight: '60vh', overflowY: 'auto',
          }}>
            <p style={{ margin: '0 0 10px 8px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 }}>Menu Lainnya</p>
            {items.map(item => {
              const active = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { navigate(item.id); setOpen(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: active ? '#60A5FA' : '#94A3B8',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500,
                    textAlign: 'left', transition: 'all 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = active ? 'rgba(59,130,246,0.15)' : 'transparent'}
                >
                  <Icon name={item.icon} size={16} color={active ? '#60A5FA' : '#64748B'} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

export default AppLayout
