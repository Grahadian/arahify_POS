// ============================================================
// MSME GROW POS - Admin Dashboard v7.0
// ============================================================
import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatRelativeTime } from '@/utils/format'
import Icon from '@/components/ui/Icon'
import { Badge } from '@/components/ui/index.jsx'

const STATUS_COLOR = { completed:'green', refunded:'red', pending:'yellow', cancelled:'gray' }
const STATUS_LABEL = { completed:'Selesai', refunded:'Direfund', pending:'Pending', cancelled:'Batal' }

// Consistent page wrapper
const Page = ({ children }) => (
  <div style={{ padding:'20px', maxWidth:960, margin:'0 auto' }}>{children}</div>
)

const StatCard = ({ label, value, sub, subColor, icon, accent }) => (
  <div style={{
    background:'#fff', borderRadius:14, padding:'16px 18px',
    border:'1px solid #E2E8F0', position:'relative', overflow:'hidden',
  }}>
    <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background:accent, borderRadius:'14px 0 0 14px' }} />
    <div style={{ paddingLeft:4 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ background:accent+'18', borderRadius:10, padding:9, flexShrink:0 }}>
          <Icon name={icon} size={18} color={accent} />
        </div>
      </div>
      <p style={{ margin:'0 0 3px', fontSize:12, color:'#64748B', fontWeight:500 }}>{label}</p>
      <p style={{ margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#0F172A', lineHeight:1.1, letterSpacing:-0.5 }}>{value}</p>
      {sub && <p style={{ margin:0, fontSize:12, color: subColor||'#64748B', fontWeight:600 }}>{sub}</p>}
    </div>
  </div>
)

export default function DashboardPage() {
  const { transactions, products, settings, navigate, members, expenses } = useApp()
  const [alertDismissed, setAlertDismissed] = useState(false)

  const stats = useMemo(() => {
    const today   = new Date().toDateString()
    const todayTrx = transactions.filter(t => new Date(t.date||t.createdAt).toDateString() === today)
    const weekAgo  = Date.now() - 7 * 24 * 3600000
    const weekTrx  = transactions.filter(t => new Date(t.date||t.createdAt).getTime() > weekAgo)
    const prevWeekTrx = transactions.filter(t => { const d = new Date(t.date||t.createdAt).getTime(); return d > weekAgo-7*24*3600000 && d <= weekAgo })
    const done     = transactions.filter(t => !t.status || t.status==='completed')
    const totalRev = done.reduce((s,t)=>s+(t.total||0),0)
    const weekRev  = weekTrx.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0)
    const prevRev  = prevWeekTrx.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0)
    const growth   = prevRev > 0 ? ((weekRev-prevRev)/prevRev*100).toFixed(1) : 0
    const totalHPP = done.reduce((s,t)=>s+(t.items||[]).reduce((ss,i)=>ss+(i.hpp||0)*(i.qty||0),0),0)

    const payBreakdown = ['Cash','Card','QRIS','Transfer','Online']
      .map(p => ({ name:p, count:done.filter(t=>t.payment===p).length, total:done.filter(t=>t.payment===p).reduce((s,t)=>s+(t.total||0),0) }))
      .filter(p => p.count > 0)

    const topProducts = products.map(p => ({
      ...p,
      salesQty: done.reduce((s,t)=>s+(t.items||[]).filter(i=>i.productId===p.id||i.name===p.name).reduce((ss,i)=>ss+(i.qty||0),0),0),
      revenue : done.reduce((s,t)=>s+(t.items||[]).filter(i=>i.productId===p.id||i.name===p.name).reduce((ss,i)=>ss+(i.price||0)*(i.qty||0),0),0),
    })).sort((a,b)=>b.revenue-a.revenue).slice(0,5)
    const maxRev = Math.max(...topProducts.map(p=>p.revenue), 1)

    const LOW = settings?.lowStockThreshold || 5
    const lowStock = products.filter(p=>p.active&&p.stock!=null&&p.stock<=LOW).sort((a,b)=>a.stock-b.stock)
    const outOfStock = lowStock.filter(p=>p.stock===0)
    const activeMembers = members.filter(m=>done.some(t=>t.memberId===m.id))
    const memberRev = done.filter(t=>t.memberId).reduce((s,t)=>s+(t.total||0),0)
    const now = new Date()
    const allExp = expenses||[]
    const weekExp  = allExp.filter(e=>new Date(e.date||e.createdAt).getTime()>weekAgo).reduce((s,e)=>s+(e.amount||0),0)
    const monthExp = allExp.filter(e=>{const d=new Date(e.date||e.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).reduce((s,e)=>s+(e.amount||0),0)

    return {
      totalRev, totalHPP, profit: totalRev - totalHPP,
      todayRev:todayTrx.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0),
      todayOrders:todayTrx.length, totalOrders:transactions.length,
      weekRev, growth, activeProducts:products.filter(p=>p.active).length,
      payBreakdown, topProducts, maxRev,
      lowStock, outOfStock,
      activeMembers, memberRev,
      weekExp, monthExp,
    }
  }, [transactions, products, members, expenses, settings])

  const Row = ({ label, value, bold }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#F8FAFC', borderRadius:9, marginBottom:5 }}>
      <span style={{ fontSize:13, color:'#475569' }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:bold?900:700, color:'#0F172A' }}>{value}</span>
    </div>
  )

  return (
    <Page>
      {/* Alert stok */}
      {!alertDismissed && stats.lowStock.length > 0 && (
        <div style={{ background:'#FFFBEB', border:'1.5px solid #FCD34D', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ background:'#FEF3C7', borderRadius:8, padding:7, flexShrink:0 }}>
            <Icon name="warning" size={16} color="#D97706" />
          </div>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:800, color:'#92400E' }}>
              {stats.outOfStock.length > 0 && `${stats.outOfStock.length} produk habis`}
              {stats.outOfStock.length > 0 && stats.lowStock.length > stats.outOfStock.length && ' · '}
              {stats.lowStock.length > stats.outOfStock.length && `${stats.lowStock.length-stats.outOfStock.length} stok menipis`}
            </p>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {stats.lowStock.slice(0,6).map(p=>(
                <span key={p.id} style={{ fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:700, background:p.stock===0?'#FEE2E2':'#FFEDD5', color:p.stock===0?'#991B1B':'#C2410C', border:`1px solid ${p.stock===0?'#FCA5A5':'#FDBA74'}` }}>
                  {p.name} ({p.stock===0?'Habis':`${p.stock} ${p.unit||'pcs'}`})
                </span>
              ))}
              {stats.lowStock.length > 6 && <span style={{ fontSize:11, color:'#D97706', fontWeight:600 }}>+{stats.lowStock.length-6} lagi</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
            <button onClick={()=>navigate('inventory')} style={{ padding:'6px 12px', background:'#D97706', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Kelola</button>
            <button onClick={()=>setAlertDismissed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:20, padding:0, lineHeight:1, fontWeight:300 }}>×</button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:'0 0 3px', fontSize:20, fontWeight:800, color:'#0F172A', letterSpacing:-0.3 }}>Business Overview</h2>
        <p style={{ margin:0, color:'#64748B', fontSize:13 }}>Ringkasan performa bisnis {settings.businessName || 'Anda'}</p>
      </div>

      {/* Stats — 4 columns */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:12, marginBottom:16 }}>
        <StatCard label="Total Revenue"   value={formatIDR(stats.totalRev)}   sub={`+${stats.growth}% minggu ini`}    subColor={stats.growth>=0?'#16A34A':'#DC2626'} icon="cash"      accent="#3B82F6" />
        <StatCard label="Order Hari Ini"  value={stats.todayOrders}           sub={formatIDR(stats.todayRev)}          subColor="#0284C7"                             icon="orders"    accent="#0EA5E9" />
        <StatCard label="Total Transaksi" value={stats.totalOrders}           sub={`${stats.activeProducts} produk aktif`} subColor="#64748B"                        icon="register"  accent="#8B5CF6" />
        <StatCard label="Est. Laba Kotor" value={formatIDR(stats.profit)}     sub={`HPP ${formatIDR(stats.totalHPP)}`} subColor={stats.profit>=0?'#16A34A':'#DC2626'} icon="profit"   accent="#10B981" />
      </div>

      {/* Member + Expense */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        {/* Member card */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ background:'#DBEAFE', borderRadius:9, padding:8 }}><Icon name="members" size={15} color="#1D4ED8" /></div>
              <span style={{ fontSize:14, fontWeight:800, color:'#0F172A' }}>Member</span>
            </div>
            <button onClick={()=>navigate('members')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#3B82F6', fontWeight:700, fontFamily:'inherit' }}>Lihat semua</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            <div style={{ background:'#EFF6FF', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid #BFDBFE' }}>
              <p style={{ margin:'0 0 2px', fontSize:10, color:'#1D4ED8', fontWeight:700, textTransform:'uppercase' }}>Total</p>
              <p style={{ margin:0, fontSize:22, fontWeight:900, color:'#1D4ED8' }}>{members.length}</p>
            </div>
            <div style={{ background:'#F0FDF4', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid #86EFAC' }}>
              <p style={{ margin:'0 0 2px', fontSize:10, color:'#166534', fontWeight:700, textTransform:'uppercase' }}>Aktif</p>
              <p style={{ margin:0, fontSize:22, fontWeight:900, color:'#166534' }}>{stats.activeMembers.length}</p>
            </div>
          </div>
          <div style={{ background:'#EDE9FE', borderRadius:9, padding:'8px 12px', border:'1px solid #C4B5FD', display:'flex', alignItems:'center', gap:7 }}>
            <Icon name="profit" size={12} color="#7C3AED" />
            <span style={{ fontSize:12, color:'#6D28D9', fontWeight:700 }}>Revenue: {formatIDR(stats.memberRev)}</span>
          </div>
        </div>

        {/* Expense card */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ background:'#FEE2E2', borderRadius:9, padding:8 }}><Icon name="expense" size={15} color="#DC2626" /></div>
              <span style={{ fontSize:14, fontWeight:800, color:'#0F172A' }}>Pengeluaran</span>
            </div>
            <button onClick={()=>navigate('expense')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#3B82F6', fontWeight:700, fontFamily:'inherit' }}>Detail</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            <div style={{ background:'#FEF2F2', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid #FCA5A5' }}>
              <p style={{ margin:'0 0 2px', fontSize:10, color:'#DC2626', fontWeight:700, textTransform:'uppercase' }}>Minggu</p>
              <p style={{ margin:0, fontSize:14, fontWeight:900, color:'#DC2626' }}>{formatIDR(stats.weekExp)}</p>
            </div>
            <div style={{ background:'#FFEDD5', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid #FDBA74' }}>
              <p style={{ margin:'0 0 2px', fontSize:10, color:'#C2410C', fontWeight:700, textTransform:'uppercase' }}>Bulan</p>
              <p style={{ margin:0, fontSize:14, fontWeight:900, color:'#C2410C' }}>{formatIDR(stats.monthExp)}</p>
            </div>
          </div>
          <div style={{ background:'#DCFCE7', borderRadius:9, padding:'8px 12px', border:'1px solid #86EFAC', display:'flex', alignItems:'center', gap:7 }}>
            <Icon name="trending" size={12} color="#166534" />
            <span style={{ fontSize:12, color:'#166534', fontWeight:700 }}>Est. laba: {formatIDR(Math.max(0, stats.totalRev - stats.monthExp))}</span>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      {stats.payBreakdown.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
          <p style={{ margin:'0 0 14px', fontSize:14, fontWeight:800, color:'#0F172A' }}>Breakdown Pembayaran</p>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(stats.payBreakdown.length, 5)}, 1fr)`, gap:10 }}>
            {stats.payBreakdown.map(p=>(
              <div key={p.name} style={{ background:'#F8FAFC', borderRadius:11, padding:'12px 10px', textAlign:'center', border:'1px solid #E2E8F0' }}>
                <div style={{ width:34, height:34, background:'#DBEAFE', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
                  <Icon name={p.name==='Card'?'card':p.name==='QRIS'?'qris':p.name==='Transfer'?'transfer':'cash'} size={16} color="#1D4ED8" />
                </div>
                <p style={{ margin:'0 0 2px', fontSize:11, color:'#475569', fontWeight:600 }}>{p.name}</p>
                <p style={{ margin:'0 0 1px', fontSize:18, fontWeight:900, color:'#0F172A' }}>{p.count}</p>
                <p style={{ margin:0, fontSize:10, color:'#94A3B8' }}>{formatIDR(p.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>Produk Terlaris</p>
          <Badge color="blue">All Time</Badge>
        </div>
        {stats.topProducts.length === 0 ? (
          <p style={{ color:'#94A3B8', fontSize:13, textAlign:'center', padding:'20px 0' }}>Belum ada data penjualan</p>
        ) : stats.topProducts.map((p,i)=>{
          const BAR_COLORS = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444']
          const RANK_STYLES = [
            { bg:'#DBEAFE', color:'#1D4ED8' },
            { bg:'#DCFCE7', color:'#166534' },
            { bg:'#FFEDD5', color:'#C2410C' },
            { bg:'#F1F5F9', color:'#475569' },
            { bg:'#F1F5F9', color:'#475569' },
          ]
          return (
            <div key={p.id||i} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:22, height:22, ...RANK_STYLES[i], borderRadius:6, fontSize:10, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{p.name}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:800, color:'#1D4ED8', flexShrink:0 }}>{formatIDR(p.revenue)}</span>
              </div>
              <div style={{ height:5, background:'#F1F5F9', borderRadius:10, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(p.revenue/stats.maxRev)*100}%`, background:BAR_COLORS[i], borderRadius:10, transition:'width 0.6s ease' }} />
              </div>
              <p style={{ margin:'3px 0 0', fontSize:11, color:'#94A3B8' }}>{p.salesQty} terjual</p>
            </div>
          )
        })}
      </div>

      {/* Recent Transactions */}
      <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:14, padding:'16px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>Transaksi Terbaru</p>
          <button onClick={()=>navigate('reports')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#3B82F6', fontWeight:700, fontFamily:'inherit' }}>Lihat semua</button>
        </div>
        {transactions.length === 0 ? (
          <p style={{ color:'#94A3B8', fontSize:13, textAlign:'center', padding:'20px 0' }}>Belum ada transaksi</p>
        ) : transactions.slice(0,8).map(t=>(
          <div key={t.id} onClick={()=>navigate('reports')} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #F8FAFC', cursor:'pointer', transition:'background 0.1s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, background:t.status==='refunded'?'#FEE2E2':'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name="user" size={15} color={t.status==='refunded'?'#DC2626':'#2563EB'} />
              </div>
              <div>
                <p style={{ margin:'0 0 1px', fontSize:12, fontWeight:800, color:'#0F172A', fontFamily:'monospace' }}>{t.id}</p>
                <p style={{ margin:0, fontSize:11, color:'#94A3B8' }}>{formatRelativeTime(t.date||t.createdAt)} · {t.cashier}{t.memberName?` · ${t.memberName}`:''}</p>
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
            <button onClick={()=>navigate('reports')} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:9, padding:'9px 20px', color:'#3B82F6', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Lihat semua {transactions.length} transaksi
            </button>
          </div>
        )}
      </div>
    </Page>
  )
}
