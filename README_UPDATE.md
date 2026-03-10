# MSME Grow POS — Patch Update v3

## Cara Install
Salin setiap file ke path yang sama di dalam project `msme-grow-pos/src/`.

| File dalam ZIP                              | Path di project                                      |
|---------------------------------------------|------------------------------------------------------|
| `src/App.jsx`                               | `src/App.jsx`                                        |
| `src/context/AppContext.jsx`                | `src/context/AppContext.jsx`                         |
| `src/components/layout/AppLayout.jsx`       | `src/components/layout/AppLayout.jsx`                |
| `src/components/layout/ReceiptPrint.jsx`    | `src/components/layout/ReceiptPrint.jsx`             |
| `src/pages/auth/LoginPage.jsx`              | `src/pages/auth/LoginPage.jsx`                       |
| `src/pages/auth/RegisterPage.jsx`           | `src/pages/auth/RegisterPage.jsx`                    |
| `src/pages/admin/DashboardPage.jsx`         | `src/pages/admin/DashboardPage.jsx`                  |
| `src/pages/admin/ReportsPage.jsx`           | `src/pages/admin/ReportsPage.jsx`                    |
| `src/pages/admin/SettingsPage.jsx`          | `src/pages/admin/SettingsPage.jsx`                   |
| `src/pages/kasir/RegisterPage.jsx`          | `src/pages/kasir/RegisterPage.jsx`                   |
| `src/pages/kasir/OrdersPage.jsx`            | `src/pages/kasir/OrdersPage.jsx`                     |
| `src/pages/kasir/MembersPage.jsx`           | `src/pages/kasir/MembersPage.jsx`                    |
| `src/pages/kasir/InventoryPage.jsx`         | `src/pages/kasir/InventoryPage.jsx`                  |

## Perubahan per Poin

### 1. UI Login & Register — Redesign Premium Dark
- Background dark gradient (Navy → Blue → Navy) dengan blob dekoratif
- Input field dengan glass-morphism, border highlight saat focus
- Animasi hover pada tombol
- OTP 6 kotak dengan auto-focus, countdown timer, paste support
- Stepper step indicator yang elegant
- Tombol kontak (WA/IG/Email) terintegrasi di halaman login

### 2. Scrollbar Global
- `AppLayout` menambahkan `scrollbar-width: thin` dan webkit scrollbar styles
- Konten halaman dapat di-scroll saat zoom browser
- `overflowY: auto` pada semua auth page

### 3. Logo Bisnis Custom
- Di **Pengaturan → Profil Bisnis** → Upload logo (PNG/JPG, maks 2MB)
- Logo tampil di: header app (ganti ikon rumah), halaman login, struk cetak
- Disimpan sebagai base64 di localStorage

### 4. Loading Screen saat Login
- Animasi loading muncul 1.4 detik setelah login berhasil
- Pesan dinamis: "Menyiapkan dashboard bisnis..." / "Menyiapkan kasir POS..."
- Juga muncul saat pertama kali app dimuat

### 5. Cart Resizable (geser kiri-kanan)
- **Drag divider** antara grid produk dan keranjang untuk ubah lebar
- Lebar min: 260px, maks: 520px, default: 320px
- Hover divider berubah biru sebagai indikator
- Grid produk **auto-fill responsive** mengikuti sisa lebar layar

### 6. Info Member di Struk
- Jika transaksi menggunakan member, struk mencetak:
  - Nama lengkap, No. Telepon, Email, ID Member
  - Ditampilkan dalam kotak border dashed bertuliskan "★ Pelanggan Member"
- Data `memberPhone` dan `memberEmail` kini ikut tersimpan di transaksi
