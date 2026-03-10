// ============================================================
// MSME GROW POS - Google Apps Script Service (Multi-Client)
// ============================================================
// Setiap klien punya Google Sheet + GAS deployment sendiri.
// URL GAS Web App per klien disimpan di data CLIENTS (useUsers.js)
// dan bisa di-override via Settings (tersimpan di localStorage).
//
// ALUR INTEGRASI PER KLIEN BARU:
// 1. Anda buat Google Spreadsheet baru untuk klien
// 2. Buka Extensions → Apps Script
// 3. Paste kode GAS_TEMPLATE_CODE ke Code.gs
// 4. Deploy: Execute as Me, Access: Anyone
// 5. Salin Web App URL
// 6. Paste URL ke CLIENTS array (useUsers.js) untuk clientId klien tsb
// ============================================================

import { GAS_ACTIONS } from '@/config/constants'

// ─────────────────────────────────────────────────────────────
// BASE REQUEST
// GAS Web App menerima POST dengan body JSON (Content-Type: text/plain
// untuk menghindari CORS preflight pada mode no-cors tidak bisa
// baca response — gunakan 'cors' dengan GAS yang sudah deploy public)
// ─────────────────────────────────────────────────────────────
const gasRequest = async (webAppUrl, action, payload = {}) => {
  if (!webAppUrl || webAppUrl.includes('GANTI_URL')) {
    throw new Error('Google Apps Script URL belum dikonfigurasi untuk klien ini.')
  }

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    const json = JSON.parse(text)

    if (json.error) throw new Error(json.error)
    return json

  } catch (err) {
    if (err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
      throw new Error(
        'Tidak dapat terhubung ke Google Sheets.\n' +
        'Pastikan: (1) koneksi internet aktif, (2) URL Web App benar, ' +
        '(3) GAS sudah di-deploy dengan akses "Anyone".'
      )
    }
    throw err
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API FUNCTIONS
// ─────────────────────────────────────────────────────────────

/** Verifikasi koneksi ke GAS Web App klien */
export const verifyGASConnection = (url) =>
  gasRequest(url, GAS_ACTIONS.VERIFY)

/** Ambil daftar produk dari tab Produk di Sheet klien */
export const fetchProductsFromSheet = async (url) => {
  const res = await gasRequest(url, GAS_ACTIONS.GET_PRODUCTS)
  return res.products || []
}

/** Kirim/timpa seluruh produk ke tab Produk */
export const syncProductsToSheet = (url, products) =>
  gasRequest(url, GAS_ACTIONS.SYNC_PRODUCTS, { products })

/** Tambah 1 transaksi baru ke tab Transaksi (dipanggil otomatis setiap checkout) */
export const addTransactionToSheet = (url, transaction) =>
  gasRequest(url, GAS_ACTIONS.ADD_TRANSACTION, { transaction })

/** Ambil semua transaksi dari Sheet */
export const fetchTransactionsFromSheet = async (url) => {
  const res = await gasRequest(url, GAS_ACTIONS.GET_TRANSACTIONS)
  return res.transactions || []
}

/** Ambil settings bisnis dari tab Pengaturan */
export const fetchSettingsFromSheet = async (url) => {
  const res = await gasRequest(url, GAS_ACTIONS.GET_SETTINGS)
  return res.settings || {}
}

/** Update settings di tab Pengaturan */
export const updateSettingsInSheet = (url, settings) =>
  gasRequest(url, GAS_ACTIONS.UPDATE_SETTINGS, { settings })

/** Full sync: produk + transaksi + settings sekaligus */
export const syncAllToSheet = (url, { products, transactions, settings }) =>
  gasRequest(url, GAS_ACTIONS.SYNC_ALL, { products, transactions, settings })

// ─────────────────────────────────────────────────────────────
// GOOGLE APPS SCRIPT TEMPLATE
// ─────────────────────────────────────────────────────────────
// Paste kode ini ke Google Apps Script (Code.gs) untuk setiap klien.
// Deploy sebagai Web App: Execute as Me, Who has access: Anyone.
//
// Sheet yang akan dibuat otomatis:
//   📋 Transaksi   - semua data transaksi
//   📦 Produk      - master data produk/layanan
//   ⚙️  Pengaturan  - konfigurasi bisnis
//   📊 Laporan     - ringkasan otomatis harian & mingguan
// ─────────────────────────────────────────────────────────────
export const GAS_TEMPLATE_CODE = `
// ============================================================
// MSME GROW POS - Google Apps Script Backend
// Versi: 1.0.0
// Deploy: Web App | Execute as: Me | Access: Anyone
// ============================================================

const SHEETS = {
  TRANSACTIONS : 'Transaksi',
  PRODUCTS     : 'Produk',
  SETTINGS     : 'Pengaturan',
  REPORT       : 'Laporan',
};

// ── Entry Points ─────────────────────────────────────────────
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;

    switch (action) {
      case 'verify':
        result = { success: true, message: 'Koneksi berhasil! MSME Grow POS terhubung.', version: '1.0.0' };
        break;
      case 'getProducts':
        result = { success: true, products: getProducts_() };
        break;
      case 'syncProducts':
        result = syncProducts_(data.products);
        break;
      case 'addTransaction':
        result = addTransaction_(data.transaction);
        // Rebuild laporan setiap ada transaksi baru
        buildLaporan_();
        break;
      case 'getTransactions':
        result = { success: true, transactions: getTransactions_() };
        break;
      case 'getSettings':
        result = { success: true, settings: getSettings_() };
        break;
      case 'updateSettings':
        result = updateSettings_(data.settings);
        break;
      case 'syncAll':
        syncProducts_(data.products);
        if (data.transactions && data.transactions.length) {
          data.transactions.forEach(t => addTransaction_(t));
        }
        updateSettings_(data.settings);
        buildLaporan_();
        result = { success: true, message: 'Full sync selesai.' };
        break;
      default:
        result = { error: 'Action tidak dikenal: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'MSME Grow POS API aktif.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Sheet Helpers ─────────────────────────────────────────────
function getOrCreate_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers) sh.appendRow(headers);
    sh.setFrozenRows(1);
    // Style header row
    sh.getRange(1, 1, 1, headers.length)
      .setBackground('#1E3A8A')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
  }
  return sh;
}

function sheetToObjects_(sh) {
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

// ── Transactions ──────────────────────────────────────────────
function addTransaction_(trx) {
  const sh = getOrCreate_(SHEETS.TRANSACTIONS, [
    'ID','Tanggal','Waktu','Item Detail','Jumlah Item',
    'Subtotal','Pajak','Diskon','Total',
    'Metode Bayar','Kasir','Catatan','Status','Sync At'
  ]);

  const dt        = new Date(trx.date);
  const tglStr    = Utilities.formatDate(dt, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  const wktStr    = Utilities.formatDate(dt, Session.getScriptTimeZone(), 'HH:mm:ss');
  const itemDetail = (trx.items || []).map(i => i.qty + 'x ' + i.name + ' (@' + i.price + ')').join('; ');
  const jumlahItem = (trx.items || []).reduce((s, i) => s + i.qty, 0);

  sh.appendRow([
    trx.id,
    tglStr,
    wktStr,
    itemDetail,
    jumlahItem,
    trx.subtotal   || 0,
    trx.tax        || 0,
    trx.discount   || 0,
    trx.total      || 0,
    trx.payment    || '',
    trx.cashier    || '',
    trx.note       || '',
    trx.status     || 'completed',
    new Date().toISOString(),
  ]);

  return { success: true, id: trx.id };
}

function getTransactions_() {
  const sh = getOrCreate_(SHEETS.TRANSACTIONS, ['ID','Tanggal','Waktu','Item Detail','Jumlah Item','Subtotal','Pajak','Diskon','Total','Metode Bayar','Kasir','Catatan','Status','Sync At']);
  return sheetToObjects_(sh);
}

// ── Products ──────────────────────────────────────────────────
function syncProducts_(products) {
  const sh = getOrCreate_(SHEETS.PRODUCTS, [
    'ID','Nama','Deskripsi','Harga','Kategori',
    'Satuan','SKU','Stok','Aktif','Dibuat'
  ]);
  // Clear data lama (kecuali header)
  if (sh.getLastRow() > 1) {
    sh.deleteRows(2, sh.getLastRow() - 1);
  }
  products.forEach(p => {
    sh.appendRow([
      p.id, p.name, p.description || '', p.price,
      p.category, p.unit, p.sku || '', p.stock || 0,
      p.active ? 'YA' : 'TIDAK', p.createdAt || '',
    ]);
  });
  return { success: true, count: products.length };
}

function getProducts_() {
  const sh = getOrCreate_(SHEETS.PRODUCTS, ['ID','Nama','Deskripsi','Harga','Kategori','Satuan','SKU','Stok','Aktif','Dibuat']);
  return sheetToObjects_(sh).map(p => ({
    ...p,
    price  : Number(p['Harga'])  || 0,
    stock  : Number(p['Stok'])   || 0,
    active : p['Aktif'] === 'YA' || p['Aktif'] === true,
  }));
}

// ── Settings ──────────────────────────────────────────────────
function updateSettings_(settings) {
  const sh = getOrCreate_(SHEETS.SETTINGS, ['Key', 'Value', 'Diperbarui']);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  const now = new Date().toISOString();
  Object.entries(settings).forEach(([k, v]) => sh.appendRow([k, v, now]));
  return { success: true };
}

function getSettings_() {
  const sh = getOrCreate_(SHEETS.SETTINGS, ['Key', 'Value', 'Diperbarui']);
  const rows = sheetToObjects_(sh);
  const out  = {};
  rows.forEach(r => { if (r['Key']) out[r['Key']] = r['Value']; });
  return out;
}

// ── Laporan Otomatis ──────────────────────────────────────────
// Tab Laporan dibangun ulang setiap ada transaksi baru.
// Berisi: ringkasan harian & mingguan, breakdown per metode bayar,
// dan top 5 produk terlaris.
function buildLaporan_() {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  let sh       = ss.getSheetByName(SHEETS.REPORT);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(SHEETS.REPORT);

  const trxSh  = ss.getSheetByName(SHEETS.TRANSACTIONS);
  if (!trxSh || trxSh.getLastRow() <= 1) {
    sh.getRange('A1').setValue('Belum ada data transaksi.');
    return;
  }

  const allData    = trxSh.getDataRange().getValues();
  const headers    = allData[0];
  const idxTgl     = headers.indexOf('Tanggal');
  const idxTotal   = headers.indexOf('Total');
  const idxBayar   = headers.indexOf('Metode Bayar');
  const idxItem    = headers.indexOf('Item Detail');
  const idxStatus  = headers.indexOf('Status');
  const rows       = allData.slice(1).filter(r => r[idxStatus] === 'completed');

  const tz       = Session.getScriptTimeZone();
  const today    = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');

  // ── Hitung ringkasan per hari ──────────────────────────────
  const byDay = {};
  rows.forEach(r => {
    const d   = r[idxTgl];
    const tot = Number(r[idxTotal]) || 0;
    if (!byDay[d]) byDay[d] = { revenue: 0, orders: 0 };
    byDay[d].revenue += tot;
    byDay[d].orders  += 1;
  });

  // ── Hitung ringkasan per metode bayar ──────────────────────
  const byPayment = {};
  rows.forEach(r => {
    const m   = r[idxBayar] || 'Lainnya';
    const tot = Number(r[idxTotal]) || 0;
    if (!byPayment[m]) byPayment[m] = { revenue: 0, orders: 0 };
    byPayment[m].revenue += tot;
    byPayment[m].orders  += 1;
  });

  // ── Hitung top produk ──────────────────────────────────────
  const prodMap = {};
  rows.forEach(r => {
    const items = String(r[idxItem]).split(';');
    items.forEach(item => {
      const m = item.trim().match(/^(\\d+)x (.+?) \\(@(\\d+)\\)$/);
      if (m) {
        const qty   = Number(m[1]);
        const name  = m[2].trim();
        const price = Number(m[3]);
        if (!prodMap[name]) prodMap[name] = { qty: 0, revenue: 0 };
        prodMap[name].qty     += qty;
        prodMap[name].revenue += qty * price;
      }
    });
  });
  const topProds = Object.entries(prodMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);

  // ── Total keseluruhan ──────────────────────────────────────
  const totalRevenue = rows.reduce((s, r) => s + (Number(r[idxTotal]) || 0), 0);
  const totalOrders  = rows.length;
  const todayData    = byDay[today] || { revenue: 0, orders: 0 };

  // ── Tulis ke sheet Laporan ─────────────────────────────────
  const updatedAt = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm:ss');

  // Style helper
  const bold   = (range) => range.setFontWeight('bold');
  const header = (range, color) => range.setBackground(color || '#1E3A8A').setFontColor('#FFFFFF').setFontWeight('bold');

  let row = 1;

  // Title
  sh.getRange(row, 1, 1, 5).merge().setValue('📊 LAPORAN BISNIS MSME GROW POS').setFontSize(14).setFontWeight('bold').setBackground('#1E3A8A').setFontColor('#FFFFFF').setHorizontalAlignment('center');
  row++;
  sh.getRange(row, 1, 1, 5).merge().setValue('Diperbarui: ' + updatedAt).setFontSize(10).setFontColor('#6B7280').setHorizontalAlignment('center');
  row += 2;

  // ── Ringkasan Umum ─────────────────────────────────────────
  header(sh.getRange(row, 1, 1, 2), '#1D4ED8');
  sh.getRange(row, 1).setValue('📌 RINGKASAN UMUM');
  row++;
  [
    ['Total Revenue (All Time)', 'Rp ' + totalRevenue.toLocaleString('id-ID')],
    ['Total Transaksi (All Time)', totalOrders + ' transaksi'],
    ['Revenue Hari Ini (' + today + ')', 'Rp ' + todayData.revenue.toLocaleString('id-ID')],
    ['Orders Hari Ini', todayData.orders + ' transaksi'],
  ].forEach(([label, val]) => {
    sh.getRange(row, 1).setValue(label).setBackground('#F0F9FF');
    sh.getRange(row, 2).setValue(val).setFontWeight('bold');
    row++;
  });
  row++;

  // ── Laporan Harian ─────────────────────────────────────────
  header(sh.getRange(row, 1, 1, 3), '#1D4ED8');
  sh.getRange(row, 1).setValue('📅 LAPORAN HARIAN (30 Hari Terakhir)');
  row++;
  header(sh.getRange(row, 1, 1, 3), '#3B82F6');
  sh.getRange(row, 1).setValue('Tanggal');
  sh.getRange(row, 2).setValue('Total Revenue');
  sh.getRange(row, 3).setValue('Jumlah Transaksi');
  row++;
  const sortedDays = Object.entries(byDay).sort((a,b) => {
    const parseDate = s => { const p = s.split('/'); return new Date(p[2], p[1]-1, p[0]); };
    return parseDate(b[0]) - parseDate(a[0]);
  }).slice(0, 30);
  sortedDays.forEach(([tgl, d], i) => {
    const bg = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    sh.getRange(row, 1).setValue(tgl).setBackground(bg);
    sh.getRange(row, 2).setValue(d.revenue).setNumberFormat('#,##0').setBackground(bg);
    sh.getRange(row, 3).setValue(d.orders).setBackground(bg);
    row++;
  });
  row++;

  // ── Breakdown Metode Pembayaran ────────────────────────────
  header(sh.getRange(row, 1, 1, 3), '#1D4ED8');
  sh.getRange(row, 1).setValue('💳 BREAKDOWN METODE PEMBAYARAN');
  row++;
  header(sh.getRange(row, 1, 1, 3), '#3B82F6');
  sh.getRange(row, 1).setValue('Metode');
  sh.getRange(row, 2).setValue('Total Revenue');
  sh.getRange(row, 3).setValue('Jumlah Transaksi');
  row++;
  Object.entries(byPayment).sort((a,b) => b[1].revenue - a[1].revenue).forEach(([m, d], i) => {
    const bg = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    sh.getRange(row, 1).setValue(m).setBackground(bg);
    sh.getRange(row, 2).setValue(d.revenue).setNumberFormat('#,##0').setBackground(bg);
    sh.getRange(row, 3).setValue(d.orders).setBackground(bg);
    row++;
  });
  row++;

  // ── Top Produk Terlaris ────────────────────────────────────
  header(sh.getRange(row, 1, 1, 3), '#1D4ED8');
  sh.getRange(row, 1).setValue('🏆 TOP PRODUK / LAYANAN TERLARIS');
  row++;
  header(sh.getRange(row, 1, 1, 3), '#3B82F6');
  sh.getRange(row, 1).setValue('Produk / Layanan');
  sh.getRange(row, 2).setValue('Total Revenue');
  sh.getRange(row, 3).setValue('Qty Terjual');
  row++;
  topProds.forEach(([name, d], i) => {
    const bg = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    sh.getRange(row, 1).setValue((i+1) + '. ' + name).setBackground(bg);
    sh.getRange(row, 2).setValue(d.revenue).setNumberFormat('#,##0').setBackground(bg);
    sh.getRange(row, 3).setValue(d.qty).setBackground(bg);
    row++;
  });

  // Auto-fit kolom
  sh.autoResizeColumns(1, 5);
}

// ── Trigger Otomatis ──────────────────────────────────────────
// Jalankan fungsi ini SEKALI dari Apps Script editor untuk
// mengaktifkan rebuild laporan setiap hari jam 01:00 pagi.
function setupDailyTrigger() {
  // Hapus trigger lama jika ada
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('buildLaporan_')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();
  Logger.log('Daily trigger berhasil dibuat: buildLaporan_ setiap hari jam 01:00');
}
`

