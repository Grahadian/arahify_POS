// ============================================================
// MSME GROW POS - Admin Dashboard v6.0 — Professional, no emoji
// ============================================================
import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatRelativeTime } from '@/utils/format'
import Icon from '@/components/ui/Icon'
import { Card, Badge } from '@/components/ui/index.jsx'

const STATUS_COLOR = { completed:'green', refunded:'red', pending:'yellow', cancelled:'gray' }
const STATUS_LABEL = { completed:'Selesai', refunded:'Direfund', pending:'Pending', cancelled:'Batal' }

const DashboardPage = () => {
 const { transactions, products, settings, navigate, members, expenses } = useApp()
 const [alertDismissed, setAlertDismissed] = useState(false)

 const stats = useMemo(() => {
 const today = new Date().toDateString()
 const todayTrx = transactions.filter(t => new Date(t.date||t.createdAt).toDateString() === today)
 const weekAgo = Date.now() - 7 * 24 * 3600000
 const weekTrx = transactions.filter(t => new Date(t.date||t.createdAt).getTime() > weekAgo)
 const prevWeekTrx = transactions.filter(t => { const d = new Date(t.date||t.createdAt).getTime(); return d > weekAgo - 7*24*3600000 && d <= weekAgo })
 const completedAll = transactions.filter(t => !t.status || t.status === 'completed')
 const totalRevenue = completedAll.reduce((s,t) => s+(t.total||0), 0)
 const weekRevenue = weekTrx.filter(t => !t.status||t.status==='completed').reduce((s,t) => s+(t.total||0), 0)
 const prevWeekRev = prevWeekTrx.filter(t => !t.status||t.status==='completed').reduce((s,t) => s+(t.total||0), 0)
 const weekGrowth = prevWeekRev > 0 ? ((weekRevenue-prevWeekRev)/prevWeekRev*100).toFixed(1) : 0

 const paymentBreakdown = ['Cash','Card','QRIS','Transfer','Online'].map(p => ({
 name:p, count:completedAll.filter(t=>t.payment===p).length,
 total:completedAll.filter(t=>t.payment===p).reduce((s,t)=>s+(t.total||0),0)
 })).filter(p => p.count > 0)

 const topProducts = products.map(p => ({
 ...p,
 salesQty: completedAll.reduce((s,t) => s+(t.items||[]).filter(i=>i.productId===p.id||i.name===p.name).reduce((ss,i)=>ss+(i.qty||0),0), 0),
 revenue : completedAll.reduce((s,t) => s+(t.items||[]).filter(i=>i.productId===p.id||i.name===p.name).reduce((ss,i)=>ss+(i.price||0)*(i.qty||0),0), 0),
 })).sort((a,b) => b.revenue-a.revenue).slice(0,5)
 const maxRevenue = Math.max(...topProducts.map(p=>p.revenue), 1)

 const LOW = settings?.lowStockThreshold || 5
 const lowStockProducts = products.filter(p => p.active && p.stock != null && p.stock <= LOW).sort((a,b)=>a.stock-b.stock)
 const outOfStock = lowStockProducts.filter(p => p.stock === 0)

 const activeMembers = members.filter(m => completedAll.some(t=>t.memberId===m.id))
 const totalMemberRevenue = completedAll.filter(t=>t.memberId).reduce((s,t)=>s+(t.total||0),0)

 const allExp = expenses || []
 const now = new Date()
 const weekExpTotal = allExp.filter(e=>new Date(e.date||e.createdAt).getTime()>weekAgo).reduce((s,e)=>s+(e.amount||0),0)
 const monthExpTotal = allExp.filter(e=>{const d=new Date(e.date||e.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).reduce((s,e)=>s+(e.amount||0),0)
 const totalHPP = completedAll.reduce((s,t)=>s+(t.items||[]).reduce((ss,i)=>ss+(i.hpp||0)*(i.qty||0),0),0)
 const estimatedProfit = totalRevenue - totalHPP

 return {
 totalRevenue, totalHPP, estimatedProfit,
 todayRevenue:todayTrx.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0),
 todayOrders:todayTrx.length, totalOrders:transactions.length,
 weekRevenue, weekGrowth, activeProducts:products.filter(p=>p.active).length,
 paymentBreakdown, topProducts, maxRevenue,
 lowStockProducts, outOfStock,
 activeMembers, totalMemberRevenue,
 weekExpTotal, monthExpTotal, allExp,
 }
 }, [transactions, products, members, expenses, settings])

 const Stat = ({ label, value, sub, subColor, icon, iconColor = '#2563EB', iconBg = '#EFF6FF' }) => (
 <div style={{ background:'#fff', borderRadius:14, padding:16, border:'1px solid #F1F5F9', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
 <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
 <div style={{ flex:1 }}>
 <p style={{ margin:'0 0 4px', fontSize:12, color:'#64748B', fontWeight:500 }}>{label}</p>
 <p style={{ margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#0F172A', lineHeight:1.2 }}>{value}</p>
 {sub && <p style={{ margin:0, fontSize:12, color: subColor || '#64748B', fontWeight:600 }}>{sub}</p>}
 </div>
 <div style={{ background:iconBg, borderRadius:10, padding:10, flexShrink:0, marginLeft:8 }}>
 <Icon name={icon} size={19} color={iconColor} />
 </div>
 </div>
 </div>
 )

 return (
 <div style={{ padding:'16px 20px', maxWidth:960, margin:'0 auto' }}>

 {/* Low Stock Alert */}
 {!alertDismissed && stats.lowStockProducts.length > 0 && (
 <div style={{ background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:12, alignItems:'flex-start' }}>
 <div style={{ background:'#FEF3C7', borderRadius:8, padding:6, flexShrink:0 }}>
 <Icon name="warning" size={16} color="#D97706" />
 </div>
 <div style={{ flex:1 }}>
 <p style={{ margin:'0 0 5px', fontSize:13, fontWeight:800, color:'#92400E' }}>
 {stats.outOfStock.length > 0 && `${stats.outOfStock.length} produk habis`}
 {stats.outOfStock.length > 0 && (stats.lowStockProducts.length - stats.outOfStock.length) > 0 && ' · '}
 {(stats.lowStockProducts.length - stats.outOfStock.length) > 0 && `${stats.lowStockProducts.length - stats.outOfStock.length} stok menipis`}
 </p>
 <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
 {stats.lowStockProducts.slice(0,6).map(p => (
 <span key={p.id} style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:700, background:p.stock===0?'#FEF2F2':'#FFF7ED', color:p.stock===0?'#991B1B':'#92400E', border:`1px solid ${p.stock===0?'#FECACA':'#FDE68A'}` }}>
 {p.name} ({p.stock===0?'Habis':`${p.stock} ${p.unit||'pcs'}`})
 </span>
 ))}
 {stats.lowStockProducts.length > 6 && <span style={{ fontSize:11, color:'#D97706' }}>+{stats.lowStockProducts.length-6} lagi</span>}
 </div>
 </div>
 <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
 <button onClick={()=>navigate('inventory')} style={{ padding:'6px 12px', background:'#D97706', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
 Kelola Stok
 </button>
 <button onClick={()=>setAlertDismissed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:18, padding:0, lineHeight:1 }}>×</button>
 </div>
 </div>
 )}

 {/* Header */}
 <div style={{ marginBottom:18 }}>
 <h2 style={{ margin:'0 0 3px', fontSize:20, fontWeight:800, color:'#0F172A' }}>Business Overview</h2>
 <p style={{ margin:0, color:'#64748B', fontSize:13 }}>Ringkasan performa bisnis {settings.businessName || 'Anda'}</p>
 </div>

 {/* Stats Grid */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:16 }}>
 <Stat label="Total Revenue" value={formatIDR(stats.totalRevenue)} sub={`+${stats.weekGrowth}% minggu ini`} subColor="#22C55E" icon="cash" iconBg="#EFF6FF" />
 <Stat label="Order Hari Ini" value={stats.todayOrders} sub={formatIDR(stats.todayRevenue)} subColor="#2563EB" icon="orders" iconBg="#F0FDF4" iconColor="#059669" />
 <Stat label="Total Transaksi" value={stats.totalOrders} sub={`${stats.activeProducts} produk aktif`} subColor="#64748B" icon="register" iconBg="#FFF7ED" iconColor="#D97706" />
 <Stat label="Est. Laba Kotor" value={formatIDR(stats.estimatedProfit)} sub={`HPP ${formatIDR(stats.totalHPP)}`} subColor={stats.estimatedProfit >= 0 ? '#059669' : '#EF4444'} icon="profit" iconBg="#F5F3FF" iconColor="#7C3AED" />
 </div>

 {/* Member + Pengeluaran */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
 <Card style={{ padding:16 }}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
 <div style={{ background:'#EFF6FF', borderRadius:8, padding:6 }}><Icon name="members" size={15} color="#2563EB" /></div>
 <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>Member</h3>
 </div>
 <button onClick={()=>navigate('members')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#2563EB', fontWeight:700, fontFamily:'inherit' }}>Lihat Semua</button>
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
 {[{label:'Total',value:members.length,color:'#2563EB',bg:'#EFF6FF'},{label:'Aktif',value:stats.activeMembers.length,color:'#059669',bg:'#F0FDF4'}].map(s=>(
 <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
 <p style={{ margin:'0 0 2px', fontSize:10, color:s.color, fontWeight:700, textTransform:'uppercase' }}>{s.label}</p>
 <p style={{ margin:0, fontSize:20, fontWeight:900, color:s.color }}>{s.value}</p>
 </div>
 ))}
 </div>
 <div style={{ padding:'8px 12px', background:'#F5F3FF', borderRadius:10, display:'flex', alignItems:'center', gap:6 }}>
 <Icon name="profit" size={12} color="#7C3AED" />
 <p style={{ margin:0, fontSize:11, color:'#6D28D9', fontWeight:700 }}>Revenue member: {formatIDR(stats.totalMemberRevenue)}</p>
 </div>
 </Card>

 <Card style={{ padding:16 }}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
 <div style={{ background:'#FEF2F2', borderRadius:8, padding:6 }}><Icon name="expense" size={15} color="#EF4444" /></div>
 <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>Pengeluaran</h3>
 </div>
 <button onClick={()=>navigate('expense')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#2563EB', fontWeight:700, fontFamily:'inherit' }}>Detail</button>
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
 {[{label:'Minggu Ini',value:formatIDR(stats.weekExpTotal),color:'#EF4444',bg:'#FEF2F2'},{label:'Bulan Ini',value:formatIDR(stats.monthExpTotal),color:'#F97316',bg:'#FFF7ED'}].map(s=>(
 <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
 <p style={{ margin:'0 0 2px', fontSize:10, color:s.color, fontWeight:700, textTransform:'uppercase' }}>{s.label}</p>
 <p style={{ margin:0, fontSize:13, fontWeight:900, color:s.color }}>{s.value}</p>
 </div>
 ))}
 </div>
 <div style={{ padding:'8px 12px', background:'#F0FDF4', borderRadius:10, display:'flex', alignItems:'center', gap:6 }}>
 <Icon name="trending" size={12} color="#059669" />
 <p style={{ margin:0, fontSize:11, color:'#166534', fontWeight:700 }}>Est. laba bulan ini: {formatIDR(Math.max(0, stats.totalRevenue - stats.monthExpTotal))}</p>
 </div>
 </Card>
 </div>

 {/* Payment Breakdown */}
 {stats.paymentBreakdown.length > 0 && (
 <Card style={{ marginBottom:14 }}>
 <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800, color:'#0F172A' }}>Breakdown Pembayaran</h3>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:10 }}>
 {stats.paymentBreakdown.map(p => (
 <div key={p.name} style={{ background:'#F9FAFB', borderRadius:12, padding:'12px 10px', textAlign:'center', border:'1px solid #F1F5F9' }}>
 <div style={{ width:36, height:36, background:'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 7px' }}>
 <Icon name={p.name==='Card'?'card':p.name==='QRIS'?'qris':'cash'} size={16} color="#2563EB" />
 </div>
 <p style={{ margin:'0 0 2px', fontSize:11, color:'#64748B', fontWeight:600 }}>{p.name}</p>
 <p style={{ margin:'0 0 1px', fontSize:17, fontWeight:900, color:'#0F172A' }}>{p.count}</p>
 <p style={{ margin:0, fontSize:10, color:'#94A3B8' }}>{formatIDR(p.total)}</p>
 </div>
 ))}
 </div>
 </Card>
 )}

 {/* Top Products */}
 <Card style={{ marginBottom:14 }}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
 <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>Produk Terlaris</h3>
 <Badge color="blue">All Time</Badge>
 </div>
 {stats.topProducts.length === 0 ? (
 <div style={{ textAlign:'center', padding:'24px 0' }}>
 <Icon name="inventory" size={28} color="#CBD5E1" />
 <p style={{ color:'#94A3B8', fontSize:13, marginTop:8 }}>Belum ada data penjualan</p>
 </div>
 ) : stats.topProducts.map((p, i) => {
 const colors = ['#2563EB','#059669','#F97316','#7C3AED','#EC4899']
 return (
 <div key={p.id||i} style={{ marginBottom:12 }}>
 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
 <span style={{ width:22, height:22, background:i<3?['#FFF7ED','#F0FDF4','#EFF6FF'][i]:'#F3F4F6', borderRadius:6, fontSize:11, fontWeight:900, color:i<3?['#C2410C','#166534','#1D4ED8'][i]:'#64748B', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
 <span style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{p.name}</span>
 </div>
 <span style={{ fontSize:13, fontWeight:800, color:'#2563EB', flexShrink:0 }}>{formatIDR(p.revenue)}</span>
 </div>
 <div style={{ height:5, background:'#F1F5F9', borderRadius:10, overflow:'hidden' }}>
 <div style={{ height:'100%', width:`${(p.revenue/stats.maxRevenue)*100}%`, background:colors[i]||'#94A3B8', borderRadius:10, transition:'width 0.5s' }} />
 </div>
 <p style={{ margin:'3px 0 0', fontSize:11, color:'#94A3B8' }}>{p.salesQty} terjual</p>
 </div>
 )
 })}
 </Card>

 {/* Recent Transactions */}
 <Card>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
 <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>Transaksi Terbaru</h3>
 <button onClick={() => navigate('reports')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#2563EB', fontWeight:700, fontFamily:'inherit' }}>Lihat Semua</button>
 </div>
 {transactions.length === 0 ? (
 <div style={{ textAlign:'center', padding:'24px 0' }}>
 <Icon name="orders" size={28} color="#CBD5E1" />
 <p style={{ color:'#94A3B8', fontSize:13, marginTop:8 }}>Belum ada transaksi</p>
 </div>
 ) : transactions.slice(0, 8).map(t => (
 <div key={t.id} onClick={() => navigate('reports')} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #F8FAFC', cursor:'pointer' }}
 onMouseEnter={e => e.currentTarget.style.background='#F9FAFB'}
 onMouseLeave={e => e.currentTarget.style.background='transparent'}>
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <div style={{ width:36, height:36, background:t.status==='refunded'?'#FEF2F2':'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <Icon name="user" size={15} color={t.status==='refunded'?'#EF4444':'#2563EB'} />
 </div>
 <div>
 <p style={{ margin:'0 0 1px', fontSize:12, fontWeight:800, color:'#0F172A', fontFamily:'monospace' }}>{t.id}</p>
 <p style={{ margin:0, fontSize:11, color:'#94A3B8' }}>{formatRelativeTime(t.date||t.createdAt)} · {t.cashier}{t.memberName ? ` · ${t.memberName}` : ''}</p>
 </div>
 </div>
 <div style={{ textAlign:'right', flexShrink:0 }}>
 <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:900, color:t.status==='refunded'?'#94A3B8':'#0F172A', textDecoration:t.status==='refunded'?'line-through':'none' }}>{formatIDR(t.total||0)}</p>
 <Badge color={STATUS_COLOR[t.status]||'green'}>{STATUS_LABEL[t.status]||'Selesai'}</Badge>
 </div>
 </div>
 ))}
 {transactions.length > 8 && (
 <div style={{ textAlign:'center', paddingTop:12 }}>
 <button onClick={() => navigate('reports')} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10, padding:'9px 20px', color:'#2563EB', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
 Lihat Semua {transactions.length} Transaksi
 </button>
 </div>
 )}
 </Card>
 </div>
 )
}

export default DashboardPage
