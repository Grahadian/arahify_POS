// ============================================================
// MSME GROW POS - Google Apps Script Backend
// ============================================================
// CARA DEPLOY:
// 1. Buka Google Spreadsheet klien
// 2. Extensions → Apps Script
// 3. Hapus semua kode di Code.gs, paste SELURUH file ini
// 4. Klik Deploy → New deployment → Web app
//    - Execute as : Me
//    - Who has access : Anyone
// 5. Klik Deploy → salin Web App URL
// 6. Paste URL di app: Settings → Google Sheets → URL input
// ============================================================
// Versi  : 1.0.0
// Update : 2025
// ============================================================

// Nama-nama tab sheet
var SHEETS = {
  TRANSACTIONS : 'Transaksi',
  PRODUCTS     : 'Produk',
  SETTINGS     : 'Pengaturan',
  REPORT       : 'Laporan',
};

// ============================================================
// ENTRY POINTS
// ============================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var data   = JSON.parse(e.postData.contents);
    var action = data.action;
    var result;

    switch (action) {
      case 'verify':
        result = {
          success : true,
          message : 'Koneksi berhasil! MSME Grow POS terhubung.',
          version : '1.0.0',
          sheets  : getSheetNames_(),
        };
        break;

      case 'getProducts':
        result = { success: true, products: getProducts_() };
        break;

      case 'syncProducts':
        result = syncProducts_(data.products);
        break;

      case 'addTransaction':
        result = addTransaction_(data.transaction);
        buildLaporan_(); // rebuild laporan setiap transaksi baru
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
        // Push semua data sekaligus (produk + transaksi + settings)
        var syncResult = { products: 0, transactions: 0 };
        if (data.products) {
          syncProducts_(data.products);
          syncResult.products = data.products.length;
        }
        if (data.transactions && data.transactions.length) {
          // Hanya tambah transaksi yang belum ada (cek berdasarkan ID)
          var existingIds = getTransactionIds_();
          var newTrx = data.transactions.filter(function(t) {
            return existingIds.indexOf(t.id) === -1;
          });
          newTrx.forEach(function(t) { addTransaction_(t); });
          syncResult.transactions = newTrx.length;
        }
        if (data.settings) {
          updateSettings_(data.settings);
        }
        buildLaporan_();
        result = {
          success      : true,
          message      : 'Full sync selesai.',
          productsSync : syncResult.products,
          newTrxSync   : syncResult.transactions,
        };
        break;

      default:
        result = { error: 'Action tidak dikenal: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('ERROR doPost: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

// Untuk test via browser (GET request)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success : true,
      message : 'MSME Grow POS API aktif.',
      version : '1.0.0',
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HELPER: Sheet Utilities
// ============================================================

function getOrCreate_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);

  if (!sh) {
    sh = ss.insertSheet(name);

    if (headers && headers.length) {
      sh.appendRow(headers);
      sh.setFrozenRows(1);

      // Style header
      var headerRange = sh.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1E3A8A');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
    }
  }

  return sh;
}

function sheetToObjects_(sh) {
  var data = sh.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      obj[h] = row[i];
    });
    return obj;
  });
}

function getSheetNames_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets().map(function(s) { return s.getName(); });
}

// ============================================================
// TRANSACTIONS
// ============================================================

var TRX_HEADERS = [
  'ID', 'Tanggal', 'Waktu', 'Item Detail', 'Jumlah Item',
  'Subtotal', 'Pajak', 'Diskon', 'Total',
  'Metode Bayar', 'Kasir', 'Catatan', 'Status', 'Sync At'
];

