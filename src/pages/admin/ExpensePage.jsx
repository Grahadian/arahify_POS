// ============================================================
// MSME GROW POS — Pengeluaran (Expense) Page
// ============================================================
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatDate } from '@/utils/format'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'

const EXPENSE_CATEGORIES = [
 'Semua','Bahan Baku','Gaji Karyawan','Sewa Tempat','Listrik & Air',
 'Peralatan','Transportasi','Marketing','Pajak','Lainnya',
]

const EMPTY_FORM = { amount:'', category:'Bahan Baku', description:'', date: new Date().toISOString().slice(0,10) }

const ExpensePage = () => {
 const { expenses, addExpense, updateExpense, deleteExpense, transactions, settings } = useApp()

 const [modal, setModal] = useState(false)
 const [editTarget,setEditTarget]=useState(null)
 const [form, setForm] = useState(EMPTY_FORM)
 const [delConfirm,setDelConfirm]=useState(null)
 const [catFilter,setCatFilter]= useState('Semua')
 const [search, setSearch] = useState('')
 const [errors, setErrors] = useState({})

 // Date filter — default bulan ini
 const now = new Date()
 const defFrom = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
 const defTo = new Date().toISOString().slice(0,10)
 const [dateFrom, setDateFrom] = useState(defFrom)
 const [dateTo, setDateTo] = useState(defTo)

 const filtered = useMemo(() => {
 return expenses.filter(e => {
 const d = (e.date||e.createdAt||'').slice(0,10)
 const matchDate = (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo)
 const matchCat = catFilter === 'Semua' || e.category === catFilter
 const matchQ = !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase())
 return matchDate && matchCat && matchQ
 }).sort((a,b) => (b.date||b.createdAt||'') > (a.date||a.createdAt||'') ? 1 : -1)
 }, [expenses, dateFrom, dateTo, catFilter, search])

 const totalExpense = filtered.reduce((s,e) => s+(e.amount||0), 0)

 // Revenue in same period
 const totalRevenue = useMemo(() => transactions
 .filter(t => (!t.status||t.status==='completed') && (t.date||t.createdAt||'').slice(0,10) >= dateFrom && (t.date||t.createdAt||'').slice(0,10) <= dateTo)
 .reduce((s,t) => s+(t.total||0), 0),
 [transactions, dateFrom, dateTo])

 const totalHPP = useMemo(() => transactions
 .filter(t => (!t.status||t.status==='completed') && (t.date||t.createdAt||'').slice(0,10) >= dateFrom && (t.date||t.createdAt||'').slice(0,10) <= dateTo)
 .reduce((s,t) => s+(t.items||[]).reduce((ss,i)=>ss+(i.hpp||0)*(i.qty||0),0), 0),
 [transactions, dateFrom, dateTo])

 const grossProfit = totalRevenue - totalHPP
 const netProfit = grossProfit - totalExpense

 const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setModal(true) }
 const openEdit = (e) => { setEditTarget(e); setForm({ amount:String(e.amount), category:e.category, description:e.description||'', date:(e.date||e.createdAt||'').slice(0,10) }); setErrors({}); setModal(true) }

 const validate = () => {
 const err = {}
 if (!form.amount || Number(form.amount) <= 0) err.amount = 'Nominal harus lebih dari 0'
 if (!form.description.trim()) err.description = 'Keterangan wajib diisi'
 setErrors(err)
 return Object.keys(err).length === 0
 }

 const save = () => {
 if (!validate()) return
 const data = { amount:Number(form.amount), category:form.category, description:form.description.trim(), date:form.date }
 if (editTarget) updateExpense({ ...editTarget, ...data })
 else addExpense(data)
 setModal(false)
 }

 const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#FAFAFA' }
 const focusIn = e => { e.target.style.borderColor='#2563EB'; e.target.style.background='#fff' }
 const focusOut = e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#FAFAFA' }

 const CAT_COLORS = {
 'Bahan Baku':'#F97316','Gaji Karyawan':'#2563EB','Sewa Tempat':'#7C3AED',
 'Listrik & Air':'#EAB308','Peralatan':'#06B6D4','Transportasi':'#22C55E',
 'Marketing':'#EC4899','Pajak':'#EF4444','Lainnya':'#6B7280',
 }

 return (
 <div style={{ padding:'16px 20px', maxWidth:960, margin:'0 auto' }}>

 {/* Header */}
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
 <div>
 <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#111827' }}>Pengeluaran</h2>
 <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>Catat semua pengeluaran operasional bisnis</p>
 </div>
 <Button onClick={openAdd} variant="primary" icon="plus" size="sm">Tambah Pengeluaran</Button>
 </div>

 {/* Laba Rugi Summary */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
 {[
 { label:'Total Pendapatan', value:totalRevenue, color:'#16A34A', bg:'#F0FDF4', icon:'' },
 { label:'HPP', value:totalHPP, color:'#D97706', bg:'#FFFBEB', icon:'' },
 { label:'Laba Kotor', value:grossProfit, color:'#2563EB', bg:'#EFF6FF', icon:'' },
 { label:'Total Pengeluaran',value:totalExpense, color:'#EF4444', bg:'#FEF2F2', icon:'' },
 { label:'LABA BERSIH', value:netProfit, color:netProfit>=0?'#16A34A':'#EF4444', bg:netProfit>=0?'#F0FDF4':'#FEF2F2', icon:netProfit>=0?'':'', bold:true },
 ].map(s=>(
 <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:'12px 14px', border:`1px solid ${s.color}22` }}>
 <p style={{ margin:'0 0 4px', fontSize:11, color:'#6B7280', fontWeight:700 }}>{s.icon} {s.label}</p>
 <p style={{ margin:0, fontSize:s.bold?17:15, fontWeight:900, color:s.color }}>{formatIDR(s.value)}</p>
 </div>
 ))}
 </div>

 {/* Filter Bar */}
 <div style={{ background:'#fff', borderRadius:12, padding:'12px 14px', border:'1px solid #F1F5F9', marginBottom:14, display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
 <div style={{ display:'flex', gap:6, alignItems:'center' }}>
 <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ ...inp, width:130, padding:'7px 10px' }} />
 <span style={{ color:'#9CA3AF', fontSize:13 }}>–</span>
 <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ ...inp, width:130, padding:'7px 10px' }} />
 </div>
 <div style={{ position:'relative', flex:1, minWidth:160 }}>
 <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}><Icon name="search" size={14} color="#9CA3AF" /></span>
 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari keterangan..." style={{ ...inp, paddingLeft:32, padding:'8px 12px 8px 32px' }} />
 </div>
 </div>

 {/* Chart Pengeluaran Per Kategori */}
 {filtered.length > 0 && (() => {
 const catTotals = EXPENSE_CATEGORIES.filter(c=>c!=='Semua').map(cat => ({
 cat, total: filtered.filter(e=>e.category===cat).reduce((s,e)=>s+(e.amount||0),0), color: CAT_COLORS[cat]||'#6B7280'
 })).filter(x=>x.total>0).sort((a,b)=>b.total-a.total)
 const maxCat = Math.max(...catTotals.map(x=>x.total), 1)
 if (!catTotals.length) return null
 return (
 <div style={{ background:'#fff', borderRadius:14, padding:'16px 18px', border:'1px solid #F1F5F9', marginBottom:14 }}>
 <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800, color:'#111827' }}> Grafik Per Kategori</h3>
 {catTotals.map(({cat,total,color}) => (
 <div key={cat} style={{ marginBottom:10 }}>
 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
 <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{cat}</span>
 <span style={{ fontSize:12, fontWeight:800, color }}>
 {formatIDR(total)} <span style={{ fontWeight:400, color:'#9CA3AF' }}>({((total/totalExpense)*100).toFixed(1)}%)</span>
 </span>
 </div>
 <div style={{ height:8, background:'#F3F4F6', borderRadius:10, overflow:'hidden' }}>
 <div style={{ height:'100%', width:`${(total/maxCat)*100}%`, background:color, borderRadius:10, transition:'width 0.6s ease' }} />
 </div>
 </div>
 ))}
 </div>
 )
 })()}

 {/* Category filter chips */}
 <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:14, paddingBottom:4 }}>
 {EXPENSE_CATEGORIES.map(c=>(
 <button key={c} onClick={()=>setCatFilter(c)} style={{ padding:'5px 13px', borderRadius:20, border:`1.5px solid ${catFilter===c?CAT_COLORS[c]||'#2563EB':'#E5E7EB'}`, background:catFilter===c?(CAT_COLORS[c]||'#2563EB')+'15':'#fff', color:catFilter===c?CAT_COLORS[c]||'#2563EB':'#6B7280', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'all 0.15s' }}>
 {c}
 </button>
 ))}
 </div>

 {/* Total filtered */}
 {catFilter !== 'Semua' && (
 <div style={{ marginBottom:10, padding:'8px 12px', background:'#F9FAFB', borderRadius:8, fontSize:13, color:'#374151' }}>
 <strong>{filtered.length} pengeluaran</strong> · Total: <strong style={{ color:'#EF4444' }}>{formatIDR(totalExpense)}</strong>
 </div>
 )}

 {/* List */}
 <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
 {filtered.length === 0 ? (
 <div style={{ textAlign:'center', padding:'48px 24px', color:'#9CA3AF' }}>
 <div style={{ fontSize:40, marginBottom:12 }}></div>
 <p style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:'#374151' }}>Belum ada pengeluaran</p>
 <p style={{ margin:'0 0 16px', fontSize:13 }}>Catat pengeluaran untuk menghitung laba rugi yang akurat.</p>
 <Button onClick={openAdd} variant="primary" size="sm" icon="plus">Tambah Pengeluaran</Button>
 </div>
 ) : filtered.map(e => {
 const catColor = CAT_COLORS[e.category] || '#6B7280'
 return (
 <div key={e.id} style={{ background:'#fff', borderRadius:14, padding:'14px 16px', border:'1px solid #F1F5F9', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:12 }}>
 <div style={{ width:44, height:44, borderRadius:12, background:catColor+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>
 {e.category==='Bahan Baku'?'':e.category==='Gaji Karyawan'?'':e.category==='Sewa Tempat'?'':e.category==='Listrik & Air'?'':e.category==='Peralatan'?'':e.category==='Transportasi'?'':e.category==='Marketing'?'':e.category==='Pajak'?'':''}
 </div>
 <div style={{ flex:1, minWidth:0 }}>
 <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:700, color:'#111827' }}>{e.description}</p>
 <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
 <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:catColor+'15', color:catColor, fontWeight:700 }}>{e.category}</span>
 <span style={{ fontSize:11, color:'#9CA3AF' }}>{(e.date||e.createdAt||'').slice(0,10)}</span>
 </div>
 </div>
 <div style={{ textAlign:'right', flexShrink:0 }}>
 <p style={{ margin:'0 0 6px', fontSize:16, fontWeight:900, color:'#EF4444' }}>-{formatIDR(e.amount)}</p>
 <div style={{ display:'flex', gap:6 }}>
 <button onClick={()=>openEdit(e)} style={{ width:28, height:28, borderRadius:7, border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
 <Icon name="edit" size={13} color="#374151" />
 </button>
 <button onClick={()=>setDelConfirm(e)} style={{ width:28, height:28, borderRadius:7, border:'1.5px solid #FECACA', background:'#FEF2F2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
 <Icon name="trash" size={13} color="#EF4444" />
 </button>
 </div>
 </div>
 </div>
 )
 })}
 </div>

 {/* Add/Edit Modal */}
 <Modal open={modal} onClose={()=>setModal(false)} title={editTarget?'Edit Pengeluaran':'Tambah Pengeluaran'} maxWidth={440}>
 <div style={{ marginBottom:12 }}>
 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Nominal (Rp) *</label>
 <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="50000" style={inp} onFocus={focusIn} onBlur={focusOut} />
 {errors.amount&&<p style={{ margin:'4px 0 0', fontSize:11, color:'#EF4444' }}>{errors.amount}</p>}
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
 <div>
 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Kategori</label>
 <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{ ...inp, cursor:'pointer' }} onFocus={focusIn} onBlur={focusOut}>
 {EXPENSE_CATEGORIES.filter(c=>c!=='Semua').map(c=><option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 <div>
 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Tanggal</label>
 <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp} onFocus={focusIn} onBlur={focusOut} />
 </div>
 </div>
 <div style={{ marginBottom:20 }}>
 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Keterangan *</label>
 <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="e.g. Beli bahan baku ayam 5kg" style={inp} onFocus={focusIn} onBlur={focusOut} />
 {errors.description&&<p style={{ margin:'4px 0 0', fontSize:11, color:'#EF4444' }}>{errors.description}</p>}
 </div>
 <div style={{ display:'flex', gap:10 }}>
 <Button onClick={()=>setModal(false)} variant="secondary" fullWidth>Batal</Button>
 <Button onClick={save} variant="primary" fullWidth icon="check">{editTarget?'Simpan':'Tambah'}</Button>
 </div>
 </Modal>

 {/* Delete confirm */}
 <Modal open={!!delConfirm} onClose={()=>setDelConfirm(null)} title="Hapus Pengeluaran">
 <div style={{ textAlign:'center', marginBottom:20 }}>
 <div style={{ fontSize:48, marginBottom:10 }}></div>
 <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:800, color:'#111827' }}>Hapus "{delConfirm?.description}"?</h3>
 <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>Tindakan ini tidak dapat dibatalkan.</p>
 </div>
 <div style={{ display:'flex', gap:10 }}>
 <Button onClick={()=>setDelConfirm(null)} variant="secondary" fullWidth>Batal</Button>
 <Button onClick={()=>{deleteExpense(delConfirm.id);setDelConfirm(null)}} variant="danger" fullWidth>Hapus</Button>
 </div>
 </Modal>
 </div>
 )
}

export default ExpensePage
