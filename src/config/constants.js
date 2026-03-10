// ============================================================
// MSME GROW POS - Application Constants
// ============================================================

export const APP_NAME = 'MSME Grow POS'
export const APP_VERSION = '1.0.0'

// Tax rate default (5%)
export const DEFAULT_TAX_RATE = 0.05

// Local storage keys
export const STORAGE_KEYS = {
  USER: 'msme_grow_user',
  PRODUCTS: 'msme_grow_products',
  TRANSACTIONS: 'msme_grow_transactions',
  SETTINGS: 'msme_grow_settings',
  GS_CONFIG: 'msme_grow_gs_config',
}

// User roles
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  KASIR: 'kasir',
}

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  QRIS: 'QRIS',
  TRANSFER: 'Transfer',
}

// Transaction statuses
export const TRX_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
}

// Product categories
export const CATEGORIES = ['Semua', 'Strategi', 'Legal', 'Marketing', 'Keuangan', 'Lainnya']

// Category colors mapping
export const CATEGORY_COLORS = {
  'Strategi': { bg: '#EFF6FF', text: '#1D4ED8', accent: '#2563EB' },
  'Legal': { bg: '#F0FDF4', text: '#166534', accent: '#22C55E' },
  'Marketing': { bg: '#FFF7ED', text: '#C2410C', accent: '#F97316' },
  'Keuangan': { bg: '#F5F3FF', text: '#6D28D9', accent: '#A855F7' },
  'Lainnya': { bg: '#F9FAFB', text: '#374151', accent: '#6B7280' },
}

// Currency options
export const CURRENCIES = [
  { code: 'IDR', name: 'Rupiah Indonesia', symbol: 'Rp', locale: 'id-ID' },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY' },
]

// Google Apps Script actions
export const GAS_ACTIONS = {
  VERIFY: 'verify',
  GET_PRODUCTS: 'getProducts',
  SYNC_PRODUCTS: 'syncProducts',
  ADD_TRANSACTION: 'addTransaction',
  GET_TRANSACTIONS: 'getTransactions',
  GET_SETTINGS: 'getSettings',
  UPDATE_SETTINGS: 'updateSettings',
  SYNC_ALL: 'syncAll',
}

// Initial demo products
export const INITIAL_PRODUCTS = [
  {
    id: 'prod_001',
    name: 'Business Strategy Consultation',
    description: 'Sesi konsultasi strategi bisnis komprehensif termasuk analisis pasar dan roadmap pertumbuhan.',
    price: 250000,
    category: 'Strategi',
    unit: 'sesi',
    sku: 'BSC-001',
    stock: 99,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_002',
    name: 'Legal Contract Review',
    description: 'Review mendalam perjanjian layanan dan dokumen hukum bisnis Anda.',
    price: 500000,
    category: 'Legal',
    unit: 'dokumen',
    sku: 'LCR-001',
    stock: 99,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_003',
    name: 'Marketing Audit',
    description: 'Analisis menyeluruh strategi marketing saat ini dan rekomendasi peningkatan.',
    price: 1200000,
    category: 'Marketing',
    unit: 'paket',
    sku: 'MA-001',
    stock: 99,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_004',
    name: 'Brand Identity Package',
    description: 'Desain logo, palet warna, dan panduan merek lengkap untuk bisnis Anda.',
    price: 850000,
    category: 'Marketing',
    unit: 'paket',
    sku: 'BIP-001',
    stock: 99,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_005',
    name: 'Laporan Keuangan Setup',
    description: 'Setup sistem pelaporan keuangan otomatis menggunakan Google Sheets.',
    price: 450000,
    category: 'Keuangan',
    unit: 'sesi',
    sku: 'LKS-001',
    stock: 99,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_006',
    name: 'Konsultasi Pajak',
    description: 'Konsultasi perpajakan UMKM termasuk perhitungan dan pelaporan SPT.',
    price: 350000,
    category: 'Keuangan',
    unit: 'sesi',
    sku: 'KP-001',
    stock: 99,
    active: true,
    createdAt: new Date().toISOString(),
  },
]

// Demo transactions
export const INITIAL_TRANSACTIONS = [
  {
    id: 'TRX-10001',
    date: new Date(Date.now() - 120000).toISOString(),
    items: [{ productId: 'prod_001', name: 'Business Strategy Consultation', qty: 1, price: 250000, unit: 'sesi' }],
    subtotal: 250000,
    tax: 12500,
    total: 262500,
    discount: 0,
    payment: 'Cash',
    cashier: 'Budi Santoso',
    cashierId: 2,
    note: '',
    status: 'completed',
  },
  {
    id: 'TRX-10002',
    date: new Date(Date.now() - 900000).toISOString(),
    items: [
      { productId: 'prod_002', name: 'Legal Contract Review', qty: 2, price: 500000, unit: 'dokumen' },
    ],
    subtotal: 1000000,
    tax: 50000,
    total: 1050000,
    discount: 0,
    payment: 'Card',
    cashier: 'Budi Santoso',
    cashierId: 2,
    note: '',
    status: 'completed',
  },
  {
    id: 'TRX-10003',
    date: new Date(Date.now() - 3600000).toISOString(),
    items: [{ productId: 'prod_003', name: 'Marketing Audit', qty: 1, price: 1200000, unit: 'paket' }],
    subtotal: 1200000,
    tax: 60000,
    total: 1260000,
    discount: 0,
    payment: 'QRIS',
    cashier: 'Admin MSME Grow',
    cashierId: 1,
    note: '',
    status: 'completed',
  },
]

// Default settings per client
export const DEFAULT_SETTINGS = {
  businessName: 'MSME Grow',
  ownerName: '',
  whatsapp: '',
  address: '',
  currency: 'IDR',
  taxRate: 5,
  taxEnabled: true,
  showLogoOnReceipt: true,
  receiptFooter: 'Terima kasih atas kepercayaan Anda!',
  printAutomatically: false,
  lowStockAlert: 5,
  gsWebAppUrl: '',
  gsConnected: false,
  gsLastSync: null,
  theme: 'light',
  language: 'id',
  qrisImageUrl: '',
  kasirPin: '',
  bankAccounts: [
    { bankName: '', noRek: '', atasNama: '' },
    { bankName: '', noRek: '', atasNama: '' },
  ],
}

// Online food delivery channels (for POS cart)
export const ONLINE_CHANNELS = {
  GOFOOD:    'GoFood',
  SHOPEFOOD: 'ShopeeFood',
  GRABFOOD:  'GrabFood',
}
