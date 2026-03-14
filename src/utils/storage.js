// ============================================================
// MSME GROW POS - Local Storage Utilities
// ============================================================

import { STORAGE_KEYS } from '@/config/constants'

/**
 * Get item from localStorage, parse JSON
 */
export const getStorage = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return fallback
    return JSON.parse(item)
  } catch (error) {
    console.error(`[Storage] Failed to get "${key}":`, error)
    return fallback
  }
}

/**
 * Set item in localStorage, stringify JSON
 * Handles QuotaExceededError: strip images into separate key, retry
 */
export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn(`[Storage] Quota exceeded for "${key}". Stripping images...`)
      try {
        if (Array.isArray(value)) {
          // Pisahkan images ke key terpisah agar tidak bloat produk
          const images = {}
          const stripped = value.map(item => {
            if (item?.id && item?.image) images[item.id] = item.image
            return item && typeof item === 'object' ? { ...item, image: '' } : item
          })
          localStorage.setItem(key, JSON.stringify(stripped))
          if (Object.keys(images).length > 0) {
            try { localStorage.setItem(key + '_img', JSON.stringify(images)) } catch {}
          }
          return true
        }
      } catch (e2) {
        console.error(`[Storage] Still failed after strip:`, e2)
      }
    }
    console.error(`[Storage] Failed to set "${key}":`, error)
    return false
  }
}

/**
 * Get products and merge split images back in
 */
export const getProductsWithImages = (key, fallback = []) => {
  const products = getStorage(key, fallback)
  if (!Array.isArray(products)) return products
  try {
    const raw = localStorage.getItem(key + '_img')
    if (!raw) return products
    const images = JSON.parse(raw)
    return products.map(p => ({ ...p, image: images[p.id] || p.image || '' }))
  } catch {
    return products
  }
}

/**
 * Remove item from localStorage
 */
export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key)
    localStorage.removeItem(key + '_img')
    return true
  } catch (error) {
    console.error(`[Storage] Failed to remove "${key}":`, error)
    return false
  }
}

/**
 * Clear all app data from localStorage
 */
export const clearAllStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
    localStorage.removeItem(key + '_img')
  })
}

export const saveSession = (user) =>
  setStorage(STORAGE_KEYS.USER, { ...user, sessionAt: new Date().toISOString() })

export const getSession = () => getStorage(STORAGE_KEYS.USER, null)

export const clearSession = () => removeStorage(STORAGE_KEYS.USER)

export const getGSConfig = () => getStorage(STORAGE_KEYS.GS_CONFIG, null)

export const saveGSConfig = (clientId, config) => {
  const all = getStorage(STORAGE_KEYS.GS_CONFIG, {})
  all[clientId] = { ...config, updatedAt: new Date().toISOString() }
  setStorage(STORAGE_KEYS.GS_CONFIG, all)
}

export const getGSConfigForClient = (clientId) => {
  const all = getStorage(STORAGE_KEYS.GS_CONFIG, {})
  return all[clientId] || null
}
