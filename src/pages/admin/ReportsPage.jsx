// ============================================================
// MSME GROW POS - Reports Page with Date Range + Transactions
// ============================================================
import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatDate, formatRelativeTime } from '@/utils/format'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { Card, Badge } from '@/components/ui/index.jsx'

const catBarColors = {
 'Strategi' : '#2563EB', 'Legal' : '#22C55E',
 'Marketing' : '#F97316', 'Keuangan' : '#A855F7',
 'Kuliner' : '#EF4444', 'Fashion' : '#EC4899',
 'Retail' : '#06B6D4', 'Jasa' : '#F59E0B',
 'Lainnya' : '#6B7280',
}

const STATUS_COLOR = { completed:'green', refunded:'red', pending:'yellow', cancelled:'gray' }
const STATUS_LABEL = { completed:'Selesai', refunded:'Direfund', pending:'Pending', cancelled:'Batal' }

// Helper: format tanggal ke YYYY-MM-DD lokal
const toLocalDate = (iso) => {
 const d = new Date(iso)
 const y = d.getFullYear()
 const m = String(d.getMonth()+1).padStart(2,'0')
 const dd= String(d.getDate()).padStart(2,'0')
 return `${y}-${m}-${dd}`
}

// 7 hari terakhir default
const defaultDateRange = () => {
 const end = new Date()
 const start = new Date(); start.setDate(start.getDate() - 6)
 return {
 from: toLocalDate(start.toISOString()),
 to : toLocalDate(end.toISOString()),
 }
}

