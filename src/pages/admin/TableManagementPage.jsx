// ============================================================
// MSME GROW POS — Table Management Page v2.0 (inline styles)
// ============================================================
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR } from '@/utils/format'

const S = {
 page: { padding:'16px 20px', maxWidth:960, margin:'0 auto' },
 card: { background:'#fff', border:'1px solid #F1F5F9', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
 overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
 modal: { background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'90vh', overflowY:'auto' },
 label: { display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 },
 inp: { width:'100%', padding:'11px 14px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#FAFAFA' },
 btn: (v) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:800, fontFamily:'inherit', cursor:'pointer', border:'none', ...(v==='primary'?{background:'#2563EB',color:'#fff'}:v==='danger'?{background:'#EF4444',color:'#fff'}:{background:'#F3F4F6',color:'#374151',border:'1px solid #E5E7EB'}) }),
}

const STATUS = {
 available:{ label:'Tersedia', bg:'#DCFCE7', border:'#86EFAC', text:'#166534', dot:'#22C55E', icon:'' },
 occupied: { label:'Terisi', bg:'#FEE2E2', border:'#FECACA', text:'#991B1B', dot:'#EF4444', icon:'' },
 reserved: { label:'Reserved', bg:'#FEF3C7', border:'#FDE68A', text:'#92400E', dot:'#F59E0B', icon:'' },
 dirty: { label:'Perlu Dibersihkan', bg:'#F3F4F6', border:'#D1D5DB', text:'#374151', dot:'#9CA3AF', icon:'' },
}

const fi = e => { e.target.style.borderColor='#2563EB'; e.target.style.background='#fff' }
const fo = e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#FAFAFA' }

