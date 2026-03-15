// ============================================================
// MSME GROW POS — Purchase Order Page v2.0 (inline styles)
// ============================================================
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR } from '@/utils/format'

const S = {
 page: { padding:'14px', margin:'0 auto' },
 card: { background:'#fff', border:'1px solid #F1F5F9', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
 overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:0 },
 modal: { background:'#fff', borderRadius:'20px 20px 0 0', padding:'16px 20px 20px', width:'100%', maxWidth:560, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'92dvh', overflowY:'auto', WebkitOverflowScrolling:'touch' },
 label: { display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 },
 inp: { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#FAFAFA' },
 btn: (v) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:800, fontFamily:'inherit', cursor:'pointer', border:'none', ...(v==='primary'?{background:'#2563EB',color:'#fff'}:v==='green'?{background:'#059669',color:'#fff'}:v==='danger'?{background:'#FEF2F2',color:'#DC2626',border:'1px solid #FECACA'}:{background:'#F3F4F6',color:'#374151',border:'1px solid #E5E7EB'}) }),
}

const STATUS = {
 draft: { label:'Draft', bg:'#F3F4F6', color:'#374151' },
 ordered: { label:'Dipesan', bg:'#DBEAFE', color:'#1D4ED8' },
 partial: { label:'Sebagian', bg:'#FEF3C7', color:'#92400E' },
 received: { label:'Diterima', bg:'#D1FAE5', color:'#065F46' },
 cancelled:{ label:'Dibatal', bg:'#FEE2E2', color:'#B91C1C' },
}

const fi = e => { e.target.style.borderColor='#2563EB'; e.target.style.background='#fff' }
const fo = e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#FAFAFA' }

