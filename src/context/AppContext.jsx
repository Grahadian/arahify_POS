import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { DEFAULT_SETTINGS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS } from '@/config/constants'
import { getStorage, setStorage, saveSession, getSession, clearSession } from '@/utils/storage'
import { generateTrxId } from '@/utils/format'
import { useUsers } from '@/hooks/useUsers'
import {
  verifyGASConnection, addTransactionToSheet,
  fetchProductsFromSheet, syncAllToSheet, fetchSettingsFromSheet,
} from '@/services/googleSheets'

const clientKey = (clientId, type) => `msme_${clientId}_${type}`

const loadClientData = (clientId) => ({
  products    : getStorage(clientKey(clientId, 'products'),     INITIAL_PRODUCTS),
  transactions: getStorage(clientKey(clientId, 'transactions'), INITIAL_TRANSACTIONS),
  settings    : getStorage(clientKey(clientId, 'settings'),     DEFAULT_SETTINGS),
  members     : getStorage(clientKey(clientId, 'members'),      []),
  gsConfig    : getStorage(clientKey(clientId, 'gsconfig'), {
    webAppUrl: '', connected: false, lastSync: null, syncing: false, error: null,
  }),
})

const initialState = {
  user: null, isAuthenticated: false, clientId: null,
  products: [], transactions: [], settings: DEFAULT_SETTINGS,
  members: [],
  gsConfig: { webAppUrl: '', connected: false, lastSync: null, syncing: false, error: null },
  cart: [], currentPage: 'login', loading: false, initialized: false,
}

const A = {
  INIT:'INIT', LOGIN:'LOGIN', LOGOUT:'LOGOUT', NAVIGATE:'NAVIGATE',
  SET_PRODUCTS:'SET_PRODUCTS', ADD_PRODUCT:'ADD_PRODUCT', UPDATE_PRODUCT:'UPDATE_PRODUCT', DELETE_PRODUCT:'DELETE_PRODUCT',
  ADD_TRANSACTION:'ADD_TRANSACTION', SET_TRANSACTIONS:'SET_TRANSACTIONS', UPDATE_TRANSACTION:'UPDATE_TRANSACTION',
  UPDATE_SETTINGS:'UPDATE_SETTINGS',
  SET_GS_CONFIG:'SET_GS_CONFIG', SET_GS_SYNCING:'SET_GS_SYNCING', SET_GS_ERROR:'SET_GS_ERROR',
  CART_ADD:'CART_ADD', CART_UPDATE_QTY:'CART_UPDATE_QTY', CART_REMOVE:'CART_REMOVE', CART_CLEAR:'CART_CLEAR',
  ADD_MEMBER:'ADD_MEMBER', UPDATE_MEMBER:'UPDATE_MEMBER', SET_MEMBERS:'SET_MEMBERS',
}

function defaultPageForRole(role) {
  if (role === 'superadmin') return 'superadmin'
  if (role === 'admin')      return 'dashboard'
  return 'register'
}

