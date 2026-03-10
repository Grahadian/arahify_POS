# 📁 Folder Aset Gambar — MSME Grow POS

Taruh semua file gambar, GIF, dan ilustrasi di sini.

## Struktur folder

```
src/assets/
├── images/
│   ├── slides/              ← Gambar carousel di halaman login
│   │   ├── slide-1.png      ← Slide 1 (promosi / fitur)
│   │   ├── slide-2.png      ← Slide 2
│   │   ├── slide-3.png      ← Slide 3
│   │   └── (tambah sesukanya)
│   ├── logo.png             ← Logo utama bisnis (opsional, override AppLogo)
│   └── receipt-header.png   ← Gambar header struk (opsional)
├── icons/
│   └── (icon custom jika ada)
└── AppLogo.jsx              ← Komponen logo React (hardcoded brand)
```

## Cara ganti slide carousel

Edit file: `src/assets/images/imageAssets.js`
Tambah/hapus item di array `PROMO_SLIDES`.

## Format yang didukung
- PNG, JPG, JPEG, WebP, GIF, SVG
- Ukuran rekomendasi slide: 800×500px atau 16:10 ratio
