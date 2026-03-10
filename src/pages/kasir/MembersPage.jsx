// ============================================================
// MSME GROW POS - Members Management Page
// ============================================================
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatDate, formatRelativeTime } from '@/utils/format'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Badge, Card, EmptyState } from '@/components/ui/index.jsx'

const BUSINESS_TYPES_LABEL = {
  FNB: '🍽️ F&B', Retail: '🛍️ Retail', Jasa: '⚙️ Jasa',
  Furniture: '🪑 Furniture', Fashion: '👗 Fashion', Lainnya: '📦 Lainnya',
}

export default function MembersPage() {
  const { members, addMember, updateMember, transactions } = useApp()

  const [search,     setSearch]     = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [editModal,  setEditModal]  = useState(false)
  const [detailModal,setDetailModal]= useState(false)
  const [selected,   setSelected]   = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [form,       setForm]       = useState({ name:'', phone:'', email:'', address:'', notes:'' })

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    return !q || m.name.toLowerCase().includes(q) || (m.phone||'').includes(q) || (m.email||'').toLowerCase().includes(q)
  })

  // Get transactions for a member
  const getMemberTrx = (memberId) => transactions.filter(t => t.memberId === memberId)

  const openNew = () => {
    setForm({ name:'', phone:'', email:'', address:'', notes:'' })
    setShowModal(true)
  }

  const openEdit = (m) => {
    setSelected(m)
    setForm({ name: m.name, phone: m.phone||'', email: m.email||'', address: m.address||'', notes: m.notes||'' })
    setEditModal(true)
  }

  const openDetail = (m) => { setSelected(m); setDetailModal(true) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      addMember(form)
      setShowModal(false)
      setForm({ name:'', phone:'', email:'', address:'', notes:'' })
    } finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    if (!form.name.trim() || !selected) return
    setSaving(true)
    try {
      updateMember({ ...selected, ...form })
      setEditModal(false)
    } finally { setSaving(false) }
  }

  const totalMemberRevenue = members.reduce((s, m) => s + (m.totalSpent||0), 0)
  const activeMembersCount = members.filter(m => (m.totalOrders||0) > 0).length

  return (
    <div style={{ padding:'16px 20px', maxWidth:860, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#111827' }}>Data Member</h2>
          <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>{members.length} member terdaftar</p>
        </div>
        <Button onClick={openNew} variant="primary" icon="plus" size="sm">Tambah Member</Button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
        {[
          { label:'Total Member',    value: members.length,        color:'#2563EB', bg:'#EFF6FF' },
          { label:'Member Aktif',    value: activeMembersCount,    color:'#22C55E', bg:'#F0FDF4' },
          { label:'Total Revenue',   value: formatIDR(totalMemberRevenue), color:'#A855F7', bg:'#F5F3FF' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'12px 16px', border:`1px solid ${s.color}22` }}>
            <p style={{ margin:'0 0 3px', fontSize:11, color:s.color, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</p>
            <p style={{ margin:0, fontSize:20, fontWeight:900, color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <Card style={{ marginBottom:14, padding:'12px 16px' }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}><Icon name="search" size={14} color="#9CA3AF" /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, telepon, email..."
            style={{ width:'100%', padding:'9px 12px 9px 32px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
        </div>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search ? 'Member tidak ditemukan' : 'Belum ada member'}
          description={search ? 'Coba ubah kata kunci pencarian.' : 'Klik "Tambah Member" untuk mendaftarkan pelanggan pertama Anda.'}
          action={!search && <Button onClick={openNew} variant="primary" icon="plus">Tambah Member Pertama</Button>}
        />
      ) : (
        filtered.map(m => {
          const memberTrx = getMemberTrx(m.id)
          const totalSpent = memberTrx.filter(t => t.status==='completed').reduce((s,t) => s+(t.total||0), 0)
          return (
            <div key={m.id} style={{ background:'#fff', borderRadius:14, padding:'14px 18px', marginBottom:10, border:'1.5px solid #F1F5F9', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                {/* Avatar */}
                <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:20, fontWeight:900, color:'#fff' }}>{m.name.charAt(0).toUpperCase()}</span>
                </div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <p style={{ margin:0, fontSize:15, fontWeight:800, color:'#111827' }}>{m.name}</p>
                    {memberTrx.length > 0 && <Badge color="blue">{memberTrx.length}x transaksi</Badge>}
                  </div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    {m.phone   && <span style={{ fontSize:12, color:'#6B7280' }}>📱 {m.phone}</span>}
                    {m.email   && <span style={{ fontSize:12, color:'#6B7280' }}>✉️ {m.email}</span>}
                    {m.address && <span style={{ fontSize:12, color:'#6B7280' }}>📍 {m.address}</span>}
                  </div>
                  <p style={{ margin:'4px 0 0', fontSize:11, color:'#9CA3AF' }}>Daftar {formatRelativeTime(m.createdAt)}</p>
                </div>
                {/* Stats */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ margin:'0 0 2px', fontSize:15, fontWeight:900, color:'#2563EB' }}>{formatIDR(totalSpent)}</p>
                  <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>total belanja</p>
                </div>
                {/* Actions */}
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => openDetail(m)} style={{ padding:'7px 12px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, color:'#2563EB', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Detail
                  </button>
                  <button onClick={() => openEdit(m)} style={{ padding:'7px 12px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8, color:'#374151', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Edit
                  </button>
                </div>
              </div>
              {m.notes && <p style={{ margin:'10px 0 0', fontSize:12, color:'#6B7280', fontStyle:'italic', paddingTop:10, borderTop:'1px solid #F9FAFB' }}>💬 {m.notes}</p>}
            </div>
          )
        })
      )}

      {/* ── Add Member Modal ── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Tambah Member Baru">
        <MemberForm form={form} setForm={setForm} />
        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth>Batal</Button>
          <Button onClick={handleSave} variant="primary" fullWidth icon="check" loading={saving} disabled={!form.name.trim()}>
            Simpan Member
          </Button>
        </div>
      </Modal>

      {/* ── Edit Member Modal ── */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Data Member">
        <MemberForm form={form} setForm={setForm} />
        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <Button onClick={() => setEditModal(false)} variant="secondary" fullWidth>Batal</Button>
          <Button onClick={handleUpdate} variant="primary" fullWidth icon="check" loading={saving} disabled={!form.name.trim()}>
            Simpan Perubahan
          </Button>
        </div>
      </Modal>

      {/* ── Member Detail Modal ── */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Profil Member">
        {selected && (() => {
          const memberTrx = getMemberTrx(selected.id)
          const totalSpent = memberTrx.filter(t => t.status==='completed').reduce((s,t) => s+(t.total||0), 0)
          const avgSpend   = memberTrx.length > 0 ? totalSpent / memberTrx.filter(t=>t.status==='completed').length : 0
          return (
            <div>
              {/* Profile header */}
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <span style={{ fontSize:30, fontWeight:900, color:'#fff' }}>{selected.name.charAt(0).toUpperCase()}</span>
                </div>
                <h3 style={{ margin:'0 0 4px', fontSize:18, fontWeight:900, color:'#111827' }}>{selected.name}</h3>
                <p style={{ margin:0, fontSize:12, color:'#9CA3AF' }}>Member sejak {formatDate(selected.createdAt)}</p>
              </div>

              {/* Contact info */}
              <div style={{ background:'#F9FAFB', borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
                {[
                  ['📱 Telepon', selected.phone   || '-'],
                  ['✉️ Email',   selected.email   || '-'],
                  ['📍 Alamat',  selected.address || '-'],
                  ...(selected.notes ? [['💬 Catatan', selected.notes]] : []),
                ].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F1F5F9' }}>
                    <span style={{ fontSize:12, color:'#6B7280' }}>{l}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'#111827', maxWidth:'60%', textAlign:'right', wordBreak:'break-word' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                {[
                  { label:'Total Transaksi', value: memberTrx.length, color:'#2563EB' },
                  { label:'Total Belanja',   value: formatIDR(totalSpent), color:'#22C55E' },
                  { label:'Rata-rata',       value: formatIDR(Math.round(avgSpend)), color:'#A855F7' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                    <p style={{ margin:'0 0 3px', fontSize:10, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase' }}>{s.label}</p>
                    <p style={{ margin:0, fontSize:14, fontWeight:900, color:s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent transactions */}
              {memberTrx.length > 0 && (
                <>
                  <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:800, color:'#374151', textTransform:'uppercase', letterSpacing:0.5 }}>Riwayat Transaksi</p>
                  {memberTrx.slice(0,5).map(t => (
                    <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #F9FAFB' }}>
                      <div>
                        <p style={{ margin:'0 0 1px', fontSize:12, fontWeight:700, color:'#111827', fontFamily:'monospace' }}>{t.id}</p>
                        <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>{formatRelativeTime(t.date||t.createdAt)} · {t.payment}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:800, color: t.status==='refunded'?'#EF4444':'#111827', textDecoration: t.status==='refunded'?'line-through':'none' }}>{formatIDR(t.total)}</p>
                        <Badge color={t.status==='completed'?'green':t.status==='refunded'?'red':'gray'} size="xs">
                          {t.status==='completed'?'Selesai':t.status==='refunded'?'Refund':'Batal'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <Button onClick={() => { setDetailModal(false); openEdit(selected) }} variant="secondary" fullWidth icon="edit">Edit Data</Button>
                <Button onClick={() => setDetailModal(false)} variant="primary" fullWidth>Tutup</Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

// Shared form component
const MemberForm = ({ form, setForm }) => (
  <div>
    {[
      { label:'Nama Lengkap *', key:'name',    placeholder:'Budi Santoso',          type:'text'    },
      { label:'No. Telepon',    key:'phone',   placeholder:'+62 812 3456 7890',     type:'tel'     },
      { label:'Email',          key:'email',   placeholder:'email@example.com',     type:'email'   },
      { label:'Alamat',         key:'address', placeholder:'Jl. Contoh No.1, Kota', type:'text'    },
      { label:'Catatan',        key:'notes',   placeholder:'Preferensi, info dll.', type:'textarea'},
    ].map(f => (
      <div key={f.key} style={{ marginBottom:12 }}>
        <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>{f.label}</label>
        {f.type === 'textarea' ? (
          <textarea value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={2}
            style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', resize:'none', boxSizing:'border-box' }} />
        ) : (
          <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
            style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
        )}
      </div>
    ))}
  </div>
)