function addTransaction_(trx) {
  var sh  = getOrCreate_(SHEETS.TRANSACTIONS, TRX_HEADERS);
  var tz  = Session.getScriptTimeZone();
  var dt  = new Date(trx.date || new Date().toISOString());

  var tglStr    = Utilities.formatDate(dt, tz, 'dd/MM/yyyy');
  var wktStr    = Utilities.formatDate(dt, tz, 'HH:mm:ss');
  var items     = trx.items || [];
  var itemDetail = items.map(function(i) {
    return i.qty + 'x ' + i.name + ' (@' + i.price + ')';
  }).join('; ');
  var jumlahItem = items.reduce(function(s, i) { return s + (i.qty || 0); }, 0);

  sh.appendRow([
    trx.id          || '',
    tglStr,
    wktStr,
    itemDetail,
    jumlahItem,
    trx.subtotal    || 0,
    trx.tax         || 0,
    trx.discount    || 0,
    trx.total       || 0,
    trx.payment     || '',
    trx.cashier     || '',
    trx.note        || '',
    trx.status      || 'completed',
    new Date().toISOString(),
  ]);

  // Zebra striping untuk baris baru
  var lastRow = sh.getLastRow();
  if (lastRow % 2 === 0) {
    sh.getRange(lastRow, 1, 1, TRX_HEADERS.length).setBackground('#F9FAFB');
  }

  return { success: true, id: trx.id };
}

function getTransactions_() {
  var sh = getOrCreate_(SHEETS.TRANSACTIONS, TRX_HEADERS);
  return sheetToObjects_(sh);
}

function getTransactionIds_() {
  var sh = getOrCreate_(SHEETS.TRANSACTIONS, TRX_HEADERS);
  var data = sh.getDataRange().getValues();
  if (data.length <= 1) return [];
  // Kolom ID ada di index 0
  return data.slice(1).map(function(row) { return String(row[0]); });
}

// ============================================================
// PRODUCTS
// ============================================================

var PROD_HEADERS = [
  'ID', 'Nama', 'Deskripsi', 'Harga', 'Kategori',
  'Satuan', 'SKU', 'Stok', 'Aktif', 'Dibuat'
];

function syncProducts_(products) {
  if (!products || !products.length) return { success: true, count: 0 };

  var sh = getOrCreate_(SHEETS.PRODUCTS, PROD_HEADERS);

  // Hapus data lama (kecuali header)
  if (sh.getLastRow() > 1) {
    sh.deleteRows(2, sh.getLastRow() - 1);
  }

  products.forEach(function(p, i) {
    sh.appendRow([
      p.id          || '',
      p.name        || '',
      p.description || '',
      p.price       || 0,
      p.category    || '',
      p.unit        || '',
      p.sku         || '',
      p.stock       || 0,
      p.active      ? 'YA' : 'TIDAK',
      p.createdAt   || '',
    ]);
    // Zebra striping
    if (i % 2 === 0) {
      sh.getRange(i + 2, 1, 1, PROD_HEADERS.length).setBackground('#F9FAFB');
    }
  });

  sh.autoResizeColumns(1, PROD_HEADERS.length);
  return { success: true, count: products.length };
}

function getProducts_() {
  var sh = getOrCreate_(SHEETS.PRODUCTS, PROD_HEADERS);
  return sheetToObjects_(sh).map(function(p) {
    return {
      id          : p['ID']          || '',
      name        : p['Nama']        || '',
      description : p['Deskripsi']   || '',
      price       : Number(p['Harga'])  || 0,
      category    : p['Kategori']    || '',
      unit        : p['Satuan']      || '',
      sku         : p['SKU']         || '',
      stock       : Number(p['Stok'])   || 0,
      active      : p['Aktif'] === 'YA',
      createdAt   : p['Dibuat']      || '',
    };
  });
}

// ============================================================
// SETTINGS
// ============================================================

var SET_HEADERS = ['Key', 'Value', 'Diperbarui'];

function updateSettings_(settings) {
  var sh  = getOrCreate_(SHEETS.SETTINGS, SET_HEADERS);
  var now = new Date().toISOString();

  if (sh.getLastRow() > 1) {
    sh.deleteRows(2, sh.getLastRow() - 1);
  }

  Object.keys(settings).forEach(function(k) {
    sh.appendRow([k, settings[k], now]);
  });

  return { success: true };
}

function getSettings_() {
  var sh   = getOrCreate_(SHEETS.SETTINGS, SET_HEADERS);
  var rows = sheetToObjects_(sh);
  var out  = {};
  rows.forEach(function(r) {
    if (r['Key']) out[r['Key']] = r['Value'];
  });
  return out;
}

