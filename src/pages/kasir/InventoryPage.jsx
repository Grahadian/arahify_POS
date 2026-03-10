import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, generateProductId } from '@/utils/format'
import { CATEGORIES, CATEGORY_COLORS } from '@/config/constants'
import { ROLES } from '@/config/constants'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Card, Badge, EmptyState } from '@/components/ui/index.jsx'

const EMPTY_FORM = {
  name: '', description: '', price: '', category: 'Strategi',
  unit: 'sesi', sku: '', stock: '99', active: true,
}

const InventoryPage = () => {
  const { products, addProduct, updateProduct, deleteProduct, user } = useApp()
  const isAdmin = user?.role === ROLES.ADMIN

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [showInactive, setShowInactive] = useState(false)
  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Semua' || p.category === category
    const matchActive = showInactive ? true : p.active
    return matchSearch && matchCat && matchActive
  })

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModal(true)
  }

  const openEdit = (product) => {
    setEditTarget(product)
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category: product.category,
      unit: product.unit,
      sku: product.sku || '',
      stock: String(product.stock),
      active: product.active,
    })
    setFormErrors({})
    setModal(true)
  }

  const validateForm = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Nama produk wajib diisi.'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) errors.price = 'Harga harus lebih dari 0.'
    if (!form.unit.trim()) errors.unit = 'Satuan wajib diisi.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const saveProduct = () => {
    if (!validateForm()) return
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      unit: form.unit.trim(),
      sku: form.sku.trim(),
      stock: Number(form.stock) || 99,
      active: form.active,
    }

    if (editTarget) {
      updateProduct({ ...editTarget, ...data })
    } else {
      addProduct({ id: generateProductId(), ...data, createdAt: new Date().toISOString() })
    }
    setModal(false)
  }

  const toggleActive = (product) => {
    updateProduct({ ...product, active: !product.active })
  }

  const confirmDelete = (product) => {
    setDeleteConfirm(product)
  }

  const doDelete = () => {
    if (deleteConfirm) {
      deleteProduct(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const setF = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const colors = CATEGORY_COLORS

  return (
    <div style={{ padding: '16px 20px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#111827' }}>
            Inventori & Layanan
          </h2>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 13 }}>
            {products.filter(p => p.active).length} aktif · {products.length} total produk
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} variant="primary" icon="plus" size="sm">
            Tambah Produk
          </Button>
        )}
      </div>

      {/* Search + Filter */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <Icon name="search" size={16} color="#9CA3AF" />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama produk atau SKU..."
            style={{
              width: '100%', padding: '10px 10px 10px 38px',
              border: '1.5px solid #E5E7EB', borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#2563EB'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', alignItems: 'center' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '5px 14px', borderRadius: 20,
                border: category === c ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB',
                background: category === c ? '#EFF6FF' : '#fff',
                color: category === c ? '#2563EB' : '#6B7280',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
            >
              {c}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => setShowInactive(!showInactive)}
              style={{
                padding: '5px 14px', borderRadius: 20,
                border: showInactive ? '1.5px solid #9CA3AF' : '1.5px solid #E5E7EB',
                background: showInactive ? '#F9FAFB' : '#fff',
                color: '#6B7280',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
            >
              {showInactive ? '👁 Semua' : 'Aktif saja'}
            </button>
          )}
        </div>
      </div>

      {/* Product List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Icon name="inventory" size={32} color="#9CA3AF" />}
            title="Tidak ada produk"
            description={search ? `Tidak ada produk dengan kata kunci "${search}"` : 'Belum ada produk.'}
            action={isAdmin ? <Button onClick={openAdd} variant="primary" size="sm" icon="plus">Tambah Produk</Button> : null}
          />
        ) : filtered.map(product => {
          const clr = colors[product.category] || colors['Lainnya']
          return (
            <div
              key={product.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '16px 18px',
                border: '1px solid #F1F5F9',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                opacity: product.active ? 1 : 0.65,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{
                width: 52, height: 52,
                background: clr.bg,
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="package" size={24} color={clr.accent} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#111827' }}>
                    {product.name}
                  </p>
                  <Badge color={product.active ? 'green' : 'gray'}>
                    {product.active ? 'AKTIF' : 'NONAKTIF'}
                  </Badge>
                </div>
                <p style={{ margin: '0 0 5px', fontSize: 12, color: '#9CA3AF' }} className="text-truncate">
                  {product.description || 'Tidak ada deskripsi'} · SKU: {product.sku || '-'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#2563EB' }}>
                    {formatIDR(product.price)}
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>/ {product.unit}</span>
                  <Badge color={
                    product.category === 'Strategi' ? 'blue' :
                    product.category === 'Legal' ? 'green' :
                    product.category === 'Marketing' ? 'orange' :
                    product.category === 'Keuangan' ? 'purple' : 'gray'
                  }>
                    {product.category}
                  </Badge>
                </div>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(product)}
                    style={{
                      width: 34, height: 34, borderRadius: 9,
                      border: '1.5px solid #E5E7EB', background: '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    title="Edit"
                  >
                    <Icon name="edit" size={14} color="#374151" />
                  </button>
                  <button
                    onClick={() => toggleActive(product)}
                    style={{
                      width: 34, height: 34, borderRadius: 9,
                      border: '1.5px solid #E5E7EB',
                      background: product.active ? '#FEF2F2' : '#F0FDF4',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title={product.active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    <Icon name={product.active ? 'x' : 'check'} size={14} color={product.active ? '#EF4444' : '#16A34A'} />
                  </button>
                  <button
                    onClick={() => confirmDelete(product)}
                    style={{
                      width: 34, height: 34, borderRadius: 9,
                      border: '1.5px solid #FECACA', background: '#FEF2F2',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Hapus"
                  >
                    <Icon name="trash" size={14} color="#EF4444" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add/Edit Product Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editTarget ? 'Edit Produk' : 'Tambah Produk Baru'}
        maxWidth={520}
      >
        <Input label="Nama Produk / Layanan" value={form.name} onChange={setF('name')} placeholder="e.g. Business Strategy Consultation" required error={formErrors.name} />
        <Input label="Harga (IDR)" value={form.price} onChange={setF('price')} placeholder="250000" type="number" required error={formErrors.price} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input
            label="Kategori"
            value={form.category}
            onChange={setF('category')}
            type="select"
            options={['Strategi', 'Legal', 'Marketing', 'Keuangan', 'Lainnya']}
          />
          <Input label="Satuan" value={form.unit} onChange={setF('unit')} placeholder="sesi, dokumen, paket..." required error={formErrors.unit} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="SKU" value={form.sku} onChange={setF('sku')} placeholder="BSC-001" />
          <Input label="Stok" value={form.stock} onChange={setF('stock')} placeholder="99" type="number" />
        </div>
        <Input label="Deskripsi (opsional)" value={form.description} onChange={setF('description')} placeholder="Deskripsi singkat produk atau layanan..." type="textarea" rows={2} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <input
            type="checkbox"
            id="active"
            checked={form.active}
            onChange={e => setF('active')(e.target.checked)}
            style={{ accentColor: '#2563EB', width: 16, height: 16 }}
          />
          <label htmlFor="active" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>
            Produk aktif dan tersedia di POS
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={() => setModal(false)} variant="secondary" fullWidth>Batal</Button>
          <Button onClick={saveProduct} variant="primary" fullWidth icon="check">
            {editTarget ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Produk">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 60, height: 60, background: '#FEF2F2', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Icon name="trash" size={26} color="#EF4444" />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#111827' }}>
            Hapus "{deleteConfirm?.name}"?
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
            Tindakan ini tidak dapat dibatalkan. Produk akan dihapus secara permanen.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={() => setDeleteConfirm(null)} variant="secondary" fullWidth>Batal</Button>
          <Button onClick={doDelete} variant="danger" fullWidth icon="trash">Hapus</Button>
        </div>
      </Modal>
    </div>
  )
}

export default InventoryPage
