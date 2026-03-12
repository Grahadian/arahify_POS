// ============================================================
// MSME GROW POS - Application Constants v3.0
// ============================================================

export const APP_NAME = 'MSME Grow POS'
export const APP_VERSION = '3.0.0'

export const DEFAULT_TAX_RATE = 0.05

export const STORAGE_KEYS = {
  USER: 'msme_grow_user',
  PRODUCTS: 'msme_grow_products',
  TRANSACTIONS: 'msme_grow_transactions',
  SETTINGS: 'msme_grow_settings',
  GS_CONFIG: 'msme_grow_gs_config',
}

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  KASIR: 'kasir',
}

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  QRIS: 'QRIS',
  TRANSFER: 'Transfer',
}

export const TRX_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
}

// ── Product categories (umum untuk semua jenis usaha) ───────
export const CATEGORIES = [
  'Semua','Makanan','Minuman','Fashion','Kecantikan',
  'Elektronik','Kesehatan','Jasa','Retail','Lainnya',
]

export const CATEGORY_COLORS = {
  'Makanan'    : { bg: '#FFF7ED', text: '#C2410C', accent: '#F97316' },
  'Minuman'    : { bg: '#EFF6FF', text: '#1D4ED8', accent: '#2563EB' },
  'Fashion'    : { bg: '#FDF4FF', text: '#7E22CE', accent: '#A855F7' },
  'Kecantikan' : { bg: '#FFF1F2', text: '#BE123C', accent: '#F43F5E' },
  'Elektronik' : { bg: '#F0F9FF', text: '#0369A1', accent: '#0EA5E9' },
  'Kesehatan'  : { bg: '#F0FDF4', text: '#166534', accent: '#22C55E' },
  'Jasa'       : { bg: '#FEFCE8', text: '#A16207', accent: '#EAB308' },
  'Retail'     : { bg: '#F8FAFC', text: '#475569', accent: '#64748B' },
  'Lainnya'    : { bg: '#F9FAFB', text: '#374151', accent: '#6B7280' },
  // legacy
  'Strategi'   : { bg: '#EFF6FF', text: '#1D4ED8', accent: '#2563EB' },
  'Legal'      : { bg: '#F0FDF4', text: '#166534', accent: '#22C55E' },
  'Marketing'  : { bg: '#FFF7ED', text: '#C2410C', accent: '#F97316' },
  'Keuangan'   : { bg: '#F5F3FF', text: '#6D28D9', accent: '#A855F7' },
}

// ── Satuan produk (UOM) ──────────────────────────────────────
export const PRODUCT_UNITS = [
  'pcs','buah','unit','lusin','kodi','gross',
  'kg','gram','ons','ton',
  'liter','ml','botol','galon',
  'meter','cm','lembar','roll',
  'pak','karton','dus','box','sachet','bungkus',
  'porsi','mangkuk','gelas','cup',
  'sesi','paket','jam','hari',
  'lainnya',
]

export const CURRENCIES = [
  { code: 'IDR', name: 'Rupiah Indonesia', symbol: 'Rp', locale: 'id-ID' },
  { code: 'USD', name: 'US Dollar',        symbol: '$',  locale: 'en-US' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' },
  { code: 'MYR', name: 'Malaysian Ringgit',symbol: 'RM', locale: 'ms-MY' },
]

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

export const ONLINE_CHANNELS = {
  GOFOOD:    'GoFood',
  SHOPEEFOOD: 'ShopeeFood',
  GRABFOOD:  'GrabFood',
}

// ── Default settings per client ──────────────────────────────
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
  // loyalty points
  loyaltyEnabled: false,
  pointsPerRupiah: 1000,   // 1 poin per Rp 1.000
  pointsRedeemRate: 1,     // 1 poin = Rp 1
  // shift kasir
  shiftEnabled: false,
  // table management
  tableEnabled: false,
}

// ── Initial demo products (relevan UMKM) ─────────────────────
export const INITIAL_PRODUCTS = [
  {
    id: 'prod_001',
    name: 'Nasi Goreng Spesial',
    description: 'Nasi goreng dengan telur, ayam, dan sayuran pilihan.',
    price: 25000,
    hpp: 12000,
    category: 'Makanan',
    unit: 'porsi',
    sku: 'MKN-001',
    stock: 50,
    active: true,
    hasVariants: false,
    variants: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_002',
    name: 'Es Teh Manis',
    description: 'Teh manis dingin dengan es batu.',
    price: 8000,
    hpp: 2000,
    category: 'Minuman',
    unit: 'gelas',
    sku: 'MNM-001',
    stock: 100,
    active: true,
    hasVariants: true,
    variants: [
      { id: 'v1', name: 'Kecil', price: 6000, hpp: 1500, stock: 50 },
      { id: 'v2', name: 'Besar', price: 10000, hpp: 2500, stock: 50 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_003',
    name: 'Kaos Polos Cotton',
    description: 'Kaos cotton combed 30s, tersedia berbagai ukuran.',
    price: 85000,
    hpp: 40000,
    category: 'Fashion',
    unit: 'pcs',
    sku: 'FSH-001',
    stock: 30,
    active: true,
    hasVariants: true,
    variants: [
      { id: 'v1', name: 'S', price: 85000, hpp: 40000, stock: 10 },
      { id: 'v2', name: 'M', price: 85000, hpp: 40000, stock: 10 },
      { id: 'v3', name: 'L', price: 85000, hpp: 40000, stock: 5 },
      { id: 'v4', name: 'XL', price: 90000, hpp: 42000, stock: 5 },
    ],
    createdAt: new Date().toISOString(),
  },
]

export const INITIAL_TRANSACTIONS = [
  {
    id: 'TRX-10001',
    date: new Date(Date.now() - 120000).toISOString(),
    items: [{ productId: 'prod_001', name: 'Nasi Goreng Spesial', qty: 2, price: 25000, hpp: 12000, unit: 'porsi' }],
    subtotal: 50000, tax: 2500, total: 52500, discount: 0,
    payment: 'Cash', cashier: 'Admin', cashierId: 1, note: '', status: 'completed',
  },
  {
    id: 'TRX-10002',
    date: new Date(Date.now() - 900000).toISOString(),
    items: [{ productId: 'prod_002', name: 'Es Teh Manis', qty: 3, price: 8000, hpp: 2000, unit: 'gelas' }],
    subtotal: 24000, tax: 1200, total: 25200, discount: 0,
    payment: 'QRIS', cashier: 'Admin', cashierId: 1, note: '', status: 'completed',
  },
]
