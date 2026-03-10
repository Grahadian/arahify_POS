import { useState } from 'react'
import Icon from './Icon'

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  suffix,
  note,
  error,
  required,
  disabled,
  rows = 3,
  options = [], // for select type
  style: extraStyle = {},
}) => {
  const [focused, setFocused] = useState(false)

  const inputStyle = {
    width: '100%',
    padding: icon ? '11px 14px 11px 40px' : suffix ? '11px 40px 11px 14px' : '11px 14px',
    border: `1.5px solid ${error ? '#FCA5A5' : focused ? '#2563EB' : '#E5E7EB'}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    background: disabled ? '#F9FAFB' : '#fff',
    color: disabled ? '#9CA3AF' : '#1F2937',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused && !error ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
    ...extraStyle,
  }

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          {options.map(opt => (
            typeof opt === 'string'
              ? <option key={opt} value={opt}>{opt}</option>
              : <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    }

    if (type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )
    }

    return (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        style={inputStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    )
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
          marginBottom: 6,
        }}>
          {label}
          {required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1,
          }}>
            <Icon name={icon} size={16} color={focused ? '#2563EB' : '#9CA3AF'} />
          </span>
        )}
        {renderInput()}
        {suffix && (
          <span style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)', fontSize: 13, color: '#9CA3AF',
            pointerEvents: 'none',
          }}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="warning" size={12} color="#EF4444" /> {error}
        </p>
      )}
      {note && !error && (
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{note}</p>
      )}
    </div>
  )
}

export default Input
