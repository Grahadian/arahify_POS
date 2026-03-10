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
 */
export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`[Storage] Failed to set "${key}":`, error)
    return false
  }
}

/**
 * Remove item from localStorage
 */
export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key)
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
  })
}

/**
 * Save current user session
 */
export const saveSession = (user) => {
  setStorage(STORAGE_KEYS.USER, {
    ...user,
    sessionAt: new Date().toISOString(),
  })
}

/**
 * Get current session
 */
export const getSession = () => {
  return getStorage(STORAGE_KEYS.USER, null)
}

/**
 * Clear session
 */
export const clearSession = () => {
  removeStorage(STORAGE_KEYS.USER)
}

/**
 * Get GS Config from storage
 */
export const getGSConfig = () => {
  return getStorage(STORAGE_KEYS.GS_CONFIG, null)
}

/**
 * Save GS Config (per client, keyed by clientId)
 */
export const saveGSConfig = (clientId, config) => {
  const allConfigs = getStorage(STORAGE_KEYS.GS_CONFIG, {})
  allConfigs[clientId] = {
    ...config,
    updatedAt: new Date().toISOString(),
  }
  setStorage(STORAGE_KEYS.GS_CONFIG, allConfigs)
}

/**
 * Get GS Config for a specific client
 */
export const getGSConfigForClient = (clientId) => {
  const allConfigs = getStorage(STORAGE_KEYS.GS_CONFIG, {})
  return allConfigs[clientId] || null
}