const ReportsPage = () => {
 const { transactions, products, members, settings, expenses, shifts, navigate, refundTransaction } = useApp()
 const [activeTab, setActiveTab] = useState('overview')

 // Unified Date Range (berlaku untuk SEMUA tab) 
 const [dateRange, setDateRange] = useState(defaultDateRange())
 const [trxSearch, setTrxSearch] = useState('')
 const [trxPage, setTrxPage] = useState(1)
 const TRX_PER_PAGE = 10

 // Detail & Refund modal state 
 const [selected, setSelected] = useState(null)
 const [showDetail, setShowDetail] = useState(false)
 const [showRefund, setShowRefund] = useState(false)
 const [refundReason, setRefundReason] = useState("")
 const [refundCustom, setRefundCustom] = useState("")
 const [refundConfirm, setRefundConfirm] = useState(false)

 const REFUND_REASONS = ["Produk/layanan tidak sesuai pesanan","Pelanggan membatalkan transaksi","Kesalahan input kasir","Produk rusak / cacat","Pembayaran ganda (double charge)","Alasan lainnya"]

 const openDetail = (t) => { setSelected(t); setShowDetail(true) }
 const openRefund = () => { setRefundReason(""); setRefundCustom(""); setRefundConfirm(false); setShowDetail(false); setShowRefund(true) }
 const doRefund = () => { const reason = refundReason === "Alasan lainnya" ? refundCustom : refundReason; if (!reason.trim()) return; refundTransaction(selected.id, reason); setShowRefund(false); setSelected(prev => ({ ...prev, status:"refunded", refundReason:reason, refundedAt:new Date().toISOString() })) }
 const getMemberName = (t) => { if (t?.memberName) return t.memberName; if (t?.memberId) { const m = members?.find(m => m.id === t.memberId); return m?.name || null } return null }

 // Export ke Excel (CSV) 
 const exportToExcel = (txns, range, biz) => {
 const completed = txns.filter(t => !t.status || t.status === 'completed')
 const rows = [
 ['ID Transaksi','Tanggal','Kasir','Member','Metode Bayar','Subtotal','Pajak','Diskon','Total','Status','Catatan','Produk'],
 ...completed.map(t => [
 t.id,
 new Date(t.date||t.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}),
 t.cashier||'-',
 t.memberName||'-',
 t.payment||'-',
 t.subtotal||0,
 t.tax||0,
 t.discount||0,
 t.total||0,
 t.status||'completed',
 t.note||'-',
 (t.items||[]).map(i=>`${i.name} x${i.qty}`).join('; '),
 ])
 ]
 const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
 const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `laporan_${biz?.businessName||'msme'}_${range.from}_${range.to}.csv`
 document.body.appendChild(a); a.click()
 document.body.removeChild(a); URL.revokeObjectURL(url)
 }

 // Download Laporan 
 const [downloading, setDownloading] = useState(false)

 const downloadReport = () => {
 const biz = settings?.businessName || 'MSME Grow'
 const from = dateRange.from
 const to = dateRange.to
 const now = new Date().toLocaleString('id-ID', { timeZone:'Asia/Jakarta' })

 const completed = rangeTransactions.filter(t => !t.status || t.status === 'completed')
 const refunded = rangeTransactions.filter(t => t.status === 'refunded')

 // Format rupiah inline (no import)
 const rp = (n) => 'Rp ' + (n||0).toLocaleString('id-ID')

 // Payment breakdown
 const payMap = {}
 completed.forEach(t => { payMap[t.payment] = (payMap[t.payment]||0) + (t.total||0) })

 // Kasir performance
 const kasirMap = {}
 completed.forEach(t => {
 const k = t.cashier||'Unknown'
 if (!kasirMap[k]) kasirMap[k] = { name:k, revenue:0, orders:0 }
 kasirMap[k].revenue += (t.total||0)
 kasirMap[k].orders += 1
 })
 const kasirList = Object.values(kasirMap).sort((a,b) => b.revenue - a.revenue)

 // Top products
 const prodMap = {}
 completed.forEach(t => (t.items||[]).forEach(i => {
 if (!prodMap[i.name]) prodMap[i.name] = { name:i.name, qty:0, revenue:0 }
 prodMap[i.name].qty += (i.qty||0)
 prodMap[i.name].revenue += (i.price||0)*(i.qty||0)
 }))
 const topProds = Object.values(prodMap).sort((a,b) => b.revenue - a.revenue).slice(0,10)

 // Daily breakdown
 const dayMap = {}
 completed.forEach(t => {
 const d = new Date(t.date||t.createdAt).toLocaleDateString('sv', { timeZone:'Asia/Jakarta' })
 if (!dayMap[d]) dayMap[d] = { date:d, revenue:0, orders:0 }
 dayMap[d].revenue += (t.total||0)
 dayMap[d].orders += 1
 })
 const days = Object.values(dayMap).sort((a,b) => a.date.localeCompare(b.date))

 const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Laporan ${biz} ${from} sd ${to}</title>
<style>
 * { box-sizing: border-box; margin: 0; padding: 0; }
 body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 32px; }
 h1 { font-size: 22px; font-weight: 900; color: #1E3A8A; margin-bottom: 4px; }
 h2 { font-size: 15px; font-weight: 800; color: #1E3A8A; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #DBEAFE; }
 h3 { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px; }
 .meta { font-size: 11px; color: #6B7280; margin-bottom: 6px; }
 .badge-period { display:inline-block; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; border-radius:6px; padding:3px 10px; font-size:11px; font-weight:700; }
 .summary-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 8px; }
 .summary-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px; }
 .summary-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B7280; font-weight: 700; margin-bottom: 6px; }
 .summary-card .value { font-size: 18px; font-weight: 900; }
 .summary-card .sub { font-size: 10px; color: #6B7280; margin-top: 3px; }
 .blue { color: #1D4ED8; } .green { color: #059669; } .orange { color: #D97706; } .red { color: #DC2626; }
 table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px; }
 th { background: #EFF6FF; color: #1E3A8A; font-weight: 700; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
 td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
 tr:last-child td { border-bottom: none; }
 tr:nth-child(even) td { background: #FAFAFA; }
 .right { text-align: right; }
 .mono { font-family: monospace; font-size: 10px; }
 .status-ok { background:#ECFDF5; color:#059669; padding:2px 7px; border-radius:20px; font-size:9px; font-weight:700; }
 .status-ref { background:#FEF2F2; color:#DC2626; padding:2px 7px; border-radius:20px; font-size:9px; font-weight:700; }
 .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF; text-align: center; }
 @media print {
 body { padding: 16px; }
 @page { margin: 16mm; size: A4; }
 h2 { page-break-before: auto; }
 table { page-break-inside: auto; }
 tr { page-break-inside: avoid; }
 }
</style>
</head>
<body>

<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;">
 <div>
 <h1> Laporan Bisnis</h1>
 <p class="meta">${biz}</p>
 <span class="badge-period">Periode: ${from} — ${to}</span>
 </div>
 <div style="text-align:right">
 <p style="font-size:10px;color:#9CA3AF">Dicetak: ${now}</p>
 <p style="font-size:10px;color:#9CA3AF">MSME Grow POS System</p>
 </div>
</div>

<!-- RINGKASAN EKSEKUTIF -->
<h2> Ringkasan Eksekutif</h2>
<div class="summary-grid">
 <div class="summary-card">
 <div class="label">Total Revenue</div>
 <div class="value blue">${rp(stats.total)}</div>
 <div class="sub">${Number(stats.revGrowth)>=0?'':''} ${Math.abs(stats.revGrowth)}% vs periode sebelumnya</div>
 </div>
 <div class="summary-card">
 <div class="label">Estimasi Net Profit</div>
 <div class="value green">${rp(stats.profit)}</div>
 <div class="sub">Margin ~33%</div>
 </div>
 <div class="summary-card">
 <div class="label">Total Transaksi</div>
 <div class="value orange">${completed.length}</div>
 <div class="sub">${refunded.length} direfund</div>
 </div>
 <div class="summary-card">
 <div class="label">Rata-rata / Transaksi</div>
 <div class="value">${rp(completed.length > 0 ? Math.round(stats.total/completed.length) : 0)}</div>
 <div class="sub">Dari ${rangeTransactions.length} total transaksi</div>
 </div>
</div>

<!-- BREAKDOWN METODE PEMBAYARAN -->
<h2> Breakdown Metode Pembayaran</h2>
<table>
 <thead><tr><th>Metode Pembayaran</th><th class="right">Total Transaksi</th><th class="right">Total Revenue</th><th class="right">% dari Total</th></tr></thead>
 <tbody>
 ${Object.entries(payMap).sort((a,b)=>b[1]-a[1]).map(([pay, rev]) => {
 const cnt = completed.filter(t=>t.payment===pay).length
 const pct = stats.total > 0 ? ((rev/stats.total)*100).toFixed(1) : 0
 return `<tr><td>${pay}</td><td class="right">${cnt}</td><td class="right">${rp(rev)}</td><td class="right">${pct}%</td></tr>`
 }).join('')}
 <tr style="font-weight:900;background:#EFF6FF"><td>TOTAL</td><td class="right">${completed.length}</td><td class="right">${rp(stats.total)}</td><td class="right">100%</td></tr>
 </tbody>
</table>

<!-- PERFORMA KASIR -->
${kasirList.length > 0 ? `
<h2> Performa Kasir</h2>
<table>
 <thead><tr><th>#</th><th>Nama Kasir</th><th class="right">Jumlah Transaksi</th><th class="right">Total Revenue</th><th class="right">Rata-rata/Trx</th></tr></thead>
 <tbody>
 ${kasirList.map((k,i) => `<tr>
 <td>${i+1}</td>
 <td>${k.name}</td>
 <td class="right">${k.orders}</td>
 <td class="right">${rp(k.revenue)}</td>
 <td class="right">${rp(k.orders > 0 ? Math.round(k.revenue/k.orders) : 0)}</td>
 </tr>`).join('')}
 </tbody>
</table>` : ''}

<!-- TOP PRODUK -->
${topProds.length > 0 ? `
<h2> Top Produk & Layanan</h2>
<table>
 <thead><tr><th>#</th><th>Nama Produk</th><th class="right">Qty Terjual</th><th class="right">Total Revenue</th></tr></thead>
 <tbody>
 ${topProds.map((p,i) => `<tr>
 <td>${i+1}</td>
 <td>${p.name}</td>
 <td class="right">${p.qty}</td>
 <td class="right">${rp(p.revenue)}</td>
 </tr>`).join('')}
 </tbody>
</table>` : ''}

<!-- LAPORAN HARIAN -->
${days.length > 0 ? `
<h2> Laporan Per Hari</h2>
<table>
 <thead><tr><th>Tanggal</th><th>Hari</th><th class="right">Jumlah Transaksi</th><th class="right">Revenue</th><th class="right">Rata-rata/Trx</th></tr></thead>
 <tbody>
 ${days.map(d => {
 const hari = new Date(d.date+'T00:00:00').toLocaleDateString('id-ID', { weekday:'long' })
 return `<tr>
 <td class="mono">${d.date}</td>
 <td>${hari}</td>
 <td class="right">${d.orders}</td>
 <td class="right">${rp(d.revenue)}</td>
 <td class="right">${rp(d.orders > 0 ? Math.round(d.revenue/d.orders) : 0)}</td>
 </tr>`
 }).join('')}
 <tr style="font-weight:900;background:#EFF6FF">
 <td colspan="2">TOTAL</td>
 <td class="right">${days.reduce((s,d)=>s+d.orders,0)}</td>
 <td class="right">${rp(days.reduce((s,d)=>s+d.revenue,0))}</td>
 <td class="right">—</td>
 </tr>
 </tbody>
</table>` : ''}

<!-- DETAIL SEMUA TRANSAKSI -->
<h2> Detail Semua Transaksi (${rangeTransactions.length} transaksi)</h2>
<table>
 <thead><tr><th>ID Transaksi</th><th>Tanggal & Waktu</th><th>Kasir</th><th>Produk</th><th>Metode</th><th class="right">Total</th><th>Status</th></tr></thead>
 <tbody>
 ${rangeTransactions.sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt)).map(t => {
 const dt = new Date(t.date||t.createdAt).toLocaleString('id-ID', { timeZone:'Asia/Jakarta', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
 const items = (t.items||[]).map(i=>`${i.name} (${i.qty}x)`).join(', ')
 const isRef = t.status === 'refunded'
 return `<tr>
 <td class="mono">${t.id}</td>
 <td style="white-space:nowrap">${dt}</td>
 <td>${t.cashier||'-'}</td>
 <td style="max-width:200px;font-size:10px">${items}</td>
 <td>${t.payment||'-'}</td>
 <td class="right" style="${isRef?'text-decoration:line-through;color:#9CA3AF':'font-weight:700'}">${rp(t.total)}</td>
 <td><span class="${isRef?'status-ref':'status-ok'}">${isRef?'Refund':'Selesai'}</span></td>
 </tr>`
 }).join('')}
 </tbody>
</table>

<div class="footer">
 <p>Laporan ini dibuat otomatis oleh <strong>MSME Grow POS System</strong> pada ${now}</p>
 <p>Periode: ${from} s/d ${to} · Total ${rangeTransactions.length} transaksi · Revenue ${rp(stats.total)}</p>
</div>

</body>
</html>`

 // Buka di tab baru lalu trigger print/save as PDF
 const win = window.open('', '_blank')
 win.document.write(html)
 win.document.close()
 win.onload = () => {
 win.focus()
 win.print()
 }
 setDownloading(false)
 }


 // Shortcut presets
 const applyPreset = (days) => {
 const end = toLocalDate(new Date().toISOString())
 const start = new Date(); start.setDate(start.getDate() - (days - 1))
 setDateRange({ from: toLocalDate(start.toISOString()), to: end })
 setTrxPage(1)
 }
 const applyThisMonth = () => {
 const d = new Date()
 const start = new Date(d.getFullYear(), d.getMonth(), 1)
 const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
 setDateRange({ from: toLocalDate(start.toISOString()), to: toLocalDate(end.toISOString()) })
 setTrxPage(1)
 }
 const applyLastMonth = () => {
 const d = new Date()
 const start = new Date(d.getFullYear(), d.getMonth() - 1, 1)
 const end = new Date(d.getFullYear(), d.getMonth(), 0)
 setDateRange({ from: toLocalDate(start.toISOString()), to: toLocalDate(end.toISOString()) })
 setTrxPage(1)
 }

 // Filter transactions by dateRange
 const rangeTransactions = useMemo(() => {
 const from = new Date(dateRange.from)
 const to = new Date(dateRange.to); to.setHours(23,59,59,999)
 return transactions.filter(t => {
 const d = new Date(t.date || t.createdAt)
 return d >= from && d <= to
 })
 }, [transactions, dateRange])

 // Base stats (filtered by dateRange) 
 const stats = useMemo(() => {
 const completed = rangeTransactions.filter(t => t.status === 'completed' || !t.status)
 const total = completed.reduce((s, t) => s + (t.total||0), 0)
 const totalHPP = completed.reduce((s,t) => s+(t.items||[]).reduce((ss,i)=>ss+(i.hpp||0)*(i.qty||0),0), 0)
 const grossProfit= total - totalHPP
 const totalExpInRange = (expenses||[]).filter(e=>{const d=(e.date||e.createdAt||'').slice(0,10); return d>=dateRange.from && d<=dateRange.to}).reduce((s,e)=>s+(e.amount||0),0)
 const profit = grossProfit - totalExpInRange

 // Compare with previous same-length period
 const fromD = new Date(dateRange.from)
 const toD = new Date(dateRange.to); toD.setHours(23,59,59,999)
 const diffMs = toD - fromD
 const prevTo = new Date(fromD.getTime() - 1)
 const prevFrom= new Date(prevTo.getTime() - diffMs)
 const prevCompleted = transactions.filter(t => {
 const d = new Date(t.date || t.createdAt)
 return (t.status === 'completed' || !t.status) && d >= prevFrom && d <= prevTo
 })
 const prevTotal = prevCompleted.reduce((s,t) => s+(t.total||0), 0)
 const revGrowth = prevTotal > 0 ? ((total - prevTotal) / prevTotal * 100).toFixed(1) : 0
 const orderGrowth = prevCompleted.length > 0 ? ((completed.length - prevCompleted.length) / prevCompleted.length * 100).toFixed(1) : 0

 const allCategories = [...new Set([
 ...products.map(p => p.category),
 'Strategi','Legal','Marketing','Keuangan','Lainnya',
 ])].filter(Boolean)

 const categoryRevenue = allCategories.map(cat => {
 const rev = completed.reduce((s, t) =>
 s + (t.items||[]).filter(i => {
 const p = products.find(p => p.name === i.name || p.id === i.productId)
 return p?.category === cat
 }).reduce((ss, i) => ss + (i.price||0) * (i.qty||0), 0), 0)
 return { name: cat, revenue: rev }
 }).sort((a, b) => b.revenue - a.revenue)

 const maxCatRev = Math.max(...categoryRevenue.map(c => c.revenue), 1)

 const topProducts = products.map(p => ({
 ...p,
 salesQty: completed.reduce((s, t) =>
 s + (t.items||[]).filter(i => i.productId===p.id || i.name===p.name).reduce((ss,i) => ss+(i.qty||0), 0), 0),
 revenue: completed.reduce((s, t) =>
 s + (t.items||[]).filter(i => i.productId===p.id || i.name===p.name).reduce((ss,i) => ss+(i.price||0)*(i.qty||0), 0), 0),
 })).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

 const maxProdRev = Math.max(...topProducts.map(p => p.revenue), 1)

 const kasirMap = {}
 completed.forEach(t => {
 const k = t.cashier || 'Unknown'
 if (!kasirMap[k]) kasirMap[k] = { name:k, revenue:0, orders:0 }
 kasirMap[k].revenue += (t.total||0)
 kasirMap[k].orders += 1
 })
 const kasirPerf = Object.values(kasirMap).sort((a,b) => b.revenue - a.revenue)

 return { total, profit, totalHPP, grossProfit, totalExpInRange, totalOrders:completed.length, revGrowth, orderGrowth, categoryRevenue, maxCatRev, topProducts, maxProdRev, kasirPerf }
 }, [rangeTransactions, transactions, products, dateRange])

 // Sales Trend data based on date range 
 const trendData = useMemo(() => {
 const from = new Date(dateRange.from)
 const to = new Date(dateRange.to)
 to.setHours(23,59,59,999)

 const days = []
 const cur = new Date(from)
 while (cur <= to) {
 const dayStr = toLocalDate(cur.toISOString())
 const dayTrx = transactions.filter(t => {
 const s = t.status
 const ok = !s || s === 'completed'
 return ok && toLocalDate(t.date||t.createdAt||'') === dayStr
 })
 days.push({
 date : dayStr,
 label : cur.toLocaleDateString('id-ID', { weekday:'short', day:'numeric' }),
 shortLabel: cur.toLocaleDateString('id-ID', { weekday:'short' }),
 revenue : dayTrx.reduce((s,t) => s+(t.total||0), 0),
 orders : dayTrx.length,
 })
 cur.setDate(cur.getDate() + 1)
 }

 const maxRev = Math.max(...days.map(d => d.revenue), 1)
 const totalRev = days.reduce((s,d) => s+d.revenue, 0)
 const totalOrd = days.reduce((s,d) => s+d.orders, 0)
 const peakDay = days.reduce((a,b) => a.revenue>=b.revenue ? a : b, days[0] || { label:'-', revenue:0 })

 return { days, maxRev, totalRev, totalOrd, peakDay }
 }, [transactions, dateRange])

 // Transactions filtered by dateRange + search 
 const filteredTrx = useMemo(() => {
 const q = trxSearch.toLowerCase()
 return rangeTransactions.filter(t => {
 if (!q) return true
 return (t.id||'').toLowerCase().includes(q) ||
 (t.cashier||'').toLowerCase().includes(q) ||
 (t.payment||'').toLowerCase().includes(q) ||
 (t.memberName||'').toLowerCase().includes(q) ||
 (t.items||[]).some(i => (i.name||'').toLowerCase().includes(q))
 })
 }, [rangeTransactions, trxSearch])

 const trxPageCount = Math.ceil(filteredTrx.length / TRX_PER_PAGE)
 const pagedTrx = filteredTrx.slice((trxPage-1)*TRX_PER_PAGE, trxPage*TRX_PER_PAGE)

 const tabs = [
 { id:'overview', label:'Overview' },
 { id:'trends', label:'Sales Trends' },
 { id:'category', label:'Category ROI' },
 { id:'profitloss', label:' Laba Rugi' },
 { id:'stock', label:' Stok' },
 { id:'cashier', label:' Per Kasir' },
 { id:'shift', label:'⏰ Per Shift' },
 { id:'transactions',label:' Transaksi' },
 ]

 return (
 <div style={{ padding:'16px 20px', maxWidth:960, margin:'0 auto' }}>
 <div style={{ marginBottom:16 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:14 }}>
 <div>
 <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#111827' }}>Admin Insights</h2>
 <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>Analitik mendalam untuk pengambilan keputusan bisnis</p>
 </div>
 </div>

 {/* Date Range Picker — berlaku semua tab */}
 <div style={{ background:'#fff', border:'1px solid #F1F5F9', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
 <span style={{ fontSize:12, color:'#6B7280', fontWeight:700, whiteSpace:'nowrap' }}> Periode:</span>

 {/* Date inputs */}
 <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:220 }}>
 <input type="date" value={dateRange.from}
 onChange={e => { setDateRange(d => ({ ...d, from: e.target.value })); setTrxPage(1) }}
 style={{ padding:'6px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'#111827', background:'#FAFAFA', cursor:'pointer' }} />
 <span style={{ fontSize:13, color:'#9CA3AF', fontWeight:600 }}>—</span>
 <input type="date" value={dateRange.to}
 onChange={e => { setDateRange(d => ({ ...d, to: e.target.value })); setTrxPage(1) }}
 style={{ padding:'6px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'#111827', background:'#FAFAFA', cursor:'pointer' }} />
 </div>

 {/* Preset buttons */}
 <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
 {[
 { label:'7H', action: () => applyPreset(7) },
 { label:'30H', action: () => applyPreset(30) },
 { label:'90H', action: () => applyPreset(90) },
 { label:'Bulan Ini', action: applyThisMonth },
 { label:'Bulan Lalu', action: applyLastMonth },
 ].map(p => (
 <button key={p.label} onClick={p.action}
 style={{ padding:'5px 11px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'#F9FAFB', color:'#374151', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', transition:'all 0.12s' }}
 onMouseEnter={e => { e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.borderColor='#BFDBFE'; e.currentTarget.style.color='#2563EB' }}
 onMouseLeave={e => { e.currentTarget.style.background='#F9FAFB'; e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.color='#374151' }}>
 {p.label}
 </button>
 ))}
 </div>

 {/* Active range display */}
 <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'4px 10px', whiteSpace:'nowrap' }}>
 <span style={{ fontSize:11, fontWeight:700, color:'#2563EB' }}>
 {dateRange.from} → {dateRange.to}
 </span>
 </div>

 {/* Download button */}
 <button onClick={downloadReport} disabled={downloading || rangeTransactions.length === 0}
 style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:10, border:'none', background: rangeTransactions.length === 0 ? '#E5E7EB' : 'linear-gradient(135deg,#1D4ED8,#2563EB)', color: rangeTransactions.length === 0 ? '#9CA3AF' : '#fff', fontSize:13, fontWeight:800, cursor: rangeTransactions.length === 0 ? 'not-allowed' : 'pointer', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow: rangeTransactions.length === 0 ? 'none' : '0 2px 8px rgba(37,99,235,0.3)', transition:'all 0.15s' }}
 title={rangeTransactions.length === 0 ? 'Tidak ada data di periode ini' : `Download laporan ${rangeTransactions.length} transaksi`}>
 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
 </svg>
 {downloading ? 'Menyiapkan...' : `Download PDF${rangeTransactions.length > 0 ? ` (${rangeTransactions.length})` : ''}`}
 </button>
 </div>
 </div>

 {/* Tabs */}
 <div style={{ display:'flex', gap:7, marginBottom:18, overflowX:'auto', paddingBottom:2 }}>
 {tabs.map(t => (
 <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
 padding:'7px 18px', borderRadius:20, border:'none', cursor:'pointer',
 fontFamily:'inherit', fontWeight:700, fontSize:13, whiteSpace:'nowrap',
 background: activeTab===t.id ? '#2563EB' : '#F3F4F6',
 color: activeTab===t.id ? '#fff' : '#6B7280',
 transition:'all 0.15s',
 }}>
 {t.label}
 </button>
 ))}
 </div>

 {/* OVERVIEW TAB */}
 {activeTab === 'overview' && (
 <div>
 {/* Stats */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:16 }}>
 {[
 { label:`Total Revenue — ${dateRange.from} s/d ${dateRange.to}`, value:formatIDR(stats.total), sub: Number(stats.revGrowth)>=0 ? `+${stats.revGrowth}% vs periode sebelumnya` : `${stats.revGrowth}% vs periode sebelumnya`, subColor: Number(stats.revGrowth)>=0?'#22C55E':'#EF4444', icon:'cash', iconBg:'#EFF6FF' },
 { label:'Estimasi Net Profit', value:formatIDR(stats.profit), sub: Number(stats.revGrowth)>=0 ? `+${stats.revGrowth}% vs bulan lalu` : `${stats.revGrowth}% vs bulan lalu`, subColor:'#22C55E', icon:'trending', iconBg:'#F0FDF4' },
 { label:'Total Transaksi', value:stats.totalOrders, sub:`${Number(stats.orderGrowth)>=0?'+':''}${stats.orderGrowth}% vs bulan lalu`, subColor:Number(stats.orderGrowth)>=0?'#22C55E':'#EF4444', icon:'orders', iconBg:'#FFF7ED' },
 ].map(s => (
 <Card key={s.label}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <div>
 <p style={{ margin:'0 0 4px', fontSize:12, color:'#6B7280', fontWeight:500 }}>{s.label}</p>
 <p style={{ margin:'0 0 4px', fontSize:24, fontWeight:900, color:'#111827' }}>{s.value}</p>
 <p style={{ margin:0, fontSize:12, color:s.subColor, fontWeight:700 }}>{s.sub}</p>
 </div>
 <div style={{ width:48, height:48, background:s.iconBg, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <Icon name={s.icon} size={22} color="#2563EB" />
 </div>
 </div>
 </Card>
 ))}
 </div>

 {/* Top Products */}
 <Card style={{ marginBottom:14 }}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
 <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#111827' }}>Top Produk & Layanan</h3>
 <Badge color="blue">{dateRange.from} — {dateRange.to}</Badge>
 </div>
 {stats.topProducts.length === 0 ? (
 <p style={{ color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'16px 0' }}>Belum ada data penjualan.</p>
 ) : stats.topProducts.map((p, i) => {
 const colors = ['#2563EB','#22C55E','#F97316','#A855F7','#EC4899']
 return (
 <div key={p.id||i} style={{ marginBottom:12 }}>
 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
 <span style={{ width:22, height:22, background: i<3?['#FFF7ED','#F0FDF4','#EFF6FF'][i]:'#F3F4F6', borderRadius:6, fontSize:11, fontWeight:900, color: i<3?['#C2410C','#166534','#1D4ED8'][i]:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
 <span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{p.name}</span>
 </div>
 <span style={{ fontSize:13, fontWeight:800, color:'#2563EB', flexShrink:0 }}>{formatIDR(p.revenue)}</span>
 </div>
 <div style={{ height:6, background:'#F3F4F6', borderRadius:10, overflow:'hidden' }}>
 <div style={{ height:'100%', width:`${(p.revenue/stats.maxProdRev)*100}%`, background:colors[i]||'#6B7280', borderRadius:10, transition:'width 0.8s ease' }} />
 </div>
 <p style={{ margin:'3px 0 0', fontSize:11, color:'#9CA3AF' }}>{p.salesQty} terjual</p>
 </div>
 )
 })}
 </Card>

 {/* Top Kasir */}
 {stats.kasirPerf.length > 0 && (
 <Card style={{ marginBottom:14 }}>
 <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800, color:'#111827' }}>Performa Kasir</h3>
 {stats.kasirPerf.slice(0,5).map((k, i) => (
 <div key={k.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < Math.min(4, stats.kasirPerf.length-1) ? '1px solid #F9FAFB':'none' }}>
 <div style={{ width:38, height:38, background:'#EFF6FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <Icon name="user" size={18} color="#2563EB" />
 </div>
 <div style={{ flex:1 }}>
 <p style={{ margin:'0 0 1px', fontSize:13, fontWeight:700, color:'#111827' }}>{k.name}</p>
 <p style={{ margin:0, fontSize:12, color:'#9CA3AF' }}>{k.orders} transaksi</p>
 </div>
 <p style={{ margin:0, fontSize:14, fontWeight:900, color:'#2563EB' }}>{formatIDR(k.revenue)}</p>
 </div>
 ))}
 </Card>
 )}

 {/* Category Breakdown */}
 <Card style={{ marginBottom:14 }}>
 <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800, color:'#111827' }}>Revenue per Kategori</h3>
 {stats.categoryRevenue.filter(c => c.revenue > 0).length === 0 ? (
 <p style={{ color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'16px 0' }}>Belum ada data.</p>
 ) : stats.categoryRevenue.filter(c => c.revenue > 0).map(c => (
 <div key={c.name} style={{ marginBottom:12 }}>
 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
 <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>{c.name}</span>
 <span style={{ fontSize:13, fontWeight:800, color:'#111827' }}>{formatIDR(c.revenue)}</span>
 </div>
 <div style={{ height:7, background:'#F3F4F6', borderRadius:10 }}>
 <div style={{ height:'100%', width:`${(c.revenue/stats.maxCatRev)*100}%`, background:catBarColors[c.name]||'#6B7280', borderRadius:10, minWidth:4 }} />
 </div>
 </div>
 ))}
 </Card>

 {/* ALL Transactions */}
 <Card>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
 <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#111827' }}>Semua Riwayat Transaksi</h3>
 <span style={{ fontSize:12, color:'#6B7280' }}>{filteredTrx.length} transaksi</span>
 </div>

 {/* Search */}
 <div style={{ position:'relative', marginBottom:12 }}>
 <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}><Icon name="search" size={14} color="#9CA3AF" /></span>
 <input
 value={trxSearch}
 onChange={e => { setTrxSearch(e.target.value); setTrxPage(1) }}
 placeholder="Cari ID, kasir, produk, member..."
 style={{ width:'100%', padding:'9px 12px 9px 32px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
 />
 </div>

 {pagedTrx.length === 0 ? (
 <p style={{ color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'20px 0' }}>
 {trxSearch ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi.'}
 </p>
 ) : (
 <>
 {pagedTrx.map(t => (
 <div key={t.id} onClick={() => openDetail(t)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid #F9FAFB', cursor:'pointer' }}
 onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
 onMouseLeave={e => e.currentTarget.style.background='transparent'}
 >
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <div style={{ width:38, height:38, background: t.status==='refunded'?'#FEF2F2':'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <Icon name="user" size={16} color={t.status==='refunded'?'#EF4444':'#2563EB'} />
 </div>
 <div>
 <p style={{ margin:'0 0 1px', fontSize:13, fontWeight:800, color:'#111827', fontFamily:'monospace' }}>{t.id}</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>
 {formatRelativeTime(t.date||t.createdAt)} · {t.cashier}
 {t.memberName ? ` · ${t.memberName}` : ''}
 {' · '}{t.payment}
 </p>
 </div>
 </div>
 <div style={{ textAlign:'right', flexShrink:0 }}>
 <p style={{ margin:'0 0 3px', fontSize:13, fontWeight:900, color: t.status==='refunded'?'#9CA3AF':'#111827', textDecoration: t.status==='refunded'?'line-through':'none' }}>
 +{formatIDR(t.total||0)}
 </p>
 <Badge color={STATUS_COLOR[t.status]||'green'}>{STATUS_LABEL[t.status]||'Selesai'}</Badge>
 </div>
 </div>
 ))}

 {/* Pagination */}
 {trxPageCount > 1 && (
 <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:14 }}>
 <button onClick={() => setTrxPage(p => Math.max(1,p-1))} disabled={trxPage===1}
 style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', color: trxPage===1?'#D1D5DB':'#374151' }}>
 ← Prev
 </button>
 <span style={{ fontSize:12, color:'#6B7280' }}>
 Hal {trxPage} / {trxPageCount}
 </span>
 <button onClick={() => setTrxPage(p => Math.min(trxPageCount,p+1))} disabled={trxPage===trxPageCount}
 style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', color: trxPage===trxPageCount?'#D1D5DB':'#374151' }}>
 Next →
 </button>
 </div>
 )}
 </>
 )}
 </Card>
 </div>
 )}

 {/* SALES TRENDS TAB */}
 {activeTab === 'trends' && (
 <div>
 <Card style={{ marginBottom:14 }}>
 <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
 <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#111827', flex:1 }}>Tren Penjualan</h3>
 <span style={{ fontSize:12, color:'#6B7280' }}>{dateRange.from} → {dateRange.to}</span>
 </div>

 {/* Bar chart */}
 {trendData.days.length === 0 ? (
 <p style={{ color:'#9CA3AF', textAlign:'center', padding:'30px 0', fontSize:13 }}>Tidak ada data di rentang ini.</p>
 ) : (
 <>
 <div style={{ display:'flex', alignItems:'flex-end', gap: trendData.days.length > 14 ? 3 : 7, height:150, marginBottom:8 }}>
 {trendData.days.map((day, i) => (
 <div key={day.date} title={`${day.date}: ${formatIDR(day.revenue)} (${day.orders} order)`}
 style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', cursor:'default' }}>
 <div style={{
 width:'100%',
 height:`${Math.max((day.revenue/trendData.maxRev)*100, day.revenue>0?4:0)}%`,
 background: day.date===toLocalDate(new Date().toISOString())
 ? 'linear-gradient(180deg,#2563EB,#1D4ED8)' : '#BFDBFE',
 borderRadius:'4px 4px 0 0',
 minHeight: day.revenue>0 ? 6 : 2,
 transition:'height 0.4s ease',
 }} />
 </div>
 ))}
 </div>

 {/* X-axis labels — only show some if too many */}
 <div style={{ display:'flex', gap: trendData.days.length > 14 ? 3 : 7 }}>
 {trendData.days.map((day, i) => (
 <div key={day.date} style={{ flex:1, textAlign:'center' }}>
 {(trendData.days.length <= 14 || i % Math.ceil(trendData.days.length/14) === 0) && (
 <span style={{ fontSize:9, color: day.date===toLocalDate(new Date().toISOString())?'#2563EB':'#9CA3AF', fontWeight: day.date===toLocalDate(new Date().toISOString())?800:500 }}>
 {day.shortLabel}
 </span>
 )}
 </div>
 ))}
 </div>

 {/* Summary stats */}
 <div style={{ marginTop:16, background:'#F9FAFB', borderRadius:10, padding:'12px 14px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
 <div style={{ textAlign:'center' }}>
 <p style={{ margin:'0 0 2px', fontSize:11, color:'#6B7280' }}>Total Revenue</p>
 <p style={{ margin:0, fontSize:16, fontWeight:900, color:'#2563EB' }}>{formatIDR(trendData.totalRev)}</p>
 </div>
 <div style={{ textAlign:'center' }}>
 <p style={{ margin:'0 0 2px', fontSize:11, color:'#6B7280' }}>Total Orders</p>
 <p style={{ margin:0, fontSize:16, fontWeight:900, color:'#111827' }}>{trendData.totalOrd}</p>
 </div>
 <div style={{ textAlign:'center' }}>
 <p style={{ margin:'0 0 2px', fontSize:11, color:'#6B7280' }}>Hari Terbaik</p>
 <p style={{ margin:0, fontSize:16, fontWeight:900, color:'#22C55E' }}>{trendData.peakDay?.shortLabel || '-'}</p>
 </div>
 </div>
 </>
 )}
 </Card>

 {/* Daily breakdown table */}
 <Card>
 <h3 style={{ margin:'0 0 12px', fontSize:15, fontWeight:800, color:'#111827' }}>Detail Per Hari</h3>
 <div style={{ overflowX:'auto' }}>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
 <thead>
 <tr style={{ borderBottom:'2px solid #F1F5F9' }}>
 {['Tanggal','Hari','Orders','Revenue','Rata-rata/Order'].map(h => (
 <th key={h} style={{ padding:'8px 10px', textAlign: h==='Tanggal'||h==='Hari'?'left':'right', fontWeight:700, color:'#6B7280', fontSize:11, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {[...trendData.days].reverse().map((day, i) => (
 <tr key={day.date} style={{ borderBottom:'1px solid #F9FAFB', background: day.date===toLocalDate(new Date().toISOString())?'#EFF6FF':'transparent' }}>
 <td style={{ padding:'9px 10px', fontWeight:700, color:'#111827', fontFamily:'monospace', fontSize:12 }}>{day.date}</td>
 <td style={{ padding:'9px 10px', color:'#6B7280' }}>{day.label}</td>
 <td style={{ padding:'9px 10px', textAlign:'right', fontWeight:700, color: day.orders>0?'#2563EB':'#D1D5DB' }}>{day.orders}</td>
 <td style={{ padding:'9px 10px', textAlign:'right', fontWeight:800, color: day.revenue>0?'#111827':'#D1D5DB' }}>{day.revenue>0?formatIDR(day.revenue):'-'}</td>
 <td style={{ padding:'9px 10px', textAlign:'right', color:'#6B7280' }}>{day.orders>0?formatIDR(Math.round(day.revenue/day.orders)):'-'}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>
 </div>
 )}

 {/* CATEGORY ROI TAB */}
 {activeTab === 'category' && (
 <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
 {stats.categoryRevenue.length === 0 ? (
 <Card><p style={{ color:'#9CA3AF', textAlign:'center', padding:'30px 0', fontSize:13 }}>Belum ada data kategori.</p></Card>
 ) : stats.categoryRevenue.map(c => {
 const catProds = products.filter(p => p.category === c.name)
 return (
 <Card key={c.name}>
 <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:10 }}>
 <div style={{ width:44, height:44, background:(catBarColors[c.name]||'#6B7280')+'22', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
 <Icon name="tag" size={20} color={catBarColors[c.name]||'#6B7280'} />
 </div>
 <div style={{ flex:1 }}>
 <p style={{ margin:'0 0 1px', fontWeight:800, fontSize:15, color:'#111827' }}>{c.name}</p>
 <p style={{ margin:0, fontSize:12, color:'#9CA3AF' }}>{catProds.length} produk</p>
 </div>
 <p style={{ margin:0, fontSize:18, fontWeight:900, color:'#2563EB' }}>{formatIDR(c.revenue)}</p>
 </div>
 <div style={{ height:6, background:'#F3F4F6', borderRadius:10 }}>
 <div style={{ height:'100%', width:`${(c.revenue/stats.maxCatRev)*100}%`, background:catBarColors[c.name]||'#6B7280', borderRadius:10, minWidth:c.revenue>0?4:0 }} />
 </div>
 </Card>
 )
 })}
 </div>
 )}


 {/* LABA RUGI TAB */}
 {activeTab === 'profitloss' && (
 <div>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:12, marginBottom:18 }}>
 {[
 { label:'Total Pendapatan', value:stats.total, color:'#16A34A', bg:'#F0FDF4', icon:'', desc:'Revenue kotor' },
 { label:'HPP (Modal)', value:stats.totalHPP||0, color:'#D97706', bg:'#FFFBEB', icon:'', desc:'Harga pokok produk' },
 { label:'Laba Kotor', value:stats.grossProfit||0, color:'#2563EB', bg:'#EFF6FF', icon:'', desc:'Pendapatan − HPP' },
 { label:'Total Pengeluaran', value:stats.totalExpInRange||0,color:'#EF4444', bg:'#FEF2F2', icon:'', desc:'Biaya operasional' },
 { label:'LABA BERSIH', value:stats.profit||0, color:(stats.profit||0)>=0?'#16A34A':'#EF4444', bg:(stats.profit||0)>=0?'#F0FDF4':'#FEF2F2', icon:(stats.profit||0)>=0?'':'', desc:'Laba kotor − pengeluaran', bold:true },
 ].map(s=>(
 <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:'14px 16px', border:`1px solid ${s.color}22` }}>
 <p style={{ margin:'0 0 3px', fontSize:11, color:'#6B7280', fontWeight:700 }}>{s.icon} {s.label}</p>
 <p style={{ margin:'0 0 2px', fontSize:s.bold?19:16, fontWeight:900, color:s.color }}>{'Rp '+(s.value||0).toLocaleString('id-ID')}</p>
 <p style={{ margin:0, fontSize:10, color:'#9CA3AF' }}>{s.desc}</p>
 </div>
 ))}
 </div>
 {stats.totalHPP > 0 && (
 <div style={{ background:'#fff', borderRadius:14, padding:16, border:'1px solid #F1F5F9', marginBottom:16 }}>
 <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800, color:'#111827' }}> Analisis Margin</h3>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
 {[
 { label:'Margin Kotor', value: stats.total>0 ? ((stats.grossProfit/stats.total)*100).toFixed(1)+'%' : '-', color:'#2563EB' },
 { label:'Margin Bersih', value: stats.total>0 ? ((stats.profit/stats.total)*100).toFixed(1)+'%' : '-', color:(stats.profit||0)>=0?'#16A34A':'#EF4444' },
 { label:'Rasio HPP', value: stats.total>0 ? (((stats.totalHPP||0)/stats.total)*100).toFixed(1)+'%' : '-', color:'#D97706' },
 { label:'Avg Transaksi', value: stats.totalOrders>0 ? 'Rp '+(Math.round(stats.total/stats.totalOrders)).toLocaleString('id-ID') : '-', color:'#6B7280' },
 ].map(m=>(
 <div key={m.label} style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 12px' }}>
 <p style={{ margin:'0 0 4px', fontSize:11, color:'#9CA3AF', fontWeight:700 }}>{m.label}</p>
 <p style={{ margin:0, fontSize:18, fontWeight:900, color:m.color }}>{m.value}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 {stats.topProducts.length > 0 && (
 <div style={{ background:'#fff', borderRadius:14, padding:16, border:'1px solid #F1F5F9', marginBottom:16 }}>
 <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800, color:'#111827' }}> HPP & Margin per Produk</h3>
 <div style={{ overflowX:'auto' }}>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
 <thead>
 <tr style={{ background:'#F9FAFB' }}>
 {['Produk','Qty','Revenue','HPP','Laba Kotor','Margin'].map(h=>(
 <th key={h} style={{ padding:'8px 10px', textAlign:h==='Produk'?'left':'right', color:'#6B7280', fontWeight:700, fontSize:10, textTransform:'uppercase', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {stats.topProducts.map((p)=>{
 const hpp = rangeTransactions.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>(t.items||[]).filter(i=>i.productId===p.id||i.name===p.name).reduce((ss,it)=>ss+(it.hpp||0)*(it.qty||0),s),0)
 const laba = p.revenue - hpp
 const margin = p.revenue>0 ? Math.round((laba/p.revenue)*100) : 0
 return (
 <tr key={p.id} style={{ borderBottom:'1px solid #F3F4F6' }}>
 <td style={{ padding:'9px 10px', fontWeight:600 }}>{p.name}</td>
 <td style={{ padding:'9px 10px', textAlign:'right', color:'#6B7280' }}>{p.salesQty}</td>
 <td style={{ padding:'9px 10px', textAlign:'right', fontWeight:700 }}>{'Rp '+(p.revenue||0).toLocaleString('id-ID')}</td>
 <td style={{ padding:'9px 10px', textAlign:'right', color:'#D97706' }}>{'Rp '+hpp.toLocaleString('id-ID')}</td>
 <td style={{ padding:'9px 10px', textAlign:'right', fontWeight:700, color:laba>=0?'#16A34A':'#EF4444' }}>{'Rp '+laba.toLocaleString('id-ID')}</td>
 <td style={{ padding:'9px 10px', textAlign:'right' }}>
 <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, background:margin>=30?'#F0FDF4':margin>=15?'#FFFBEB':'#FEF2F2', color:margin>=30?'#16A34A':margin>=15?'#D97706':'#EF4444' }}>{margin}%</span>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}
 <div style={{ background:'#fff', borderRadius:14, padding:16, border:'1px solid #F1F5F9' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
 <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:'#111827' }}> Pengeluaran Periode Ini</h3>
 <button onClick={()=>navigate('expenses')} style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'5px 12px', color:'#2563EB', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Kelola →</button>
 </div>
 {(expenses||[]).filter(e=>{const d=(e.date||e.createdAt||'').slice(0,10);return d>=dateRange.from&&d<=dateRange.to}).length===0 ? (
 <div style={{ textAlign:'center', padding:'24px', color:'#9CA3AF' }}>
 <p style={{ fontSize:13, color:'#374151' }}>Belum ada pengeluaran. Catat di menu Pengeluaran.</p>
 </div>
 ) : (
 <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
 {(expenses||[]).filter(e=>{const d=(e.date||e.createdAt||'').slice(0,10);return d>=dateRange.from&&d<=dateRange.to}).slice(0,8).map(e=>(
 <div key={e.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'#F9FAFB', borderRadius:8 }}>
 <div>
 <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#111827' }}>{e.description}</p>
 <p style={{ margin:0, fontSize:10, color:'#9CA3AF' }}>{e.category} · {(e.date||e.createdAt||'').slice(0,10)}</p>
 </div>
 <span style={{ fontSize:13, fontWeight:800, color:'#EF4444' }}>-{'Rp '+(e.amount||0).toLocaleString('id-ID')}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {/* STOK TAB */}
 {activeTab === 'stock' && (() => {
 const LOW_THRESHOLD = settings?.lowStockAlert || 5
 const activeProds = products.filter(p => p.active)
 const lowStock = activeProds.filter(p => !p.hasVariants && p.stock <= LOW_THRESHOLD)
 const lowVariant = activeProds.filter(p => p.hasVariants && (p.variants||[]).some(v => v.stock <= LOW_THRESHOLD))
 const outOfStock = activeProds.filter(p => !p.hasVariants && p.stock === 0)
 const totalStock = activeProds.filter(p => !p.hasVariants).reduce((s,p) => s + (p.stock||0), 0)

 // Stok keluar (terjual) dalam periode
 const soldMap = {}
 rangeTransactions.filter(t => !t.status || t.status === 'completed').forEach(t => {
 ;(t.items||[]).forEach(i => {
 const key = i.productId || i.name
 if (!soldMap[key]) soldMap[key] = { name: i.name, qty: 0, revenue: 0 }
 soldMap[key].qty += (i.qty || 0)
 soldMap[key].revenue += (i.price||0) * (i.qty||0)
 })
 })
 const soldList = Object.values(soldMap).sort((a,b) => b.qty - a.qty)

 return (
 <div>
 {/* Summary cards */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
 {[
 { label:'Total Produk Aktif', value: activeProds.length, color:'#2563EB', bg:'#EFF6FF' },
 { label:'Total Unit Stok', value: totalStock.toLocaleString('id-ID'), color:'#059669', bg:'#F0FDF4' },
 { label:'Stok Menipis', value: lowStock.length + lowVariant.length, color:'#D97706', bg:'#FFFBEB' },
 { label:'Stok Habis', value: outOfStock.length, color:'#EF4444', bg:'#FEF2F2' },
 ].map(s => (
 <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'12px 14px', border:`1px solid ${s.color}22` }}>
 <p style={{ margin:'0 0 4px', fontSize:11, color:'#6B7280', fontWeight:700 }}>{s.label}</p>
 <p style={{ margin:0, fontSize:20, fontWeight:900, color:s.color }}>{s.value}</p>
 </div>
 ))}
 </div>

 {/* Stok Habis */}
 {outOfStock.length > 0 && (
 <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
 <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#991B1B' }}> Stok Habis ({outOfStock.length} produk)</h4>
 <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
 {outOfStock.map(p => (
 <span key={p.id} style={{ background:'#fff', border:'1px solid #FECACA', borderRadius:8, padding:'4px 12px', fontSize:12, fontWeight:700, color:'#DC2626' }}>{p.name}</span>
 ))}
 </div>
 </div>
 )}

 {/* Stok Menipis */}
 {(lowStock.length + lowVariant.length) > 0 && (
 <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
 <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#92400E' }}> Stok Menipis (≤{LOW_THRESHOLD} unit)</h4>
 {lowStock.map(p => (
 <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #FDE68A' }}>
 <span style={{ fontSize:13, color:'#92400E' }}>{p.name}</span>
 <span style={{ fontSize:13, fontWeight:800, color:'#D97706' }}>{p.stock} unit</span>
 </div>
 ))}
 {lowVariant.map(p => (p.variants||[]).filter(v => v.stock <= LOW_THRESHOLD).map(v => (
 <div key={`${p.id}_${v.id}`} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #FDE68A' }}>
 <span style={{ fontSize:13, color:'#92400E' }}>{p.name} — {v.name}</span>
 <span style={{ fontSize:13, fontWeight:800, color:'#D97706' }}>{v.stock} unit</span>
 </div>
 )))}
 </div>
 )}

 {/* Stok Terjual dalam Periode */}
 <div style={{ background:'#fff', border:'1px solid #F1F5F9', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
 <h4 style={{ margin:'0 0 14px', fontSize:13, fontWeight:800, color:'#111827' }}> Stok Keluar (Terjual) — Periode Ini</h4>
 {soldList.length === 0 ? (
 <p style={{ color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'16px 0' }}>Belum ada penjualan di periode ini.</p>
 ) : (
 <div style={{ overflowX:'auto' }}>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
 <thead>
 <tr style={{ background:'#F9FAFB' }}>
 {['#','Produk','Qty Terjual','Revenue'].map(h => (
 <th key={h} style={{ padding:'8px 10px', textAlign:h==='Produk'||h==='#'?'left':'right', color:'#6B7280', fontWeight:700, fontSize:10, textTransform:'uppercase', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {soldList.map((p, i) => (
 <tr key={p.name} style={{ borderBottom:'1px solid #F3F4F6' }}>
 <td style={{ padding:'8px 10px', fontSize:11, color:'#9CA3AF' }}>{i+1}</td>
 <td style={{ padding:'8px 10px', fontWeight:600 }}>{p.name}</td>
 <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:800, color:'#2563EB' }}>{p.qty}</td>
 <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700 }}>{'Rp '+(p.revenue||0).toLocaleString('id-ID')}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Semua Produk + stok */}
 <div style={{ background:'#fff', border:'1px solid #F1F5F9', borderRadius:14, padding:'14px 16px' }}>
 <h4 style={{ margin:'0 0 14px', fontSize:13, fontWeight:800, color:'#111827' }}> Inventori Lengkap</h4>
 <div style={{ overflowX:'auto' }}>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
 <thead>
 <tr style={{ background:'#F9FAFB' }}>
 {['Produk','Kategori','Harga Jual','HPP','Margin','Stok'].map(h => (
 <th key={h} style={{ padding:'8px 10px', textAlign:h==='Produk'||h==='Kategori'?'left':'right', color:'#6B7280', fontWeight:700, fontSize:10, textTransform:'uppercase', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {activeProds.map(p => {
 const margin = p.hpp && p.price ? Math.round(((p.price - p.hpp) / p.price) * 100) : null
 const isLow = !p.hasVariants && p.stock <= LOW_THRESHOLD
 return (
 <tr key={p.id} style={{ borderBottom:'1px solid #F3F4F6', background: isLow ? '#FFFBEB' : 'transparent' }}>
 <td style={{ padding:'8px 10px', fontWeight:600 }}>
 {p.name}
 {p.hasVariants && <span style={{ marginLeft:6, fontSize:10, background:'#EFF6FF', color:'#2563EB', padding:'1px 6px', borderRadius:6, fontWeight:700 }}>VARIAN</span>}
 </td>
 <td style={{ padding:'8px 10px', color:'#6B7280', fontSize:11 }}>{p.category}</td>
 <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700 }}>{'Rp '+(p.price||0).toLocaleString('id-ID')}</td>
 <td style={{ padding:'8px 10px', textAlign:'right', color:'#D97706' }}>{p.hpp ? 'Rp '+(p.hpp||0).toLocaleString('id-ID') : '-'}</td>
 <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color: margin ? (margin >= 30 ? '#16A34A' : margin >= 15 ? '#D97706' : '#EF4444') : '#9CA3AF' }}>
 {margin !== null ? `${margin}%` : '-'}
 </td>
 <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:800, color: isLow ? '#EF4444' : '#111827' }}>
 {p.hasVariants ? (p.variants||[]).map(v=>`${v.name}:${v.stock}`).join(', ') : p.stock}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )
 })()}

 {/* PER KASIR TAB */}
 {activeTab === 'cashier' && (() => {
 const completed = rangeTransactions.filter(t => !t.status || t.status === 'completed')
 const kasirMap = {}
 completed.forEach(t => {
 const k = t.cashier || 'Unknown'
 if (!kasirMap[k]) kasirMap[k] = { name:k, revenue:0, orders:0, items:0, methods:{} }
 kasirMap[k].revenue += (t.total||0)
 kasirMap[k].orders += 1
 kasirMap[k].items += (t.items||[]).reduce((s,i) => s + (i.qty||0), 0)
 const m = t.payment || 'Cash'
 kasirMap[k].methods[m] = (kasirMap[k].methods[m]||0) + (t.total||0)
 })
 const kasirList = Object.values(kasirMap).sort((a,b) => b.revenue - a.revenue)
 const totalRev = kasirList.reduce((s,k) => s + k.revenue, 0)

 // Shifts per kasir (reserved for future use)

 return (
 <div>
 {kasirList.length === 0 ? (
 <div style={{ textAlign:'center', padding:'48px 0', color:'#9CA3AF' }}>
 <p style={{ fontSize:14, color:'#374151' }}>Belum ada data transaksi di periode ini.</p>
 </div>
 ) : (
 <>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
 {[
 { label:'Total Kasir Aktif', value: kasirList.length, color:'#2563EB', bg:'#EFF6FF' },
 { label:'Total Transaksi', value: completed.length, color:'#059669', bg:'#F0FDF4' },
 { label:'Total Revenue', value: 'Rp '+(totalRev||0).toLocaleString('id-ID'), color:'#7C3AED', bg:'#F5F3FF' },
 { label:'Avg / Kasir', value: kasirList.length > 0 ? 'Rp '+Math.round(totalRev/kasirList.length).toLocaleString('id-ID') : '-', color:'#D97706', bg:'#FFFBEB' },
 ].map(s => (
 <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'12px 14px', border:`1px solid ${s.color}22` }}>
 <p style={{ margin:'0 0 4px', fontSize:11, color:'#6B7280', fontWeight:700 }}>{s.label}</p>
 <p style={{ margin:0, fontSize:16, fontWeight:900, color:s.color }}>{s.value}</p>
 </div>
 ))}
 </div>

 {kasirList.map((kasir, idx) => (
 <div key={kasir.name} style={{ background:'#fff', border:'1px solid #F1F5F9', borderRadius:14, padding:'16px 18px', marginBottom:12 }}>
 <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
 <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(135deg,${['#2563EB','#059669','#7C3AED','#D97706','#EF4444'][idx%5]},${['#7C3AED','#2563EB','#EC4899','#EF4444','#D97706'][idx%5]})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <span style={{ color:'#fff', fontWeight:900, fontSize:16 }}>{kasir.name.charAt(0).toUpperCase()}</span>
 </div>
 <div style={{ flex:1 }}>
 <p style={{ margin:'0 0 2px', fontSize:15, fontWeight:800, color:'#111827' }}>{kasir.name}</p>
 <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>{kasir.orders} transaksi · {kasir.items} item terjual</p>
 </div>
 <div style={{ textAlign:'right' }}>
 <p style={{ margin:'0 0 2px', fontSize:17, fontWeight:900, color:'#2563EB' }}>{'Rp '+(kasir.revenue||0).toLocaleString('id-ID')}</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>{totalRev > 0 ? Math.round((kasir.revenue/totalRev)*100) : 0}% dari total</p>
 </div>
 </div>
 {/* Revenue bar */}
 <div style={{ height:8, background:'#F3F4F6', borderRadius:8, marginBottom:12, overflow:'hidden' }}>
 <div style={{ height:'100%', width:`${totalRev > 0 ? (kasir.revenue/totalRev)*100 : 0}%`, background:`linear-gradient(90deg,${['#2563EB','#059669','#7C3AED','#D97706','#EF4444'][idx%5]},${['#7C3AED','#2563EB','#EC4899','#EF4444','#D97706'][idx%5]})`, borderRadius:8, transition:'width 0.8s ease' }} />
 </div>
 {/* Methods */}
 <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
 {Object.entries(kasir.methods).map(([method, amount]) => (
 <span key={method} style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#374151' }}>
 {method}: {'Rp '+(amount||0).toLocaleString('id-ID')}
 </span>
 ))}
 </div>
 </div>
 ))}
 </>
 )}
 </div>
 )
 })()}

 {/* SHIFT TAB */}
 {activeTab === 'shift' && (() => {
 const closedShifts = (shifts||[]).filter(s => s.status === 'closed' || s.closedAt || s.endTime).sort((a,b)=>
 new Date(b.closedAt||b.endTime||0) - new Date(a.closedAt||a.endTime||0))
 const [selShift, setSelShift] = useState(null)
 const totalCash = closedShifts.reduce((s,sh)=>s+(sh.cashSales||sh.totalCash||0),0)
 const totalSales = closedShifts.reduce((s,sh)=>s+(sh.totalSales||sh.revenue||0),0)
 const avgPerShift = closedShifts.length>0 ? totalSales/closedShifts.length : 0
 return (
 <div>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
 {[
 { label:'Total Shift', value:closedShifts.length, color:'#2563EB', bg:'#EFF6FF', isNum:true },
 { label:'Total Penjualan', value:formatIDR(totalSales), color:'#22C55E', bg:'#F0FDF4' },
 { label:'Total Kas Masuk', value:formatIDR(totalCash), color:'#F97316', bg:'#FFF7ED' },
 { label:'Rata-rata/Shift', value:formatIDR(Math.round(avgPerShift)), color:'#A855F7', bg:'#F5F3FF' },
 ].map(s=>(
 <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:'14px 16px', border:`1px solid ${s.color}22` }}>
 <p style={{ margin:'0 0 4px', fontSize:11, color:s.color, fontWeight:700, textTransform:'uppercase' }}>{s.label}</p>
 <p style={{ margin:0, fontSize:s.isNum?28:18, fontWeight:900, color:s.color }}>{s.value}</p>
 </div>
 ))}
 </div>

 {closedShifts.length === 0 ? (
 <div style={{ textAlign:'center', padding:'40px 20px', color:'#9CA3AF' }}>
 <p style={{ fontSize:36, margin:'0 0 8px' }}>⏰</p>
 <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#374151' }}>Belum ada riwayat shift</p>
 <p style={{ margin:'4px 0 0', fontSize:12 }}>Laporan shift akan muncul setelah kasir menutup shift</p>
 </div>
 ) : (
 <div style={{ background:'#fff', borderRadius:14, border:'1px solid #F1F5F9', overflow:'hidden' }}>
 <div style={{ padding:'12px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:'#111827' }}>Riwayat Shift ({closedShifts.length})</h3>
 </div>
 {closedShifts.map(sh => {
 const trxCount = sh.transactionCount || (transactions.filter(t=>t.shiftId===sh.id).length)
 const revenue = sh.totalSales || sh.revenue || 0
 const openTime = new Date(sh.openedAt||sh.startTime)
 const closeTime= new Date(sh.closedAt||sh.endTime)
 const duration = Math.round((closeTime-openTime)/60000)
 const selisih = (sh.actualBalance||0) - (sh.expectedBalance||sh.openingBalance||0)
 return (
 <div key={sh.id} style={{ padding:'14px 16px', borderBottom:'1px solid #F9FAFB', cursor:'pointer' }}
 onClick={()=>setSelShift(selShift?.id===sh.id?null:sh)}
 onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'}
 onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <div>
 <p style={{ margin:'0 0 3px', fontSize:13, fontWeight:800, color:'#111827' }}>
 {sh.cashierName||sh.kasirName||'Kasir'} · {openTime.toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}
 </p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>
 {openTime.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})} – {closeTime.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})} · {duration < 60 ? `${duration} mnt` : `${Math.floor(duration/60)}j ${duration%60}m`}
 </p>
 </div>
 <div style={{ textAlign:'right' }}>
 <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:900, color:'#2563EB' }}>{formatIDR(revenue)}</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>{trxCount} transaksi</p>
 </div>
 </div>
 {selShift?.id===sh.id && (
 <div style={{ marginTop:12, background:'#F9FAFB', borderRadius:10, padding:'10px 14px' }}>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
 {[
 ['Modal Awal', formatIDR(sh.openingBalance||0)],
 ['Penjualan', formatIDR(revenue)],
 ['Kas Aktual', formatIDR(sh.actualBalance||0)],
 ['Selisih', (selisih>=0?'+':'')+formatIDR(selisih)],
 ].map(([l,v])=>(
 <div key={l} style={{ background:'#fff', borderRadius:8, padding:'8px 10px' }}>
 <p style={{ margin:'0 0 2px', fontSize:10, color:'#9CA3AF', fontWeight:700 }}>{l}</p>
 <p style={{ margin:0, fontSize:12, fontWeight:800, color: l==='Selisih'?(selisih>=0?'#22C55E':'#EF4444'):'#111827' }}>{v}</p>
 </div>
 ))}
 </div>
 {sh.notes && <p style={{ margin:'8px 0 0', fontSize:11, color:'#6B7280', fontStyle:'italic' }}> {sh.notes}</p>}
 </div>
 )}
 </div>
 )
 })}
 </div>
 )}
 </div>
 )
 })()}

 {/* TRANSAKSI TAB */}
 {activeTab === 'transactions' && (
 <div>
 <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
 <div style={{ position:'relative', flex:1, minWidth:200 }}>
 <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>
 <Icon name="search" size={14} color="#9CA3AF" />
 </span>
 <input value={trxSearch} onChange={e => { setTrxSearch(e.target.value); setTrxPage(1) }}
 placeholder="Cari ID, kasir, member, produk..."
 style={{ width:'100%', padding:'9px 12px 9px 32px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
 </div>
 <button onClick={() => exportToExcel(rangeTransactions, dateRange, settings)}
 style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, border:'none', background:'#166534', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
 Export Excel
 </button>
 </div>
 <p style={{ margin:'0 0 12px', fontSize:12, color:'#9CA3AF' }}>{filteredTrx.length} transaksi ditemukan</p>
 {pagedTrx.map(t => (
 <div key={t.id} onClick={() => openDetail(t)}
 style={{ background:'#fff', border:'1px solid #F1F5F9', borderRadius:12, padding:'12px 14px', marginBottom:8, cursor:'pointer', transition:'all 0.15s' }}
 onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
 onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
 <div style={{ flex:1 }}>
 <span style={{ fontSize:12, fontWeight:800, color:'#111827', fontFamily:'monospace' }}>{t.id}</span>
 {getMemberName(t) && <span style={{ marginLeft:8, fontSize:11, color:'#7C3AED', fontWeight:700 }}> {getMemberName(t)}</span>}
 </div>
 <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
 <p style={{ margin:'0 0 2px', fontSize:15, fontWeight:900, color:'#111827' }}>{'Rp '+(t.total||0).toLocaleString('id-ID')}</p>
 <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:700, background: t.status==='refunded'?'#FEF2F2':t.status==='pending'?'#FFFBEB':'#F0FDF4', color: t.status==='refunded'?'#DC2626':t.status==='pending'?'#D97706':'#166534' }}>
 {STATUS_LABEL[t.status||'completed']}
 </span>
 </div>
 </div>
 <div style={{ display:'flex', gap:8, flexWrap:'wrap', fontSize:11, color:'#9CA3AF' }}>
 <span>{new Date(t.date||t.createdAt).toLocaleDateString('id-ID', { timeZone:'Asia/Jakarta', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
 <span>·</span><span>{t.payment}</span>
 <span>·</span><span>{t.cashier}</span>
 <span>·</span><span>{(t.items||[]).length} item</span>
 </div>
 </div>
 ))}
 {trxPageCount > 1 && (
 <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:16 }}>
 <button onClick={() => setTrxPage(p => Math.max(1, p-1))} disabled={trxPage===1} style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'#fff', cursor:trxPage===1?'not-allowed':'pointer', color:trxPage===1?'#D1D5DB':'#374151', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>← Prev</button>
 <span style={{ padding:'6px 14px', fontSize:12, color:'#6B7280', alignSelf:'center' }}>Halaman {trxPage} / {trxPageCount}</span>
 <button onClick={() => setTrxPage(p => Math.min(trxPageCount, p+1))} disabled={trxPage===trxPageCount} style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'#fff', cursor:trxPage===trxPageCount?'not-allowed':'pointer', color:trxPage===trxPageCount?'#D1D5DB':'#374151', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>Next →</button>
 </div>
 )}
 </div>
 )}
 */}
 <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Detail Transaksi">
 {selected && (
 <div>
 {selected.status === 'refunded' && (
 <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
 <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'#991B1B' }}>Transaksi ini sudah direfund</p>
 <p style={{ margin:0, fontSize:12, color:'#991B1B' }}>Alasan: {selected.refundReason}</p>
 {selected.refundedAt && <p style={{ margin:'2px 0 0', fontSize:11, color:'#EF4444' }}>{formatDate(selected.refundedAt)}</p>}
 </div>
 )}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
 {[
 ['ID Transaksi', selected.id],
 ['Tanggal', formatDate(selected.date||selected.createdAt)],
 ['Kasir', selected.cashier],
 ['Metode Bayar', selected.payment],
 ...(getMemberName(selected) ? [['Member', getMemberName(selected)]] : []),
 ...(selected.note ? [['Catatan', selected.note]] : []),
 ].map(([label, val]) => (
 <div key={label} style={{ background:'#F9FAFB', borderRadius:9, padding:'9px 12px' }}>
 <p style={{ margin:'0 0 2px', fontSize:10, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.4 }}>{label}</p>
 <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#111827', wordBreak:'break-all' }}>{val}</p>
 </div>
 ))}
 </div>
 <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:800, color:'#374151', textTransform:'uppercase', letterSpacing:0.5 }}>Item Dibeli</p>
 <div style={{ background:'#F9FAFB', borderRadius:10, marginBottom:14 }}>
 {(selected.items||[]).map((item, i) => (
 <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 14px', borderBottom: i<(selected.items.length-1)?'1px solid #F1F5F9':'none' }}>
 <div>
 <p style={{ margin:'0 0 1px', fontSize:13, fontWeight:700, color:'#111827' }}>{item.name}</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>{item.qty} × {formatIDR(item.price)}</p>
 </div>
 <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#111827' }}>{formatIDR(item.qty*item.price)}</p>
 </div>
 ))}
 </div>
 <div style={{ background:'#F9FAFB', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
 {[
 ['Subtotal', formatIDR(selected.subtotal)],
 ...(selected.tax > 0 ? [['Pajak', '+'+formatIDR(selected.tax)]] : []),
 ...(selected.discount > 0 ? [['Diskon', '-'+formatIDR(selected.discount)]] : []),
 ...(selected.cashReceived > 0 ? [['Diterima', formatIDR(selected.cashReceived)]] : []),
 ...(selected.changeAmount > 0 ? [['Kembalian', formatIDR(selected.changeAmount)]] : []),
 ].map(([label, val]) => (
 <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
 <span style={{ fontSize:13, color:'#6B7280' }}>{label}</span>
 <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{val}</span>
 </div>
 ))}
 <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', borderTop:'1px solid #E5E7EB', marginTop:6 }}>
 <span style={{ fontSize:15, fontWeight:800, color:'#111827' }}>Total</span>
 <span style={{ fontSize:17, fontWeight:900, color:'#2563EB' }}>{formatIDR(selected.total)}</span>
 </div>
 </div>
 <div style={{ display:'flex', gap:10 }}>
 {selected.status === 'completed' && (
 <Button onClick={openRefund} variant="danger" fullWidth icon="warning" size="sm">Proses Refund</Button>
 )}
 </div>
 </div>
 )}
 </Modal>

 {/* REFUND MODAL */}
 <Modal open={showRefund} onClose={() => !refundConfirm && setShowRefund(false)} title="Proses Refund">
 {selected && (
 <div>
 <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
 <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:700, color:'#991B1B' }}> Konfirmasi Refund</p>
 <p style={{ margin:0, fontSize:12, color:'#DC2626' }}>ID: {selected.id} · {formatIDR(selected.total)}</p>
 </div>
 <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:'#374151' }}>Pilih alasan refund:</p>
 <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
 {REFUND_REASONS.map(r => (
 <label key={r} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background: refundReason===r?'#FEF2F2':'#F9FAFB', border:`1.5px solid ${refundReason===r?'#FECACA':'#E5E7EB'}`, borderRadius:9, cursor:'pointer' }}>
 <input type="radio" name="reason" checked={refundReason===r} onChange={() => setRefundReason(r)} style={{ accentColor:'#EF4444' }} />
 <span style={{ fontSize:13, color:'#374151' }}>{r}</span>
 </label>
 ))}
 </div>
 {refundReason === 'Alasan lainnya' && (
 <textarea value={refundCustom} onChange={e=>setRefundCustom(e.target.value)}
 placeholder="Jelaskan alasan refund..."
 style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', minHeight:80, boxSizing:'border-box', marginBottom:14 }} />
 )}
 <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, cursor:'pointer' }}>
 <input type="checkbox" checked={refundConfirm} onChange={e=>setRefundConfirm(e.target.checked)} style={{ accentColor:'#EF4444', width:16, height:16 }} />
 <span style={{ fontSize:13, color:'#374151' }}>Saya konfirmasi proses refund ini tidak dapat dibatalkan</span>
 </label>
 <Button onClick={doRefund} variant="danger" fullWidth
 disabled={!refundReason || (refundReason==='Alasan lainnya'&&!refundCustom.trim()) || !refundConfirm}>
 ↩ Proses Refund Sekarang
 </Button>
 </div>
 )}
 </Modal>
 </div>
 )
}

export default ReportsPage
