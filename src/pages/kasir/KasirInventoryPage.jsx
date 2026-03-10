// ============================================================
// MSME GROW POS - Kasir Inventory Page (VIEW ONLY)
// ============================================================
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR } from '@/utils/format'
import { CATEGORIES, CATEGORY_COLORS } from '@/config/constants'
import Icon from '@/components/ui/Icon'
import { Badge } from '@/components/ui/index.jsx'

export default function KasirInventoryPage() {
  const { products } = useApp()

  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('Semua')

  const cats = ['Semua', ...CATEGORIES]

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Semua' || p.category === category
    return matchSearch && matchCat && p.active
  })

  return (
    <div style={{ padding:'16px 20px', maxWidth:900, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:18, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#111827' }}>Produk & Layanan</h2>
          <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>{filtered.length} produk aktif</p>
        </div>
        {/* View-only badge */}
        <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, padding:'6px 12px', display:'flex', alignItems:'center', gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <span style={{ fontSize:11, fontWeight:700, color:'#D97706' }}>Lihat Saja</span>
        </div>
      </div>

      {/* Info kasir */}
      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', gap:8, alignItems:'center' }}>
        <span style={{ fontSize:14 }}>ℹ️</span>
        <p style={{ margin:0, fontSize:12, color:'#1E40AF' }}>
          Anda hanya dapat <strong>melihat</strong> daftar produk. Untuk menambah atau mengubah produk, hubungi Admin.
        </p>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:14 }}>
        <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}>
          <Icon name="search" size={16} color="#9CA3AF" />
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama produk atau SKU..."
          style={{ width:'100%', padding:'10px 12px 10px 38px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box' }} />
      </div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid', borderColor:category===c?'#2563EB':'#E5E7EB', background:category===c?'#2563EB':'#fff', color:category===c?'#fff':'#374151', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 20px', color:'#9CA3AF' }}>
          <p style={{ fontSize:40, margin:'0 0 8px' }}>📦</p>
          <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:700, color:'#374151' }}>Tidak ada produk ditemukan</p>
          <p style={{ margin:0, fontSize:13 }}>Coba kata kunci lain atau ubah filter kategori</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(p => {
            const cc = CATEGORY_COLORS[p.category] || CATEGORY_COLORS['Lainnya']
            const lowStock = p.stock != null && p.stock < 5
            return (
              <div key={p.id} style={{ background:'#fff', borderRadius:14, padding:'14px 16px', border:'1px solid #F1F5F9', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, background:cc.bg, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon name="inventory" size={20} color={cc.accent} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#111827' }}>{p.name}</p>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:cc.bg, color:cc.text }}>{p.category}</span>
                  </div>
                  {p.description && <p style={{ margin:'0 0 4px', fontSize:12, color:'#6B7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:400 }}>{p.description}</p>}
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <p style={{ margin:0, fontSize:15, fontWeight:900, color:'#2563EB' }}>{formatIDR(p.price)}<span style={{ fontSize:11, fontWeight:400, color:'#9CA3AF' }}> /{p.unit}</span></p>
                    {p.sku && <span style={{ fontSize:11, color:'#9CA3AF', fontFamily:'monospace' }}>SKU: {p.sku}</span>}
                    {p.stock != null && (
                      <span style={{ fontSize:11, fontWeight:700, color:lowStock?'#EF4444':'#6B7280' }}>
                        {lowStock ? '⚠ ' : ''}Stok: {p.stock}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