export default function PurchaseOrderPage() {
 const { purchaseOrders=[], suppliers=[], products, addPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder } = useApp()

 const [view, setView] = useState('list')
 const [filterStatus,setFilterStatus]= useState('all')
 const [search, setSearch] = useState('')
 const [detailPO, setDetailPO] = useState(null)
 const [receiveModal,setReceiveModal]= useState(null)
 const [receiveQtys, setReceiveQtys] = useState({})

 const [poForm, setPoForm] = useState({ supplierId:'', expectedDate:'', notes:'', items:[{ productId:'', productName:'', qty:1, unitCost:0 }] })

 const filtered = useMemo(() => {
 let list = [...purchaseOrders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
 if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus)
 if (search) list = list.filter(p => p.id.toLowerCase().includes(search.toLowerCase()) || (p.supplierName||'').toLowerCase().includes(search.toLowerCase()))
 return list
 }, [purchaseOrders, filterStatus, search])

 const poTotal = useMemo(() => poForm.items.reduce((s,i) => s + (Number(i.qty)||0)*(Number(i.unitCost)||0), 0), [poForm.items])

 const addItem = () => setPoForm(p => ({ ...p, items:[...p.items, {productId:'',productName:'',qty:1,unitCost:0}] }))
 const removeItem = idx => setPoForm(p => ({ ...p, items:p.items.filter((_,i)=>i!==idx) }))

 const updateItem = (idx, key, val) => setPoForm(p => ({
 ...p, items: p.items.map((it,i) => {
 if (i !== idx) return it
 if (key === 'productId') {
 const prod = products.find(pr => pr.id === val)
 return { ...it, productId:val, productName:prod?.name||'', unitCost:prod?.hpp||0 }
 }
 return { ...it, [key]:val }
 })
 }))

 const handleCreate = () => {
 const supplier = suppliers.find(s => s.id === poForm.supplierId)
 if (!poForm.supplierId) { alert('Pilih supplier terlebih dahulu'); return }
 const validItems = poForm.items.filter(i => i.productId && i.qty > 0)
 if (!validItems.length) { alert('Tambahkan minimal 1 produk'); return }
 addPurchaseOrder({ supplierId:poForm.supplierId, supplierName:supplier?.name||'-', expectedDate:poForm.expectedDate, notes:poForm.notes, items:validItems, totalAmount:validItems.reduce((s,i)=>s+i.qty*i.unitCost,0), status:'ordered' })
 setPoForm({ supplierId:'', expectedDate:'', notes:'', items:[{productId:'',productName:'',qty:1,unitCost:0}] })
 setView('list')
 }

 const openReceive = (po) => {
 const qtys = {}
 po.items.forEach(it => { qtys[it.productId] = it.qty - (it.receivedQty||0) })
 setReceiveQtys(qtys); setReceiveModal(po)
 }

 const statusOrder = ['all','ordered','partial','received','cancelled']

 return (
 <div style={S.page}>
 {/* Header */}
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
 <div>
 <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#111827', letterSpacing:-0.5 }}> Purchase Order</h2>
 <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>{purchaseOrders.length} PO total</p>
 </div>
 <button style={S.btn(view==='create'?'ghost':'primary')} onClick={()=>setView(v=>v==='create'?'list':'create')}>
 {view==='create'?'← Kembali':'+ Buat PO Baru'}
 </button>
 </div>

 {view === 'create' ? (
 /* CREATE FORM */
 <div style={{ ...S.card, padding:'22px 24px' }}>
 <h3 style={{ margin:'0 0 20px', fontSize:16, fontWeight:800, color:'#111827' }}>Buat Purchase Order Baru</h3>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20 }}>
 <div>
 <label style={S.label}>Supplier *</label>
 <select value={poForm.supplierId} onChange={e=>setPoForm(p=>({...p,supplierId:e.target.value}))}
 style={{ ...S.inp, appearance:'auto' }} onFocus={fi} onBlur={fo}>
 <option value="">-- Pilih Supplier --</option>
 {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
 </select>
 {!suppliers.length && <p style={{ margin:'5px 0 0', fontSize:11, color:'#D97706' }}>Tambahkan supplier di menu Supplier</p>}
 </div>
 <div>
 <label style={S.label}>Est. Tiba</label>
 <input type="date" value={poForm.expectedDate} onChange={e=>setPoForm(p=>({...p,expectedDate:e.target.value}))} style={S.inp} onFocus={fi} onBlur={fo}/>
 </div>
 <div>
 <label style={S.label}>Catatan PO</label>
 <input value={poForm.notes} onChange={e=>setPoForm(p=>({...p,notes:e.target.value}))} placeholder="Catatan..." style={S.inp} onFocus={fi} onBlur={fo}/>
 </div>
 </div>

 <div style={{ border:'1px solid #F1F5F9', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'#F8FAFC', borderBottom:'1px solid #F1F5F9' }}>
 <span style={{ fontSize:13, fontWeight:800, color:'#374151' }}>Item Pembelian</span>
 <button style={{ ...S.btn('ghost'), padding:'6px 14px', fontSize:12 }} onClick={addItem}>+ Tambah Item</button>
 </div>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
 <thead>
 <tr style={{ background:'#F9FAFB' }}>
 {['Produk','Jumlah','Harga Beli (HPP)','Subtotal',''].map(h=>(
 <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#6B7280' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {poForm.items.map((item,idx)=>(
 <tr key={idx} style={{ borderTop:'1px solid #F9FAFB' }}>
 <td style={{ padding:'10px 14px' }}>
 <select value={item.productId} onChange={e=>updateItem(idx,'productId',e.target.value)}
 style={{ ...S.inp, width:180, appearance:'auto' }} onFocus={fi} onBlur={fo}>
 <option value="">-- Pilih --</option>
 {products.filter(p=>p.active!==false).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </td>
 <td style={{ padding:'10px 14px' }}>
 <input type="number" min="1" value={item.qty} onChange={e=>updateItem(idx,'qty',Number(e.target.value))}
 style={{ ...S.inp, width:70, textAlign:'center' }} onFocus={fi} onBlur={fo}/>
 </td>
 <td style={{ padding:'10px 14px' }}>
 <input type="number" min="0" value={item.unitCost} onChange={e=>updateItem(idx,'unitCost',Number(e.target.value))}
 style={{ ...S.inp, width:120, textAlign:'right' }} onFocus={fi} onBlur={fo}/>
 </td>
 <td style={{ padding:'10px 14px', fontWeight:800, color:'#059669' }}>{formatIDR(item.qty*item.unitCost)}</td>
 <td style={{ padding:'10px 14px' }}>
 {poForm.items.length > 1 && <button onClick={()=>removeItem(idx)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#EF4444', lineHeight:1 }}>×</button>}
 </td>
 </tr>
 ))}
 </tbody>
 <tfoot>
 <tr style={{ borderTop:'2px solid #F1F5F9', background:'#F8FAFC' }}>
 <td colSpan={3} style={{ padding:'12px 16px', textAlign:'right', fontWeight:900, fontSize:14 }}>Total PO:</td>
 <td style={{ padding:'12px 16px', fontWeight:900, fontSize:16, color:'#059669' }}>{formatIDR(poTotal)}</td>
 <td></td>
 </tr>
 </tfoot>
 </table>
 </div>

 <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
 <button style={S.btn('ghost')} onClick={()=>setView('list')}>Batal</button>
 <button style={S.btn('primary')} onClick={handleCreate}> Buat Purchase Order</button>
 </div>
 </div>
 ) : (
 /* LIST */
 <>
 <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16 }}>
 <div style={{ position:'relative', flex:1, minWidth:200 }}>
 <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14 }}></span>
 <input placeholder="Cari PO ID atau supplier..." value={search} onChange={e=>setSearch(e.target.value)}
 style={{ ...S.inp, paddingLeft:36 }} onFocus={fi} onBlur={fo}/>
 </div>
 <div style={{ display:'flex', gap:6 }}>
 {statusOrder.map(st=>(
 <button key={st} onClick={()=>setFilterStatus(st)}
 style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', transition:'all 0.15s',
 background: filterStatus===st?'#2563EB':'#fff', color:filterStatus===st?'#fff':'#6B7280', borderColor:filterStatus===st?'#2563EB':'#E5E7EB' }}>
 {st==='all'?'Semua':STATUS[st]?.label}
 </button>
 ))}
 </div>
 </div>

 {filtered.length === 0 ? (
 <div style={{ ...S.card, padding:'48px 24px', textAlign:'center', color:'#9CA3AF' }}>
 <div style={{ fontSize:48, marginBottom:12 }}></div>
 <div style={{ fontWeight:700 }}>Belum ada Purchase Order</div>
 <div style={{ fontSize:13, marginTop:6 }}>Buat PO untuk mencatat pembelian dari supplier</div>
 </div>
 ) : (
 <div style={{ ...S.card, overflow:'hidden' }}>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
 <thead>
 <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #F1F5F9' }}>
 {['No. PO','Supplier','Tanggal','Est. Tiba','Total','Status','Aksi'].map(h=>(
 <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'#6B7280', whiteSpace:'nowrap' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filtered.map((po,i)=>{
 const st = STATUS[po.status] || STATUS.draft
 return (
 <tr key={po.id} style={{ borderBottom:'1px solid #F9FAFB', background:i%2===0?'#fff':'#FAFAFA' }}>
 <td style={{ padding:'12px 16px' }}>
 <button onClick={()=>setDetailPO(po)} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'monospace', fontWeight:800, color:'#2563EB', fontSize:13 }}>{po.id}</button>
 </td>
 <td style={{ padding:'12px 16px', fontWeight:700 }}>{po.supplierName}</td>
 <td style={{ padding:'12px 16px', color:'#6B7280' }}>{new Date(po.createdAt).toLocaleDateString('id-ID')}</td>
 <td style={{ padding:'12px 16px', color:'#6B7280' }}>{po.expectedDate?new Date(po.expectedDate).toLocaleDateString('id-ID'):'-'}</td>
 <td style={{ padding:'12px 16px', fontWeight:800 }}>{formatIDR(po.totalAmount)}</td>
 <td style={{ padding:'12px 16px' }}>
 <span style={{ background:st.bg, color:st.color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{st.label}</span>
 </td>
 <td style={{ padding:'12px 16px' }}>
 <div style={{ display:'flex', gap:6 }}>
 {(po.status==='ordered'||po.status==='partial') && <button style={{ ...S.btn('green'), padding:'6px 12px', fontSize:12 }} onClick={()=>openReceive(po)}>Terima</button>}
 {po.status==='ordered' && <button style={{ ...S.btn('danger'), padding:'6px 12px', fontSize:12 }} onClick={()=>updatePurchaseOrder({...po,status:'cancelled'})}>Batal</button>}
 </div>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 )}
 </>
 )}

 {/* Detail Modal */}
 {detailPO && (
 <div style={S.overlay} onClick={()=>setDetailPO(null)}>
 <div style={S.modal} onClick={e=>e.stopPropagation()}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
 <div>
 <h3 style={{ margin:'0 0 4px', fontSize:16, fontWeight:900, color:'#111827' }}>Detail PO</h3>
 <span style={{ fontFamily:'monospace', fontSize:14, color:'#2563EB', fontWeight:800 }}>{detailPO.id}</span>
 </div>
 <button style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9CA3AF' }} onClick={()=>setDetailPO(null)}>×</button>
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:8, marginBottom:14 }}>
 {[['Supplier',detailPO.supplierName],['Status',STATUS[detailPO.status]?.label],['Dibuat',new Date(detailPO.createdAt).toLocaleDateString('id-ID')],['Est. Tiba',detailPO.expectedDate||'-']].map(([l,v])=>(
 <div key={l} style={{ background:'#F8FAFC', borderRadius:8, padding:'8px 12px' }}>
 <div style={{ fontSize:11, color:'#9CA3AF' }}>{l}</div>
 <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginTop:2 }}>{v}</div>
 </div>
 ))}
 </div>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, border:'1px solid #F1F5F9', borderRadius:10, overflow:'hidden' }}>
 <thead><tr style={{ background:'#F8FAFC' }}>{['Produk','Dipesan','Diterima','HPP','Subtotal'].map(h=><th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, color:'#6B7280' }}>{h}</th>)}</tr></thead>
 <tbody>{(detailPO.items||[]).map((it,i)=>(
 <tr key={i} style={{ borderTop:'1px solid #F9FAFB' }}>
 <td style={{ padding:'10px 12px' }}>{it.productName}</td>
 <td style={{ padding:'10px 12px', textAlign:'center' }}>{it.qty}</td>
 <td style={{ padding:'10px 12px', textAlign:'center', color:'#059669', fontWeight:700 }}>{it.receivedQty||0}</td>
 <td style={{ padding:'10px 12px' }}>{formatIDR(it.unitCost)}</td>
 <td style={{ padding:'10px 12px', fontWeight:800 }}>{formatIDR(it.qty*it.unitCost)}</td>
 </tr>
 ))}</tbody>
 <tfoot><tr style={{ borderTop:'2px solid #F1F5F9', background:'#F8FAFC' }}>
 <td colSpan={4} style={{ padding:'10px 12px', textAlign:'right', fontWeight:900 }}>Total:</td>
 <td style={{ padding:'10px 12px', fontWeight:900, color:'#059669' }}>{formatIDR(detailPO.totalAmount)}</td>
 </tr></tfoot>
 </table>
 <button style={{ ...S.btn('ghost'), width:'100%', marginTop:16, justifyContent:'center' }} onClick={()=>setDetailPO(null)}>Tutup</button>
 </div>
 </div>
 )}

 {/* Receive Modal */}
 {receiveModal && (
 <div style={S.overlay} onClick={()=>setReceiveModal(null)}>
 <div style={{ ...S.modal, maxWidth:460 }} onClick={e=>e.stopPropagation()}>
 <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:900, color:'#111827' }}> Terima Barang</h3>
 <p style={{ margin:'0 0 18px', fontSize:13, color:'#6B7280' }}>Masukkan jumlah barang yang benar-benar diterima. Stok akan otomatis ditambah.</p>
 <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
 {receiveModal.items.map(it=>(
 <div key={it.productId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#F8FAFC', borderRadius:12, gap:12 }}>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:13, fontWeight:700 }}>{it.productName}</div>
 <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>Dipesan: {it.qty} | Sudah diterima: {it.receivedQty||0}</div>
 </div>
 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
 <span style={{ fontSize:12, color:'#6B7280' }}>Terima:</span>
 <input type="number" min="0" max={it.qty-(it.receivedQty||0)}
 value={receiveQtys[it.productId]||0}
 onChange={e=>setReceiveQtys(p=>({...p,[it.productId]:Number(e.target.value)}))}
 style={{ ...S.inp, width:72, textAlign:'center', fontSize:16, fontWeight:800 }} onFocus={fi} onBlur={fo}/>
 </div>
 </div>
 ))}
 </div>
 <div style={{ display:'flex', gap:10 }}>
 <button style={{ ...S.btn('ghost'), flex:1 }} onClick={()=>setReceiveModal(null)}>Batal</button>
 <button style={{ ...S.btn('green'), flex:2 }} onClick={()=>{receivePurchaseOrder(receiveModal.id,receiveQtys);setReceiveModal(null)}}> Konfirmasi Penerimaan</button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
