// ============================================================
// MSME GROW POS - Formatting Utilities
// ============================================================

import { CURRENCIES } from '@/config/constants'

/**
 * Format currency based on currency code and amount
 */
export const formatCurrency = (amount, currencyCode = 'IDR') => {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0]
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format IDR shorthand (default for most use)
 */
export const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number with thousand separator
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Format date to Indonesian locale
 */
export const formatDate = (isoString, options = {}) => {
  const defaults = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return new Date(isoString).toLocaleString('id-ID', { ...defaults, ...options })
}

/**
 * Format date only (no time)
 */
export const formatDateOnly = (isoString) => {
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format time only
 */
export const formatTime = (isoString) => {
  return new Date(isoString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g. "2 menit lalu")
 */
export const formatRelativeTime = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return formatDateOnly(isoString)
}

/**
 * Generate transaction ID
 */
export const generateTrxId = () => {
  const prefix = 'TRX'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}${random}`
}

/**
 * Generate product ID
 */
export const generateProductId = () => {
  return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate tax
 */
export const calculateTax = (subtotal, taxRate) => {
  return Math.round(subtotal * (taxRate / 100))
}

/**
 * Calculate total
 */
export const calculateTotal = (subtotal, tax, discount = 0) => {
  return subtotal + tax - discount
}

/**
 * Parse amount input string to number
 */
export const parseAmount = (str) => {
  if (!str) return 0
  return Number(String(str).replace(/[^0-9]/g, '')) || 0
}

/**
 * Truncate text
 */
export const truncate = (text, maxLength = 40) => {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}
