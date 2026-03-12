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
  products      : getStorage(clientKey(clientId, 'products'),     INITIAL_PRODUCTS),
  transactions  : getStorage(clientKey(clientId, 'transactions'), INITIAL_TRANSACTIONS),
  settings      : getStorage(clientKey(clientId, 'settings'),     DEFAULT_SETTINGS),
  members       : getStorage(clientKey(clientId, 'members'),      []),
  expenses      : getStorage(clientKey(clientId, 'expenses'),     []),
  shifts        : getStorage(clientKey(clientId, 'shifts'),       []),
  suppliers     : getStorage(clientKey(clientId, 'suppliers'),    []),
  purchaseOrders: getStorage(clientKey(clientId, 'purchaseOrders'), []),
  stockOpnames  : getStorage(clientKey(clientId, 'stockOpnames'), []),
  tables        : getStorage(clientKey(clientId, 'tables'),       []),
  gsConfig      : getStorage(clientKey(clientId, 'gsconfig'), {
    webAppUrl: '', connected: false, lastSync: null, syncing: false, error: null,
  }),
})

const initialState = {
  user: null, isAuthenticated: false, clientId: null,
  products: [], transactions: [], settings: DEFAULT_SETTINGS,
  members: [], expenses: [], shifts: [],
  suppliers: [], purchaseOrders: [], stockOpnames: [], tables: [],
  gsConfig: { webAppUrl: '', connected: false, lastSync: null, syncing: false, error: null },
  cart: [], currentPage: 'login', loading: false, initialized: false,
  activeShift: null,
}

