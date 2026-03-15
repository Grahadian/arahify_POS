// ============================================================
// MSME GROW POS - Kasir Orders Page
// - Hanya transaksi HARI INI (timezone WIB)
// - Reset otomatis jam 00:00 WIB
// - Jam real-time redesign
// - Card kanan = Total Transaksi Hari Ini
// - Tidak ada hak refund
// ============================================================
import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatDate } from '@/utils/format'
import Icon from '@/components/ui/Icon'
import Modal from '@/components/ui/Modal'

const STATUS_LABEL = { completed:'Selesai', refunded:'Direfund', pending:'Pending', cancelled:'Batal' }
const PAY_ICON = { Cash:'', Card:'', QRIS:'', Transfer:'', Online:'' }

export default function KasirOrdersPage() {
 const { transactions, user, members } = useApp()

 // Live clock (update tiap detik) 
 const [now, setNow] = useState(new Date())
 useEffect(() => {
 const t = setInterval(() => setNow(new Date()), 1000)
 return () => clearInterval(t)
 }, [])

 // Tanggal hari ini dalam WIB 
 // toLocaleDateString('sv') → format YYYY-MM-DD
 const todayWIB = now.toLocaleDateString('sv', { timeZone: 'Asia/Jakarta' })

 // Filter hanya transaksi hari ini (WIB) 
 const todayTrx = transactions.filter(t => {
 const raw = t.date || t.createdAt || ''
 if (!raw) return false
 const trxDate = new Date(raw).toLocaleDateString('sv', { timeZone: 'Asia/Jakarta' })
 return trxDate === todayWIB
 })

 // Stats 
 const completedToday = todayTrx.filter(t => !t.status || t.status === 'completed')
 const totalPenjualan = completedToday.reduce((s, t) => s + (t.total || 0), 0)
 const totalTrxHariIni = todayTrx.length // semua status

 // Format jam digital WIB 
 const jamFull = now.toLocaleTimeString('id-ID', {
 timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
 })
 const [hh, mm, ss] = jamFull.split(':')

 const tanggalStr = now.toLocaleDateString('id-ID', {
 timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
 })

 // Search 
 const [search, setSearch] = useState('')
 const filtered = todayTrx.filter(t => {
 if (!search) return true
 const q = search.toLowerCase()
 return (t.id || '').toLowerCase().includes(q) ||
 (t.cashier || '').toLowerCase().includes(q) ||
 (t.items || []).some(i => i.name.toLowerCase().includes(q))
 })

 // Detail modal 
 const [selected, setSelected] = useState(null)
 const [showDetail, setShowDetail] = useState(false)
 const openDetail = (t) => { setSelected(t); setShowDetail(true) }

 const getMemberName = (t) => {
 if (t.memberName) return t.memberName
 if (t.memberId) { const m = members?.find(m => m.id === t.memberId); return m?.name || null }
 return null
 }

 return (
 <div style={{ padding: '12px 14px', margin: '0 auto' }}>

 {/* Header */}
 <div style={{ marginBottom: 18 }}>
 <h2 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800, color: '#111827' }}>Laporan Hari Ini</h2>
 <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>{tanggalStr}</p>
 </div>

  {/* Jam Digital */}
  <div style={{
    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
    borderRadius: 16, padding: '14px 16px', marginBottom: 16,
    boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
  }}>
    <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: 1 }}>Jam Sekarang (WIB)</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '5px 13px' }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>{hh}</span>
      </div>
      <span style={{ fontSize: 28, fontWeight: 900, color: '#60A5FA', fontFamily: 'monospace', animation: 'clkBlink 1s step-end infinite' }}>:</span>
      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '5px 13px' }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>{mm}</span>
      </div>
      <span style={{ fontSize: 28, fontWeight: 900, color: '#60A5FA', fontFamily: 'monospace', animation: 'clkBlink 1s step-end infinite' }}>:</span>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '5px 11px' }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: '#BAE6FD', fontFamily: 'monospace', lineHeight: 1 }}>{ss}</span>
      </div>
    </div>
    <style>{`@keyframes clkBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
  </div>

 {/* Stats Cards */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 18 }}>
 <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '12px 14px', border: '1px solid #BFDBFE' }}>
 <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5 }}> Total Penjualan Hari Ini</p>
 <p style={{ margin: '0 0 3px', fontSize: 24, fontWeight: 900, color: '#1D4ED8', lineHeight: 1.1 }}>{formatIDR(totalPenjualan)}</p>
 <p style={{ margin: 0, fontSize: 12, color: '#3B82F6' }}>{completedToday.length} transaksi selesai</p>
 </div>
 <div style={{ background: '#F0FDF4', borderRadius: 14, padding: '12px 14px', border: '1px solid #BBF7D0' }}>
 <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5 }}> Total Transaksi Hari Ini</p>
 <p style={{ margin: '0 0 3px', fontSize: 24, fontWeight: 900, color: '#047857', lineHeight: 1.1 }}>{totalTrxHariIni}</p>
 <p style={{ margin: 0, fontSize: 12, color: '#10B981' }}>semua status transaksi</p>
 </div>
 </div>

 {/* Info reset */}
 <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
 <span>⏰</span>
 <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
 Hanya menampilkan transaksi <strong>hari ini</strong>. Data otomatis reset setiap hari jam <strong>00:00 WIB</strong>.
 </p>
 </div>

 {/* Search */}
 <div style={{ position: 'relative', marginBottom: 16 }}>
 <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
 <Icon name="search" size={16} color="#9CA3AF" />
 </div>
 <input value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Cari ID transaksi, kasir, atau produk..."
 style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
 </div>

 {/* Transaction List */}
 {filtered.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
 <p style={{ fontSize: 40, margin: '0 0 8px' }}></p>
 <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#374151' }}>
 {search ? 'Tidak ada hasil' : 'Belum ada transaksi hari ini'}
 </p>
 <p style={{ margin: 0, fontSize: 13 }}>
 {search ? 'Coba kata kunci lain' : 'Transaksi yang dibuat hari ini akan muncul di sini'}
 </p>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {filtered.map(t => {
 const ok = !t.status || t.status === 'completed'
 const ref = t.status === 'refunded'
 return (
 <div key={t.id} onClick={() => openDetail(t)}
 style={{ background: '#fff', borderRadius: 12, padding: '13px 16px', border: '1px solid #F1F5F9', cursor: 'pointer', borderLeft: `4px solid ${ref ? '#EF4444' : ok ? '#22C55E' : '#E5E7EB'}`, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'background 0.12s' }}
 onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
 onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
 <div style={{ fontSize: 22, flexShrink: 0 }}>{PAY_ICON[t.payment] || ''}</div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
 <span style={{ fontSize: 12, fontWeight: 800, color: '#374151', fontFamily: 'monospace' }}>{t.id}</span>
 <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: ref ? '#FEF2F2' : ok ? '#F0FDF4' : '#FFF7ED', color: ref ? '#EF4444' : ok ? '#22C55E' : '#F59E0B' }}>
 {STATUS_LABEL[t.status || 'completed']}
 </span>
 </div>
 <p style={{ margin: 0, fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 {(t.items || []).slice(0, 2).map(i => i.name).join(', ')}{(t.items || []).length > 2 ? ' ...' : ''}
 </p>
 <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
 {new Date(t.date || t.createdAt || '').toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} {t.cashier}
 </p>
 </div>
 <div style={{ textAlign: 'right', flexShrink: 0 }}>
 <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 900, color: ref ? '#9CA3AF' : '#111827', textDecoration: ref ? 'line-through' : 'none' }}>{formatIDR(t.total)}</p>
 <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{t.payment}</p>
 </div>
 </div>
 )
 })}
 </div>
 )}

 {/* Detail Modal (tanpa tombol refund) */}
 <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Detail Transaksi">
 {selected && (
 <div>
 {selected.status === 'refunded' && (
 <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
 <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Transaksi ini sudah direfund</p>
 <p style={{ margin: 0, fontSize: 12, color: '#991B1B' }}>Alasan: {selected.refundReason}</p>
 </div>
 )}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
 {[
 ['ID Transaksi', selected.id],
 ['Tanggal', formatDate(selected.date || selected.createdAt)],
 ['Kasir', selected.cashier],
 ['Metode Bayar', selected.payment],
 ...(getMemberName(selected) ? [['Member', getMemberName(selected)]] : []),
 ...(selected.note ? [['Catatan', selected.note]] : []),
 ].map(([label, val]) => (
 <div key={label} style={{ background: '#F9FAFB', borderRadius: 9, padding: '9px 12px' }}>
 <p style={{ margin: '0 0 2px', fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</p>
 <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', wordBreak: 'break-all' }}>{val}</p>
 </div>
 ))}
 </div>
 <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Item Dibeli</p>
 <div style={{ background: '#F9FAFB', borderRadius: 10, marginBottom: 14 }}>
 {(selected.items || []).map((item, i) => (
 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: i < selected.items.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
 <div>
 <p style={{ margin: '0 0 1px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.name}</p>
 <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{item.qty} × {formatIDR(item.price)}</p>
 </div>
 <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111827' }}>{formatIDR(item.qty * item.price)}</p>
 </div>
 ))}
 </div>
 <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
 {[
 ['Subtotal', formatIDR(selected.subtotal)],
 ...(selected.tax > 0 ? [['Pajak', '+' + formatIDR(selected.tax)]] : []),
 ...(selected.discount > 0 ? [['Diskon', '-' + formatIDR(selected.discount)]] : []),
 ...(selected.cashReceived > 0 ? [['Diterima', formatIDR(selected.cashReceived)]] : []),
 ...(selected.changeAmount > 0 ? [['Kembalian', formatIDR(selected.changeAmount)]] : []),
 ].map(([label, val]) => (
 <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
 <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
 <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{val}</span>
 </div>
 ))}
 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '1px solid #E5E7EB', marginTop: 6 }}>
 <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Total</span>
 <span style={{ fontSize: 17, fontWeight: 900, color: '#2563EB' }}>{formatIDR(selected.total)}</span>
 </div>
 </div>
 <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '10px 14px' }}>
 <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
 ℹ Refund hanya bisa dilakukan oleh Admin. Hubungi Admin jika ada transaksi yang perlu direfund.
 </p>
 </div>
 </div>
 )}
 </Modal>
 </div>
 )
}
