import Icon from './Icon'

const VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 15px rgba(37,99,235,0.35)',
  },
  secondary: {
    background: '#F1F5F9',
    color: '#374151',
    border: '1.5px solid #E2E8F0',
    boxShadow: 'none',
  },
  danger: {
    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
  },
  ghost: {
    background: 'transparent',
    color: '#2563EB',
    border: '1.5px solid #BFDBFE',
    boxShadow: 'none',
  },
  success: {
    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
  },
  outline: {
    background: 'transparent',
    color: '#374151',
    border: '1.5px solid #E5E7EB',
    boxShadow: 'none',
  },
}

const SIZES = {
  xs: { padding: '6px 10px', fontSize: 12, borderRadius: 8, gap: 4 },
  sm: { padding: '8px 14px', fontSize: 13, borderRadius: 10, gap: 6 },
  md: { padding: '12px 20px', fontSize: 14, borderRadius: 12, gap: 8 },
  lg: { padding: '14px 28px', fontSize: 15, borderRadius: 14, gap: 8 },
  xl: { padding: '16px 32px', fontSize: 16, borderRadius: 14, gap: 10 },
}

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  style: extraStyle = {},
  type = 'button',
}) => {
  const v = VARIANTS[variant] || VARIANTS.primary
  const s = SIZES[size] || SIZES.md
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: s.borderRadius,
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: isDisabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        whiteSpace: 'nowrap',
        ...v,
        ...extraStyle,
      }}
      disabled={isDisabled}
    >
      {loading ? (
        <span
          style={{
            width: 16,
            height: 16,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: variant === 'secondary' || variant === 'outline' ? '#374151' : '#fff',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      ) : icon ? (
        <Icon name={icon} size={s.fontSize + 2} color="currentColor" />
      ) : null}
      {children}
      {iconRight && !loading && (
        <Icon name={iconRight} size={s.fontSize + 2} color="currentColor" />
      )}
    </button>
  )
}

export default Button
