// ============================================================
// MSME GROW POS - Kasir Dashboard v4.0
// ============================================================
import { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR } from '@/utils/format'
import Icon from '@/components/ui/Icon'

export default function KasirDashboardPage() {
  const { user, transactions, products, activeShift, settings, navigate } = useApp()

  const now      = new Date()
  const greeting = now.getHours() < 12 ? 'Selamat Pagi' : now.getHours() < 18 ? 'Selamat Siang' : 'Selamat Malam'
  const todayStr = now.toDateString()

  const todayTrx = useMemo(() =>
    transactions.filter(t => new Date(t.date||t.createdAt).toDateString() === todayStr && (!t.status||t.status==='completed'))
  , [transactions, todayStr])

  const myTrx = useMemo(() =>
    todayTrx.filter(t => t.cashierId === user?.id || t.cashier === user?.name)
  , [todayTrx, user])

  const myRevenue  = myTrx.reduce((s,t)=>s+(t.total||0),0)
  const allRevenue = todayTrx.reduce((s,t)=>s+(t.total||0),0)

  const payBreakdown = useMemo(() => {
    const map = {}
    myTrx.forEach(t => { const p=t.payment||'Cash'; if(!map[p]) map[p]={count:0,total:0}; map[p].count++; map[p].total+=t.total||0 })
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total)
  }, [myTrx])

  const topProducts = useMemo(() => {
    const map = {}
    myTrx.forEach(t=>{(t.items||[]).forEach(i=>{const k=i.productId||i.name;if(!map[k])map[k]={name:i.name,qty:0};map[k].qty+=i.qty||0})})
    return Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,5)
  }, [myTrx])

  const lowStock = useMemo(() =>
    products.filter(p=>p.active!==false&&p.stock!=null&&p.stock<=(settings?.lowStockAlert||5))
  , [products, settings])

  const shiftMs = activeShift ? Date.now() - new Date(activeShift.startTime).getTime() : 0
  const shiftDuration = activeShift ? `${Math.floor(shiftMs/3600000)}j ${Math.floor((shiftMs%3600000)/60000)}m` : null

  const PAY_ICON = { Cash:'cash', QRIS:'qris', Card:'card', Transfer:'transfer', Online:'zap' }

  const QuickBtn = ({ icon, label, page, accent }) => (
    <button onClick={()=>navigate(page)} style={{
      background:'#1E293B', color:'#F1F5F9', border:`1px solid rgba(255,255,255,0.08)`,
      borderRadius:13, padding:'16px 10px', cursor:'pointer',
      display:'flex', flexDirection:'column', alignItems:'center', gap:9,
      fontFamily:'inherit', transition:'all 0.2s', flex:1,
    }}
    onMouseEnter={e=>{e.currentTarget.style.background='#334155';e.currentTarget.style.transform='translateY(-2px)'}}
    onMouseLeave={e=>{e.currentTarget.style.background='#1E293B';e.currentTarget.style.transform='translateY(0)'}}>
      <div style={{ width:44, height:44, borderRadius:12, background:accent+'25', display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${accent}40` }}>
        <Icon name={icon} size={21} color={accent} />
      </div>
      <span style={{ fontSize:11.5, fontWeight:700, textAlign:'center', lineHeight:1.3 }}>{label}</span>
    </button>
  )

  return (
    <div style={{ padding:'12px 14px', maxWidth:800, margin:'0 auto' }}>

      {/* Welcome Banner */}
      <div style={{ background:'#1E293B', borderRadius:16, padding:'18px 20px', marginBottom:16, color:'#F1F5F9', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(59,130,246,0.08)' }}/>
        <div style={{ position:'relative' }}>
          <p style={{ margin:'0 0 1px', fontSize:12, color:'#64748B' }}>{greeting}</p>
          <p style={{ margin:'0 0 14px', fontSize:21, fontWeight:900, letterSpacing:-0.4 }}>{user?.name || 'Kasir'}</p>

          {activeShift ? (
            <div style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:11, padding:'11px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 0 3px rgba(52,211,153,0.2)' }} />
                  <span style={{ fontSize:13, fontWeight:700, color:'#A7F3D0' }}>Shift Aktif — {activeShift.kasirName}</span>
                </div>
                <span style={{ fontSize:11, color:'#6EE7B7' }}>Mulai {new Date(activeShift.startTime).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:19, fontWeight:900, color:'#6EE7B7' }}>{shiftDuration}</div>
              </div>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'11px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#475569' }} />
                <span style={{ fontSize:13, color:'#94A3B8' }}>Shift belum dimulai</span>
              </div>
              <button onClick={()=>navigate('shift')} style={{ background:'rgba(59,130,246,0.25)', border:'1px solid rgba(59,130,246,0.4)', color:'#93C5FD', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                Buka Shift
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <QuickBtn icon="register"  label="Mulai Transaksi"  page="register"        accent="#3B82F6" />
        <QuickBtn icon="inventory" label="Cek Inventori"    page="kasir-inventory" accent="#10B981" />
        <QuickBtn icon="shift"     label="Kelola Shift"     page="shift"           accent="#8B5CF6" />
      </div>

      {/* Stats */}
      <p style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Performa Saya Hari Ini</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Transaksi Saya',  value:myTrx.length,                                                  color:'#1D4ED8', bg:'#DBEAFE', border:'#93C5FD' },
          { label:'Total Penjualan', value:formatIDR(myRevenue),                                          color:'#166534', bg:'#DCFCE7', border:'#86EFAC' },
          { label:'Rata-rata / Trx', value:myTrx.length?formatIDR(Math.round(myRevenue/myTrx.length)):'—', color:'#6D28D9', bg:'#EDE9FE', border:'#C4B5FD' },
          { label:'Semua Kasir',     value:formatIDR(allRevenue),                                          color:'#C2410C', bg:'#FFEDD5', border:'#FDBA74' },
        ].map(s=>(
          <div key={s.label} style={{ background:s.bg, border:`1.5px solid ${s.border}`, borderRadius:12, padding:'14px 16px' }}>
            <p style={{ margin:'0 0 3px', fontSize:20, fontWeight:900, color:s.color }}>{s.value}</p>
            <p style={{ margin:0, fontSize:12, color:s.color, fontWeight:500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payment + Top Products */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12, marginBottom:14 }}>
        {/* Payment */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:13, padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ background:'#DBEAFE', borderRadius:8, padding:6 }}><Icon name="card" size={14} color="#1D4ED8" /></div>
            <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Pembayaran</p>
          </div>
          {payBreakdown.length===0
            ? <p style={{ textAlign:'center', padding:'16px 0', color:'#94A3B8', fontSize:12 }}>Belum ada transaksi</p>
            : payBreakdown.map(([method, data]) => (
              <div key={method} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7, padding:'7px 10px', background:'#F8FAFC', borderRadius:8, border:'1px solid #F1F5F9' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <Icon name={PAY_ICON[method]||'cash'} size={14} color="#475569" />
                  <div>
                    <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#0F172A' }}>{method}</p>
                    <p style={{ margin:0, fontSize:10, color:'#94A3B8' }}>{data.count}x</p>
                  </div>
                </div>
                <span style={{ fontSize:13, fontWeight:800, color:'#1D4ED8' }}>{formatIDR(data.total)}</span>
              </div>
            ))}
        </div>

        {/* Top Products */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:13, padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ background:'#DCFCE7', borderRadius:8, padding:6 }}><Icon name="trending" size={14} color="#166534" /></div>
            <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Produk Terlaris</p>
          </div>
          {topProducts.length===0
            ? <p style={{ textAlign:'center', padding:'16px 0', color:'#94A3B8', fontSize:12 }}>Belum ada penjualan</p>
            : topProducts.map((p,i)=>{
              const RANK_BG = ['#DBEAFE','#DCFCE7','#FEF9C3','#EDE9FE','#FFE4E6']
              const RANK_C  = ['#1D4ED8','#166534','#854D0E','#6D28D9','#9F1239']
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ width:20, height:20, borderRadius:6, background:RANK_BG[i], fontSize:10, fontWeight:900, color:RANK_C[i], display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                    <p style={{ margin:0, fontSize:11, color:'#94A3B8' }}>{p.qty}x terjual</p>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <div style={{ background:'#FFFBEB', border:'1.5px solid #FCD34D', borderRadius:13, padding:'13px 16px', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ background:'#FEF3C7', borderRadius:7, padding:5 }}><Icon name="warning" size={14} color="#D97706" /></div>
            <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#92400E' }}>Stok Menipis ({lowStock.length})</p>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {lowStock.slice(0,6).map(p=>(
              <span key={p.id} style={{ fontSize:11, background:'#FEF3C7', color:'#92400E', border:'1px solid #FDE68A', padding:'3px 9px', borderRadius:20, fontWeight:700 }}>
                {p.name} ({p.stock})
              </span>
            ))}
            {lowStock.length>6 && <span style={{ fontSize:11, color:'#92400E' }}>+{lowStock.length-6}</span>}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:13, padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ background:'#F1F5F9', borderRadius:8, padding:6 }}><Icon name="orders" size={14} color="#334155" /></div>
          <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Transaksi Terakhir</p>
        </div>
        {myTrx.length===0
          ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <Icon name="register" size={28} color="#CBD5E1" />
              <p style={{ color:'#94A3B8', fontSize:13, marginTop:8, marginBottom:14 }}>Belum ada transaksi hari ini</p>
              <button onClick={()=>navigate('register')} style={{ background:'#1E293B', color:'#F1F5F9', border:'none', borderRadius:9, padding:'10px 22px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                Buka POS
              </button>
            </div>
          )
          : myTrx.slice(0,6).map(t=>(
            <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'#F8FAFC', borderRadius:9, marginBottom:5, border:'1px solid #F1F5F9' }}>
              <div>
                <p style={{ margin:0, fontFamily:'monospace', fontSize:11, color:'#64748B' }}>{t.id}</p>
                <p style={{ margin:'1px 0 0', fontSize:12, color:'#334155', fontWeight:600 }}>
                  {new Date(t.date||t.createdAt).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}
                  <span style={{ color:'#94A3B8', fontWeight:400 }}> · {t.payment}</span>
                </p>
              </div>
              <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>{formatIDR(t.total)}</p>
            </div>
          ))
        }
      </div>
    </div>
  )
}
