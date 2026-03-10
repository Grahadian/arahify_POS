// ============================================================
// MSME GROW POS - Reusable UI Primitives
// ============================================================

// ── Card ─────────────────────────────────────────────────────
export const Card = ({ children, style = {}, onClick, hover = false }) => (
  <div
    onClick={onClick}
    style={{
      background: '#fff',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1px solid #F1F5F9',
      cursor: onClick ? 'pointer' : 'default',
      transition: hover || onClick ? 'all 0.15s' : 'none',
      ...style,
    }}
    onMouseEnter={hover || onClick ? e => {
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
      e.currentTarget.style.transform = 'translateY(-1px)'
    } : undefined}
    onMouseLeave={hover || onClick ? e => {
      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
      e.currentTarget.style.transform = 'translateY(0)'
    } : undefined}
  >
    {children}
  </div>
)

// ── Badge ─────────────────────────────────────────────────────
const BADGE_STYLES = {
  blue: { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' },
  green: { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' },
  red: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
  orange: { background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' },
  gray: { background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' },
  purple: { background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' },
  yellow: { background: '#FEFCE8', color: '#854D0E', border: '1px solid #FEF08A' },
}

export const Badge = ({ color = 'gray', children, size = 'sm' }) => {
  const s = BADGE_STYLES[color] || BADGE_STYLES.gray
  const fontSize = size === 'sm' ? 11 : size === 'md' ? 12 : 13
  const padding = size === 'sm' ? '2px 8px' : '4px 10px'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize,
      fontWeight: 700,
      padding,
      borderRadius: 20,
      whiteSpace: 'nowrap',
      ...s,
    }}>
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export const Spinner = ({ size = 20, color = '#2563EB' }) => (
  <span style={{
    display: 'inline-block',
    width: size,
    height: size,
    border: `2px solid ${color}30`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  }} />
)

// ── Divider ───────────────────────────────────────────────────
export const Divider = ({ label, style = {} }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0', ...style }}>
    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
    {label && <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{label}</span>}
    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
  </div>
)

// ── Stat Card ─────────────────────────────────────────────────
export const StatCard = ({
  label,
  value,
  subValue,
  subColor = '#22C55E',
  icon,
  iconBg = '#EFF6FF',
  iconColor = '#2563EB',
  style = {},
}) => {
  const Icon = ({ name }) => {
    // Inline minimal icon for stat cards
    return null // Will be replaced by actual Icon component usage
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 18,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1px solid #F1F5F9',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</p>
          <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
            {value}
          </p>
          {subValue && (
            <p style={{ margin: 0, fontSize: 12, color: subColor, fontWeight: 600 }}>{subValue}</p>
          )}
        </div>
        {icon && (
          <div style={{
            background: iconBg,
            borderRadius: 12,
            padding: 10,
            flexShrink: 0,
            marginLeft: 12,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  }}>
    {icon && (
      <div style={{
        width: 72,
        height: 72,
        background: '#F3F4F6',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        {icon}
      </div>
    )}
    <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#374151' }}>{title}</p>
    {description && (
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9CA3AF', maxWidth: 300 }}>{description}</p>
    )}
    {action}
  </div>
)

// ── Alert ─────────────────────────────────────────────────────
export const Alert = ({ type = 'info', children, onClose }) => {
  const types = {
    info: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', icon: 'info' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', icon: 'check' },
    warning: { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', icon: 'warning' },
    error: { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', icon: 'x' },
  }
  const t = types[type] || types.info
  return (
    <div style={{
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      color: t.color,
      fontSize: 13,
      marginBottom: 16,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>●</span>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.color, padding: 2, display: 'flex' }}>✕</button>
      )}
    </div>
  )
}
