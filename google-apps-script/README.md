# Google Apps Script - MSME Grow POS

Folder ini berisi backend Google Apps Script yang harus di-deploy
untuk setiap klien baru.

---

## 📁 File

| File             | Keterangan                                      |
|------------------|-------------------------------------------------|
| `Code.gs`        | Kode utama — paste ke Apps Script editor        |
| `appsscript.json`| Manifest (timezone Jakarta, akses publik)       |

---

## 🚀 Cara Deploy untuk Klien Baru

### Langkah 1 — Siapkan Google Spreadsheet
1. Buka [Google Drive](https://drive.google.com)
2. Klik **+ Baru → Google Spreadsheet**
3. Beri nama, misalnya: `MSME Grow POS - [Nama Klien]`

### Langkah 2 — Buka Apps Script
1. Di dalam spreadsheet, klik menu **Extensions → Apps Script**
2. Tab baru terbuka berisi editor Apps Script

### Langkah 3 — Paste Kode
1. Hapus semua isi file `Code.gs` yang ada (kode default)
2. Salin seluruh isi file **`Code.gs`** dari folder ini
3. Paste ke editor
4. Klik **Save** (ikon floppy disk atau Ctrl+S)

### Langkah 4 — Inisialisasi Sheet (opsional tapi disarankan)
1. Di dropdown fungsi, pilih `initializeSheets`
2. Klik **Run (▶)**
3. Izinkan akses saat diminta (klik Review permissions → Allow)
4. Ini akan membuat tab: Transaksi, Produk, Pengaturan

### Langkah 5 — Deploy sebagai Web App
1. Klik **Deploy → New deployment**
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**
3. Isi form:
   - **Description**: MSME Grow POS v1.0
   - **Execute as**: **Me** ← wajib ini
   - **Who has access**: **Anyone** ← wajib ini
4. Klik **Deploy**
5. Klik **Authorize access** jika diminta
6. **Salin Web App URL** (format: `https://script.google.com/macros/s/xxxx/exec`)

### Langkah 6 — Input URL ke Aplikasi POS
1. Login ke POS sebagai **Admin** klien tersebut
2. Buka **Settings → Google Sheets**
3. Paste URL di kolom **Deployment URL**
4. Klik **Hubungkan ke Google Sheets**
5. Jika berhasil, muncul pesan "✅ Berhasil terhubung!"

### Langkah 7 — Aktifkan Laporan Harian Otomatis (opsional)
1. Kembali ke Apps Script editor
2. Di dropdown, pilih fungsi `setupDailyTrigger`
3. Klik **Run (▶)**
4. Tab Laporan akan otomatis diperbarui setiap hari jam 01.00

---

## 📊 Sheet yang Dibuat Otomatis

| Tab          | Isi                                         | Diperbarui Kapan            |
|--------------|---------------------------------------------|-----------------------------|
| Transaksi    | Semua data transaksi lengkap                | Otomatis setiap checkout    |
| Produk       | Master data produk/layanan                  | Manual via Push Sync di app |
| Pengaturan   | Konfigurasi bisnis                          | Manual via Push Sync di app |
| Laporan      | Ringkasan harian, mingguan, top produk      | Otomatis setiap transaksi   |

---

## 🔧 Fungsi Manual (jalankan dari Apps Script editor)

| Fungsi                | Kegunaan                                           |
|-----------------------|----------------------------------------------------|
| `testVerify()`        | Test apakah script berjalan normal                 |
| `initializeSheets()`  | Buat semua tab dengan header yang benar            |
| `manualBuildLaporan()`| Rebuild tab Laporan secara manual                  |
| `setupDailyTrigger()` | Aktifkan trigger laporan otomatis harian           |

---

## ⚠️ Perhatian

- **Jangan ubah** nama tab (Transaksi, Produk, Pengaturan, Laporan)
- Setiap kali update kode, buat **New deployment** (bukan redeploy lama)
- URL Web App yang baru harus diupdate di Settings aplikasi POS
- Jika ada error, cek **Apps Script → Executions** untuk log detail