// ============================================================
// LAPORAN OTOMATIS
// ============================================================
// Tab Laporan dibangun ulang setiap ada transaksi baru.
// Berisi:
//   1. Ringkasan umum (total revenue, total orders, hari ini)
//   2. Laporan harian 30 hari terakhir
//   3. Laporan mingguan 12 minggu terakhir
//   4. Breakdown metode pembayaran
//   5. Top 10 produk terlaris
// ============================================================

function buildLaporan_() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var tz     = Session.getScriptTimeZone();

  // Hapus sheet laporan lama lalu buat baru
  var oldSh = ss.getSheetByName(SHEETS.REPORT);
  if (oldSh) ss.deleteSheet(oldSh);
  var sh = ss.insertSheet(SHEETS.REPORT);

  // Ambil data transaksi
  var trxSh = ss.getSheetByName(SHEETS.TRANSACTIONS);
  if (!trxSh || trxSh.getLastRow() <= 1) {
    sh.getRange('A1').setValue('Belum ada data transaksi.');
    return;
  }

  var allData  = trxSh.getDataRange().getValues();
  var headers  = allData[0];
  var idxTgl   = headers.indexOf('Tanggal');
  var idxTotal = headers.indexOf('Total');
  var idxBayar = headers.indexOf('Metode Bayar');
  var idxItem  = headers.indexOf('Item Detail');
  var idxStat  = headers.indexOf('Status');

  // Filter hanya transaksi 'completed'
  var rows = allData.slice(1).filter(function(r) {
    return r[idxStat] === 'completed';
  });

  if (!rows.length) {
    sh.getRange('A1').setValue('Belum ada transaksi yang selesai.');
    return;
  }

  var today   = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');
  var nowStr  = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm:ss');

  // ── Agregasi per hari ──────────────────────────────────────
  var byDay = {};
  rows.forEach(function(r) {
    var d   = String(r[idxTgl]);
    var tot = Number(r[idxTotal]) || 0;
    if (!byDay[d]) byDay[d] = { revenue: 0, orders: 0 };
    byDay[d].revenue += tot;
    byDay[d].orders  += 1;
  });

  // ── Agregasi per minggu ────────────────────────────────────
  var byWeek = {};
  rows.forEach(function(r) {
    var d   = String(r[idxTgl]);
    var parts = d.split('/');
    var dt  = new Date(parts[2], parts[1]-1, parts[0]);
    var wk  = getWeekLabel_(dt, tz);
    var tot = Number(r[idxTotal]) || 0;
    if (!byWeek[wk]) byWeek[wk] = { revenue: 0, orders: 0 };
    byWeek[wk].revenue += tot;
    byWeek[wk].orders  += 1;
  });

  // ── Agregasi per metode bayar ──────────────────────────────
  var byPayment = {};
  rows.forEach(function(r) {
    var m   = String(r[idxBayar]) || 'Lainnya';
    var tot = Number(r[idxTotal]) || 0;
    if (!byPayment[m]) byPayment[m] = { revenue: 0, orders: 0 };
    byPayment[m].revenue += tot;
    byPayment[m].orders  += 1;
  });

  // ── Agregasi produk ────────────────────────────────────────
  var prodMap = {};
  rows.forEach(function(r) {
    var itemStr = String(r[idxItem]);
    var items   = itemStr.split(';');
    items.forEach(function(item) {
      var m = item.trim().match(/^(\d+)x (.+?) \(@(\d+)\)$/);
      if (m) {
        var qty   = Number(m[1]);
        var name  = m[2].trim();
        var price = Number(m[3]);
        if (!prodMap[name]) prodMap[name] = { qty: 0, revenue: 0 };
        prodMap[name].qty     += qty;
        prodMap[name].revenue += qty * price;
      }
    });
  });
  var topProds = Object.keys(prodMap)
    .map(function(k) { return { name: k, qty: prodMap[k].qty, revenue: prodMap[k].revenue }; })
    .sort(function(a, b) { return b.revenue - a.revenue; })
    .slice(0, 10);

  // ── Total keseluruhan ──────────────────────────────────────
  var totalRevenue = rows.reduce(function(s, r) { return s + (Number(r[idxTotal]) || 0); }, 0);
  var totalOrders  = rows.length;
  var todayData    = byDay[today] || { revenue: 0, orders: 0 };

  // ── Sort helper ────────────────────────────────────────────
  function parseDD_MM_YYYY(s) {
    var p = String(s).split('/');
    return p.length === 3 ? new Date(p[2], p[1]-1, p[0]) : new Date(0);
  }
  var sortedDays = Object.keys(byDay).sort(function(a, b) {
    return parseDD_MM_YYYY(b) - parseDD_MM_YYYY(a);
  }).slice(0, 30);

  var sortedWeeks = Object.keys(byWeek).sort(function(a, b) {
    return b.localeCompare(a);
  }).slice(0, 12);

  // ── Tulis ke sheet ─────────────────────────────────────────
  var rowNum = 1;

  function writeTitle(text, cols) {
    var r = sh.getRange(rowNum, 1, 1, cols || 5);
    r.merge();
    r.setValue(text);
    r.setBackground('#1E3A8A');
    r.setFontColor('#FFFFFF');
    r.setFontWeight('bold');
    r.setFontSize(12);
    r.setHorizontalAlignment('center');
    rowNum++;
  }

  function writeSectionHeader(text, cols) {
    var r = sh.getRange(rowNum, 1, 1, cols || 3);
    r.merge();
    r.setValue(text);
    r.setBackground('#1D4ED8');
    r.setFontColor('#FFFFFF');
    r.setFontWeight('bold');
    rowNum++;
  }

  function writeColHeaders(labels) {
    var r = sh.getRange(rowNum, 1, 1, labels.length);
    r.setValues([labels]);
    r.setBackground('#3B82F6');
    r.setFontColor('#FFFFFF');
    r.setFontWeight('bold');
    rowNum++;
  }

  function writeDataRow(values, bg) {
    sh.getRange(rowNum, 1, 1, values.length).setValues([values]);
    if (bg) sh.getRange(rowNum, 1, 1, values.length).setBackground(bg);
    rowNum++;
  }

  function blankRow() { rowNum++; }

  // ── Judul Utama ────────────────────────────────────────────
  writeTitle('📊  LAPORAN BISNIS MSME GROW POS', 5);
  sh.getRange(rowNum, 1, 1, 5).merge()
    .setValue('Diperbarui: ' + nowStr)
    .setFontColor('#6B7280')
    .setFontSize(10)
    .setHorizontalAlignment('center');
  rowNum++;
  blankRow();

  // ── 1. Ringkasan Umum ──────────────────────────────────────
  writeSectionHeader('📌  RINGKASAN UMUM', 2);
  var summaryData = [
    ['Total Revenue (All Time)',           'Rp ' + totalRevenue.toLocaleString('id-ID')],
    ['Total Transaksi (All Time)',          totalOrders + ' transaksi'],
    ['Revenue Hari Ini (' + today + ')',   'Rp ' + todayData.revenue.toLocaleString('id-ID')],
    ['Orders Hari Ini',                     todayData.orders + ' transaksi'],
    ['Rata-rata Revenue / Transaksi',      totalOrders > 0 ? 'Rp ' + Math.round(totalRevenue / totalOrders).toLocaleString('id-ID') : '-'],
  ];
  summaryData.forEach(function(row, i) {
    var bg = i % 2 === 0 ? '#EFF6FF' : '#FFFFFF';
    sh.getRange(rowNum, 1).setValue(row[0]).setBackground(bg).setFontWeight('bold');
    sh.getRange(rowNum, 2).setValue(row[1]).setBackground(bg);
    rowNum++;
  });
  blankRow();

  // ── 2. Laporan Harian ──────────────────────────────────────
  writeSectionHeader('📅  LAPORAN HARIAN (30 Hari Terakhir)', 3);
  writeColHeaders(['Tanggal', 'Total Revenue (Rp)', 'Jumlah Transaksi']);
  sortedDays.forEach(function(tgl, i) {
    var d  = byDay[tgl];
    var bg = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    writeDataRow([tgl, d.revenue, d.orders], bg);
  });
  blankRow();

  // ── 3. Laporan Mingguan ────────────────────────────────────
  writeSectionHeader('📆  LAPORAN MINGGUAN (12 Minggu Terakhir)', 3);
  writeColHeaders(['Minggu', 'Total Revenue (Rp)', 'Jumlah Transaksi']);
  sortedWeeks.forEach(function(wk, i) {
    var d  = byWeek[wk];
    var bg = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    writeDataRow([wk, d.revenue, d.orders], bg);
  });
  blankRow();

  // ── 4. Breakdown Metode Pembayaran ─────────────────────────
  writeSectionHeader('💳  BREAKDOWN METODE PEMBAYARAN', 3);
  writeColHeaders(['Metode', 'Total Revenue (Rp)', 'Jumlah Transaksi']);
  Object.keys(byPayment)
    .sort(function(a, b) { return byPayment[b].revenue - byPayment[a].revenue; })
    .forEach(function(m, i) {
      var d  = byPayment[m];
      var bg = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
      writeDataRow([m, d.revenue, d.orders], bg);
    });
  blankRow();

  // ── 5. Top Produk Terlaris ─────────────────────────────────
  writeSectionHeader('🏆  TOP 10 PRODUK / LAYANAN TERLARIS', 3);
  writeColHeaders(['Produk / Layanan', 'Total Revenue (Rp)', 'Qty Terjual']);
  topProds.forEach(function(p, i) {
    var bg = i % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    writeDataRow([(i+1) + '. ' + p.name, p.revenue, p.qty], bg);
  });

  // ── Auto-resize ────────────────────────────────────────────
  sh.autoResizeColumns(1, 5);

  // ── Format kolom Revenue sebagai angka ────────────────────
  sh.getRange(1, 2, sh.getLastRow(), 1).setNumberFormat('#,##0');
}

