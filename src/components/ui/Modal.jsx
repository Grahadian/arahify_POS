import { useEffect } from 'react'
import Icon from './Icon'

const Modal = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 520,
  showClose = true,
}) => {
  useEffect(() => {
    if (open) {
      // iOS-safe scroll lock
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${scrollY}px`
    } else {
      const top = document.body.style.top
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
      if (top) window.scrollTo(0, parseInt(top || '0') * -1)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'flex-end',   // bottom-sheet on all screens
        justifyContent: 'center',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxWidth,
          maxHeight: '92dvh',
          overflow: 'auto',
          overflowX: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.25s ease',
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', paddingTop:10, paddingBottom:2 }}>
          <div style={{ width:36, height:4, background:'#E5E7EB', borderRadius:2 }} />
        </div>

        {(title || showClose) && (
          <div style={{
            padding: '10px 20px 12px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            {title && (
              <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'#111827' }}>
                {title}
              </h3>
            )}
            {showClose && (
              <button
                onClick={onClose}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                <Icon name="x" size={16} color="#6B7280" />
              </button>
            )}
          </div>
        )}
        <div style={{ padding:'16px 20px 20px' }}>{children}</div>
        {/* iPhone home bar safe area */}
        <div style={{ height:'env(safe-area-inset-bottom, 8px)' }} />
      </div>
    </div>
  )
}

export default Modal
