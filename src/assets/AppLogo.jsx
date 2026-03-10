// ============================================================
// MSME GROW POS — Brand Logo (HARDCODED, tidak bisa diubah user)
// ============================================================
const AppLogo = ({ size = 40, showText = false, textColor, variant = 'color' }) => {
  const iconSize = size
  const fontSize = Math.round(size * 0.34)
  const subSize  = Math.round(size * 0.18)
  const radius   = Math.round(size * 0.26)

  const bg = {
    color  : 'linear-gradient(135deg, #1D4ED8 0%, #4F46E5 100%)',
    dark   : 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    light  : '#ffffff',
  }[variant] || 'linear-gradient(135deg, #1D4ED8 0%, #4F46E5 100%)'

  const txtClr = textColor || (variant === 'light' ? '#1D4ED8' : '#fff')
  const shadow = variant === 'light'
    ? '0 2px 8px rgba(29,78,216,0.12)'
    : '0 4px 20px rgba(29,78,216,0.45)'

  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap: Math.round(size*0.28), flexShrink:0 }}>
      {/* Icon mark */}
      <div style={{
        width:iconSize, height:iconSize, background:bg, borderRadius:radius,
        display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0, boxShadow:shadow, position:'relative', overflow:'hidden',
        border: variant==='light' ? '1.5px solid rgba(29,78,216,0.18)' : 'none',
      }}>
        {/* Shine circle */}
        <div style={{ position:'absolute', top:-iconSize*0.25, right:-iconSize*0.25, width:iconSize*0.85, height:iconSize*0.85, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
        {/* Store icon */}
        <svg width={Math.round(iconSize*0.55)} height={Math.round(iconSize*0.55)}
          viewBox="0 0 24 24" fill="none"
          stroke={variant==='light' ? '#1D4ED8' : 'rgba(255,255,255,0.95)'}
          strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
          style={{ position:'relative', zIndex:1 }}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>

      {/* Text lockup */}
      {showText && (
        <div style={{ lineHeight:1.15 }}>
          <p style={{ margin:0, fontSize:fontSize, fontWeight:900, color:txtClr, letterSpacing:-0.3, whiteSpace:'nowrap' }}>
            MSME Grow
          </p>
          <p style={{ margin:0, fontSize:subSize, fontWeight:700, color:txtClr, opacity:0.55, textTransform:'uppercase', letterSpacing:0.9, whiteSpace:'nowrap' }}>
            Point of Sale
          </p>
        </div>
      )}
    </div>
  )
}

export default AppLogo