// Helper: label minggu (e.g. "2025-W03")
function getWeekLabel_(date, tz) {
  var jan1 = new Date(date.getFullYear(), 0, 1);
  var week = Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return date.getFullYear() + '-W' + (week < 10 ? '0' + week : week);
}

// ============================================================
// TRIGGER OTOMATIS
// ============================================================
// Jalankan fungsi ini SEKALI dari editor Apps Script
// untuk mengaktifkan rebuild laporan setiap hari jam 01.00.
// Caranya: pilih fungsi "setupDailyTrigger" di dropdown,
// lalu klik tombol Run (▶).
// ============================================================

function setupDailyTrigger() {
  // Hapus semua trigger lama
  ScriptApp.getProjectTriggers().forEach(function(t) {
    ScriptApp.deleteTrigger(t);
  });

  // Buat trigger baru: jalankan buildLaporan_ setiap hari jam 01.00
  ScriptApp.newTrigger('buildLaporan_')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();

  Logger.log('✅ Daily trigger berhasil dibuat: buildLaporan_ setiap hari jam 01.00');
  SpreadsheetApp.getUi().alert('✅ Trigger harian berhasil diaktifkan!\nLaporan akan diperbarui otomatis setiap hari jam 01.00.');
}

// ============================================================
// FUNGSI MANUAL (opsional, untuk run dari editor)
// ============================================================

// Jalankan ini untuk test koneksi dari editor
function testVerify() {
  var result = { success: true, message: 'Script berjalan normal.', sheets: getSheetNames_() };
  Logger.log(JSON.stringify(result));
}

// Jalankan ini untuk membuat/refresh semua sheet header
function initializeSheets() {
  getOrCreate_(SHEETS.TRANSACTIONS, TRX_HEADERS);
  getOrCreate_(SHEETS.PRODUCTS,     PROD_HEADERS);
  getOrCreate_(SHEETS.SETTINGS,     SET_HEADERS);
  SpreadsheetApp.getUi().alert('✅ Semua sheet berhasil diinisialisasi:\n- Transaksi\n- Produk\n- Pengaturan\n\nSekarang deploy sebagai Web App.');
}

// Jalankan ini untuk rebuild laporan manual
function manualBuildLaporan() {
  buildLaporan_();
  SpreadsheetApp.getUi().alert('✅ Tab Laporan berhasil diperbarui!');
}
