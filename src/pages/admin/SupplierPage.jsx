// ============================================================
// MSME GROW POS — Supplier Page v2.0 (inline styles)
// ============================================================
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR } from '@/utils/format'

const S = {
 page: { padding: '16px 20px', maxWidth: 900, margin: '0 auto' },
 card: { background: '#fff', border: '1px solid #F1F5F9', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
 overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
 modal: { background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' },
 label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
 inp: { width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' },
 btn: (v) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:800, fontFamily:'inherit', cursor:'pointer', border:'none', ...(v==='primary'?{background:'#2563EB',color:'#fff'}:v==='danger'?{background:'#FEF2F2',color:'#DC2626',border:'1px solid #FECACA'}:{background:'#F3F4F6',color:'#374151',border:'1px solid #E5E7EB'}) }),
}
const fi = e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff' }
const fo = e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA' }

const EMPTY = { name:'', contact:'', phone:'', email:'', address:'', npwp:'', bankName:'', bankNo:'', bankHolder:'', category:'', notes:'' }

export default function SupplierPage() {
 const { suppliers = [], addSupplier, updateSupplier, deleteSupplier, purchaseOrders = [] } = useApp()

 const [search, setSearch] = useState('')
 const [form, setForm] = useState(EMPTY)
 const [editing, setEditing] = useState(null)
 const [showForm,setShowForm]= useState(false)
 const [detailId,setDetailId]= useState(null)
 const [delConf, setDelConf] = useState(null)

 const filtered = useMemo(() => suppliers.filter(s =>
 s.name.toLowerCase().includes(search.toLowerCase()) ||
 (s.contact||'').toLowerCase().includes(search.toLowerCase()) ||
 (s.category||'').toLowerCase().includes(search.toLowerCase())
 ), [suppliers, search])

 const openAdd = () => { setForm(EMPTY); setEditing(null); setShowForm(true) }
 const openEdit = (s) => { setForm({ ...EMPTY, ...s }); setEditing(s.id); setShowForm(true) }
 const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

 const handleSave = () => {
 if (!form.name.trim()) { alert('Nama supplier wajib diisi'); return }
 editing ? updateSupplier({ ...form, id: editing }) : addSupplier(form)
 setShowForm(false)
 }

 const detail = suppliers.find(s => s.id === detailId)
 const detailPOs = purchaseOrders.filter(po => po.supplierId === detailId)
 const totalBeli = detailPOs.filter(p => p.status === 'received').reduce((s, p) => s + (p.totalAmount || 0), 0)

 return (
 <div style={S.page}>
 {/* Header */}
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
 <div>
 <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#111827', letterSpacing:-0.5 }}> Supplier</h2>
 <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>{suppliers.length} supplier terdaftar</p>
 </div>
 <button style={S.btn('primary')} onClick={openAdd}>+ Tambah Supplier</button>
 </div>

 {/* Search */}
 <div style={{ position:'relative', marginBottom:16 }}>
 <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}></span>
 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, kontak, kategori..."
 style={{ ...S.inp, paddingLeft:38 }} onFocus={fi} onBlur={fo} />
 </div>

 {/* Stats */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
 {[
 ['Total Supplier', suppliers.length, '#2563EB', '#EFF6FF'],
 ['Transaksi Aktif', purchaseOrders.filter(p=>p.status==='ordered').length, '#D97706', '#FFFBEB'],
 ['PO Diterima', purchaseOrders.filter(p=>p.status==='received').length, '#059669', '#F0FDF4'],
 ].map(([label, val, color, bg]) => (
 <div key={label} style={{ ...S.card, padding:'16px 18px', background:bg }}>
 <div style={{ fontSize:24, fontWeight:900, color }}>{val}</div>
 <div style={{ fontSize:12, color:'#6B7280', marginTop:3 }}>{label}</div>
 </div>
 ))}
 </div>

 {/* Table */}
 {filtered.length === 0 ? (
 <div style={{ ...S.card, padding:'48px 24px', textAlign:'center', color:'#9CA3AF' }}>
 <div style={{ fontSize:48, marginBottom:12 }}></div>
 <div style={{ fontWeight:700, fontSize:15 }}>Belum ada supplier</div>
 <div style={{ fontSize:13, marginTop:6 }}>Tambahkan data supplier untuk memudahkan pencatatan pembelian</div>
 </div>
 ) : (
 <div style={{ ...S.card, overflow:'hidden' }}>
 <div style={{ overflowX:'auto' }}>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
 <thead>
 <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #F1F5F9' }}>
 {['Nama Supplier','Kontak','Telepon','Kategori','PO Aktif','Aksi'].map(h => (
 <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'#6B7280', whiteSpace:'nowrap' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filtered.map((s, i) => {
 const sPOs = purchaseOrders.filter(po => po.supplierId === s.id && po.status === 'ordered')
 return (
 <tr key={s.id} style={{ borderBottom:'1px solid #F9FAFB', background: i%2===0 ? '#fff' : '#FAFAFA' }}>
 <td style={{ padding:'12px 16px' }}>
 <button onClick={()=>setDetailId(s.id)} style={{ background:'none', border:'none', cursor:'pointer', fontWeight:800, color:'#111827', fontSize:13, padding:0, textAlign:'left' }}
 onMouseEnter={e=>e.target.style.color='#2563EB'} onMouseLeave={e=>e.target.style.color='#111827'}>
 {s.name}
 </button>
 {s.notes && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{s.notes.substring(0,40)}</div>}
 </td>
 <td style={{ padding:'12px 16px', color:'#6B7280' }}>{s.contact || '-'}</td>
 <td style={{ padding:'12px 16px', color:'#6B7280' }}>{s.phone || '-'}</td>
 <td style={{ padding:'12px 16px' }}>
 {s.category ? <span style={{ background:'#EFF6FF', color:'#1D4ED8', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>{s.category}</span> : <span style={{ color:'#D1D5DB' }}>-</span>}
 </td>
 <td style={{ padding:'12px 16px' }}>
 {sPOs.length > 0 ? <span style={{ background:'#FEF3C7', color:'#92400E', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>{sPOs.length} PO</span> : <span style={{ color:'#D1D5DB' }}>-</span>}
 </td>
 <td style={{ padding:'12px 16px' }}>
 <div style={{ display:'flex', gap:6 }}>
 <button style={S.btn('ghost')} onClick={()=>openEdit(s)}>Edit</button>
 <button style={S.btn('danger')} onClick={()=>setDelConf(s)}>Hapus</button>
 </div>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Form Modal */}
 {showForm && (
 <div style={S.overlay} onClick={()=>setShowForm(false)}>
 <div style={S.modal} onClick={e=>e.stopPropagation()}>
 <h3 style={{ margin:'0 0 20px', fontSize:18, fontWeight:900, color:'#111827' }}>{editing?'Edit':'Tambah'} Supplier</h3>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
 {[['Nama Supplier *','name','text','PT. Maju Bersama'],['Nama Kontak','contact','text','Budi Santoso'],['No. Telepon','phone','tel','08123456789'],['Email','email','email','budi@supplier.com'],['Kategori Barang','category','text','Bahan Baku'],['NPWP','npwp','text','12.345.678.9']].map(([label,key,type,ph])=>(
 <div key={key}>
 <label style={S.label}>{label}</label>
 <input type={type} value={form[key]} onChange={f(key)} placeholder={ph} style={S.inp} onFocus={fi} onBlur={fo}/>
 </div>
 ))}
 <div style={{ gridColumn:'1/-1' }}>
 <label style={S.label}>Alamat</label>
 <textarea value={form.address} onChange={f('address')} rows={2} placeholder="Alamat lengkap..."
 style={{ ...S.inp, resize:'none' }} onFocus={fi} onBlur={fo}/>
 </div>
 <div style={{ gridColumn:'1/-1', background:'#F8FAFC', borderRadius:12, padding:'14px 16px' }}>
 <div style={{ fontSize:12, fontWeight:800, color:'#374151', marginBottom:12 }}> Informasi Bank</div>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
 {[['Nama Bank','bankName','BCA / BRI'],['No. Rekening','bankNo','1234567890'],['Atas Nama','bankHolder','PT Maju']].map(([l,k,p])=>(
 <div key={k}>
 <label style={S.label}>{l}</label>
 <input value={form[k]} onChange={f(k)} placeholder={p} style={S.inp} onFocus={fi} onBlur={fo}/>
 </div>
 ))}
 </div>
 </div>
 <div style={{ gridColumn:'1/-1' }}>
 <label style={S.label}>Catatan</label>
 <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Catatan tambahan..."
 style={{ ...S.inp, resize:'none' }} onFocus={fi} onBlur={fo}/>
 </div>
 </div>
 <div style={{ display:'flex', gap:10, marginTop:22 }}>
 <button style={{ ...S.btn('ghost'), flex:1 }} onClick={()=>setShowForm(false)}>Batal</button>
 <button style={{ ...S.btn('primary'), flex:2 }} onClick={handleSave}>{editing?'Simpan Perubahan':'Tambah Supplier'}</button>
 </div>
 </div>
 </div>
 )}

 {/* Detail Modal */}
 {detail && (
 <div style={S.overlay} onClick={()=>setDetailId(null)}>
 <div style={S.modal} onClick={e=>e.stopPropagation()}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
 <div>
 <h3 style={{ margin:'0 0 4px', fontSize:18, fontWeight:900, color:'#111827' }}>{detail.name}</h3>
 {detail.category && <span style={{ background:'#EFF6FF', color:'#1D4ED8', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>{detail.category}</span>}
 </div>
 <button style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9CA3AF' }} onClick={()=>setDetailId(null)}>×</button>
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
 {[[' Kontak',detail.contact],[' Telepon',detail.phone],[' Email',detail.email],[' Alamat',detail.address],[' NPWP',detail.npwp]].filter(([,v])=>v).map(([l,v])=>(
 <div key={l} style={{ background:'#F8FAFC', borderRadius:10, padding:'10px 12px' }}>
 <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:3 }}>{l}</div>
 <div style={{ fontSize:13, fontWeight:700, color:'#374151' }}>{v}</div>
 </div>
 ))}
 </div>
 {detail.bankName && (
 <div style={{ background:'#EFF6FF', borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
 <div style={{ fontSize:12, fontWeight:800, color:'#1D4ED8', marginBottom:6 }}> Rekening Bank</div>
 <div style={{ fontSize:13, color:'#1E40AF' }}>{detail.bankName} — {detail.bankNo} <span style={{ color:'#6B7280' }}>a/n</span> {detail.bankHolder}</div>
 </div>
 )}
 <div>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
 <div style={{ fontSize:14, fontWeight:800, color:'#111827' }}> Riwayat PO ({detailPOs.length})</div>
 <div style={{ fontSize:13, color:'#059669', fontWeight:700 }}>Total: {formatIDR(totalBeli)}</div>
 </div>
 {detailPOs.length === 0 ? (
 <div style={{ textAlign:'center', padding:'20px', color:'#9CA3AF', background:'#F9FAFB', borderRadius:12, fontSize:13 }}>Belum ada PO untuk supplier ini</div>
 ) : (
 <div style={{ maxHeight:180, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
 {detailPOs.map(po=>(
 <div key={po.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', background:'#F9FAFB', borderRadius:10 }}>
 <div>
 <div style={{ fontSize:13, fontWeight:700 }}>{po.id}</div>
 <div style={{ fontSize:11, color:'#9CA3AF' }}>{new Date(po.createdAt).toLocaleDateString('id-ID')}</div>
 </div>
 <div style={{ textAlign:'right' }}>
 <div style={{ fontSize:13, fontWeight:800 }}>{formatIDR(po.totalAmount)}</div>
 <span style={{ fontSize:11, fontWeight:700, background: po.status==='received'?'#F0FDF4':po.status==='ordered'?'#EFF6FF':'#FEF3C7', color: po.status==='received'?'#166534':po.status==='ordered'?'#1D4ED8':'#92400E', padding:'2px 7px', borderRadius:6 }}>
 {po.status==='received'?' Diterima':po.status==='ordered'?' Dipesan':'⏳ Pending'}
 </span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 <div style={{ display:'flex', gap:10, marginTop:18 }}>
 <button style={{ ...S.btn('ghost'), flex:1 }} onClick={()=>setDetailId(null)}>Tutup</button>
 <button style={{ ...S.btn('primary'), flex:1 }} onClick={()=>{openEdit(detail);setDetailId(null)}}>Edit Supplier</button>
 </div>
 </div>
 </div>
 )}

 {/* Delete confirm */}
 {delConf && (
 <div style={S.overlay} onClick={()=>setDelConf(null)}>
 <div style={{ ...S.modal, maxWidth:380 }} onClick={e=>e.stopPropagation()}>
 <div style={{ textAlign:'center', marginBottom:18 }}>
 <div style={{ fontSize:48, marginBottom:10 }}></div>
 <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:900, color:'#111827' }}>Hapus Supplier?</h3>
 <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>Yakin hapus <strong>{delConf.name}</strong>?<br/>Data supplier akan dihapus permanen.</p>
 </div>
 <div style={{ display:'flex', gap:10 }}>
 <button style={{ ...S.btn('ghost'), flex:1 }} onClick={()=>setDelConf(null)}>Batal</button>
 <button style={{ ...S.btn('danger'), flex:1, background:'#EF4444', color:'#fff', border:'none' }} onClick={()=>{deleteSupplier(delConf.id);setDelConf(null)}}>Ya, Hapus</button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
