// ============================================================
// MSME GROW POS — Image Asset Registry
// ============================================================
// Edit file ini untuk mengganti / menambah gambar di seluruh app.
// Import gambar dari folder ini, bukan hardcode URL langsung.
//
// Untuk slide carousel login:
//   - Tambah objek ke PROMO_SLIDES
//   - Taruh file gambar di: src/assets/images/slides/
//   - Import dan masukkan ke `image` field
//
// ⚠️  Jika tidak ada file gambar, slide akan tampil sebagai
//     warna solid + teks (fallback otomatis).
// ============================================================

// ── Slide Carousel Login ─────────────────────────────────────
// Ganti `image: null` dengan import gambar Anda:
// import slide1 from './slides/slide-1.png'
// Lalu: image: slide1

export const PROMO_SLIDES = [
  {
    id: 1,
    image: null,                          // ← Ganti: import './slides/slide-1.png'
    bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    accent: '#2563EB',
    badge: '✨ Fitur Unggulan',
    title: 'Kelola Penjualan\nLebih Mudah',
    subtitle: 'POS modern yang dirancang khusus untuk UMKM Indonesia. Catat transaksi, lacak stok, dan cetak struk dalam hitungan detik.',
    icon: '🛒',
  },
  {
    id: 2,
    image: null,                          // ← Ganti: import './slides/slide-2.png'
    bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    accent: '#16A34A',
    badge: '📊 Laporan Cerdas',
    title: 'Pantau Bisnis\nDari Mana Saja',
    subtitle: 'Dashboard real-time dengan grafik penjualan, performa kasir, dan laporan harian yang otomatis tersinkron ke Google Sheets.',
    icon: '📈',
  },
  {
    id: 3,
    image: null,                          // ← Ganti: import './slides/slide-3.png'
    bg: 'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)',
    accent: '#EA580C',
    badge: '👥 Fitur Member',
    title: 'Loyalitas\nPelanggan Terjaga',
    subtitle: 'Daftarkan pelanggan sebagai member, pantau riwayat belanja, dan berikan pengalaman belanja yang personal.',
    icon: '🎁',
  },
  {
    id: 4,
    image: null,                          // ← Ganti: import './slides/slide-4.png'
    bg: 'linear-gradient(135deg, #FAF5FF 0%, #E9D5FF 100%)',
    accent: '#7C3AED',
    badge: '🔗 Integrasi',
    title: 'Terhubung ke\nGoogle Sheets',
    subtitle: 'Semua data otomatis tersinkron ke spreadsheet Anda. Analisis lanjutan, backup data, dan akses dari perangkat apa pun.',
    icon: '📋',
  },
]

// ── App Logo (opsional override) ─────────────────────────────
// Jika ingin pakai file logo gambar (PNG/SVG) gantikan AppLogo.jsx:
// import appLogoImage from './logo.png'
// export const APP_LOGO_IMAGE = appLogoImage
export const APP_LOGO_IMAGE = null  // null = pakai AppLogo.jsx (SVG default)

// ── Receipt Header Image ─────────────────────────────────────
// import receiptHeader from './receipt-header.png'
// export const RECEIPT_HEADER_IMAGE = receiptHeader
export const RECEIPT_HEADER_IMAGE = null
