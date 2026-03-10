import { useEffect } from 'react'
import Icon from './Icon'

const Modal = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 480,
  showClose = true,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          animation: 'scaleIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            {title && (
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827' }}>
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
                }}
              >
                <Icon name="x" size={16} color="#6B7280" />
              </button>
            )}
          </div>
        )}
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

export default Modal
