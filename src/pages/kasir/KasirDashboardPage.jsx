// ============================================================
// MSME GROW POS - Kasir Dashboard v3.0 — Professional, no emoji
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

  const myRevenue  = myTrx.reduce((s,t) => s+(t.total||0), 0)
  const allRevenue = todayTrx.reduce((s,t) => s+(t.total||0), 0)

  const payBreakdown = useMemo(() => {
    const map = {}
    myTrx.forEach(t => { const p = t.payment||'Cash'; if(!map[p]) map[p]={count:0,total:0}; map[p].count++; map[p].total+=t.total||0 })
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total)
  }, [myTrx])

  const topProducts = useMemo(() => {
    const map = {}
    myTrx.forEach(t => { (t.items||[]).forEach(item => { const k=item.productId||item.name; if(!map[k]) map[k]={name:item.name,qty:0,revenue:0}; map[k].qty+=item.qty||0; map[k].revenue+=(item.price||0)*(item.qty||0) }) })
    return Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,5)
  }, [myTrx])

  const lowStock = useMemo(() =>
    products.filter(p => p.active!==false && p.stock!=null && p.stock<=(settings?.lowStockAlert||5))
  , [products, settings])

  const shiftDuration = useMemo(() => {
    if (!activeShift) return null
    const ms = Date.now() - new Date(activeShift.startTime).getTime()
    return `${Math.floor(ms/3600000)}j ${Math.floor((ms%3600000)/60000)}m`
  }, [activeShift])

  const PAY_ICON_MAP = { Cash:'cash', QRIS:'qris', Card:'card', Transfer:'transfer', Online:'zap' }

  const quickActions = [
    { icon:'register', label:'Mulai Transaksi', page:'register',        bg:'linear-gradient(135deg,#059669,#047857)', shadow:'rgba(5,150,105,0.25)' },
    { icon:'inventory',label:'Cek Inventori',   page:'kasir-inventory', bg:'linear-gradient(135deg,#2563EB,#1D4ED8)', shadow:'rgba(37,99,235,0.25)'  },
    { icon:'shift',    label:'Kelola Shift',    page:'shift',           bg:'linear-gradient(135deg,#7C3AED,#6D28D9)', shadow:'rgba(124,58,237,0.25)' },
  ]

  return (
    <div style={{ padding:'16px 20px', maxWidth:800, margin:'0 auto', fontFamily:'inherit' }}>

      {/* Welcome Banner */}
      <div style={{ background:'linear-gradient(135deg,#1D4ED8,#7C3AED)', borderRadius:18, padding:'20px 22px', marginBottom:18, color:'#fff', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'relative' }}>
          <p style={{ margin:'0 0 2px', fontSize:13, color:'rgba(255,255,255,0.7)' }}>{greeting}</p>
          <p style={{ margin:'0 0 14px', fontSize:22, fontWeight:900, letterSpacing:-0.5 }}>{user?.name || 'Kasir'}</p>
          {activeShift ? (
            <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#86EFAC', boxShadow:'0 0 0 3px rgba(134,239,172,0.2)' }} />
                  <span style={{ fontSize:13, fontWeight:700 }}>Shift Aktif · {activeShift.kasirName}</span>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)' }}>
                  Mulai {new Date(activeShift.startTime).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:18, fontWeight:900 }}>{shiftDuration}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>Durasi shift</div>
              </div>
            </div>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>Shift belum dimulai</span>
              </div>
              <button onClick={()=>navigate('shift')} style={{ background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                Buka Shift
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
        {quickActions.map(btn => (
          <button key={btn.page} onClick={()=>navigate(btn.page)}
            style={{ background:btn.bg, color:'#fff', border:'none', borderRadius:14, padding:'18px 12px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, fontFamily:'inherit', boxShadow:`0 4px 16px ${btn.shadow}`, transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px ${btn.shadow}`}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 4px 16px ${btn.shadow}`}}>
            <Icon name={btn.icon} size={24} color="#fff" />
            <span style={{ fontSize:12, fontWeight:700, textAlign:'center' }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Today */}
      <p style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Performa Saya Hari Ini</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:18 }}>
        {[
          { label:'Transaksi Saya',   value: myTrx.length,  color:'#1D4ED8', bg:'#EFF6FF' },
          { label:'Total Penjualan',  value: formatIDR(myRevenue), color:'#059669', bg:'#F0FDF4' },
          { label:'Rata-rata / Trx',  value: myTrx.length ? formatIDR(Math.round(myRevenue/myTrx.length)) : 'Rp 0', color:'#7C3AED', bg:'#F5F3FF' },
          { label:'Semua Kasir',      value: formatIDR(allRevenue), color:'#D97706', bg:'#FFFBEB' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'14px 16px', border:'1px solid', borderColor:s.bg }}>
            <div style={{ fontSize:20, fontWeight:900, color:s.color, marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#64748B' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Payment & Top Products */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        <div style={{ background:'#fff', border:'1px solid #F1F5F9', borderRadius:14, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ background:'#EFF6FF', borderRadius:8, padding:6 }}><Icon name="card" size={14} color="#2563EB" /></div>
            <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Metode Pembayaran</p>
          </div>
          {payBreakdown.length === 0 ? (
            <div style={{ textAlign:'center', padding:'16px 0', color:'#94A3B8', fontSize:12 }}>Belum ada transaksi</div>
          ) : payBreakdown.map(([method, data]) => (
            <div key={method} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, padding:'8px 10px', background:'#F9FAFB', borderRadius:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Icon name={PAY_ICON_MAP[method]||'cash'} size={15} color="#64748B" />
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{method}</div>
                  <div style={{ fontSize:11, color:'#94A3B8' }}>{data.count}x</div>
                </div>
              </div>
              <span style={{ fontSize:13, fontWeight:800, color:'#2563EB' }}>{formatIDR(data.total)}</span>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', border:'1px solid #F1F5F9', borderRadius:14, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ background:'#FFF7ED', borderRadius:8, padding:6 }}><Icon name="trending" size={14} color="#D97706" /></div>
            <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Produk Terlaris</p>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'16px 0', color:'#94A3B8', fontSize:12 }}>Belum ada penjualan</div>
          ) : topProducts.map((p, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:['#EFF6FF','#F0FDF4','#FEF3C7','#F5F3FF','#FFF1F2'][i], display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:['#1D4ED8','#166534','#92400E','#6D28D9','#991B1B'][i], flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                <div style={{ fontSize:11, color:'#94A3B8' }}>{p.qty}x terjual</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Warning */}
      {lowStock.length > 0 && (
        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:14, padding:'14px 16px', marginBottom:16, display:'flex', gap:10, alignItems:'flex-start' }}>
          <div style={{ background:'#FEF3C7', borderRadius:8, padding:6, flexShrink:0 }}><Icon name="warning" size={14} color="#D97706" /></div>
          <div>
            <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:800, color:'#92400E' }}>Stok Menipis ({lowStock.length} produk)</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {lowStock.slice(0,6).map(p => (
                <span key={p.id} style={{ fontSize:11, background:'#FEF3C7', color:'#92400E', border:'1px solid #FDE68A', padding:'3px 8px', borderRadius:20, fontWeight:700 }}>
                  {p.name} ({p.stock} {p.unit||'pcs'})
                </span>
              ))}
              {lowStock.length > 6 && <span style={{ fontSize:11, color:'#92400E' }}>+{lowStock.length-6} lainnya</span>}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div style={{ background:'#fff', border:'1px solid #F1F5F9', borderRadius:14, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ background:'#F0FDF4', borderRadius:8, padding:6 }}><Icon name="orders" size={14} color="#059669" /></div>
          <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Transaksi Terakhir</p>
        </div>
        {myTrx.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <Icon name="register" size={28} color="#CBD5E1" />
            <p style={{ color:'#94A3B8', fontSize:13, marginTop:8, marginBottom:14 }}>Belum ada transaksi. Mulai berjualan sekarang.</p>
            <button onClick={()=>navigate('register')} style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Buka POS
            </button>
          </div>
        ) : myTrx.slice(0,6).map(t => (
          <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 10px', background:'#F9FAFB', borderRadius:10, marginBottom:6 }}>
            <div>
              <div style={{ fontFamily:'monospace', fontSize:11, color:'#64748B' }}>{t.id}</div>
              <div style={{ fontSize:12, color:'#0F172A', marginTop:1, fontWeight:600 }}>
                {new Date(t.date||t.createdAt).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}
                {t.payment && <span style={{ color:'#94A3B8', fontWeight:400 }}> · {t.payment}</span>}
              </div>
            </div>
            <div style={{ fontSize:14, fontWeight:800, color:'#0F172A' }}>{formatIDR(t.total)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
