// ============================================================
// MSME GROW POS - Admin Dashboard (fixed Lihat Semua + recent trx)
// ============================================================
import { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatRelativeTime } from '@/utils/format'
import Icon from '@/components/ui/Icon'
import { Card, Badge } from '@/components/ui/index.jsx'

const STATUS_COLOR = { completed:'green', refunded:'red', pending:'yellow', cancelled:'gray' }
const STATUS_LABEL = { completed:'Selesai', refunded:'Direfund', pending:'Pending', cancelled:'Batal' }

const DashboardPage = () => {
  const { transactions, products, settings, navigate } = useApp()

  const stats = useMemo(() => {
    const today    = new Date().toDateString()
    const todayTrx = transactions.filter(t => new Date(t.date||t.createdAt).toDateString() === today)
    const weekAgo  = Date.now() - 7 * 24 * 3600000
    const weekTrx  = transactions.filter(t => new Date(t.date||t.createdAt).getTime() > weekAgo)
    const prevWeekTrx = transactions.filter(t => {
      const d = new Date(t.date||t.createdAt).getTime()
      return d > weekAgo - 7*24*3600000 && d <= weekAgo
    })
    const completedAll  = transactions.filter(t => !t.status || t.status === 'completed')
    const totalRevenue  = completedAll.reduce((s,t) => s+(t.total||0), 0)
    const weekRevenue   = weekTrx.filter(t => !t.status||t.status==='completed').reduce((s,t) => s+(t.total||0), 0)
    const prevWeekRev   = prevWeekTrx.filter(t => !t.status||t.status==='completed').reduce((s,t) => s+(t.total||0), 0)
    const weekGrowth    = prevWeekRev > 0 ? ((weekRevenue-prevWeekRev)/prevWeekRev*100).toFixed(1) : 0

    const paymentBreakdown = ['Cash','Card','QRIS','Transfer'].map(p => ({
      name : p,
      count: completedAll.filter(t => t.payment === p).length,
      total: completedAll.filter(t => t.payment === p).reduce((s,t) => s+(t.total||0), 0),
    }))

    const topProducts = products.map(p => ({
      ...p,
      salesQty: completedAll.reduce((s,t) => s+(t.items||[]).filter(i => i.productId===p.id||i.name===p.name).reduce((ss,i) => ss+(i.qty||0),0), 0),
      revenue : completedAll.reduce((s,t) => s+(t.items||[]).filter(i => i.productId===p.id||i.name===p.name).reduce((ss,i) => ss+(i.price||0)*(i.qty||0),0), 0),
    })).sort((a,b) => b.revenue-a.revenue).slice(0,5)

    const maxRevenue = Math.max(...topProducts.map(p => p.revenue), 1)

    return {
      totalRevenue,
      todayRevenue : todayTrx.filter(t => !t.status||t.status==='completed').reduce((s,t) => s+(t.total||0), 0),
      todayOrders  : todayTrx.length,
      totalOrders  : transactions.length,
      weekRevenue, weekGrowth,
      activeProducts: products.filter(p => p.active).length,
      paymentBreakdown, topProducts, maxRevenue,
    }
  }, [transactions, products])

  return (
    <div style={{ padding:'16px 20px', maxWidth:960, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:18 }}>
        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#111827' }}>Business Overview</h2>
        <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>Ringkasan performa bisnis {settings.businessName || 'Anda'}</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { label:'Total Revenue',    value:formatIDR(stats.totalRevenue), sub:`↑ +${stats.weekGrowth}% minggu ini`,         subColor:'#22C55E', icon:'cash',      iconBg:'#EFF6FF' },
          { label:'Orders Hari Ini',  value:stats.todayOrders,            sub:`${formatIDR(stats.todayRevenue)} hari ini`,   subColor:'#2563EB', icon:'orders',    iconBg:'#F0FDF4' },
          { label:'Total Transaksi',  value:stats.totalOrders,            sub:`${stats.weekRevenue>0?formatIDR(stats.weekRevenue)+' minggu ini':'Belum ada'}`, subColor:'#6B7280', icon:'register',  iconBg:'#FFF7ED' },
          { label:'Produk Aktif',     value:stats.activeProducts,         sub:`${products.length} total produk`,             subColor:'#6B7280', icon:'inventory', iconBg:'#F5F3FF' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:16, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #F1F5F9' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div style={{ flex:1 }}>
                <p style={{ margin:'0 0 4px', fontSize:12, color:'#6B7280', fontWeight:500 }}>{s.label}</p>
                <p style={{ margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#111827', lineHeight:1.2 }}>{s.value}</p>
                <p style={{ margin:0, fontSize:12, color:s.subColor, fontWeight:600 }}>{s.sub}</p>
              </div>
              <div style={{ background:s.iconBg, borderRadius:12, padding:10, flexShrink:0, marginLeft:8 }}>
                <Icon name={s.icon} size={20} color="#2563EB" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Breakdown */}
      <Card style={{ marginBottom:14 }}>
        <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800, color:'#111827' }}>Breakdown Pembayaran</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:10 }}>
          {stats.paymentBreakdown.map(p => (
            <div key={p.name} style={{ background:'#F9FAFB', borderRadius:12, padding:'12px 10px', textAlign:'center' }}>
              <div style={{ width:38, height:38, background:'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 7px' }}>
                <Icon name={p.name==='Card'?'card':p.name==='QRIS'?'qris':'cash'} size={17} color="#2563EB" />
              </div>
              <p style={{ margin:'0 0 2px', fontSize:11, color:'#9CA3AF', fontWeight:600 }}>{p.name}</p>
              <p style={{ margin:'0 0 1px', fontSize:17, fontWeight:900, color:'#111827' }}>{p.count}</p>
              <p style={{ margin:0, fontSize:10, color:'#6B7280' }}>{formatIDR(p.total)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Products */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#111827' }}>Top Produk & Layanan</h3>
          <Badge color="blue">All Time</Badge>
        </div>
        {stats.topProducts.length === 0 ? (
          <p style={{ color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'20px 0' }}>Belum ada data penjualan.</p>
        ) : stats.topProducts.map((p, i) => {
          const colors = ['#2563EB','#22C55E','#F97316','#A855F7','#EC4899']
          return (
            <div key={p.id||i} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:22, height:22, background:i<3?['#FFF7ED','#F0FDF4','#EFF6FF'][i]:'#F3F4F6', borderRadius:6, fontSize:11, fontWeight:900, color:i<3?['#C2410C','#166534','#1D4ED8'][i]:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{p.name}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:800, color:'#2563EB', flexShrink:0 }}>{formatIDR(p.revenue)}</span>
              </div>
              <div style={{ height:6, background:'#F3F4F6', borderRadius:10, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(p.revenue/stats.maxRevenue)*100}%`, background:colors[i]||'#6B7280', borderRadius:10, transition:'width 0.8s ease' }} />
              </div>
              <p style={{ margin:'3px 0 0', fontSize:11, color:'#9CA3AF' }}>{p.salesQty} terjual</p>
            </div>
          )
        })}
      </Card>

      {/* Recent Transactions — semua, dengan "Lihat Semua" ke orders */}
      <Card>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#111827' }}>Transaksi Terbaru</h3>
          <span onClick={() => navigate('orders')} style={{ fontSize:13, color:'#2563EB', fontWeight:700, cursor:'pointer' }}>
            Lihat Semua →
          </span>
        </div>

        {transactions.length === 0 ? (
          <p style={{ color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'20px 0' }}>Belum ada transaksi.</p>
        ) : transactions.slice(0, 8).map(t => (
          <div key={t.id} onClick={() => navigate('orders')} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'11px 0', borderBottom:'1px solid #F9FAFB', cursor:'pointer',
            transition:'background 0.1s',
          }}
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
                  {t.memberName ? ` · 👤 ${t.memberName}` : ''}
                </p>
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:900, color: t.status==='refunded'?'#9CA3AF':'#111827', textDecoration: t.status==='refunded'?'line-through':'none' }}>
                +{formatIDR(t.total||0)}
              </p>
              <Badge color={STATUS_COLOR[t.status]||'green'}>{STATUS_LABEL[t.status]||'Selesai'}</Badge>
            </div>
          </div>
        ))}

        {transactions.length > 8 && (
          <div style={{ textAlign:'center', paddingTop:12 }}>
            <button onClick={() => navigate('orders')} style={{ background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:10, padding:'9px 20px', color:'#2563EB', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Lihat Semua {transactions.length} Transaksi
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default DashboardPage
