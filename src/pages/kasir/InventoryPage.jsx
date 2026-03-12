// ============================================================
// MSME GROW POS - Inventory Page v3.0
// Fitur: HPP, Varian Produk, Satuan UOM, Barcode Scanner
// ============================================================
import { useState, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, generateProductId } from '@/utils/format'
import { CATEGORIES, CATEGORY_COLORS, PRODUCT_UNITS, ROLES } from '@/config/constants'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Badge } from '@/components/ui/index.jsx'

const EMPTY_VARIANT = { id: '', name: '', price: '', hpp: '', stock: '10' }

const EMPTY_FORM = {
 name: '', description: '', price: '', hpp: '',
 category: 'Makanan', unit: 'pcs', sku: '', stock: '50',
 active: true, hasVariants: false, variants: [],
 barcodeInput: '',
}

const InventoryPage = () => {
 const { products, addProduct, updateProduct, deleteProduct, user, settings } = useApp()
 const isAdmin = user?.role === ROLES.ADMIN

 const [search, setSearch] = useState('')
 const [category, setCategory] = useState('Semua')
 const [showInactive, setShowInactive] = useState(false)
 const [modal, setModal] = useState(false)
 const [editTarget, setEditTarget] = useState(null)
 const [form, setForm] = useState(EMPTY_FORM)
 const [deleteConfirm,setDeleteConfirm]= useState(null)
 const [formErrors, setFormErrors] = useState({})
 const [variantError, setVariantError] = useState('')
 // Stok Opname
 const [opnameModal, setOpnameModal] = useState(false)
 const [opnameTarget, setOpnameTarget] = useState(null)
 const [opnameQty, setOpnameQty] = useState('')
 const [opnameNotes, setOpnameNotes] = useState('')
 const [activeTab, setActiveTab] = useState('basic') // 'basic' | 'variants' | 'barcode'
 const [scanMode, setScanMode] = useState(false)
 const barcodeInputRef = useRef()

 const lowStock = products.filter(p => p.active && !p.hasVariants && p.stock <= (settings?.lowStockAlert || 5)).length
 const lowStockVariants = products.filter(p => p.active && p.hasVariants &&
 (p.variants || []).some(v => v.stock <= (settings?.lowStockAlert || 5))
 ).length

 const filtered = products.filter(p => {
 const q = search.toLowerCase()
 const matchSearch = !q || p.name.toLowerCase().includes(q) ||
 (p.sku || '').toLowerCase().includes(q) ||
 (p.variants || []).some(v => v.name.toLowerCase().includes(q))
 const matchCat = category === 'Semua' || p.category === category
 const matchActive = showInactive ? true : p.active
 return matchSearch && matchCat && matchActive
 })

 const openAdd = () => {
 setEditTarget(null)
 setForm(EMPTY_FORM)
 setFormErrors({})
 setVariantError('')
 setActiveTab('basic')
 setModal(true)
 }

 const openEdit = (product) => {
 setEditTarget(product)
 setForm({
 name : product.name,
 description: product.description || '',
 price : String(product.price),
 hpp : String(product.hpp || ''),
 category : product.category,
 unit : product.unit,
 sku : product.sku || '',
 stock : String(product.stock ?? '50'),
 active : product.active,
 hasVariants: product.hasVariants || false,
 variants : (product.variants || []).map(v => ({ ...v, price: String(v.price), hpp: String(v.hpp || ''), stock: String(v.stock) })),
 barcodeInput: '',
 })
 setFormErrors({})
 setVariantError('')
 setActiveTab('basic')
 setModal(true)
 }

 const setF = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

 // Variant handlers
 const addVariant = () => {
 setForm(f => ({ ...f, variants: [...f.variants, { ...EMPTY_VARIANT, id: `v${Date.now()}` }] }))
 }
 const updateVariant = (idx, key, val) => {
 setForm(f => ({ ...f, variants: f.variants.map((v, i) => i === idx ? { ...v, [key]: val } : v) }))
 }
 const removeVariant = (idx) => {
 setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }))
 }

 // Handle barcode scan / manual entry
 const handleBarcodeSearch = (code) => {
 const q = code.trim()
 if (!q) return
 const found = products.find(p => p.sku === q || p.barcode === q)
 if (found) {
 openEdit(found)
 setSearch('')
 } else {
 setSearch(q)
 }
 }

 const validateForm = () => {
 const errors = {}
 if (!form.name.trim()) errors.name = 'Nama produk wajib diisi.'
 if (!form.hasVariants && (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0))
 errors.price = 'Harga harus lebih dari 0.'
 if (!form.unit.trim()) errors.unit = 'Satuan wajib diisi.'
 if (form.hasVariants && form.variants.length === 0) errors.variants = 'Tambahkan minimal 1 varian.'
 if (form.hasVariants) {
 for (const v of form.variants) {
 if (!v.name.trim() || !v.price || Number(v.price) <= 0) {
 errors.variants = 'Semua varian harus punya nama dan harga > 0.'
 break
 }
 }
 }
 setFormErrors(errors)
 return Object.keys(errors).length === 0
 }

 const saveProduct = () => {
 if (!validateForm()) return
 const variants = form.hasVariants
 ? form.variants.map(v => ({
 id : v.id || `v${Date.now()}_${Math.random()}`,
 name : v.name.trim(),
 price: Number(v.price),
 hpp : Number(v.hpp) || 0,
 stock: Number(v.stock) || 0,
 }))
 : []

 // Base price: if has variants, use lowest variant price; else use form price
 const basePrice = form.hasVariants
 ? Math.min(...variants.map(v => v.price))
 : Number(form.price)

 const data = {
 name : form.name.trim(),
 description: form.description.trim(),
 price : basePrice,
 hpp : form.hasVariants ? 0 : (Number(form.hpp) || 0),
 category : form.category,
 unit : form.unit.trim(),
 sku : form.sku.trim(),
 stock : form.hasVariants
 ? variants.reduce((s, v) => s + v.stock, 0)
 : (Number(form.stock) || 0),
 active : form.active,
 hasVariants: form.hasVariants,
 variants,
 }

 if (editTarget) {
 updateProduct({ ...editTarget, ...data })
 } else {
 addProduct({ id: generateProductId(), ...data, createdAt: new Date().toISOString() })
 }
 setModal(false)
 }

 const toggleActive = (product) => updateProduct({ ...product, active: !product.active })
 const confirmDelete = (product) => setDeleteConfirm(product)
 const doDelete = () => { if (deleteConfirm) { deleteProduct(deleteConfirm.id); setDeleteConfirm(null) } }

 const marginPct = (price, hpp) => {
 if (!hpp || hpp <= 0) return null
 return Math.round(((price - hpp) / price) * 100)
 }

 const clr = CATEGORY_COLORS
 const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', transition: 'all 0.15s' }
 const focusIn = e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }
 const focusOut = e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none' }

 return (
 <div style={{ padding: '16px 20px', maxWidth: 960, margin: '0 auto' }}>

 {/* Header */}
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
 <div>
 <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#111827' }}>Inventori & Produk</h2>
 <p style={{ margin: 0, color: '#6B7280', fontSize: 13 }}>
 {products.filter(p => p.active).length} aktif · {products.length} total
 {(lowStock + lowStockVariants) > 0 && (
 <span style={{ marginLeft: 8, color: '#EF4444', fontWeight: 700 }}>
 {lowStock + lowStockVariants} stok menipis
 </span>
 )}
 </p>
 </div>
 <div style={{ display: 'flex', gap: 8 }}>
 {/* Barcode scanner button */}
 <button
 onClick={() => { setScanMode(true); setTimeout(() => barcodeInputRef.current?.focus(), 100) }}
 style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}
 title="Scan barcode produk"
 >
 Scan
 </button>
 {isAdmin && (
 <Button onClick={openAdd} variant="primary" icon="plus" size="sm">Tambah Produk</Button>
 )}
 </div>
 </div>

 {/* Barcode scan mode */}
 {scanMode && (
 <div style={{ marginBottom: 12, background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
 <span style={{ fontSize: 13, color: '#1E40AF', fontWeight: 700, flexShrink: 0 }}> Mode Scan:</span>
 <input
 ref={barcodeInputRef}
 type="text"
 placeholder="Scan atau ketik barcode / SKU..."
 onKeyDown={e => { if (e.key === 'Enter') { handleBarcodeSearch(e.target.value); e.target.value = '' } }}
 style={{ flex: 1, padding: '7px 12px', border: '1.5px solid #93C5FD', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
 autoFocus
 />
 <button onClick={() => setScanMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
 </div>
 )}

 {/* Search + Filter */}
 <div style={{ marginBottom: 14 }}>
 <div style={{ position: 'relative', marginBottom: 10 }}>
 <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><Icon name="search" size={16} color="#9CA3AF" /></span>
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk, SKU, varian..."
 style={{ width: '100%', padding: '10px 10px 10px 38px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
 onFocus={e => e.target.style.borderColor = '#2563EB'} onBlur={e => e.target.style.borderColor = '#E5E7EB'}
 />
 </div>
 <div style={{ display: 'flex', gap: 7, overflowX: 'auto', alignItems: 'center', paddingBottom: 4 }}>
 {CATEGORIES.map(c => (
 <button key={c} onClick={() => setCategory(c)} style={{ padding: '5px 13px', borderRadius: 20, border: category === c ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB', background: category === c ? '#EFF6FF' : '#fff', color: category === c ? '#2563EB' : '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
 {c}
 </button>
 ))}
 {isAdmin && (
 <button onClick={() => setShowInactive(!showInactive)} style={{ padding: '5px 13px', borderRadius: 20, border: showInactive ? '1.5px solid #9CA3AF' : '1.5px solid #E5E7EB', background: showInactive ? '#F9FAFB' : '#fff', color: '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
 {showInactive ? ' Semua' : 'Aktif saja'}
 </button>
 )}
 </div>
 </div>

 {/* Product List */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {filtered.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF' }}>
 <div style={{ fontSize: 40, marginBottom: 12 }}></div>
 <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#374151' }}>Tidak ada produk</p>
 <p style={{ margin: 0, fontSize: 13 }}>{search ? `Tidak ada produk "${search}"` : 'Belum ada produk ditambahkan.'}</p>
 {isAdmin && <Button onClick={openAdd} variant="primary" size="sm" icon="plus" style={{ marginTop: 14 }}>Tambah Produk</Button>}
 </div>
 ) : filtered.map(product => {
 const cc = clr[product.category] || clr['Lainnya']
 const margin = !product.hasVariants ? marginPct(product.price, product.hpp) : null
 const isLow = !product.hasVariants && product.active && product.stock <= (settings?.lowStockAlert || 5)
 const varLow = product.hasVariants && product.active && (product.variants || []).some(v => v.stock <= (settings?.lowStockAlert || 5))

 return (
 <div key={product.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: isLow || varLow ? '1.5px solid #FED7AA' : '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', opacity: product.active ? 1 : 0.6, transition: 'all 0.15s' }}>
 <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
 {/* Icon */}
 <div style={{ width: 48, height: 48, background: cc.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
 {product.category === 'Makanan' ? '' : product.category === 'Minuman' ? '' : product.category === 'Fashion' ? '' : product.category === 'Kecantikan' ? '' : product.category === 'Elektronik' ? '' : product.category === 'Kesehatan' ? '' : ''}
 </div>

 {/* Info */}
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
 <span style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{product.name}</span>
 <Badge color={product.active ? 'green' : 'gray'}>{product.active ? 'AKTIF' : 'NONAKTIF'}</Badge>
 {product.hasVariants && <Badge color="blue">VARIAN</Badge>}
 </div>

 {/* Price + HPP + Margin */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
 {product.hasVariants ? (
 <span style={{ fontSize: 14, fontWeight: 900, color: '#2563EB' }}>
 {formatIDR(Math.min(...(product.variants || [{ price: 0 }]).map(v => v.price)))}
 {(product.variants || []).length > 1 && ` – ${formatIDR(Math.max(...(product.variants || [{ price: 0 }]).map(v => v.price)))}`}
 </span>
 ) : (
 <span style={{ fontSize: 14, fontWeight: 900, color: '#2563EB' }}>{formatIDR(product.price)}</span>
 )}
 <span style={{ fontSize: 12, color: '#9CA3AF' }}>/ {product.unit}</span>
 {product.hpp > 0 && !product.hasVariants && (
 <span style={{ fontSize: 11, color: '#6B7280', background: '#F9FAFB', padding: '2px 7px', borderRadius: 6 }}>
 HPP: {formatIDR(product.hpp)}
 </span>
 )}
 {margin !== null && (
 <span style={{ fontSize: 11, fontWeight: 700, color: margin >= 30 ? '#16A34A' : margin >= 15 ? '#D97706' : '#EF4444', background: margin >= 30 ? '#F0FDF4' : margin >= 15 ? '#FFFBEB' : '#FEF2F2', padding: '2px 7px', borderRadius: 6 }}>
 Margin {margin}%
 </span>
 )}
 </div>

 {/* Variants preview */}
 {product.hasVariants && (product.variants || []).length > 0 && (
 <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
 {(product.variants || []).map(v => (
 <span key={v.id} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: v.stock <= (settings?.lowStockAlert || 5) ? '#FEF2F2' : '#F3F4F6', color: v.stock <= (settings?.lowStockAlert || 5) ? '#EF4444' : '#374151', fontWeight: 600 }}>
 {v.name} ({v.stock})
 </span>
 ))}
 </div>
 )}

 {/* Stock + SKU */}
 <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#9CA3AF' }}>
 {!product.hasVariants && (
 <span style={{ color: isLow ? '#EF4444' : '#9CA3AF', fontWeight: isLow ? 700 : 400 }}>
 {isLow ? ' ' : ''}Stok: {product.stock}
 </span>
 )}
 {product.sku && <span>SKU: {product.sku}</span>}
 <span style={{ background: cc.bg, color: cc.text, padding: '1px 7px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>{product.category}</span>
 </div>
 </div>

 {/* Action buttons */}
 {isAdmin && (
 <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
 <button onClick={() => openEdit(product)} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit">
 <Icon name="edit" size={14} color="#374151" />
 </button>
 {product.stock != null && (
 <button onClick={() => { setOpnameTarget(product); setOpnameQty(String(product.stock)); setOpnameNotes(''); setOpnameModal(true) }}
 style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #BFDBFE', background: '#EFF6FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Adjust Stok">
 <span style={{ fontSize: 13 }}></span>
 </button>
 )}
 <button onClick={() => toggleActive(product)} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: product.active ? '#FEF2F2' : '#F0FDF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={product.active ? 'Nonaktifkan' : 'Aktifkan'}>
 <Icon name={product.active ? 'x' : 'check'} size={14} color={product.active ? '#EF4444' : '#16A34A'} />
 </button>
 <button onClick={() => confirmDelete(product)} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Hapus">
 <Icon name="trash" size={14} color="#EF4444" />
 </button>
 </div>
 )}
 </div>
 </div>
 )
 })}
 </div>

 {/* Add/Edit Product Modal */}
 <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Edit Produk' : 'Tambah Produk Baru'} maxWidth={560}>
 {/* Tab Nav */}
 <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1.5px solid #F1F5F9' }}>
 {[['basic', ' Info Dasar'], ['variants', ` Varian (${form.variants.length})`], ['barcode', ' SKU/Barcode']].map(([id, label]) => (
 <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '9px 16px', border: 'none', borderBottom: activeTab === id ? '2.5px solid #2563EB' : '2.5px solid transparent', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: activeTab === id ? '#2563EB' : '#6B7280', fontFamily: 'inherit', marginBottom: -1.5 }}>
 {label}
 </button>
 ))}
 </div>

 {/* Tab: Info Dasar */}
 {activeTab === 'basic' && (
 <div>
 <div style={{ marginBottom: 12 }}>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nama Produk *</label>
 <input value={form.name} onChange={e => setF('name')(e.target.value)} placeholder="Nama produk atau layanan" style={inp} onFocus={focusIn} onBlur={focusOut} />
 {formErrors.name && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>{formErrors.name}</p>}
 </div>

 {/* Kategori + Satuan */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
 <div>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Kategori</label>
 <select value={form.category} onChange={e => setF('category')(e.target.value)} style={{ ...inp, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }} onFocus={focusIn} onBlur={focusOut}>
 {CATEGORIES.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 <div>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Satuan *</label>
 <select value={form.unit} onChange={e => setF('unit')(e.target.value)} style={{ ...inp, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }} onFocus={focusIn} onBlur={focusOut}>
 {PRODUCT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
 </select>
 </div>
 </div>

 {/* Toggle Varian */}
 <div onClick={() => setF('hasVariants')(!form.hasVariants)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer', padding: '10px 12px', background: form.hasVariants ? '#EFF6FF' : '#F9FAFB', border: `1.5px solid ${form.hasVariants ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 10 }}>
 <div style={{ width: 36, height: 20, borderRadius: 10, background: form.hasVariants ? '#2563EB' : '#D1D5DB', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
 <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: form.hasVariants ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
 </div>
 <div>
 <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>Produk punya Varian</p>
 <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>e.g. ukuran S/M/L, rasa, warna, dll</p>
 </div>
 </div>

 {/* Harga + HPP — only show if no variants */}
 {!form.hasVariants && (
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
 <div>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Harga Jual *</label>
 <input type="number" value={form.price} onChange={e => setF('price')(e.target.value)} placeholder="25000" style={inp} onFocus={focusIn} onBlur={focusOut} />
 {formErrors.price && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>{formErrors.price}</p>}
 </div>
 <div>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
 HPP (Modal) <span style={{ color: '#9CA3AF', fontWeight: 400 }}>opsional</span>
 </label>
 <input type="number" value={form.hpp} onChange={e => setF('hpp')(e.target.value)} placeholder="12000" style={inp} onFocus={focusIn} onBlur={focusOut} />
 </div>
 </div>
 )}
 {!form.hasVariants && form.price && form.hpp && Number(form.price) > 0 && Number(form.hpp) > 0 && (
 <div style={{ marginBottom: 12, padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
 <span style={{ fontSize: 12, color: '#166534' }}>
 Estimasi margin: <strong>{marginPct(Number(form.price), Number(form.hpp))}%</strong> · Laba: <strong>{formatIDR(Number(form.price) - Number(form.hpp))}</strong>
 </span>
 </div>
 )}

 {/* Stok */}
 {!form.hasVariants && (
 <div style={{ marginBottom: 12 }}>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Stok Awal</label>
 <input type="number" value={form.stock} onChange={e => setF('stock')(e.target.value)} placeholder="50" style={inp} onFocus={focusIn} onBlur={focusOut} />
 </div>
 )}

 {/* Deskripsi */}
 <div style={{ marginBottom: 12 }}>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Deskripsi</label>
 <textarea value={form.description} onChange={e => setF('description')(e.target.value)} placeholder="Deskripsi singkat produk..." rows={2} style={{ ...inp, resize: 'none' }} onFocus={focusIn} onBlur={focusOut} />
 </div>

 {/* Status aktif */}
 <div onClick={() => setF('active')(!form.active)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', userSelect: 'none' }}>
 <div style={{ width: 18, height: 18, border: `2px solid ${form.active ? '#2563EB' : '#D1D5DB'}`, borderRadius: 5, background: form.active ? '#2563EB' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
 {form.active && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}></span>}
 </div>
 <span style={{ fontSize: 13, color: '#374151' }}>Produk aktif dan tersedia di POS</span>
 </div>
 </div>
 )}

 {/* Tab: Varian */}
 {activeTab === 'variants' && (
 <div>
 {!form.hasVariants ? (
 <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
 <p style={{ fontSize: 14 }}>Aktifkan toggle "Produk punya Varian" di tab Info Dasar terlebih dahulu.</p>
 </div>
 ) : (
 <>
 <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280' }}>
 Tambahkan varian produk (ukuran, warna, rasa, dll) dengan harga & stok masing-masing.
 </p>
 {formErrors.variants && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#EF4444' }}>{formErrors.variants}</p>}

 {form.variants.map((v, idx) => (
 <div key={v.id || idx} style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', marginBottom: 10, position: 'relative' }}>
 <div style={{ position: 'absolute', top: 8, right: 8 }}>
 <button onClick={() => removeVariant(idx)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <span style={{ color: '#EF4444', fontSize: 14, lineHeight: 1 }}>×</span>
 </button>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
 <div>
 <label style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Nama Varian *</label>
 <input value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} placeholder="e.g. S, Merah, Manis" style={{ ...inp, marginTop: 4 }} onFocus={focusIn} onBlur={focusOut} />
 </div>
 <div>
 <label style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Harga *</label>
 <input type="number" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} placeholder="0" style={{ ...inp, marginTop: 4 }} onFocus={focusIn} onBlur={focusOut} />
 </div>
 <div>
 <label style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>HPP</label>
 <input type="number" value={v.hpp} onChange={e => updateVariant(idx, 'hpp', e.target.value)} placeholder="0" style={{ ...inp, marginTop: 4 }} onFocus={focusIn} onBlur={focusOut} />
 </div>
 <div>
 <label style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Stok</label>
 <input type="number" value={v.stock} onChange={e => updateVariant(idx, 'stock', e.target.value)} placeholder="0" style={{ ...inp, marginTop: 4 }} onFocus={focusIn} onBlur={focusOut} />
 </div>
 </div>
 {v.price && v.hpp && Number(v.price) > 0 && Number(v.hpp) > 0 && (
 <p style={{ margin: '5px 0 0', fontSize: 11, color: '#16A34A' }}>
 Margin: {marginPct(Number(v.price), Number(v.hpp))}%
 </p>
 )}
 </div>
 ))}
 <button onClick={addVariant} style={{ width: '100%', padding: '10px', border: '1.5px dashed #BFDBFE', borderRadius: 10, background: '#EFF6FF', color: '#2563EB', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
 + Tambah Varian
 </button>
 </>
 )}
 </div>
 )}

 {/* Tab: SKU / Barcode */}
 {activeTab === 'barcode' && (
 <div>
 <div style={{ marginBottom: 16 }}>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>SKU / Kode Produk</label>
 <input value={form.sku} onChange={e => setF('sku')(e.target.value)} placeholder="e.g. MKN-001 atau scan barcode..." style={inp} onFocus={focusIn} onBlur={focusOut} />
 <p style={{ margin: '5px 0 0', fontSize: 11, color: '#9CA3AF' }}>Gunakan kode SKU yang mudah diingat atau scan barcode dari kemasan produk.</p>
 </div>
 <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px' }}>
 <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#1E40AF' }}> Cara Scan Barcode</p>
 <p style={{ margin: 0, fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
 1. Klik "Simpan" dulu untuk menyimpan produk<br/>
 2. Di halaman inventori, klik tombol "Scan"<br/>
 3. Arahkan scanner ke barcode produk<br/>
 4. Sistem otomatis mencari produk berdasarkan SKU
 </p>
 </div>
 </div>
 )}

 <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
 <Button onClick={() => setModal(false)} variant="secondary" fullWidth>Batal</Button>
 <Button onClick={saveProduct} variant="primary" fullWidth icon="check">
 {editTarget ? 'Simpan Perubahan' : 'Tambah Produk'}
 </Button>
 </div>
 </Modal>

 {/* Delete Confirm */}
 <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Produk">
 <div style={{ textAlign: 'center', marginBottom: 20 }}>
 <div style={{ width: 60, height: 60, background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}></div>
 <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#111827' }}>Hapus "{deleteConfirm?.name}"?</h3>
 <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>Tindakan ini tidak dapat dibatalkan.</p>
 </div>
 <div style={{ display: 'flex', gap: 10 }}>
 <Button onClick={() => setDeleteConfirm(null)} variant="secondary" fullWidth>Batal</Button>
 <Button onClick={doDelete} variant="danger" fullWidth>Hapus</Button>
 </div>
 </Modal>

 {/* Stok Opname Modal */}
 <Modal open={opnameModal} onClose={()=>setOpnameModal(false)} title=" Adjust Stok (Opname)">
 {opnameTarget && (
 <div>
 <div style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
 <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:800, color:'#111827' }}>{opnameTarget.name}</p>
 <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>Stok saat ini: <strong>{opnameTarget.stock}</strong> {opnameTarget.unit||'pcs'}</p>
 </div>
 <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Stok Baru (setelah opname) *</label>
 <input type="number" min="0" value={opnameQty} onChange={e=>setOpnameQty(e.target.value)}
 style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:16, fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:12, textAlign:'center', fontWeight:800 }} />
 <div style={{ display:'flex', gap:8, marginBottom:12 }}>
 {[0,1,5,10,50,100].map(n=>(
 <button key={n} onClick={()=>setOpnameQty(String(n))}
 style={{ flex:1, padding:'7px 4px', background:opnameQty===String(n)?'#2563EB':'#F3F4F6', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:opnameQty===String(n)?'#fff':'#374151' }}>
 {n}
 </button>
 ))}
 </div>
 <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Keterangan (opsional)</label>
 <input value={opnameNotes} onChange={e=>setOpnameNotes(e.target.value)} placeholder="Misal: hasil hitung fisik, koreksi..."
 style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:14 }} />
 <div style={{ display:'flex', gap:10 }}>
 <Button onClick={()=>setOpnameModal(false)} variant="secondary" fullWidth>Batal</Button>
 <Button onClick={()=>{
 const newStock = parseInt(opnameQty)
 if (isNaN(newStock) || newStock < 0) return
 updateProduct({ ...opnameTarget, stock: newStock })
 setOpnameModal(false)
 }} variant="primary" fullWidth icon="check">Simpan Stok</Button>
 </div>
 </div>
 )}
 </Modal>
 </div>
 )
}

export default InventoryPage