const A = {
  INIT:'INIT', LOGIN:'LOGIN', LOGOUT:'LOGOUT', NAVIGATE:'NAVIGATE',
  SET_PRODUCTS:'SET_PRODUCTS', ADD_PRODUCT:'ADD_PRODUCT', UPDATE_PRODUCT:'UPDATE_PRODUCT', DELETE_PRODUCT:'DELETE_PRODUCT',
  ADD_TRANSACTION:'ADD_TRANSACTION', SET_TRANSACTIONS:'SET_TRANSACTIONS', UPDATE_TRANSACTION:'UPDATE_TRANSACTION',
  UPDATE_SETTINGS:'UPDATE_SETTINGS',
  SET_GS_CONFIG:'SET_GS_CONFIG', SET_GS_SYNCING:'SET_GS_SYNCING', SET_GS_ERROR:'SET_GS_ERROR',
  CART_ADD:'CART_ADD', CART_UPDATE_QTY:'CART_UPDATE_QTY', CART_REMOVE:'CART_REMOVE', CART_CLEAR:'CART_CLEAR',
  ADD_MEMBER:'ADD_MEMBER', UPDATE_MEMBER:'UPDATE_MEMBER', SET_MEMBERS:'SET_MEMBERS',
  ADD_EXPENSE:'ADD_EXPENSE', UPDATE_EXPENSE:'UPDATE_EXPENSE', DELETE_EXPENSE:'DELETE_EXPENSE', SET_EXPENSES:'SET_EXPENSES',
  START_SHIFT:'START_SHIFT', END_SHIFT:'END_SHIFT', SET_SHIFTS:'SET_SHIFTS',
  UPDATE_MEMBER_POINTS:'UPDATE_MEMBER_POINTS',
  // Suppliers
  ADD_SUPPLIER:'ADD_SUPPLIER', UPDATE_SUPPLIER:'UPDATE_SUPPLIER', DELETE_SUPPLIER:'DELETE_SUPPLIER',
  // Purchase Orders
  ADD_PURCHASE_ORDER:'ADD_PURCHASE_ORDER', UPDATE_PURCHASE_ORDER:'UPDATE_PURCHASE_ORDER',
  RECEIVE_PURCHASE_ORDER:'RECEIVE_PURCHASE_ORDER',
  // Stock Opname
  ADD_STOCK_OPNAME:'ADD_STOCK_OPNAME',
  // Tables
  ADD_TABLE:'ADD_TABLE', UPDATE_TABLE:'UPDATE_TABLE', DELETE_TABLE:'DELETE_TABLE',
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
    case A.SET_PRODUCTS:    return { ...state, products: payload }
    case A.ADD_PRODUCT:     return { ...state, products: [...state.products, payload] }
    case A.UPDATE_PRODUCT:  return { ...state, products: state.products.map(p => p.id === payload.id ? { ...p, ...payload } : p) }
    case A.DELETE_PRODUCT:  return { ...state, products: state.products.filter(p => p.id !== payload) }
    case A.ADD_TRANSACTION: return { ...state, transactions: [payload, ...state.transactions] }
    case A.SET_TRANSACTIONS: return { ...state, transactions: payload }
    case A.UPDATE_TRANSACTION: return { ...state, transactions: state.transactions.map(t => t.id === payload.id ? { ...t, ...payload } : t) }
    case A.UPDATE_SETTINGS: return { ...state, settings: { ...state.settings, ...payload } }
    case A.SET_GS_CONFIG:   return { ...state, gsConfig: { ...state.gsConfig, ...payload } }
    case A.SET_GS_SYNCING:  return { ...state, gsConfig: { ...state.gsConfig, syncing: payload } }
    case A.SET_GS_ERROR:    return { ...state, gsConfig: { ...state.gsConfig, error: payload, syncing: false } }
    case A.ADD_MEMBER:      return { ...state, members: [payload, ...state.members] }
    case A.UPDATE_MEMBER:   return { ...state, members: state.members.map(m => m.id === payload.id ? { ...m, ...payload } : m) }
    case A.SET_MEMBERS:     return { ...state, members: payload }
    // Expenses
    case A.ADD_EXPENSE:     return { ...state, expenses: [payload, ...state.expenses] }
    case A.UPDATE_EXPENSE:  return { ...state, expenses: state.expenses.map(e => e.id === payload.id ? { ...e, ...payload } : e) }
    case A.DELETE_EXPENSE:  return { ...state, expenses: state.expenses.filter(e => e.id !== payload) }
    case A.SET_EXPENSES:    return { ...state, expenses: payload }
    // Shifts
    case A.START_SHIFT:     return { ...state, activeShift: payload, shifts: [payload, ...state.shifts] }
    case A.END_SHIFT: {
      const updated = state.shifts.map(s => s.id === payload.id ? { ...s, ...payload } : s)
      return { ...state, activeShift: null, shifts: updated }
    }
    case A.SET_SHIFTS:      return { ...state, shifts: payload }
    // Member points
    case A.UPDATE_MEMBER_POINTS:
      return { ...state, members: state.members.map(m => m.id === payload.id ? { ...m, points: (m.points||0) + payload.delta } : m) }
    // Suppliers
    case A.ADD_SUPPLIER:    return { ...state, suppliers: [payload, ...state.suppliers] }
    case A.UPDATE_SUPPLIER: return { ...state, suppliers: state.suppliers.map(s => s.id === payload.id ? { ...s, ...payload } : s) }
    case A.DELETE_SUPPLIER: return { ...state, suppliers: state.suppliers.filter(s => s.id !== payload) }
    // Purchase Orders
    case A.ADD_PURCHASE_ORDER:    return { ...state, purchaseOrders: [payload, ...state.purchaseOrders] }
    case A.UPDATE_PURCHASE_ORDER: return { ...state, purchaseOrders: state.purchaseOrders.map(p => p.id === payload.id ? { ...p, ...payload } : p) }
    case A.RECEIVE_PURCHASE_ORDER: {
      // receiveQtys: { productId: qty }
      const { poId, receiveQtys } = payload
      const po = state.purchaseOrders.find(p => p.id === poId)
      if (!po) return state
      const updatedItems = po.items.map(item => ({
        ...item,
        receivedQty: (item.receivedQty || 0) + (receiveQtys[item.productId] || 0)
      }))
      const allReceived = updatedItems.every(it => it.receivedQty >= it.qty)
      const partialReceived = updatedItems.some(it => it.receivedQty > 0)
      const newStatus = allReceived ? 'received' : partialReceived ? 'partial' : po.status
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.map(p => p.id === poId ? { ...p, items: updatedItems, status: newStatus, receivedAt: allReceived ? new Date().toISOString() : p.receivedAt } : p)
      }
    }
    // Stock Opname
    case A.ADD_STOCK_OPNAME: return { ...state, stockOpnames: [payload, ...state.stockOpnames] }
    // Tables
    case A.ADD_TABLE:    return { ...state, tables: [...state.tables, payload] }
    case A.UPDATE_TABLE: return { ...state, tables: state.tables.map(t => t.id === payload.id ? { ...t, ...payload } : t) }
    case A.DELETE_TABLE: return { ...state, tables: state.tables.filter(t => t.id !== payload) }
    // Cart
    case A.CART_ADD: {
      const key = payload.variantId ? `${payload.productId}_${payload.variantId}` : payload.productId
      const ex  = state.cart.find(i => (i.variantId ? `${i.productId}_${i.variantId}` : i.productId) === key)
      if (ex) return { ...state, cart: state.cart.map(i => {
        const ik = i.variantId ? `${i.productId}_${i.variantId}` : i.productId
        return ik === key ? { ...i, qty: i.qty + 1 } : i
      })}
      return { ...state, cart: [...state.cart, { ...payload, qty: 1 }] }
    }
    case A.CART_UPDATE_QTY: {
      const key = payload.variantId ? `${payload.productId}_${payload.variantId}` : payload.productId
      return { ...state, cart: state.cart.map(i => {
        const ik = i.variantId ? `${i.productId}_${i.variantId}` : i.productId
        return ik === key ? { ...i, qty: payload.qty } : i
      }).filter(i => i.qty > 0)}
    }
    case A.CART_REMOVE: return { ...state, cart: state.cart.filter(i => {
      const ik = i.variantId ? `${i.productId}_${i.variantId}` : i.productId
      return ik !== payload
    })}
    case A.CART_CLEAR:  return { ...state, cart: [] }
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
          const user       = freshUser || session
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

  // Persist to localStorage whenever data changes
  useEffect(() => {
    if (state.initialized && state.clientId) {
      setStorage(clientKey(state.clientId, 'products'),      state.products)
      setStorage(clientKey(state.clientId, 'transactions'),  state.transactions)
      setStorage(clientKey(state.clientId, 'settings'),      state.settings)
      setStorage(clientKey(state.clientId, 'members'),       state.members)
      setStorage(clientKey(state.clientId, 'expenses'),      state.expenses)
      setStorage(clientKey(state.clientId, 'shifts'),        state.shifts)
      setStorage(clientKey(state.clientId, 'suppliers'),     state.suppliers)
      setStorage(clientKey(state.clientId, 'purchaseOrders'),state.purchaseOrders)
      setStorage(clientKey(state.clientId, 'stockOpnames'),  state.stockOpnames)
      setStorage(clientKey(state.clientId, 'tables'),        state.tables)
      setStorage(clientKey(state.clientId, 'gsconfig'),      state.gsConfig)
    }
  }, [state.products, state.transactions, state.settings, state.members, state.expenses, state.shifts, state.suppliers, state.purchaseOrders, state.stockOpnames, state.tables, state.gsConfig, state.clientId, state.initialized])

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

  const logout   = useCallback(() => { clearSession(); dispatch({ type: A.LOGOUT }) }, [])
  const navigate = useCallback((page) => dispatch({ type: A.NAVIGATE, payload: page }), [])

  const addProduct    = useCallback((p)  => dispatch({ type: A.ADD_PRODUCT,    payload: p }),  [])
  const updateProduct = useCallback((p)  => dispatch({ type: A.UPDATE_PRODUCT, payload: p }),  [])
  const deleteProduct = useCallback((id) => dispatch({ type: A.DELETE_PRODUCT, payload: id }), [])
  const setProducts   = useCallback((ps) => dispatch({ type: A.SET_PRODUCTS,   payload: ps }), [])

  const addTransaction = useCallback(async (trxData) => {
    const trx = { ...trxData, id: generateTrxId(), createdAt: new Date().toISOString() }
    dispatch({ type: A.ADD_TRANSACTION, payload: trx })

    // Update stock for each item
    trxData.items?.forEach(item => {
      if (!item.productId) return
      const prod = state.products.find(p => p.id === item.productId)
      if (!prod) return
      if (item.variantId) {
        const updatedVariants = (prod.variants || []).map(v =>
          v.id === item.variantId ? { ...v, stock: Math.max(0, (v.stock || 0) - item.qty) } : v
        )
        dispatch({ type: A.UPDATE_PRODUCT, payload: { ...prod, variants: updatedVariants } })
      } else {
        dispatch({ type: A.UPDATE_PRODUCT, payload: { ...prod, stock: Math.max(0, (prod.stock || 0) - item.qty) } })
      }
    })

    // Award loyalty points if enabled
    if (state.settings.loyaltyEnabled && trxData.memberId) {
      const pts = Math.floor((trxData.total || 0) / (state.settings.pointsPerRupiah || 1000))
      if (pts > 0) dispatch({ type: A.UPDATE_MEMBER_POINTS, payload: { id: trxData.memberId, delta: pts } })
    }

    // Update member stats
    if (trxData.memberId) {
      const member = state.members.find(m => m.id === trxData.memberId)
      if (member) {
        dispatch({ type: A.UPDATE_MEMBER, payload: {
          ...member,
          totalOrders: (member.totalOrders || 0) + 1,
          totalSpent : (member.totalSpent  || 0) + (trxData.total || 0),
          lastVisit  : new Date().toISOString(),
        }})
      }
    }

    // Sync to GSheets
    if (state.gsConfig.connected && state.gsConfig.webAppUrl) {
      try {
        await addTransactionToSheet(state.gsConfig.webAppUrl, trx)
        dispatch({ type: A.SET_GS_CONFIG, payload: { lastSync: new Date().toISOString(), error: null } })
      } catch (err) { dispatch({ type: A.SET_GS_ERROR, payload: err.message }) }
    }
    return trx
  }, [state.products, state.members, state.settings, state.gsConfig])

  const refundTransaction = useCallback((trxId, reason) => {
    const trx = state.transactions.find(t => t.id === trxId)
    // Restore stock on refund
    if (trx) {
      trx.items?.forEach(item => {
        if (!item.productId) return
        const prod = state.products.find(p => p.id === item.productId)
        if (!prod) return
        if (item.variantId) {
          const updatedVariants = (prod.variants || []).map(v =>
            v.id === item.variantId ? { ...v, stock: (v.stock || 0) + item.qty } : v
          )
          dispatch({ type: A.UPDATE_PRODUCT, payload: { ...prod, variants: updatedVariants } })
        } else {
          dispatch({ type: A.UPDATE_PRODUCT, payload: { ...prod, stock: (prod.stock || 0) + item.qty } })
        }
      })
      // Deduct member points if rewarded
      if (trx.memberId && state.settings.loyaltyEnabled) {
        const pts = Math.floor((trx.total || 0) / (state.settings.pointsPerRupiah || 1000))
        if (pts > 0) dispatch({ type: A.UPDATE_MEMBER_POINTS, payload: { id: trx.memberId, delta: -pts } })
      }
    }
    dispatch({ type: A.UPDATE_TRANSACTION, payload: {
      id: trxId, status: 'refunded',
      refundReason: reason, refundedAt: new Date().toISOString(),
    }})
  }, [state.transactions, state.products, state.settings])

  const updateSettings = useCallback((s) => dispatch({ type: A.UPDATE_SETTINGS, payload: s }), [])

  // Google Sheets
  const connectGoogleSheets    = useCallback(async (webAppUrl) => {
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
  const syncToGoogleSheets     = useCallback(async () => {
    dispatch({ type: A.SET_GS_SYNCING, payload: true })
    try {
      await syncAllToSheet(state.gsConfig.webAppUrl, { products: state.products, transactions: state.transactions, settings: state.settings })
      dispatch({ type: A.SET_GS_CONFIG, payload: { lastSync: new Date().toISOString(), syncing: false, error: null } })
    } catch (err) { dispatch({ type: A.SET_GS_ERROR, payload: err.message }); throw err }
  }, [state.gsConfig.webAppUrl, state.products, state.transactions, state.settings])
  const pullFromGoogleSheets   = useCallback(async () => {
    dispatch({ type: A.SET_GS_SYNCING, payload: true })
    try {
      const [products, settings] = await Promise.all([
        fetchProductsFromSheet(state.gsConfig.webAppUrl),
        fetchSettingsFromSheet(state.gsConfig.webAppUrl),
      ])
      if (products.length > 0) dispatch({ type: A.SET_PRODUCTS, payload: products })
      if (Object.keys(settings).length > 0) dispatch({ type: A.UPDATE_SETTINGS, payload: settings })
      dispatch({ type: A.SET_GS_CONFIG, payload: { lastSync: new Date().toISOString(), syncing: false, error: null } })
      return { success: true, productsCount: products.length }
    } catch (err) { dispatch({ type: A.SET_GS_ERROR, payload: err.message }); throw err }
  }, [state.gsConfig.webAppUrl])

  // Members
  const addMember    = useCallback((m) => dispatch({ type: A.ADD_MEMBER, payload: { ...m, id: `MBR-${Date.now()}`, createdAt: new Date().toISOString(), totalSpent: 0, totalOrders: 0, points: 0 } }), [])
  const updateMember = useCallback((m) => dispatch({ type: A.UPDATE_MEMBER, payload: m }), [])

  // Expenses (Pengeluaran)
  const addExpense    = useCallback((e) => dispatch({ type: A.ADD_EXPENSE,   payload: { ...e, id: `EXP-${Date.now()}`, createdAt: new Date().toISOString() } }), [])
  const updateExpense = useCallback((e) => dispatch({ type: A.UPDATE_EXPENSE, payload: e }), [])
  const deleteExpense = useCallback((id) => dispatch({ type: A.DELETE_EXPENSE, payload: id }), [])

  // Suppliers
  const addSupplier    = useCallback((s) => dispatch({ type: A.ADD_SUPPLIER,    payload: { ...s, id: `SUP-${Date.now()}`, createdAt: new Date().toISOString() } }), [])
  const updateSupplier = useCallback((s) => dispatch({ type: A.UPDATE_SUPPLIER, payload: s }), [])
  const deleteSupplier = useCallback((id) => dispatch({ type: A.DELETE_SUPPLIER, payload: id }), [])

  // Purchase Orders
  const addPurchaseOrder = useCallback((po) => dispatch({
    type: A.ADD_PURCHASE_ORDER,
    payload: { ...po, id: `PO-${Date.now()}`, createdAt: new Date().toISOString() }
  }), [])
  const updatePurchaseOrder = useCallback((po) => dispatch({ type: A.UPDATE_PURCHASE_ORDER, payload: po }), [])
  const receivePurchaseOrder = useCallback((poId, receiveQtys) => {
    // Update stock for each received product
    Object.entries(receiveQtys).forEach(([productId, qty]) => {
      if (!qty || qty <= 0) return
      const prod = state.products.find(p => p.id === productId)
      if (prod) dispatch({ type: A.UPDATE_PRODUCT, payload: { ...prod, stock: (prod.stock||0) + qty } })
    })
    dispatch({ type: A.RECEIVE_PURCHASE_ORDER, payload: { poId, receiveQtys } })
  }, [state.products])

  // Stock Opname
  const addStockOpname = useCallback((opname) => dispatch({
    type: A.ADD_STOCK_OPNAME,
    payload: { ...opname, id: `OPN-${Date.now()}` }
  }), [])

  // Tables
  const addTable    = useCallback((t) => dispatch({ type: A.ADD_TABLE,    payload: { ...t, id: `TBL-${Date.now()}`, createdAt: new Date().toISOString() } }), [])
  const updateTable = useCallback((t) => dispatch({ type: A.UPDATE_TABLE, payload: t }), [])
  const deleteTable = useCallback((id) => dispatch({ type: A.DELETE_TABLE, payload: id }), [])

  // Shifts
  const startShift = useCallback((modalKas, kasirName) => {
    const shift = {
      id       : `SHIFT-${Date.now()}`,
      startTime: new Date().toISOString(),
      endTime  : null,
      kasirId  : state.user?.id,
      kasirName: kasirName || state.user?.name,
      modalKas : modalKas || 0,
      status   : 'active',
    }
    dispatch({ type: A.START_SHIFT, payload: shift })
    return shift
  }, [state.user])

  const endShift = useCallback((totalPenjualan, totalKas, notes) => {
    if (!state.activeShift) return
    const ended = {
      ...state.activeShift,
      endTime        : new Date().toISOString(),
      totalPenjualan : totalPenjualan || 0,
      totalKas       : totalKas || 0,
      notes          : notes || '',
      status         : 'closed',
    }
    dispatch({ type: A.END_SHIFT, payload: ended })
    return ended
  }, [state.activeShift])

  // Cart
  const cartAdd = useCallback((p, variant = null) => {
    const payload = variant
      ? { productId: p.id, variantId: variant.id, name: `${p.name} - ${variant.name}`, price: variant.price, hpp: variant.hpp || 0, unit: p.unit, category: p.category }
      : { productId: p.id, variantId: null, name: p.name, price: p.price, hpp: p.hpp || 0, unit: p.unit, category: p.category }
    dispatch({ type: A.CART_ADD, payload })
  }, [])
  const cartUpdateQty = useCallback((productId, qty, variantId = null) => dispatch({ type: A.CART_UPDATE_QTY, payload: { productId, variantId, qty } }), [])
  const cartRemove    = useCallback((productId, variantId = null) => {
    const key = variantId ? `${productId}_${variantId}` : productId
    dispatch({ type: A.CART_REMOVE, payload: key })
  }, [])
  const cartClear     = useCallback(() => dispatch({ type: A.CART_CLEAR }), [])

  const value = {
    ...state, navigate,
    login, logout, authenticate,
    addProduct, updateProduct, deleteProduct, setProducts,
    addTransaction, refundTransaction,
    updateSettings,
    connectGoogleSheets, disconnectGoogleSheets, syncToGoogleSheets, pullFromGoogleSheets,
    addMember, updateMember,
    addExpense, updateExpense, deleteExpense,
    startShift, endShift,
    addSupplier, updateSupplier, deleteSupplier,
    addPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder,
    addStockOpname,
    addTable, updateTable, deleteTable,
    cartAdd, cartUpdateQty, cartRemove, cartClear,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
