// ============================================================
// MSME GROW POS - UI Primitives v4.0
// ============================================================

// ── Card ─────────────────────────────────────────────────────
export const Card = ({ children, style = {}, onClick, hover = false }) => (
  <div
    onClick={onClick}
    style={{
      background:'#fff',
      borderRadius:14,
      padding:18,
      boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      border:'1px solid #E2E8F0',
      cursor: onClick ? 'pointer' : 'default',
      transition: hover || onClick ? 'all 0.15s' : 'none',
      ...style,
    }}
    onMouseEnter={hover||onClick ? e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';e.currentTarget.style.transform='translateY(-1px)'} : undefined}
    onMouseLeave={hover||onClick ? e=>{e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)';e.currentTarget.style.transform='translateY(0)'} : undefined}
  >
    {children}
  </div>
)

// ── Badge ─────────────────────────────────────────────────────
const BADGE_STYLES = {
  blue:   { background:'#DBEAFE', color:'#1D4ED8', border:'1px solid #93C5FD' },
  green:  { background:'#DCFCE7', color:'#166534', border:'1px solid #86EFAC' },
  red:    { background:'#FEE2E2', color:'#991B1B', border:'1px solid #FCA5A5' },
  orange: { background:'#FFEDD5', color:'#C2410C', border:'1px solid #FDBA74' },
  gray:   { background:'#F1F5F9', color:'#475569', border:'1px solid #CBD5E1' },
  purple: { background:'#EDE9FE', color:'#6D28D9', border:'1px solid #C4B5FD' },
  yellow: { background:'#FEF9C3', color:'#854D0E', border:'1px solid #FDE047' },
}

export const Badge = ({ color='gray', children, size='sm' }) => {
  const s = BADGE_STYLES[color] || BADGE_STYLES.gray
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      fontSize: size==='sm' ? 11 : size==='md' ? 12 : 13,
      fontWeight:700,
      padding: size==='sm' ? '2px 8px' : '4px 10px',
      borderRadius:20, whiteSpace:'nowrap',
      ...s,
    }}>
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export const Spinner = ({ size=20, color='#2563EB' }) => (
  <span style={{
    display:'inline-block', width:size, height:size,
    border:`2.5px solid ${color}30`, borderTopColor:color,
    borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0,
  }} />
)

// ── Divider ───────────────────────────────────────────────────
export const Divider = ({ label, style={} }) => (
  <div style={{ display:'flex', alignItems:'center', gap:12, margin:'8px 0', ...style }}>
    <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
    {label && <span style={{ fontSize:12, color:'#94A3B8', whiteSpace:'nowrap' }}>{label}</span>}
    <div style={{ flex:1, height:1, background:'#E2E8F0' }} />
  </div>
)

// ── Alert ─────────────────────────────────────────────────────
const ALERT_STYLES = {
  warning: { bg:'#FFFBEB', border:'#FDE68A', text:'#92400E', iconColor:'#D97706' },
  error:   { bg:'#FEF2F2', border:'#FECACA', text:'#991B1B', iconColor:'#DC2626' },
  success: { bg:'#F0FDF4', border:'#BBF7D0', text:'#166534', iconColor:'#16A34A' },
  info:    { bg:'#EFF6FF', border:'#BFDBFE', text:'#1E40AF', iconColor:'#2563EB' },
}

export const Alert = ({ type='info', children, style={} }) => {
  const s = ALERT_STYLES[type] || ALERT_STYLES.info
  return (
    <div style={{ background:s.bg, border:`1.5px solid ${s.border}`, borderRadius:12, padding:'12px 16px', ...style }}>
      <p style={{ margin:0, fontSize:13, color:s.text, lineHeight:1.5 }}>{children}</p>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
export const EmptyState = ({ title, description, action }) => (
  <div style={{ textAlign:'center', padding:'44px 20px', color:'#94A3B8' }}>
    <p style={{ margin:'0 0 6px', fontSize:14, fontWeight:700, color:'#334155' }}>{title}</p>
    {description && <p style={{ margin:'0 0 16px', fontSize:13, lineHeight:1.5 }}>{description}</p>}
    {action}
  </div>
)

// ── Section Header ────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action, style={} }) => (
  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, gap:10, ...style }}>
    <div>
      <h2 style={{ margin:'0 0 3px', fontSize:18, fontWeight:800, color:'#0F172A', letterSpacing:-0.3 }}>{title}</h2>
      {subtitle && <p style={{ margin:0, fontSize:13, color:'#64748B' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
)

// ── StatCard (used by SuperAdminDashboard) ────────────────────
import Icon from '@/components/ui/Icon'
export const StatCard = ({ label, value, icon, color = '#2563EB', style = {} }) => (
  <div style={{
    background: '#fff',
    borderRadius: 14,
    padding: '16px 18px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    ...style,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon name={icon} size={20} color={color} />
    </div>
    <div>
      <p style={{ margin: '0 0 3px', fontSize: 12, color: '#64748B', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A' }}>{value}</p>
    </div>
  </div>
)