function reducer(state, { type, payload }) {
  switch (type) {
    case A.INIT:    return { ...state, ...payload, initialized: true }
    case A.LOGIN: {
      const page = defaultPageForRole(payload.user.role)
      return { ...state, user: payload.user, isAuthenticated: true, clientId: payload.user.clientId, ...payload.clientData, currentPage: page }
    }
    case A.LOGOUT:  return { ...initialState, initialized: true, currentPage: 'login' }
    case A.NAVIGATE: return { ...state, currentPage: payload }
    case A.SET_PRODUCTS: return { ...state, products: payload }
    case A.ADD_PRODUCT:  return { ...state, products: [...state.products, payload] }
    case A.UPDATE_PRODUCT: return { ...state, products: state.products.map(p => p.id === payload.id ? { ...p, ...payload } : p) }
    case A.DELETE_PRODUCT: return { ...state, products: state.products.filter(p => p.id !== payload) }
    case A.ADD_TRANSACTION: return { ...state, transactions: [payload, ...state.transactions] }
    case A.SET_TRANSACTIONS: return { ...state, transactions: payload }
    case A.UPDATE_TRANSACTION: return { ...state, transactions: state.transactions.map(t => t.id === payload.id ? { ...t, ...payload } : t) }
    case A.UPDATE_SETTINGS: return { ...state, settings: { ...state.settings, ...payload } }
    case A.SET_GS_CONFIG:   return { ...state, gsConfig: { ...state.gsConfig, ...payload } }
    case A.SET_GS_SYNCING:  return { ...state, gsConfig: { ...state.gsConfig, syncing: payload } }
    case A.SET_GS_ERROR:    return { ...state, gsConfig: { ...state.gsConfig, error: payload, syncing: false } }
    case A.ADD_MEMBER:    return { ...state, members: [payload, ...state.members] }
    case A.UPDATE_MEMBER: return { ...state, members: state.members.map(m => m.id === payload.id ? { ...m, ...payload } : m) }
    case A.SET_MEMBERS:   return { ...state, members: payload }
    case A.CART_ADD: {
      const ex = state.cart.find(i => i.productId === payload.productId)
      if (ex) return { ...state, cart: state.cart.map(i => i.productId === payload.productId ? { ...i, qty: i.qty + 1 } : i) }
      return { ...state, cart: [...state.cart, { ...payload, qty: 1 }] }
    }
    case A.CART_UPDATE_QTY: return { ...state, cart: state.cart.map(i => i.productId === payload.productId ? { ...i, qty: payload.qty } : i).filter(i => i.qty > 0) }
    case A.CART_REMOVE:     return { ...state, cart: state.cart.filter(i => i.productId !== payload) }
    case A.CART_CLEAR:      return { ...state, cart: [] }
    default: return state
  }
}

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { refreshUser, authenticate } = useUsers()

  useEffect(() => {
    const restore = async () => {
      try {
        const session = getSession()
        if (session?.id) {
          let freshUser = null
          try { freshUser = await refreshUser(session.id) } catch {}
          const user = freshUser || session
          const clientData = user.clientId ? loadClientData(user.clientId) : {}
          if (user.gsWebAppUrl && clientData.gsConfig && !clientData.gsConfig.webAppUrl) {
            clientData.gsConfig.webAppUrl = user.gsWebAppUrl
          }
          dispatch({ type: A.INIT, payload: { user, isAuthenticated: true, clientId: user.clientId, currentPage: session.currentPage || defaultPageForRole(user.role), ...clientData } })
          return
        }
      } catch (e) { console.warn('Session restore failed:', e.message) }
      dispatch({ type: A.INIT, payload: {} })
    }
    restore()
  }, [])

  useEffect(() => {
    if (state.initialized && state.clientId) {
      setStorage(clientKey(state.clientId, 'products'),     state.products)
      setStorage(clientKey(state.clientId, 'transactions'), state.transactions)
      setStorage(clientKey(state.clientId, 'settings'),     state.settings)
      setStorage(clientKey(state.clientId, 'members'),      state.members)
      setStorage(clientKey(state.clientId, 'gsconfig'),     state.gsConfig)
    }
  }, [state.products, state.transactions, state.settings, state.members, state.gsConfig, state.clientId, state.initialized])

  useEffect(() => {
    if (state.isAuthenticated && state.user) saveSession({ ...state.user, currentPage: state.currentPage })
  }, [state.currentPage, state.isAuthenticated])

  const login = useCallback((user) => {
    saveSession(user)
    const clientData = user.clientId ? loadClientData(user.clientId) : {}
    if (user.gsWebAppUrl && clientData.gsConfig && !clientData.gsConfig.webAppUrl) {
      clientData.gsConfig.webAppUrl = user.gsWebAppUrl
      if (user.gsConnected) clientData.gsConfig.connected = true
    }
    dispatch({ type: A.LOGIN, payload: { user, clientData } })
  }, [])

  const logout = useCallback(() => { clearSession(); dispatch({ type: A.LOGOUT }) }, [])
  const navigate = useCallback((page) => dispatch({ type: A.NAVIGATE, payload: page }), [])

  const addProduct    = useCallback((p)  => dispatch({ type: A.ADD_PRODUCT,    payload: p }),  [])
  const updateProduct = useCallback((p)  => dispatch({ type: A.UPDATE_PRODUCT, payload: p }),  [])
  const deleteProduct = useCallback((id) => dispatch({ type: A.DELETE_PRODUCT, payload: id }), [])
  const setProducts   = useCallback((ps) => dispatch({ type: A.SET_PRODUCTS,   payload: ps }), [])

  const addTransaction = useCallback(async (trxData) => {
    const trx = { ...trxData, id: generateTrxId(), createdAt: new Date().toISOString() }
    dispatch({ type: A.ADD_TRANSACTION, payload: trx })
    if (state.gsConfig.connected && state.gsConfig.webAppUrl) {
      try {
        await addTransactionToSheet(state.gsConfig.webAppUrl, trx)
        dispatch({ type: A.SET_GS_CONFIG, payload: { lastSync: new Date().toISOString(), error: null } })
      } catch (err) { dispatch({ type: A.SET_GS_ERROR, payload: err.message }) }
    }
    return trx
  }, [state.gsConfig])

  // Refund transaction — hanya admin, status → refunded, data tetap ada
  const refundTransaction = useCallback((trxId, reason) => {
    dispatch({ type: A.UPDATE_TRANSACTION, payload: {
      id: trxId,
      status: 'refunded',
      refundReason: reason,
      refundedAt: new Date().toISOString(),
    }})
  }, [])

  const updateSettings = useCallback((s) => dispatch({ type: A.UPDATE_SETTINGS, payload: s }), [])

  const connectGoogleSheets = useCallback(async (webAppUrl) => {
    dispatch({ type: A.SET_GS_SYNCING, payload: true })
    try {
      await verifyGASConnection(webAppUrl)
      dispatch({ type: A.SET_GS_CONFIG, payload: { webAppUrl, connected: true, lastSync: new Date().toISOString(), syncing: false, error: null } })
    } catch (err) {
      dispatch({ type: A.SET_GS_CONFIG, payload: { webAppUrl, connected: false, syncing: false, error: err.message } })
      throw err
    }
  }, [])

  const disconnectGoogleSheets = useCallback(() => {
    dispatch({ type: A.SET_GS_CONFIG, payload: { webAppUrl: '', connected: false, lastSync: null, error: null } })
  }, [])

  const syncToGoogleSheets = useCallback(async () => {
    dispatch({ type: A.SET_GS_SYNCING, payload: true })
    try {
      await syncAllToSheet(state.gsConfig.webAppUrl, { products: state.products, transactions: state.transactions, settings: state.settings })
      dispatch({ type: A.SET_GS_CONFIG, payload: { lastSync: new Date().toISOString(), syncing: false, error: null } })
    } catch (err) { dispatch({ type: A.SET_GS_ERROR, payload: err.message }); throw err }
  }, [state.gsConfig.webAppUrl, state.products, state.transactions, state.settings])

  const pullFromGoogleSheets = useCallback(async () => {
    dispatch({ type: A.SET_GS_SYNCING, payload: true })
    try {
      const [products, settings] = await Promise.all([fetchProductsFromSheet(state.gsConfig.webAppUrl), fetchSettingsFromSheet(state.gsConfig.webAppUrl)])
      if (products.length > 0) dispatch({ type: A.SET_PRODUCTS, payload: products })
      if (Object.keys(settings).length > 0) dispatch({ type: A.UPDATE_SETTINGS, payload: settings })
      dispatch({ type: A.SET_GS_CONFIG, payload: { lastSync: new Date().toISOString(), syncing: false, error: null } })
      return { success: true, productsCount: products.length }
    } catch (err) { dispatch({ type: A.SET_GS_ERROR, payload: err.message }); throw err }
  }, [state.gsConfig.webAppUrl])

  // Member actions
  const addMember    = useCallback((m)  => dispatch({ type: A.ADD_MEMBER,    payload: { ...m, id: `MBR-${Date.now()}`, createdAt: new Date().toISOString(), totalSpent: 0, totalOrders: 0 } }), [])
  const updateMember = useCallback((m)  => dispatch({ type: A.UPDATE_MEMBER, payload: m }), [])

  const cartAdd       = useCallback((p)       => dispatch({ type: A.CART_ADD,        payload: { productId: p.id, name: p.name, price: p.price, unit: p.unit, category: p.category } }), [])
  const cartUpdateQty = useCallback((id, qty) => dispatch({ type: A.CART_UPDATE_QTY, payload: { productId: id, qty } }), [])
  const cartRemove    = useCallback((id)      => dispatch({ type: A.CART_REMOVE,     payload: id }), [])
  const cartClear     = useCallback(()        => dispatch({ type: A.CART_CLEAR }),                   [])

  const value = {
    ...state, navigate,
    login, logout, authenticate,
    addProduct, updateProduct, deleteProduct, setProducts,
    addTransaction, refundTransaction,
    updateSettings,
    connectGoogleSheets, disconnectGoogleSheets, syncToGoogleSheets, pullFromGoogleSheets,
    addMember, updateMember,
    cartAdd, cartUpdateQty, cartRemove, cartClear,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
