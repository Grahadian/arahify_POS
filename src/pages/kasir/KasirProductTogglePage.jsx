// ============================================================
// MSME GROW POS - Kasir Product Toggle Page
// Kasir bisa aktifkan/nonaktifkan produk saja — tidak bisa
// tambah, hapus, atau edit stok/harga
// ============================================================
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR } from '@/utils/format'
import { CATEGORY_COLORS } from '@/config/constants'
import Icon from '@/components/ui/Icon'

export default function KasirProductTogglePage() {
  const { products, updateProduct, settings } = useApp()
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('Semua')
  const [toggling, setToggling] = useState(null) // productId being toggled

  const clr = CATEGORY_COLORS || {}

  const availableCategories = useMemo(() => {
    const used = new Set(products.map(p => p.category).filter(Boolean))
    return ['Semua', ...Array.from(used)]
  }, [products])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q)
      const matchCat    = category === 'Semua' || p.category === category
      return matchSearch && matchCat
    })
  }, [products, search, category])

  const activeCount   = products.filter(p => p.active).length
  const inactiveCount = products.filter(p => !p.active).length

  const handleToggle = async (product) => {
    setToggling(product.id)
    await updateProduct({ ...product, active: !product.active })
    setTimeout(() => setToggling(null), 400)
  }

  const categoryEmoji = (cat) => {
    const map = { Makanan:'🍔', Minuman:'🥤', Fashion:'👕', Kecantikan:'💄', Elektronik:'📱', Kesehatan:'💊' }
    return map[cat] || '📦'
  }

  return (
    <div style={{ padding:'14px', margin:'0 auto', fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom:18 }}>
        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:900, color:'#111827' }}>Produk Aktif</h2>
        <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>
          Aktifkan atau nonaktifkan produk yang tampil di POS
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        {[
          { label:'Aktif di POS',  value: activeCount,   color:'#059669', bg:'#DCFCE7', border:'#BBF7D0' },
          { label:'Nonaktif',      value: inactiveCount, color:'#6B7280', bg:'#F9FAFB', border:'#E5E7EB' },
          { label:'Total Produk',  value: products.length, color:'#2563EB', bg:'#DBEAFE', border:'#BFDBFE' },
        ].map(s => (
          <div key={s.label} style={{ flex:1, background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:'14px' }}>
            <p style={{ margin:'0 0 2px', fontSize:22, fontWeight:900, color:s.color }}>{s.value}</p>
            <p style={{ margin:0, fontSize:11, color:'#6B7280', fontWeight:600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:11, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:16, flexShrink:0 }}>ℹ️</span>
        <p style={{ margin:0, fontSize:12, color:'#92400E', lineHeight:1.5 }}>
          Produk yang <strong>nonaktif</strong> tidak akan muncul di layar POS. Untuk menambah produk atau mengubah harga/stok, minta Admin.
        </p>
      </div>

      {/* Search + Category filter */}
      <div style={{ marginBottom:14 }}>
        <div style={{ position:'relative', marginBottom:10 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}>
            <Icon name="search" size={15} color="#9CA3AF" />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama produk atau SKU..."
            style={{ width:'100%', padding:'10px 12px 10px 36px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor='#2563EB'}
            onBlur={e => e.target.style.borderColor='#E5E7EB'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:18, padding:0, lineHeight:1 }}>×</button>
          )}
        </div>
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
          {availableCategories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding:'5px 13px', borderRadius:20, border: category===c ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB', background: category===c ? '#EFF6FF' : '#fff', color: category===c ? '#2563EB' : '#6B7280', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', flexShrink:0 }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'#9CA3AF', background:'#fff', borderRadius:16, border:'1px solid #F1F5F9' }}>
          <span style={{ fontSize:40, display:'block', marginBottom:12 }}>📦</span>
          <p style={{ margin:'0 0 4px', fontWeight:700, color:'#374151' }}>Tidak ada produk</p>
          <p style={{ margin:0, fontSize:13 }}>{search ? `Tidak ditemukan "${search}"` : 'Belum ada produk.'}</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(product => {
            const cc = clr[product.category] || { bg:'#F9FAFB', text:'#374151' }
            const isActive  = product.active !== false
            const isToggling = toggling === product.id
            return (
              <div key={product.id}
                style={{ background:'#fff', borderRadius:14, padding:'14px 16px', border: isActive ? '1px solid #F1F5F9' : '1px solid #E5E7EB', display:'flex', alignItems:'center', gap:12, opacity: isActive ? 1 : 0.6, transition:'all 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>

                {/* Icon / Image */}
                {product.image ? (
                  <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', flexShrink:0 }}>
                    <img src={product.image} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                ) : (
                  <div style={{ width:44, height:44, background:cc.bg, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>
                    {categoryEmoji(product.category)}
                  </div>
                )}

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <span style={{ fontWeight:800, fontSize:13, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</span>
                    {!isActive && (
                      <span style={{ fontSize:10, fontWeight:700, color:'#6B7280', background:'#F3F4F6', padding:'1px 7px', borderRadius:10, flexShrink:0 }}>NONAKTIF</span>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:900, color:'#2563EB' }}>
                      {product.hasVariants
                        ? `${formatIDR(Math.min(...(product.variants||[{price:0}]).map(v=>v.price)))}+`
                        : formatIDR(product.price)}
                    </span>
                    <span style={{ fontSize:11, color:'#9CA3AF' }}>/ {product.unit||'pcs'}</span>
                    {!product.hasVariants && product.stock != null && (
                      <span style={{ fontSize:11, color: product.stock<=5?'#EF4444':'#9CA3AF' }}>
                        Stok: {product.stock}{product.stock<=5?' ⚠️':''}
                      </span>
                    )}
                    {product.category && (
                      <span style={{ fontSize:10, color:cc.text, background:cc.bg, padding:'1px 7px', borderRadius:6, fontWeight:700 }}>{product.category}</span>
                    )}
                  </div>
                </div>

                {/* Toggle button */}
                <button
                  onClick={() => handleToggle(product)}
                  disabled={!!isToggling}
                  title={isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                  style={{
                    flexShrink:0,
                    width: 52, height: 28,
                    borderRadius: 14,
                    border: 'none',
                    background: isToggling ? '#E5E7EB' : isActive ? '#059669' : '#D1D5DB',
                    cursor: isToggling ? 'default' : 'pointer',
                    position: 'relative',
                    transition: 'all 0.25s',
                    outline: 'none',
                  }}>
                  <div style={{
                    position: 'absolute',
                    top: 3, left: isActive ? 26 : 3,
                    width: 22, height: 22,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    transition: 'left 0.25s',
                  }}/>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
