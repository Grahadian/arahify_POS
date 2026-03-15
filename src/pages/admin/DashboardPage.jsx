// ============================================================
// MSME GROW POS - Admin Dashboard v9.0
// GoSquared-inspired 3-panel layout
// ============================================================
import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatRelativeTime } from '@/utils/format'
import Icon from '@/components/ui/Icon'
import { Badge } from '@/components/ui/index.jsx'

const STATUS_COLOR = { completed:'green', refunded:'red', pending:'yellow', cancelled:'gray' }
const STATUS_LABEL = { completed:'Selesai', refunded:'Direfund', pending:'Pending', cancelled:'Batal' }

export default function DashboardPage() {
  const { transactions, products, settings, navigate, members, expenses } = useApp()
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [activePayTab, setActivePayTab] = useState('all')

  const stats = useMemo(() => {
    const today    = new Date().toDateString()
    const weekAgo  = Date.now() - 7*24*3600000
    const now      = new Date()
    const todayTrx = transactions.filter(t => new Date(t.date||t.createdAt).toDateString()===today)
    const weekTrx  = transactions.filter(t => new Date(t.date||t.createdAt).getTime()>weekAgo)
    const prevWeek = transactions.filter(t => { const d=new Date(t.date||t.createdAt).getTime(); return d>weekAgo-7*24*3600000&&d<=weekAgo })
    const done     = transactions.filter(t => !t.status||t.status==='completed')
    const totalRev = done.reduce((s,t)=>s+(t.total||0),0)
    const weekRev  = weekTrx.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0)
    const prevRev  = prevWeek.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0)
    const growth   = prevRev>0?((weekRev-prevRev)/prevRev*100).toFixed(1):0
    const totalHPP = done.reduce((s,t)=>s+(t.items||[]).reduce((ss,i)=>ss+(i.hpp||0)*(i.qty||0),0),0)

    // Daily revenue for last 7 days
    const days7 = Array.from({length:7},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(6-i))
      const ds=d.toDateString()
      const rev=done.filter(t=>new Date(t.date||t.createdAt).toDateString()===ds).reduce((s,t)=>s+(t.total||0),0)
      return { label:d.toLocaleDateString('id-ID',{weekday:'short'}), rev }
    })
    const maxDay = Math.max(...days7.map(d=>d.rev),1)

    const topProducts = products.map(p=>({
      ...p,
      salesQty:done.reduce((s,t)=>s+(t.items||[]).filter(i=>i.productId===p.id||i.name===p.name).reduce((ss,i)=>ss+(i.qty||0),0),0),
      revenue :done.reduce((s,t)=>s+(t.items||[]).filter(i=>i.productId===p.id||i.name===p.name).reduce((ss,i)=>ss+(i.price||0)*(i.qty||0),0),0),
    })).sort((a,b)=>b.revenue-a.revenue).slice(0,7)
    const maxRev = Math.max(...topProducts.map(p=>p.revenue),1)

    const payBreakdown = ['Cash','Card','QRIS','Transfer']
      .map(p=>({ name:p, count:done.filter(t=>t.payment===p).length, total:done.filter(t=>t.payment===p).reduce((s,t)=>s+(t.total||0),0) }))

    const LOW = settings?.lowStockThreshold||5
    const lowStock = products.filter(p=>p.active&&p.stock!=null&&p.stock<=LOW).sort((a,b)=>a.stock-b.stock)
    const outOfStock = lowStock.filter(p=>p.stock===0)
    const activeMembers = members.filter(m=>done.some(t=>t.memberId===m.id))
    const memberRev = done.filter(t=>t.memberId).reduce((s,t)=>s+(t.total||0),0)
    const allExp = expenses||[]
    const monthExp = allExp.filter(e=>{const d=new Date(e.date||e.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).reduce((s,e)=>s+(e.amount||0),0)
    const avgOrder = done.length>0?Math.round(totalRev/done.length):0

    return {
      totalRev,totalHPP,profit:totalRev-totalHPP,
      todayRev:todayTrx.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0),
      todayOrders:todayTrx.length, totalOrders:transactions.length,
      weekRev,growth,activeProducts:products.filter(p=>p.active).length,
      days7,maxDay,topProducts,maxRev,payBreakdown,
      lowStock,outOfStock,activeMembers,memberRev,monthExp,avgOrder,
    }
  }, [transactions,products,members,expenses,settings])

  const totalPayCount = stats.payBreakdown.reduce((s,p)=>s+p.count,0)||1

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F8FAFC', minHeight:0 }}>

      {/* ── Top Header ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'14px 20px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div>
            <h2 style={{ margin:'0 0 2px', fontSize:18, fontWeight:800, color:'#0F172A' }}>Business Overview</h2>
            <p style={{ margin:0, fontSize:12, color:'#64748B' }}>Performa {settings?.businessName||'bisnis'} Anda hari ini</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>navigate('reports')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#2563EB', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              <Icon name="reports" size={13} color="#fff" /> Laporan Lengkap
            </button>
          </div>
        </div>

        {/* Low stock alert */}
        {!alertDismissed && stats.lowStock.length>0 && (
          <div style={{ marginTop:12, background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
            <Icon name="warning" size={14} color="#D97706" />
            <span style={{ fontSize:12, color:'#92400E', fontWeight:700, flex:1 }}>
              {stats.outOfStock.length>0?`${stats.outOfStock.length} produk habis · `:''}{stats.lowStock.length-stats.outOfStock.length>0?`${stats.lowStock.length-stats.outOfStock.length} menipis`:''}
            </span>
            <button onClick={()=>navigate('inventory')} style={{ padding:'4px 10px', background:'#D97706', border:'none', borderRadius:6, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Kelola</button>
            <button onClick={()=>setAlertDismissed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:16, padding:0, lineHeight:1, fontFamily:'inherit' }}>×</button>
          </div>
        )}
      </div>

      {/* ── 4 Stats Bar ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', display:'grid', gridTemplateColumns:'repeat(4,1fr)', flexShrink:0 }}>
        {[
          { label:'Total Revenue', value:formatIDR(stats.totalRev), sub:`+${stats.growth}% minggu ini`, subC:stats.growth>=0?'#16A34A':'#DC2626', icon:'cash', c:'#3B82F6' },
          { label:'Transaksi Hari Ini', value:stats.todayOrders, sub:formatIDR(stats.todayRev), subC:'#0284C7', icon:'orders', c:'#0EA5E9' },
          { label:'Avg Order Value', value:formatIDR(stats.avgOrder), sub:`${stats.totalOrders} total transaksi`, subC:'#64748B', icon:'register', c:'#8B5CF6' },
          { label:'Est. Laba', value:formatIDR(stats.profit), sub:`HPP ${formatIDR(stats.totalHPP)}`, subC:stats.profit>=0?'#16A34A':'#DC2626', icon:'profit', c:'#10B981' },
        ].map((s,i)=>(
          <div key={i} style={{ padding:'14px 18px', borderRight:'1px solid #E2E8F0', position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.c, borderRadius:'0 0 3px 3px' }} />
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
              <div style={{ background:s.c+'18', borderRadius:7, padding:5 }}><Icon name={s.icon} size={14} color={s.c} /></div>
              <span style={{ fontSize:11, color:'#64748B', fontWeight:600 }}>{s.label}</span>
            </div>
            <p style={{ margin:'0 0 2px', fontSize:20, fontWeight:900, color:'#0F172A', letterSpacing:-0.5 }}>{s.value}</p>
            <p style={{ margin:0, fontSize:11, color:s.subC, fontWeight:600 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── 3-Column Main Body ── */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr', overflow:'auto', minHeight:0 }} className="dashboard-body">
        <div style={{ display:'flex', gap:0, minHeight:0, flex:1 }} className="dashboard-inner">

          {/* ── Left Panel: Top Products ── */}
          <div style={{ width:260, flexShrink:0, borderRight:'1px solid #E2E8F0', background:'#fff', overflowY:'auto', display:'flex', flexDirection:'column' }} className="dash-left">
            {/* Header */}
            <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, fontWeight:800, color:'#0F172A' }}>Produk Terlaris</span>
              <button onClick={()=>navigate('inventory')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#3B82F6', fontWeight:700, fontFamily:'inherit', padding:0 }}>Kelola</button>
            </div>
            {/* Product list */}
            <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
              {stats.topProducts.length===0 ? (
                <p style={{ padding:'24px 16px', textAlign:'center', color:'#9CA3AF', fontSize:12 }}>Belum ada data penjualan</p>
              ) : stats.topProducts.map((p,i)=>{
                const BAR_C=['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#EC4899','#06B6D4']
                return (
                  <div key={p.id||i} style={{ padding:'9px 16px', borderBottom:'1px solid #F8FAFC', display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:11, fontWeight:900, color:'#94A3B8', width:16, flexShrink:0 }}>{i+1}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:'0 0 3px', fontSize:12, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                      <div style={{ height:4, background:'#F1F5F9', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${(p.revenue/stats.maxRev)*100}%`, background:BAR_C[i%BAR_C.length], borderRadius:4, transition:'width 0.3s' }} />
                      </div>
                      <p style={{ margin:'2px 0 0', fontSize:10, color:'#94A3B8' }}>{p.salesQty} terjual</p>
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, color:'#1D4ED8', flexShrink:0 }}>{formatIDR(p.revenue)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Center Panel: Chart + Recent Transactions ── */}
          <div style={{ flex:1, minWidth:0, overflowY:'auto', background:'#F8FAFC' }} className="dash-center">

            {/* Revenue Chart */}
            <div style={{ background:'#fff', margin:'16px 16px 0', borderRadius:14, border:'1px solid #E2E8F0', padding:'16px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:800, color:'#0F172A' }}>Revenue Harian</p>
                  <p style={{ margin:0, fontSize:11, color:'#64748B' }}>7 hari terakhir</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ margin:'0 0 1px', fontSize:22, fontWeight:900, color:'#0F172A' }}>{formatIDR(stats.weekRev)}</p>
                  <span style={{ fontSize:11, fontWeight:700, color:stats.growth>=0?'#16A34A':'#DC2626' }}>
                    {stats.growth>=0?'↑':'↓'} {Math.abs(stats.growth)}% vs minggu lalu
                  </span>
                </div>
              </div>
              {/* Line chart — SVG */}
              {(() => {
                const W=700, H=90, PAD=8
                const pts = stats.days7.map((d,i) => ({
                  x: PAD + (i/(stats.days7.length-1||1))*(W-PAD*2),
                  y: H - PAD - (d.rev/stats.maxDay)*(H-PAD*2),
                  rev: d.rev, label: d.label,
                }))
                const polyline = pts.map(p=>`${p.x},${p.y}`).join(' ')
                const area = `${pts[0].x},${H} ` + pts.map(p=>`${p.x},${p.y}`).join(' ') + ` ${pts[pts.length-1].x},${H}`
                return (
                  <div style={{ position:'relative' }}>
                    <svg viewBox={`0 0 ${W} ${H+20}`} style={{ width:'100%', height:110, overflow:'visible' }}>
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18"/>
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      {[0,0.25,0.5,0.75,1].map((v,i)=>(
                        <line key={i} x1={PAD} y1={PAD+(1-v)*(H-PAD*2)} x2={W-PAD} y2={PAD+(1-v)*(H-PAD*2)}
                          stroke="#F1F5F9" strokeWidth="1" />
                      ))}
                      {/* Area fill */}
                      <polygon points={area} fill="url(#lineGrad)" />
                      {/* Line */}
                      <polyline points={polyline} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Data points */}
                      {pts.map((p,i)=>(
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#2563EB" strokeWidth="2.5"/>
                          {p.rev>0 && <circle cx={p.x} cy={p.y} r="2" fill="#2563EB"/>}
                          <text x={p.x} y={H+16} textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="600" style={{textTransform:'capitalize'}}>{p.label}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )
              })()}
            </div>

            {/* Recent Transactions */}
            <div style={{ background:'#fff', margin:'12px 16px', borderRadius:14, border:'1px solid #E2E8F0', padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Transaksi Terbaru</p>
                <button onClick={()=>navigate('reports')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#3B82F6', fontWeight:700, fontFamily:'inherit', padding:0 }}>Lihat semua →</button>
              </div>
              {transactions.length===0 ? (
                <p style={{ color:'#9CA3AF', fontSize:12, textAlign:'center', padding:'16px 0' }}>Belum ada transaksi</p>
              ) : transactions.slice(0,6).map(t=>(
                <div key={t.id} onClick={()=>navigate('reports')} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #F8FAFC', cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
                    <div style={{ width:32, height:32, background:t.status==='refunded'?'#FEE2E2':'#EFF6FF', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon name="user" size={13} color={t.status==='refunded'?'#DC2626':'#2563EB'} />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ margin:'0 0 1px', fontSize:11, fontWeight:800, color:'#0F172A', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.id}</p>
                      <p style={{ margin:0, fontSize:10, color:'#94A3B8' }}>{formatRelativeTime(t.date||t.createdAt)} · {t.cashier||'Kasir'}</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                    <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:900, color:t.status==='refunded'?'#94A3B8':'#0F172A', textDecoration:t.status==='refunded'?'line-through':'none' }}>{formatIDR(t.total||0)}</p>
                    <Badge color={STATUS_COLOR[t.status]||'green'}>{STATUS_LABEL[t.status]||'Selesai'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Panel: Payment + Member + Stok ── */}
          <div style={{ width:230, flexShrink:0, borderLeft:'1px solid #E2E8F0', background:'#fff', overflowY:'auto', display:'flex', flexDirection:'column' }} className="dash-right">

            {/* Payment Breakdown */}
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #F1F5F9' }}>
              <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:800, color:'#0F172A' }}>Metode Bayar</p>
              {stats.payBreakdown.map(p=>(
                <div key={p.name} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>{p.name}</span>
                    <span style={{ fontSize:11, color:'#64748B' }}>{p.count} trx</span>
                  </div>
                  <div style={{ height:5, background:'#F1F5F9', borderRadius:5, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(p.count/totalPayCount)*100}%`, background:p.name==='Cash'?'#3B82F6':p.name==='Card'?'#10B981':p.name==='QRIS'?'#8B5CF6':'#F59E0B', borderRadius:5 }} />
                  </div>
                  <p style={{ margin:'2px 0 0', fontSize:10, color:'#94A3B8' }}>{formatIDR(p.total)}</p>
                </div>
              ))}
              {stats.payBreakdown.every(p=>p.count===0) && <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'8px 0' }}>Belum ada data</p>}
            </div>

            {/* Member Stats */}
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #F1F5F9' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Member</p>
                <button onClick={()=>navigate('members')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#3B82F6', fontWeight:700, fontFamily:'inherit', padding:0 }}>Detail →</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                <div style={{ background:'#EFF6FF', borderRadius:10, padding:'10px', textAlign:'center' }}>
                  <p style={{ margin:'0 0 1px', fontSize:9, color:'#1D4ED8', fontWeight:700, textTransform:'uppercase' }}>Total</p>
                  <p style={{ margin:0, fontSize:20, fontWeight:900, color:'#1D4ED8' }}>{members.length}</p>
                </div>
                <div style={{ background:'#ECFDF5', borderRadius:10, padding:'10px', textAlign:'center' }}>
                  <p style={{ margin:'0 0 1px', fontSize:9, color:'#166534', fontWeight:700, textTransform:'uppercase' }}>Aktif</p>
                  <p style={{ margin:0, fontSize:20, fontWeight:900, color:'#166534' }}>{stats.activeMembers.length}</p>
                </div>
              </div>
              <div style={{ background:'#EDE9FE', borderRadius:8, padding:'7px 10px', display:'flex', alignItems:'center', gap:5 }}>
                <Icon name="profit" size={11} color="#7C3AED" />
                <span style={{ fontSize:11, color:'#6D28D9', fontWeight:700 }}>Rev: {formatIDR(stats.memberRev)}</span>
              </div>
            </div>

            {/* Low stock warning */}
            {stats.lowStock.length>0 && (
              <div style={{ padding:'14px 16px' }}>
                <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#0F172A' }}>⚠ Perlu Restock</p>
                {stats.lowStock.slice(0,4).map(p=>(
                  <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #F8FAFC' }}>
                    <span style={{ fontSize:11, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{p.name}</span>
                    <span style={{ fontSize:11, fontWeight:800, color:p.stock===0?'#DC2626':'#D97706', flexShrink:0, marginLeft:6 }}>
                      {p.stock===0?'Habis':`${p.stock} left`}
                    </span>
                  </div>
                ))}
                {stats.lowStock.length>4 && <p style={{ margin:'6px 0 0', fontSize:11, color:'#94A3B8', textAlign:'center' }}>+{stats.lowStock.length-4} produk lagi</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .dashboard-inner{ flex-direction: column !important; }
          .dash-left, .dash-right { width: 100% !important; border-right: none !important; border-left: none !important; border-bottom: 1px solid #E2E8F0; }
          .dashboard-body { overflow: auto !important; }
        }
        @media(max-width:640px){
          .dashboard-stats-bar { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  )
}
