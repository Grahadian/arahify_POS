// ============================================================
// MSME GROW POS - Super Admin Dashboard
// ============================================================
// Hanya bisa diakses oleh user dengan role: superadmin
// Fitur: lihat semua client, aktivasi manual, update GS URL,
// statistik revenue, suspend/aktifkan client
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import {
 getAllClients, setClientStatus, updateClientGSUrl,
 getSuperAdminStats, addUserToClient,
} from '@/services/supabase'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatDate } from '@/utils/format'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Card, Badge, Alert, StatCard, EmptyState } from '@/components/ui/index.jsx'

const STATUS_COLOR = {
 active : 'green',
 trial : 'blue',
 pending : 'yellow',
 suspended : 'red',
 cancelled : 'gray',
}
const STATUS_LABEL = {
 active : ' Aktif',
 trial : ' Trial',
 pending : '⏳ Pending',
 suspended : ' Suspended',
 cancelled : ' Cancelled',
}

const SuperAdminDashboard = () => {
 const { logout } = useApp()

 const [tab, setTab] = useState('clients')
 const [clients, setClients] = useState([])
 const [stats, setStats] = useState(null)
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState('')
 const [filter, setFilter] = useState('')
 const [error, setError] = useState('')
 const [success, setSuccess] = useState('')
 const [page, setPage] = useState(1)
 const [total, setTotal] = useState(0)

 // Modals
 const [selectedClient, setSelectedClient] = useState(null)
 const [showGSModal, setShowGSModal] = useState(false)
 const [showAddUser, setShowAddUser] = useState(false)
 const [gsUrlInput, setGsUrlInput] = useState('')
 const [gsUpdating, setGsUpdating] = useState(false)

 // Add user form
 const [newUser, setNewUser] = useState({ username: '', email: '', fullName: '', password: '', role: 'kasir' })
 const [addingUser, setAddingUser] = useState(false)

 const loadData = useCallback(async () => {
 setLoading(true)
 setError('')
 try {
 const [clientsRes, statsRes] = await Promise.all([
 getAllClients({ page, search: search || null, status: filter || null }),
 getSuperAdminStats(),
 ])
 setClients(clientsRes.clients || [])
 setTotal(clientsRes.total || 0)
 setStats(statsRes)
 } catch (e) {
 setError(e.message)
 } finally {
 setLoading(false)
 }
 }, [page, search, filter])

 useEffect(() => { loadData() }, [loadData])

 const handleSetStatus = async (clientId, status) => {
 try {
 await setClientStatus(clientId, status)
 setSuccess(`Status berhasil diubah ke: ${STATUS_LABEL[status]}`)
 loadData()
 } catch (e) { setError(e.message) }
 }

 const handleUpdateGS = async () => {
 if (!selectedClient || !gsUrlInput.trim()) return
 setGsUpdating(true)
 try {
 await updateClientGSUrl(selectedClient.id, gsUrlInput.trim())
 setSuccess(`GAS URL berhasil disimpan untuk ${selectedClient.business_name}`)
 setShowGSModal(false)
 loadData()
 } catch (e) { setError(e.message) }
 finally { setGsUpdating(false) }
 }

 const handleAddUser = async () => {
 if (!selectedClient) return
 setAddingUser(true)
 try {
 await addUserToClient(selectedClient.id, newUser)
 setSuccess('User berhasil ditambahkan!')
 setShowAddUser(false)
 setNewUser({ username: '', email: '', fullName: '', password: '', role: 'kasir' })
 } catch (e) { setError(e.message) }
 finally { setAddingUser(false) }
 }

 const openGSModal = (client) => {
 setSelectedClient(client)
 setGsUrlInput(client.gs_web_app_url || '')
 setShowGSModal(true)
 }

 const openAddUser = (client) => {
 setSelectedClient(client)
 setNewUser({ username: '', email: '', fullName: '', password: '', role: 'kasir' })
 setShowAddUser(true)
 }

 return (
 <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>

 {/* Topbar */}
 <div style={{ background: '#1E3A8A', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <Icon name="store" size={18} color="#fff" />
 </div>
 <div>
 <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#fff' }}>MSME Grow</p>
 <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>SUPER ADMIN PANEL</p>
 </div>
 </div>
 <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
 <Icon name="logout" size={14} color="#fff" /> Logout
 </button>
 </div>

 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>

 {error && <Alert type="error" onClose={() => setError('')} style={{ marginBottom: 16 }}>{error}</Alert>}
 {success && <Alert type="success" onClose={() => setSuccess('')} style={{ marginBottom: 16 }}>{success}</Alert>}

 {/* Stats */}
 {stats && (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
 <StatCard icon="store" label="Total Client" value={stats.totalClients} color="#2563EB" />
 <StatCard icon="check" label="Client Aktif" value={stats.activeClients} color="#22C55E" />
 <StatCard icon="warning" label="Pending/Trial" value={stats.pendingClients} color="#F97316" />
 <StatCard icon="reports" label="Total Revenue" value={formatIDR(stats.totalRevenue)} color="#A855F7" />
 </div>
 )}

 {/* Tabs */}
 <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
 {[
 { id: 'clients', label: ' Semua Client' },
 { id: 'payments', label: ' Pembayaran Terbaru' },
 ].map(t => (
 <button key={t.id} onClick={() => setTab(t.id)} style={{
 padding: '8px 18px', borderRadius: 10,
 border: tab === t.id ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB',
 background: tab === t.id ? '#EFF6FF' : '#fff',
 color: tab === t.id ? '#2563EB' : '#6B7280',
 fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
 }}>
 {t.label}
 </button>
 ))}
 </div>

 {/* CLIENTS TAB */}
 {tab === 'clients' && (
 <div>
 {/* Filters */}
 <Card style={{ marginBottom: 16 }}>
 <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
 <div style={{ flex: 1, minWidth: 200 }}>
 <Input value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Cari nama bisnis, email, pemilik..." icon="search" />
 </div>
 <select
 value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}
 style={{ padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#374151' }}
 >
 <option value="">Semua Status</option>
 {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
 </select>
 <Button onClick={loadData} variant="secondary" icon="refresh" size="sm">Refresh</Button>
 </div>
 </Card>

 {loading ? (
 <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
 <p style={{ fontSize: 14 }}>Memuat data...</p>
 </div>
 ) : clients.length === 0 ? (
 <EmptyState icon="store" title="Belum ada client" desc="Client baru akan muncul di sini setelah mendaftar." />
 ) : (
 <>
 <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280' }}>
 Menampilkan {clients.length} dari {total} client
 </p>
 {clients.map(c => (
 <Card key={c.id} style={{ marginBottom: 12 }}>
 <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
 {/* Info */}
 <div style={{ flex: 1, minWidth: 200 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
 <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>{c.business_name}</p>
 <Badge color={STATUS_COLOR[c.status] || 'gray'}>{STATUS_LABEL[c.status] || c.status}</Badge>
 {c.plan === 'pro' && <Badge color="purple">Pro</Badge>}
 </div>
 <p style={{ margin: '0 0 2px', fontSize: 13, color: '#6B7280' }}>
 {c.owner_name} · {c.email}
 </p>
 {c.whatsapp && (
 <p style={{ margin: '0 0 2px', fontSize: 13, color: '#6B7280' }}> {c.whatsapp}</p>
 )}
 <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9CA3AF' }}>
 Daftar: {formatDate(c.created_at)}
 {c.plan_ends_at && ` · Aktif s/d: ${formatDate(c.plan_ends_at)}`}
 </p>
 {/* GS Status */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
 <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.gs_connected ? '#22C55E' : '#E5E7EB' }} />
 <span style={{ fontSize: 12, color: c.gs_connected ? '#166534' : '#9CA3AF' }}>
 {c.gs_connected ? 'Google Sheets terhubung' : c.gs_web_app_url ? 'GAS URL tersimpan (belum connect)' : 'Google Sheets belum dikonfigurasi'}
 </span>
 </div>
 {/* Users count */}
 {c.users && (
 <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>
 {c.users.length} user ({c.users.filter(u => u.role === 'admin').length} admin, {c.users.filter(u => u.role === 'kasir').length} kasir)
 </p>
 )}
 </div>

 {/* Actions */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
 <Button onClick={() => openGSModal(c)} variant="secondary" size="sm" icon="spreadsheet" fullWidth>
 {c.gs_web_app_url ? 'Update GAS URL' : 'Set GAS URL'}
 </Button>
 <Button onClick={() => openAddUser(c)} variant="ghost" size="sm" icon="user" fullWidth>
 Tambah User
 </Button>
 {c.status === 'active' ? (
 <Button onClick={() => handleSetStatus(c.id, 'suspended')} variant="danger" size="sm" icon="warning" fullWidth>
 Suspend
 </Button>
 ) : c.status === 'suspended' ? (
 <Button onClick={() => handleSetStatus(c.id, 'active')} variant="success" size="sm" icon="check" fullWidth>
 Aktifkan
 </Button>
 ) : c.status === 'pending' ? (
 <Button onClick={() => handleSetStatus(c.id, 'active')} variant="primary" size="sm" icon="check" fullWidth>
 Aktifkan Manual
 </Button>
 ) : null}
 </div>
 </div>
 </Card>
 ))}

 {/* Pagination */}
 {total > 20 && (
 <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
 <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="secondary" size="sm" icon="chevronLeft">Prev</Button>
 <span style={{ padding: '8px 16px', fontSize: 13, color: '#374151', fontWeight: 700 }}>Hal {page}</span>
 <Button onClick={() => setPage(p => p + 1)} disabled={clients.length < 20} variant="secondary" size="sm" icon="chevronRight">Next</Button>
 </div>
 )}
 </>
 )}
 </div>
 )}

 {/* PAYMENTS TAB */}
 {tab === 'payments' && (
 <Card>
 <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800 }}>Pembayaran Terbaru</h3>
 {stats?.recentPayments?.length === 0 ? (
 <EmptyState icon="reports" title="Belum ada pembayaran" desc="Pembayaran client akan muncul di sini." />
 ) : (
 (stats?.recentPayments || []).map((p, i) => (
 <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
 <div>
 <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#111827' }}>{p.clients?.business_name || '-'}</p>
 <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{formatDate(p.paid_at)}</p>
 </div>
 <div style={{ textAlign: 'right' }}>
 <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 800, color: '#2563EB' }}>{formatIDR(p.amount)}</p>
 <Badge color="green">Lunas</Badge>
 </div>
 </div>
 ))
 )}
 </Card>
 )}
 </div>

 {/* Modal: Update GAS URL */}
 <Modal open={showGSModal} onClose={() => setShowGSModal(false)} title={`Google Sheets — ${selectedClient?.business_name}`}>
 <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
 Setelah setup GAS untuk klien ini, paste Web App URL di sini. URL ini akan dipakai app POS klien untuk sync data.
 </p>
 <Input
 label="Google Apps Script Web App URL"
 value={gsUrlInput}
 onChange={setGsUrlInput}
 placeholder="https://script.google.com/macros/s/.../exec"
 icon="link"
 />
 <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
 <Button onClick={() => setShowGSModal(false)} variant="secondary" fullWidth>Batal</Button>
 <Button onClick={handleUpdateGS} variant="primary" fullWidth loading={gsUpdating} icon="check">Simpan URL</Button>
 </div>
 </Modal>

 {/* Modal: Add User */}
 <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title={`Tambah User — ${selectedClient?.business_name}`}>
 <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280' }}>
 Tambah akun admin atau kasir tambahan untuk klien ini.
 </p>
 <Input label="Nama Lengkap *" value={newUser.fullName} onChange={v => setNewUser(p => ({ ...p, fullName: v }))} placeholder="Nama kasir / admin" icon="user" />
 <Input label="Username *" value={newUser.username} onChange={v => setNewUser(p => ({ ...p, username: v.toLowerCase().replace(/\s/g,'') }))} placeholder="username_kasir" icon="user" />
 <Input label="Email *" value={newUser.email} onChange={v => setNewUser(p => ({ ...p, email: v }))} placeholder="email@bisnis.com" icon="mail" />
 <Input label="Password *" value={newUser.password} onChange={v => setNewUser(p => ({ ...p, password: v }))} placeholder="min. 6 karakter" type="password" icon="lock" />
 <Input label="Role" value={newUser.role} onChange={v => setNewUser(p => ({ ...p, role: v }))} type="select"
 options={[{ value: 'kasir', label: 'Kasir' }, { value: 'admin', label: 'Admin' }]} />
 <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
 <Button onClick={() => setShowAddUser(false)} variant="secondary" fullWidth>Batal</Button>
 <Button onClick={handleAddUser} variant="primary" fullWidth loading={addingUser} icon="user">Tambah User</Button>
 </div>
 </Modal>
 </div>
 )
}

export default SuperAdminDashboard