export default function TableManagementPage() {
 const { tables=[], addTable, updateTable, deleteTable, transactions } = useApp()

 const [filterStatus, setFilterStatus] = useState('all')
 const [areaFilter, setAreaFilter] = useState('Semua')
 const [form, setForm] = useState({ name:'', capacity:4, area:'', notes:'' })
 const [editTable, setEditTable] = useState(null)
 const [showForm, setShowForm] = useState(false)
 const [detailTable, setDetailTable] = useState(null)

 const areas = useMemo(() => ['Semua', ...new Set(tables.map(t=>t.area).filter(Boolean))], [tables])

 const displayed = useMemo(() =>
 tables.filter(t => (filterStatus==='all'||t.status===filterStatus) && (areaFilter==='Semua'||t.area===areaFilter))
 , [tables, filterStatus, areaFilter])

 const stats = useMemo(() => ({
 total: tables.length,
 available:tables.filter(t=>t.status==='available').length,
 occupied: tables.filter(t=>t.status==='occupied').length,
 reserved: tables.filter(t=>t.status==='reserved').length,
 }), [tables])

 const openAdd = () => { setForm({name:'',capacity:4,area:'',notes:''}); setEditTable(null); setShowForm(true) }
 const openEdit = (t) => { setForm({name:t.name,capacity:t.capacity,area:t.area||'',notes:t.notes||''}); setEditTable(t); setShowForm(true) }
 const f = k => e => setForm(p=>({...p,[k]:e.target.value}))

 const handleSave = () => {
 if (!form.name.trim()) { alert('Nama meja wajib diisi'); return }
 editTable ? updateTable({...editTable,...form}) : addTable({...form,status:'available'})
 setShowForm(false)
 }

 const tableTrx = useMemo(() => {
 if (!detailTable) return []
 return transactions.filter(t=>t.tableId===detailTable.id).sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt)).slice(0,8)
 }, [detailTable, transactions])

 return (
 <div style={S.page}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
 <div>
 <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#111827', letterSpacing:-0.5 }}> Manajemen Meja</h2>
 <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>{stats.total} meja terdaftar</p>
 </div>
 <button style={S.btn('primary')} onClick={openAdd}>+ Tambah Meja</button>
 </div>

 {/* Stats */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
 {[['Total',stats.total,'#374151','#F8FAFC'],['Tersedia',stats.available,'#166534','#DCFCE7'],['Terisi',stats.occupied,'#991B1B','#FEE2E2'],['Reserved',stats.reserved,'#92400E','#FEF3C7']].map(([l,v,c,bg])=>(
 <div key={l} style={{ ...S.card, padding:'16px 18px', background:bg }}>
 <div style={{ fontSize:26, fontWeight:900, color:c }}>{v}</div>
 <div style={{ fontSize:12, color:'#6B7280', marginTop:3 }}>{l}</div>
 </div>
 ))}
 </div>

 {/* Filters */}
 <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
 {['all','available','occupied','reserved','dirty'].map(st=>(
 <button key={st} onClick={()=>setFilterStatus(st)}
 style={{ padding:'8px 14px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:'inherit', cursor:'pointer', border:'1.5px solid', transition:'all 0.15s',
 background:filterStatus===st?'#2563EB':'#fff', color:filterStatus===st?'#fff':'#6B7280', borderColor:filterStatus===st?'#2563EB':'#E5E7EB' }}>
 {st==='all'?'Semua Status':(STATUS[st]?.icon+' '+STATUS[st]?.label)}
 </button>
 ))}
 {areas.length > 1 && (
 <select value={areaFilter} onChange={e=>setAreaFilter(e.target.value)}
 style={{ padding:'8px 14px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:'inherit', cursor:'pointer', border:'1.5px solid #E5E7EB', background:'#fff', marginLeft:'auto', appearance:'auto' }}>
 {areas.map(a=><option key={a}>{a}</option>)}
 </select>
 )}
 </div>

 {/* Grid */}
 {displayed.length === 0 ? (
 <div style={{ ...S.card, padding:'48px 24px', textAlign:'center', color:'#9CA3AF' }}>
 <div style={{ fontSize:48, marginBottom:12 }}></div>
 <div style={{ fontWeight:700 }}>Belum ada meja</div>
 <div style={{ fontSize:13, marginTop:6 }}>Tambahkan meja untuk memulai manajemen meja restoran/kafe</div>
 </div>
 ) : (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:14 }}>
 {displayed.map(table => {
 const st = STATUS[table.status] || STATUS.available
 return (
 <div key={table.id} onClick={()=>setDetailTable(table)}
 style={{ background:st.bg, border:`2px solid ${st.border}`, borderRadius:16, padding:'18px 14px', cursor:'pointer', transition:'all 0.15s', position:'relative', textAlign:'center' }}
 onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'}}
 onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
 <div style={{ position:'absolute', top:10, right:10, width:10, height:10, borderRadius:'50%', background:st.dot }} />
 <div style={{ fontSize:28, marginBottom:8 }}></div>
 <div style={{ fontSize:15, fontWeight:900, color:'#111827', marginBottom:4 }}>{table.name}</div>
 <div style={{ fontSize:11, fontWeight:700, color:st.text, marginBottom:4 }}>{st.label}</div>
 <div style={{ fontSize:11, color:'#6B7280' }}> {table.capacity} org</div>
 {table.area && <div style={{ fontSize:10, color:'#9CA3AF', marginTop:3 }}>{table.area}</div>}
 </div>
 )
 })}
 </div>
 )}

 {/* Add/Edit Form */}
 {showForm && (
 <div style={S.overlay} onClick={()=>setShowForm(false)}>
 <div style={S.modal} onClick={e=>e.stopPropagation()}>
 <h3 style={{ margin:'0 0 20px', fontSize:18, fontWeight:900 }}>{editTable?'Edit':'Tambah'} Meja</h3>
 <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
 {[['Nama Meja *','name','text','Meja 1 / VIP-A'],['Area / Ruangan','area','text','Indoor / Outdoor'],['Catatan','notes','text','Dekat jendela...']].map(([label,key,type,ph])=>(
 <div key={key}>
 <label style={S.label}>{label}</label>
 <input type={type} value={form[key]} onChange={f(key)} placeholder={ph} style={S.inp} onFocus={fi} onBlur={fo}/>
 </div>
 ))}
 <div>
 <label style={S.label}>Kapasitas (orang)</label>
 <input type="number" min="1" max="50" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:Number(e.target.value)}))}
 style={S.inp} onFocus={fi} onBlur={fo}/>
 </div>
 </div>
 <div style={{ display:'flex', gap:10, marginTop:22 }}>
 <button style={{ ...S.btn('ghost'), flex:1 }} onClick={()=>setShowForm(false)}>Batal</button>
 <button style={{ ...S.btn('primary'), flex:2 }} onClick={handleSave}>{editTable?'Simpan':'Tambah Meja'}</button>
 </div>
 </div>
 </div>
 )}

 {/* Detail Modal */}
 {detailTable && (
 <div style={S.overlay} onClick={()=>setDetailTable(null)}>
 <div style={S.modal} onClick={e=>e.stopPropagation()}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
 <div>
 <h3 style={{ margin:'0 0 4px', fontSize:18, fontWeight:900 }}>{detailTable.name}</h3>
 <div style={{ fontSize:12, color:'#6B7280' }}> {detailTable.capacity} orang{detailTable.area?` • ${detailTable.area}`:''}</div>
 </div>
 <button style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9CA3AF' }} onClick={()=>setDetailTable(null)}>×</button>
 </div>

 {/* Status change */}
 <div style={{ marginBottom:18 }}>
 <div style={{ fontSize:12, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>Ubah Status:</div>
 <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
 {Object.entries(STATUS).map(([key,cfg])=>(
 <button key={key} onClick={()=>updateTable({...detailTable,status:key})}
 style={{ padding:'8px 14px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:'inherit', cursor:'pointer', border:`2px solid ${cfg.border}`,
 background:detailTable.status===key?cfg.dot:'#fff', color:detailTable.status===key?'#fff':cfg.text, opacity:detailTable.status===key?1:0.85, transition:'all 0.15s' }}>
 {cfg.icon} {cfg.label}
 </button>
 ))}
 </div>
 </div>

 {/* Recent transactions */}
 <div style={{ marginBottom:16 }}>
 <div style={{ fontSize:13, fontWeight:800, color:'#374151', marginBottom:10 }}>Transaksi Terakhir</div>
 {tableTrx.length === 0
 ? <div style={{ textAlign:'center', padding:'16px', color:'#9CA3AF', background:'#F9FAFB', borderRadius:10, fontSize:13 }}>Belum ada transaksi di meja ini</div>
 : tableTrx.map(t=>(
 <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'9px 12px', borderBottom:'1px solid #F9FAFB', fontSize:13 }}>
 <div>
 <div style={{ fontFamily:'monospace', fontSize:11, color:'#9CA3AF' }}>{t.id}</div>
 <div style={{ color:'#374151' }}>{new Date(t.date||t.createdAt).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
 </div>
 <div style={{ fontWeight:800 }}>{formatIDR(t.total)}</div>
 </div>
 ))
 }
 </div>

 <div style={{ display:'flex', gap:10 }}>
 <button style={{ ...S.btn('ghost'), flex:1 }} onClick={()=>{openEdit(detailTable);setDetailTable(null)}}>Edit</button>
 <button style={{ ...S.btn('danger'), flex:1 }} onClick={()=>{deleteTable(detailTable.id);setDetailTable(null)}}>Hapus</button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
