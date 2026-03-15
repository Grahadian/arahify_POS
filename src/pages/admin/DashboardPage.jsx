// ============================================================
// MSME GROW POS - Admin Dashboard v11.0
// Desktop: 3-panel GoSquared layout
// Mobile: Single column stacked
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

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const weekAgo = Date.now() - 7*24*3600000
    const now = new Date()
    const todayTrx = transactions.filter(t => new Date(t.date||t.createdAt).toDateString()===today)
    const weekTrx = transactions.filter(t => new Date(t.date||t.createdAt).getTime()>weekAgo)
    const prevWeek = transactions.filter(t => { const d=new Date(t.date||t.createdAt).getTime(); return d>weekAgo-7*24*3600000&&d<=weekAgo })
    const done = transactions.filter(t => !t.status||t.status==='completed')
    const totalRev = done.reduce((s,t)=>s+(t.total||0),0)
    const weekRev = weekTrx.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0)
    const prevRev = prevWeek.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0)
    const growth = prevRev>0?((weekRev-prevRev)/prevRev*100).toFixed(1):0
    const totalHPP = done.reduce((s,t)=>s+(t.items||[]).reduce((ss,i)=>ss+(i.hpp||0)*(i.qty||0),0),0)
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
      revenue:done.reduce((s,t)=>s+(t.items||[]).filter(i=>i.productId===p.id||i.name===p.name).reduce((ss,i)=>ss+(i.price||0)*(i.qty||0),0),0),
    })).sort((a,b)=>b.revenue-a.revenue).slice(0,7)
    const maxRev = Math.max(...topProducts.map(p=>p.revenue),1)
    const payBreakdown = ['Cash','Card','QRIS','Transfer'].map(p=>({ name:p, count:done.filter(t=>t.payment===p).length, total:done.filter(t=>t.payment===p).reduce((s,t)=>s+(t.total||0),0) }))
    const LOW = settings?.lowStockThreshold||5
    const lowStock = products.filter(p=>p.active&&p.stock!=null&&p.stock<=LOW).sort((a,b)=>a.stock-b.stock)
    const outOfStock = lowStock.filter(p=>p.stock===0)
    const activeMembers = members.filter(m=>done.some(t=>t.memberId===m.id))
    const memberRev = done.filter(t=>t.memberId).reduce((s,t)=>s+(t.total||0),0)
    const allExp = expenses||[]
    const monthExp = allExp.filter(e=>{const d=new Date(e.date||e.createdAt);return d.getMonth()===new Date().getMonth()&&d.getFullYear()===new Date().getFullYear()}).reduce((s,e)=>s+(e.amount||0),0)
    const avgOrder = done.length>0?Math.round(totalRev/done.length):0
    const totalPayCount = Math.max(payBreakdown.reduce((s,p)=>s+p.count,0),1)
    return { totalRev,totalHPP,profit:totalRev-totalHPP,todayRev:todayTrx.filter(t=>!t.status||t.status==='completed').reduce((s,t)=>s+(t.total||0),0),todayOrders:todayTrx.length,totalOrders:transactions.length,weekRev,growth,activeProducts:products.filter(p=>p.active).length,days7,maxDay,topProducts,maxRev,payBreakdown,totalPayCount,lowStock,outOfStock,activeMembers,memberRev,monthExp,avgOrder }
  }, [transactions,products,members,expenses,settings])

  const BAR_C = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#EC4899','#06B6D4']

  // Inline SVG line chart
  const LineChart = () => {
    const W=700, H=90, PAD=8
    const pts = stats.days7.map((d,i)=>({ x:PAD+(i/(stats.days7.length-1||1))*(W-PAD*2), y:H-PAD-(d.rev/stats.maxDay)*(H-PAD*2), rev:d.rev, label:d.label }))
    const polyline = pts.map(p=>`${p.x},${p.y}`).join(' ')
    const area = `${pts[0].x},${H} `+pts.map(p=>`${p.x},${p.y}`).join(' ')+` ${pts[pts.length-1].x},${H}`
    return (
      <svg viewBox={`0 0 ${W} ${H+20}`} style={{width:'100%',height:110,overflow:'visible'}}>
        <defs><linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity="0.15"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0"/></linearGradient></defs>
        {[0,0.5,1].map((v,i)=><line key={i} x1={PAD} y1={PAD+(1-v)*(H-PAD*2)} x2={W-PAD} y2={PAD+(1-v)*(H-PAD*2)} stroke="#F1F5F9" strokeWidth="1"/>)}
        <polygon points={area} fill="url(#dashGrad)"/>
        <polyline points={polyline} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#2563EB" strokeWidth="2"/>
            {p.rev>0&&<circle cx={p.x} cy={p.y} r="2" fill="#2563EB"/>}
            <text x={p.x} y={H+16} textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="600">{p.label}</text>
          </g>
        ))}
      </svg>
    )
  }

  return (
    <div style={{background:'#F8FAFC', minHeight:'100%'}}>

      {/* ── Header ── */}
      <div style={{background:'#fff', padding:'16px 20px 14px', borderBottom:'1px solid #E2E8F0', marginBottom:16}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10}}>
          <div>
            <h2 style={{margin:'0 0 2px', fontSize:18, fontWeight:800, color:'#0F172A'}}>Business Overview</h2>
            <p style={{margin:0, fontSize:12, color:'#64748B'}}>Performa {settings?.businessName||'MSME Grow'} Anda hari ini</p>
          </div>
          <button onClick={()=>navigate('reports')} style={{display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'#2563EB', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', touchAction:'manipulation'}}>
            <Icon name="reports" size={14} color="#fff"/> Laporan Lengkap
          </button>
        </div>
        {!alertDismissed && stats.lowStock.length>0 && (
          <div style={{marginTop:12, background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10}}>
            <Icon name="warning" size={14} color="#D97706"/>
            <span style={{fontSize:12, color:'#92400E', fontWeight:700, flex:1}}>
              {stats.outOfStock.length>0?`${stats.outOfStock.length} produk habis · `:''}{stats.lowStock.length-stats.outOfStock.length>0?`${stats.lowStock.length-stats.outOfStock.length} stok menipis`:''}
            </span>
            <button onClick={()=>navigate('inventory')} style={{padding:'4px 10px', background:'#D97706', border:'none', borderRadius:6, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}>Kelola</button>
            <button onClick={()=>setAlertDismissed(true)} style={{background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:18, padding:0, lineHeight:1, fontFamily:'inherit'}}>×</button>
          </div>
        )}
      </div>

      {/* ── Stats Bar — 4 col desktop, 2 col mobile ── */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, margin:'0 16px 16px', background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', overflow:'hidden'}} className="dash-stats">
        {[
          {label:'Total Revenue', value:formatIDR(stats.totalRev), sub:`+${stats.growth}% minggu ini`, subC:Number(stats.growth)>=0?'#16A34A':'#DC2626', icon:'cash', c:'#3B82F6'},
          {label:'Transaksi Hari Ini', value:stats.todayOrders, sub:formatIDR(stats.todayRev), subC:'#0284C7', icon:'orders', c:'#0EA5E9'},
          {label:'Avg Order Value', value:formatIDR(stats.avgOrder), sub:`${stats.totalOrders} total transaksi`, subC:'#64748B', icon:'register', c:'#8B5CF6'},
          {label:'Est. Laba', value:formatIDR(stats.profit), sub:`HPP ${formatIDR(stats.totalHPP)}`, subC:stats.profit>=0?'#16A34A':'#DC2626', icon:'profit', c:'#10B981'},
        ].map((s,i)=>(
          <div key={i} style={{padding:'16px 18px', borderRight:i<3?'1px solid #E2E8F0':'none', position:'relative'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:s.c}}/>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
              <div style={{width:32, height:32, borderRadius:8, background:`${s.c}15`, display:'flex', alignItems:'center', justifyContent:'center'}}>
                <Icon name={s.icon} size={15} color={s.c}/>
              </div>
              <span style={{fontSize:11, color:'#64748B', fontWeight:600}}>{s.label}</span>
            </div>
            <p style={{margin:'0 0 3px', fontSize:20, fontWeight:900, color:'#0F172A', letterSpacing:-0.5}}>{s.value}</p>
            <p style={{margin:0, fontSize:11, color:s.subC, fontWeight:600}}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── 3-column body ── */}
      <div style={{display:'flex', gap:12, padding:'0 16px', alignItems:'flex-start'}} className="dash-body">

        {/* LEFT: Top Products */}
        <div style={{width:240, flexShrink:0}} className="dash-left-col">
          <div style={{background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', overflow:'hidden'}}>
            <div style={{padding:'14px 16px 10px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontSize:13, fontWeight:800, color:'#0F172A'}}>Produk Terlaris</span>
              <button onClick={()=>navigate('inventory')} style={{background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#3B82F6', fontWeight:700, fontFamily:'inherit', padding:0}}>Kelola</button>
            </div>
            {stats.topProducts.length===0
              ? <p style={{padding:'24px 16px', textAlign:'center', color:'#9CA3AF', fontSize:12}}>Belum ada data</p>
              : stats.topProducts.map((p,i)=>(
                <div key={p.id||i} style={{padding:'10px 16px', borderBottom:'1px solid #F8FAFC', display:'flex', alignItems:'center', gap:10}}>
                  <span style={{fontSize:11, fontWeight:900, color:'#94A3B8', width:16, flexShrink:0}}>{i+1}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:'0 0 3px', fontSize:12, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.name}</p>
                    <div style={{height:4, background:'#F1F5F9', borderRadius:4, overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${(p.revenue/stats.maxRev)*100}%`, background:BAR_C[i%BAR_C.length], borderRadius:4}}/>
                    </div>
                    <p style={{margin:'2px 0 0', fontSize:10, color:'#94A3B8'}}>{p.salesQty} terjual</p>
                  </div>
                  <span style={{fontSize:11, fontWeight:800, color:'#1D4ED8', flexShrink:0}}>{formatIDR(p.revenue)}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* CENTER: Chart + Recent Transactions */}
        <div style={{flex:1, minWidth:0}} className="dash-center-col">
          {/* Revenue chart */}
          <div style={{background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', padding:'16px 20px', marginBottom:12}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
              <div>
                <p style={{margin:'0 0 2px', fontSize:13, fontWeight:800, color:'#0F172A'}}>Revenue Harian</p>
                <p style={{margin:0, fontSize:11, color:'#64748B'}}>7 hari terakhir</p>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{margin:'0 0 1px', fontSize:20, fontWeight:900, color:'#0F172A'}}>{formatIDR(stats.weekRev)}</p>
                <span style={{fontSize:11, fontWeight:700, color:Number(stats.growth)>=0?'#16A34A':'#DC2626'}}>
                  {Number(stats.growth)>=0?'↑':'↓'} {Math.abs(stats.growth)}% vs minggu lalu
                </span>
              </div>
            </div>
            <LineChart/>
          </div>

          {/* Recent transactions */}
          <div style={{background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', padding:'14px 16px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
              <p style={{margin:0, fontSize:13, fontWeight:800, color:'#0F172A'}}>Transaksi Terbaru</p>
              <button onClick={()=>navigate('reports')} style={{background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#3B82F6', fontWeight:700, fontFamily:'inherit', padding:0}}>Lihat semua →</button>
            </div>
            {transactions.length===0
              ? <p style={{color:'#9CA3AF', fontSize:12, textAlign:'center', padding:'16px 0'}}>Belum ada transaksi</p>
              : transactions.slice(0,6).map(t=>(
                <div key={t.id} onClick={()=>navigate('reports')} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #F8FAFC', cursor:'pointer'}}>
                  <div style={{display:'flex', alignItems:'center', gap:9, minWidth:0}}>
                    <div style={{width:32, height:32, background:t.status==='refunded'?'#FEE2E2':'#EFF6FF', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                      <Icon name="user" size={13} color={t.status==='refunded'?'#DC2626':'#2563EB'}/>
                    </div>
                    <div style={{minWidth:0}}>
                      <p style={{margin:'0 0 1px', fontSize:11, fontWeight:800, color:'#0F172A', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.id}</p>
                      <p style={{margin:0, fontSize:10, color:'#94A3B8'}}>{formatRelativeTime(t.date||t.createdAt)} · {t.cashier||'Kasir'}</p>
                    </div>
                  </div>
                  <div style={{textAlign:'right', flexShrink:0, marginLeft:8}}>
                    <p style={{margin:'0 0 2px', fontSize:13, fontWeight:900, color:t.status==='refunded'?'#94A3B8':'#0F172A'}}>{formatIDR(t.total||0)}</p>
                    <Badge color={STATUS_COLOR[t.status]||'green'}>{STATUS_LABEL[t.status]||'Selesai'}</Badge>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* RIGHT: Payment + Member + Stok */}
        <div style={{width:220, flexShrink:0}} className="dash-right-col">
          {/* Payment breakdown */}
          <div style={{background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', padding:'14px 16px', marginBottom:12}}>
            <p style={{margin:'0 0 12px', fontSize:13, fontWeight:800, color:'#0F172A'}}>Metode Bayar</p>
            {stats.payBreakdown.map(p=>(
              <div key={p.name} style={{marginBottom:10}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                  <span style={{fontSize:12, color:'#374151', fontWeight:600}}>{p.name}</span>
                  <span style={{fontSize:11, color:'#64748B'}}>{p.count} trx</span>
                </div>
                <div style={{height:5, background:'#F1F5F9', borderRadius:5, overflow:'hidden'}}>
                  <div style={{height:'100%', width:`${(p.count/stats.totalPayCount)*100}%`, background:p.name==='Cash'?'#3B82F6':p.name==='Card'?'#10B981':p.name==='QRIS'?'#8B5CF6':'#F59E0B', borderRadius:5}}/>
                </div>
                <p style={{margin:'2px 0 0', fontSize:10, color:'#94A3B8'}}>{formatIDR(p.total)}</p>
              </div>
            ))}
            {stats.payBreakdown.every(p=>p.count===0)&&<p style={{fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'8px 0'}}>Belum ada data</p>}
          </div>

          {/* Member */}
          <div style={{background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', padding:'14px 16px', marginBottom:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
              <p style={{margin:0, fontSize:13, fontWeight:800, color:'#0F172A'}}>Member</p>
              <button onClick={()=>navigate('members')} style={{background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#3B82F6', fontWeight:700, fontFamily:'inherit', padding:0}}>Detail →</button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8}}>
              <div style={{background:'#EFF6FF', borderRadius:10, padding:'10px', textAlign:'center'}}>
                <p style={{margin:'0 0 1px', fontSize:9, color:'#1D4ED8', fontWeight:700, textTransform:'uppercase'}}>Total</p>
                <p style={{margin:0, fontSize:20, fontWeight:900, color:'#1D4ED8'}}>{members.length}</p>
              </div>
              <div style={{background:'#ECFDF5', borderRadius:10, padding:'10px', textAlign:'center'}}>
                <p style={{margin:'0 0 1px', fontSize:9, color:'#166534', fontWeight:700, textTransform:'uppercase'}}>Aktif</p>
                <p style={{margin:0, fontSize:20, fontWeight:900, color:'#166534'}}>{stats.activeMembers.length}</p>
              </div>
            </div>
            <div style={{background:'#EDE9FE', borderRadius:8, padding:'7px 10px', display:'flex', alignItems:'center', gap:5}}>
              <Icon name="profit" size={11} color="#7C3AED"/>
              <span style={{fontSize:11, color:'#6D28D9', fontWeight:700}}>Rev: {formatIDR(stats.memberRev)}</span>
            </div>
          </div>

          {/* Low stock */}
          {stats.lowStock.length>0&&(
            <div style={{background:'#fff', borderRadius:14, border:'1px solid #E2E8F0', padding:'14px 16px'}}>
              <p style={{margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#0F172A'}}>⚠ Perlu Restock</p>
              {stats.lowStock.slice(0,4).map(p=>(
                <div key={p.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #F8FAFC'}}>
                  <span style={{fontSize:11, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1}}>{p.name}</span>
                  <span style={{fontSize:11, fontWeight:800, color:p.stock===0?'#DC2626':'#D97706', flexShrink:0, marginLeft:6}}>{p.stock===0?'Habis':`${p.stock}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile-only: stacked sections ── */}
      <style>{`
        @media(max-width:639px){
          .dash-stats { grid-template-columns: repeat(2,1fr) !important; margin: 0 12px 12px !important; }
          .dash-stats > div { border-right: none !important; border-bottom: 1px solid #E2E8F0; }
          .dash-body { flex-direction: column !important; padding: 0 12px !important; }
          .dash-left-col, .dash-right-col { width: 100% !important; }
        }
        @media(min-width:640px) and (max-width:900px){
          .dash-body { flex-wrap: wrap !important; }
          .dash-left-col { width: 200px !important; }
          .dash-right-col { width: 180px !important; }
        }
      `}</style>
    </div>
  )
}
