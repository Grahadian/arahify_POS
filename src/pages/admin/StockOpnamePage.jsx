// ============================================================
// MSME GROW POS — Stock Opname Page v2.0 (inline styles)
// ============================================================
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR } from '@/utils/format'

const S = {
 page: { padding:'14px', margin:'0 auto' },
 card: { background:'#fff', border:'1px solid #F1F5F9', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
 overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:0 },
 modal: { background:'#fff', borderRadius:'20px 20px 0 0', padding:'14px 20px 20px', width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'92dvh', overflowY:'auto', WebkitOverflowScrolling:'touch' },
 label: { display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 },
 inp: { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#FAFAFA' },
 btn: (v) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:800, fontFamily:'inherit', cursor:'pointer', border:'none', ...(v==='primary'?{background:'#2563EB',color:'#fff'}:v==='green'?{background:'#059669',color:'#fff'}:{background:'#F3F4F6',color:'#374151',border:'1px solid #E5E7EB'}) }),
}
const fi = e => { e.target.style.borderColor='#2563EB'; e.target.style.background='#fff' }
const fo = e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#FAFAFA' }

export default function StockOpnamePage() {
 const { products, updateProduct, stockOpnames=[], addStockOpname } = useApp()

 const [tab, setTab] = useState('opname')
 const [search, setSearch] = useState('')
 const [catFilter, setCatFilter] = useState('Semua')
 const [counts, setCounts] = useState({})
 const [note, setNote] = useState('')
 const [showConfirm, setShowConfirm] = useState(false)
 const [detailOpname, setDetailOpname] = useState(null)

 const activeProducts = useMemo(() => products.filter(p => p.active !== false && !p.hasVariants), [products])
 const categories = useMemo(() => ['Semua', ...new Set(activeProducts.map(p=>p.category).filter(Boolean))], [activeProducts])

 const filtered = useMemo(() => {
 let list = activeProducts
 if (catFilter !== 'Semua') list = list.filter(p => p.category === catFilter)
 if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku||'').toLowerCase().includes(search.toLowerCase()))
 return list
 }, [activeProducts, catFilter, search])

  const differences = useMemo(() =>
    filtered
      .filter(p => counts[p.id] !== undefined && counts[p.id] !== '')
      .map(p => {
        const actual    = Number(counts[p.id])
        const system    = p.stock || 0
        const diff      = actual - system
        const hpp       = p.hpp  || 0
        const lossValue = diff < 0 ? Math.abs(diff) * hpp : 0
        const gainValue = diff > 0 ? diff * hpp : 0
        return { ...p, actual, system, diff, hpp, lossValue, gainValue }
      })
  , [filtered, counts])

  const totalLoss = differences.filter(d => d.diff < 0).reduce((s, d) => s + d.lossValue, 0)
  const totalGain = differences.filter(d => d.diff > 0).reduce((s, d) => s + d.gainValue, 0)
  const counted   = Object.keys(counts).filter(k => counts[k] !== '').length

  const handleSave = () => {
    const adjs = differences.map(d => ({
      productId  : d.id,
      productName: d.name,
      before     : d.system,
      actual     : d.actual,
      diff       : d.diff,
      hpp        : d.hpp,
      lossValue  : d.lossValue,
      gainValue  : d.gainValue,
    }))
    adjs.forEach(adj => {
      const prod = products.find(p => p.id === adj.productId)
      if (prod) updateProduct({ ...prod, stock: adj.actual })
    })
    const diffCount = adjs.filter(a => a.diff !== 0).length
    const lossItems = adjs.filter(a => a.diff < 0).length
    const gainItems = adjs.filter(a => a.diff > 0).length
    const autoNote  = note.trim() ||
      (diffCount === 0 ? 'Tidak ada selisih — stok sesuai' :
      `${diffCount} produk selisih: ${lossItems} kurang (rugi ${formatIDR(totalLoss)}), ${gainItems} lebih`)
    addStockOpname({
      date         : new Date().toISOString(),
      note         : autoNote,
      adjustments  : adjs,
      totalProducts: counted,
      totalLoss,
      totalGain,
      diffCount,
    })
    setCounts({}); setNote(''); setShowConfirm(false); setTab('history')
  }

 return (
 <div style={S.page}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
 <div>
 <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:900, color:'#111827', letterSpacing:-0.5 }}> Stock Opname</h2>
 <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>Hitung fisik stok dan koreksi selisih</p>
 </div>
 <div style={{ display:'flex', gap:8 }}>
 {['opname','history'].map(t => (
 <button key={t} onClick={()=>setTab(t)}
 style={{ ...S.btn(tab===t?'primary':'ghost'), padding:'9px 18px' }}>
 {t==='opname'?' Opname':' Riwayat'}
 </button>
 ))}
 </div>
 </div>

 {tab === 'opname' ? (
 <>
 {counted > 0 && (
 <div style={{ background:'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border:'1px solid #BFDBFE', borderRadius:14, padding:'14px 18px', marginBottom:18, display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12 }}>
 <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
 {[['Dihitung',counted,'#1D4ED8'],['Stok Kurang',differences.filter(d=>d.diff<0).length,'#EF4444'],['Stok Lebih',differences.filter(d=>d.diff>0).length,'#059669'],['Nilai Selisih Kurang',totalLoss>0?`-${formatIDR(totalLoss)}`:'Rp 0','#DC2626']].map(([l,v,c])=>(
 <div key={l}><span style={{ fontSize:12, color:'#6B7280' }}>{l}: </span><strong style={{ color:c }}>{v}</strong></div>
 ))}
 </div>
 <button style={S.btn('primary')} onClick={()=>setShowConfirm(true)}> Selesaikan Opname</button>
 </div>
 )}

 <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
 <div style={{ position:'relative', flex:1, minWidth:200 }}>
 <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14 }}></span>
 <input placeholder="Cari produk / SKU..." value={search} onChange={e=>setSearch(e.target.value)} style={{ ...S.inp, paddingLeft:36 }} onFocus={fi} onBlur={fo}/>
 </div>
 <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{ ...S.inp, width:'auto', appearance:'auto' }} onFocus={fi} onBlur={fo}>
 {categories.map(c=><option key={c}>{c}</option>)}
 </select>
 </div>

  <div style={{ ...S.card, overflow:'hidden', overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
  <table style={{ width:'100%', minWidth:480, borderCollapse:'collapse', fontSize:13 }}>
 <thead>
 <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #F1F5F9' }}>
 {['Produk','SKU','Stok Sistem','Stok Fisik','Selisih','Nilai Selisih'].map(h=>(
 <th key={h} style={{ padding:'14px', textAlign:'left', fontWeight:700, color:'#6B7280' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filtered.map((p,i) => {
 const actual = counts[p.id] !== undefined ? Number(counts[p.id]) : ''
 const diff = actual !== '' ? actual - (p.stock||0) : null
 const rowBg = actual!==''&&diff!==0 ? (diff<0?'#FFF1F2':'#F0FDF4') : i%2===0?'#fff':'#FAFAFA'
 return (
 <tr key={p.id} style={{ borderBottom:'1px solid #F9FAFB', background:rowBg }}>
 <td style={{ padding:'11px 14px', fontWeight:700, color:'#111827' }}>{p.name}</td>
 <td style={{ padding:'11px 14px', color:'#9CA3AF', fontFamily:'monospace', fontSize:11 }}>{p.sku||'-'}</td>
 <td style={{ padding:'11px 14px', textAlign:'center', fontWeight:700, fontSize:15 }}>{p.stock||0}</td>
 <td style={{ padding:'11px 14px' }}>
 <input type="number" min="0" value={actual} placeholder={String(p.stock||0)}
 onChange={e=>setCounts(prev=>({...prev,[p.id]:e.target.value}))}
 style={{ ...S.inp, width:80, textAlign:'center', fontSize:15, fontWeight:800, ...(actual!==''&&diff!==0?{borderColor:'#F97316',background:'#FFFBEB'}:{}) }}
 onFocus={fi} onBlur={fo}/>
 </td>
              <td style={{ padding:'11px 14px', textAlign:'center', fontWeight:900, fontSize:15 }}>
                {diff !== null
                  ? <span style={{ color:diff>0?'#059669':diff<0?'#EF4444':'#9CA3AF', background:diff!==0?(diff<0?'#FFF1F2':'#F0FDF4'):'transparent', borderRadius:6, padding:'2px 8px', display:'inline-block' }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  : <span style={{ color:'#E5E7EB' }}>—</span>}
              </td>
              <td style={{ padding:'11px 14px', fontWeight:700 }}>
                {diff !== null && diff !== 0 ? (
                  <div>
                    <span style={{ color:diff<0?'#EF4444':'#059669', fontWeight:800 }}>
                      {diff < 0 ? '−' : '+'}Rp {Math.abs(diff * (p.hpp||0)).toLocaleString('id-ID')}
                    </span>
                    {(p.hpp||0) === 0 && (
                      <span style={{ fontSize:10, color:'#F59E0B', display:'block' }}>HPP belum diisi</span>
                    )}
                  </div>
                ) : <span style={{ color:'#E5E7EB' }}>—</span>}
              </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 <div style={{ padding:'10px 14px', fontSize:11, color:'#9CA3AF', borderTop:'1px solid #F9FAFB', textAlign:'center' }}>
 Isi kolom "Stok Fisik" dengan hasil hitung fisik. Kosongkan jika tidak dihitung.
 </div>
 </div>
 </>
 ) : (
 /* History */
 <div>
 {stockOpnames.length === 0 ? (
 <div style={{ ...S.card, padding:'48px 24px', textAlign:'center', color:'#9CA3AF' }}>
 <div style={{ fontSize:48, marginBottom:12 }}></div>
 <div style={{ fontWeight:700 }}>Belum ada riwayat opname</div>
 </div>
 ) : stockOpnames.map((op,i) => (
 <div key={i} style={{ ...S.card, padding:'14px', marginBottom:12, cursor:'pointer', transition:'all 0.15s' }}
 onClick={()=>setDetailOpname(op)}
 onMouseEnter={e=>e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'}
 onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <div>
 <div style={{ fontWeight:800, color:'#111827', fontSize:14 }}>{new Date(op.date).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}</div>
 <div style={{ fontSize:12, color:'#9CA3AF', marginTop:3 }}>{op.totalProducts} produk dihitung {op.note?`• ${op.note}`:''}</div>
 </div>
 <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:900, fontSize:15, color:op.totalLoss>0?'#EF4444':'#059669' }}>
                  {op.diffCount === 0 ? '✓ Stok Sesuai' : op.totalLoss > 0 ? `-${formatIDR(op.totalLoss)}` : `+${formatIDR(op.totalGain||0)}`}
                </div>
 <div style={{ fontSize:12, color:'#9CA3AF' }}>{op.adjustments?.length||0} penyesuaian</div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Confirm Modal */}
 {showConfirm && (
 <div style={S.overlay} onClick={()=>setShowConfirm(false)}>
 <div style={S.modal} onClick={e=>e.stopPropagation()}>
 <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:900 }}>Konfirmasi Stock Opname</h3>
 <p style={{ margin:'0 0 16px', fontSize:13, color:'#6B7280' }}>Stok akan disesuaikan untuk <strong>{differences.length}</strong> produk.</p>
 {totalLoss > 0 && (
 <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'14px', marginBottom:16, fontSize:13, color:'#DC2626', fontWeight:600 }}>
 Estimasi kerugian stok: <strong>{formatIDR(totalLoss)}</strong>
 </div>
 )}
 <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
 {differences.map(d=>(
 <div key={d.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, background:d.diff<0?'#FFF1F2':'#F0FDF4' }}>
 <span style={{ fontSize:13 }}>{d.name}</span>
 <span style={{ fontSize:13, fontWeight:800 }}>{d.stock} → {d.actual} <span style={{ color:d.diff<0?'#EF4444':'#059669' }}>({d.diff>0?'+':''}{d.diff})</span></span>
 </div>
 ))}
 </div>
 <div style={{ marginBottom:16 }}>
 <label style={S.label}>Catatan Opname</label>
 <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Misal: Opname rutin Maret 2026"
 style={S.inp} onFocus={fi} onBlur={fo}/>
 </div>
 <div style={{ display:'flex', gap:10 }}>
 <button style={{ ...S.btn('ghost'), flex:1 }} onClick={()=>setShowConfirm(false)}>Batal</button>
 <button style={{ ...S.btn('green'), flex:2 }} onClick={handleSave}> Selesaikan Opname</button>
 </div>
 </div>
 </div>
 )}

 {/* Detail Modal */}
 {detailOpname && (
 <div style={S.overlay} onClick={()=>setDetailOpname(null)}>
 <div style={S.modal} onClick={e=>e.stopPropagation()}>
 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
 <div>
 <h3 style={{ margin:'0 0 4px', fontSize:16, fontWeight:900 }}>Detail Opname</h3>
 <span style={{ fontSize:12, color:'#6B7280' }}>{new Date(detailOpname.date).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}</span>
 </div>
 <button style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9CA3AF' }} onClick={()=>setDetailOpname(null)}>×</button>
 </div>
 <div style={{ display:'flex', gap:16, marginBottom:14, fontSize:13 }}>
 <span>{detailOpname.totalProducts} produk</span>
 {detailOpname.note && <span style={{ color:'#6B7280' }}>• {detailOpname.note}</span>}
 <span style={{ fontWeight:700, color:detailOpname.totalLoss>0?'#EF4444':'#059669', marginLeft:'auto' }}>
              {detailOpname.diffCount === 0 ? '✓ Stok Sesuai' : detailOpname.totalLoss > 0 ? `-${formatIDR(detailOpname.totalLoss)}` : `+${formatIDR(detailOpname.totalGain||0)}`}
 </span>
 </div>
 <div style={{ maxHeight:280, overflowY:'auto', borderRadius:10, overflow:'hidden', border:'1px solid #F1F5F9' }}>
  <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
  <table style={{ width:'100%', minWidth:400, borderCollapse:'collapse', fontSize:13 }}>
 <thead><tr style={{ background:'#F8FAFC', position:'sticky', top:0 }}>
 {['Produk','Sistem','Fisik','Selisih','Nilai'].map(h=><th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, color:'#6B7280' }}>{h}</th>)}
 </tr></thead>
 <tbody>{(detailOpname.adjustments||[]).map((adj,i)=>(
 <tr key={i} style={{ borderTop:'1px solid #F9FAFB', background:adj.diff<0?'#FFF1F2':adj.diff>0?'#F0FDF4':'#fff' }}>
 <td style={{ padding:'9px 12px' }}>{adj.productName}</td>
 <td style={{ padding:'9px 12px', textAlign:'center' }}>{adj.before}</td>
 <td style={{ padding:'9px 12px', textAlign:'center', fontWeight:800 }}>{adj.actual}</td>
 <td style={{ padding:'9px 12px', textAlign:'center', fontWeight:800, color:adj.diff<0?'#EF4444':adj.diff>0?'#059669':'#9CA3AF' }}>{adj.diff>0?'+':''}{adj.diff}</td>
 <td style={{ padding:'9px 12px', fontWeight:700, color:adj.diff<0?'#EF4444':'#059669' }}>{adj.diff!==0?`${adj.diff<0?'-':'+'}${formatIDR(Math.abs(adj.diff)*adj.hpp)}`:'-'}</td>
 </tr>
 ))}</tbody>
 </table>
 </div>
  </div>
 <button style={{ ...S.btn('ghost'), width:'100%', marginTop:16, justifyContent:'center' }} onClick={()=>setDetailOpname(null)}>Tutup</button>
 </div>
 </div>
 )}
 </div>
 )
}
