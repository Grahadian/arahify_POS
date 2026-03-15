// ============================================================
// MSME GROW POS - Settings Page (Multi-Client + GAS Integration)
// ============================================================
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatRelativeTime } from '@/utils/format'
import { ROLES, CURRENCIES } from '@/config/constants'
import { GAS_TEMPLATE_CODE } from '@/services/googleSheets'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Card, Badge, Alert } from '@/components/ui/index.jsx'

const SettingsPage = () => {
 const {
 user, settings, gsConfig,
 updateSettings, logout,
 connectGoogleSheets, disconnectGoogleSheets,
 syncToGoogleSheets, pullFromGoogleSheets,
 } = useApp()

 const isAdmin = user?.role === ROLES.ADMIN

 // Info client sudah ada di user object (dari Supabase login)
 const clientInfo = {
 businessName : user?.clientBusinessName || '',
 gsWebAppUrl : user?.gsWebAppUrl || '',
 }

 const [activeTab, setActiveTab] = useState('gs') // Default langsung ke GS tab

 // Profile
 const [businessName, setBusinessName] = useState(settings.businessName || clientInfo?.businessName || '')
 const [ownerName, setOwnerName] = useState(settings.ownerName || clientInfo?.ownerName || '')
 const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '')
 const [address, setAddress] = useState(settings.address || '')
 const [currency, setCurrency] = useState(settings.currency || 'IDR')
 const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || 'Terima kasih atas kepercayaan Anda!')
 const [profileSaved, setProfileSaved] = useState(false)

 // Tax
 const [taxRate, setTaxRate] = useState(String(settings.taxRate || 5))
 const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled !== false)
 const [printAuto, setPrintAuto] = useState(settings.printAutomatically || false)
 const [receiptMode, setReceiptModeState] = useState(settings.defaultReceiptMode || 'thermal')
 const [qrisImageUrl, setQrisImageUrl] = useState(settings.qrisImageUrl || '')
 const [kasirPin, setKasirPin] = useState(settings.kasirPin || '')
 const [bankAccounts, setBankAccounts] = useState(
 settings.bankAccounts || [{ bankName:'', noRek:'', atasNama:'' }, { bankName:'', noRek:'', atasNama:'' }]
 )

 // Kasir tab state (harus di top level, bukan di dalam conditional) 
 const [kasirList, setKasirList] = useState(() => {
 try { return JSON.parse(localStorage.getItem(`kasirUsers_${settings?.businessName||'default'}`) || '[]') } catch { return [] }
 })
 const [showAddKasir, setShowAddKasir] = useState(false)
 const [kasirForm, setKasirForm] = useState({ name:'', username:'', pin:'1234' })
 const [kasirErr, setKasirErr] = useState('')

 // GS
 const [gsUrlInput, setGsUrlInput] = useState(gsConfig.webAppUrl || clientInfo?.gsWebAppUrl || '')
 const [gsConnecting, setGsConnecting] = useState(false)
 const [gsSyncing, setGsSyncing] = useState(false)
 const [gsPulling, setGsPulling] = useState(false)
 const [gsError, setGsError] = useState('')
 const [gsSuccess, setGsSuccess] = useState('')
 const [showGasCode, setShowGasCode] = useState(false)
 const [codeCopied, setCodeCopied] = useState(false)

 const [logoutConfirm, setLogoutConfirm] = useState(false)

 const tabs = isAdmin
 ? [
 { id: 'gs', label: 'Google Sheets', icon: 'spreadsheet' },
 { id: 'profile', label: 'Profil Bisnis', icon: 'store' },
 { id: 'tax', label: 'Pajak & Kasir', icon: 'percent' },
 { id: 'loyalty', label: 'Poin Reward', icon: 'loyalty' },
 { id: 'shift', label: 'Shift', icon: 'shift' },
 { id: 'kasir', label: 'Kasir', icon: 'user' },
 { id: 'account', label: 'Akun', icon: 'user' },
 ]
 : [
 { id: 'profile', label: 'Profil', icon: 'store' },
 { id: 'account', label: 'Akun', icon: 'user' },
 ]

 const saveProfile = () => {
 updateSettings({ businessName, ownerName, whatsapp, address, currency, receiptFooter })
 setProfileSaved(true)
 setTimeout(() => setProfileSaved(false), 3000)
 }

 const saveTax = () => {
 updateSettings({ taxRate: Number(taxRate) || 5, taxEnabled, printAutomatically: printAuto, defaultReceiptMode: receiptMode, qrisImageUrl, kasirPin, bankAccounts })
 alert('Pengaturan berhasil disimpan.')
 }

 const handleConnect = async () => {
 if (!gsUrlInput.trim()) { setGsError('URL tidak boleh kosong.'); return }
 if (!gsUrlInput.includes('script.google.com')) {
 setGsError('URL tidak valid. Harus berformat: https://script.google.com/macros/s/.../exec')
 return
 }
 setGsError(''); setGsSuccess('')
 setGsConnecting(true)
 try {
 await connectGoogleSheets(gsUrlInput.trim())
 setGsSuccess(' Berhasil terhubung! Data transaksi akan otomatis sync ke Google Sheets.')
 } catch (err) {
 setGsError(err.message)
 } finally {
 setGsConnecting(false)
 }
 }

 const handleDisconnect = () => {
 disconnectGoogleSheets()
 setGsUrlInput('')
 setGsSuccess('')
 setGsError('')
 }

 const handleSync = async () => {
 setGsError(''); setGsSuccess('')
 setGsSyncing(true)
 try {
 await syncToGoogleSheets()
 setGsSuccess(' Semua data berhasil disinkronisasi — produk, transaksi, settings, dan laporan sudah diperbarui.')
 } catch (err) {
 setGsError(err.message)
 } finally {
 setGsSyncing(false)
 }
 }

 const handlePull = async () => {
 setGsError(''); setGsSuccess('')
 setGsPulling(true)
 try {
 const result = await pullFromGoogleSheets()
 setGsSuccess(` Berhasil mengambil ${result.productsCount} produk dari Google Sheets!`)
 } catch (err) {
 setGsError(err.message)
 } finally {
 setGsPulling(false)
 }
 }

 const copyGasCode = () => {
 navigator.clipboard.writeText(GAS_TEMPLATE_CODE).then(() => {
 setCodeCopied(true)
 setTimeout(() => setCodeCopied(false), 2500)
 })
 }

 // Toggle switch component
 const Toggle = ({ value, onChange }) => (
 <div
 onClick={() => onChange(!value)}
 style={{ width:48, height:26, borderRadius:13, background: value ? '#2563EB' : '#D1D5DB', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}
 >
 <div style={{ position:'absolute', width:20, height:20, borderRadius:'50%', background:'#fff', top:3, left: value ? 25 : 3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
 </div>
 )

 return (
 <div style={{ padding:'14px' }}>
 <div style={{ marginBottom:18 }}>
 <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#111827' }}>Pengaturan</h2>
 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
 <p style={{ margin:0, color:'#6B7280', fontSize:13 }}>Kelola integrasi dan preferensi aplikasi</p>
 {user?.clientId && (
 <span style={{ fontSize:11, fontWeight:700, color:'#1D4ED8', background:'#EFF6FF', padding:'2px 8px', borderRadius:6, border:'1px solid #BFDBFE' }}>
 Client: {user.clientId}
 </span>
 )}
 </div>
 </div>

 {/* Tabs */}
 <div style={{ display:'flex', gap:7, marginBottom:20, overflowX:'auto', paddingBottom:2 }}>
 {tabs.map(t => (
 <button
 key={t.id}
 onClick={() => setActiveTab(t.id)}
 style={{
 display:'flex', alignItems:'center', gap:7,
 padding:'8px 16px', borderRadius:10,
 border: activeTab === t.id ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB',
 background: activeTab === t.id ? '#EFF6FF' : '#fff',
 color: activeTab === t.id ? '#2563EB' : '#6B7280',
 fontSize:13, fontWeight:700, cursor:'pointer',
 whiteSpace:'nowrap', fontFamily:'inherit', transition:'all 0.15s',
 }}
 >
 <Icon name={t.icon} size={14} color={activeTab === t.id ? '#2563EB' : '#9CA3AF'} />
 {t.label}
 {t.id === 'gs' && (
 <span style={{ width:7, height:7, borderRadius:'50%', background: gsConfig.connected ? '#22C55E' : '#9CA3AF', flexShrink:0 }} />
 )}
 </button>
 ))}
 </div>

 {/* GOOGLE SHEETS TAB */}
 {activeTab === 'gs' && (
 <div>

 {/* Status Card */}
 <Card style={{ marginBottom:14 }}>
 <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
 <div style={{ width:52, height:52, background:'#EFF6FF', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <Icon name="spreadsheet" size={26} color="#2563EB" />
 </div>
 <div style={{ flex:1 }}>
 <h3 style={{ margin:'0 0 3px', fontSize:16, fontWeight:800, color:'#111827' }}>
 Integrasi Google Sheets
 </h3>
 <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
 <div style={{
 display:'flex', alignItems:'center', gap:5,
 background: gsConfig.connected ? '#F0FDF4' : '#F9FAFB',
 border: `1px solid ${gsConfig.connected ? '#BBF7D0' : '#E5E7EB'}`,
 borderRadius:8, padding:'3px 10px',
 }}>
 <div style={{ width:7, height:7, borderRadius:'50%', background: gsConfig.connected ? '#22C55E' : '#9CA3AF', animation: gsConfig.syncing ? 'pulse 1s ease infinite' : 'none' }} />
 <span style={{ fontSize:12, fontWeight:700, color: gsConfig.connected ? '#166534' : '#6B7280' }}>
 {gsConfig.syncing ? 'Syncing...' : gsConfig.connected ? 'TERHUBUNG' : 'BELUM TERHUBUNG'}
 </span>
 </div>
 {gsConfig.lastSync && (
 <span style={{ fontSize:11, color:'#9CA3AF' }}>
 Sync terakhir: {formatRelativeTime(gsConfig.lastSync)}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Client Info */}
 {clientInfo && (
 <div style={{ background:'#F8FAFC', borderRadius:10, padding:'10px 14px', marginBottom:16, border:'1px solid #E5E7EB' }}>
 <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.5 }}>
 Sheet untuk klien ini
 </p>
 <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:800, color:'#111827' }}>
 {clientInfo.businessName}
 </p>
 <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>
 Client ID: <code style={{ background:'#E5E7EB', padding:'1px 6px', borderRadius:4, fontSize:11 }}>{clientInfo.clientId}</code>
 </p>
 </div>
 )}

 {gsError && <Alert type="error" onClose={() => setGsError('')} >{gsError}</Alert>}
 {gsSuccess && <Alert type="success" onClose={() => setGsSuccess('')}>{gsSuccess}</Alert>}

 {/* URL Input */}
 <div style={{ marginBottom:14 }}>
 <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:7 }}>
 Google Apps Script Web App URL <span style={{ color:'#DC2626' }}>*</span>
 </label>
 <div style={{ position:'relative' }}>
 <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', zIndex:1 }}>
 <Icon name="link" size={16} color={gsConfig.connected ? '#22C55E' : '#9CA3AF'} />
 </span>
 <input
 value={gsUrlInput}
 onChange={e => setGsUrlInput(e.target.value)}
 placeholder="https://script.google.com/macros/s/.../exec"
 disabled={gsConfig.connected}
 style={{
 width:'100%', padding:'12px 14px 12px 40px',
 border:`1.5px solid ${gsConfig.connected ? '#BBF7D0' : '#E5E7EB'}`,
 borderRadius:10, fontSize:13, fontFamily:'monospace',
 outline:'none', background: gsConfig.connected ? '#F0FDF4' : '#fff',
 color:'#374151', boxSizing:'border-box', transition:'border-color 0.2s',
 }}
 onFocus={e => { if (!gsConfig.connected) e.target.style.borderColor = '#2563EB' }}
 onBlur={e => { if (!gsConfig.connected) e.target.style.borderColor = '#E5E7EB' }}
 />
 </div>
 <p style={{ margin:'5px 0 0', fontSize:11, color:'#9CA3AF' }}>
 URL harus dimulai dengan: https://script.google.com/macros/s/
 </p>
 </div>

 {/* Action Buttons */}
 {!gsConfig.connected ? (
 <Button onClick={handleConnect} variant="primary" fullWidth icon="link" loading={gsConnecting}>
 {gsConnecting ? 'Menghubungkan...' : 'Hubungkan ke Google Sheets'}
 </Button>
 ) : (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
 <Button onClick={handleSync} variant="success" fullWidth icon="refresh" loading={gsSyncing}>
 {gsSyncing ? 'Syncing...' : 'Push ke Sheets'}
 </Button>
 <Button onClick={handlePull} variant="ghost" fullWidth icon="download" loading={gsPulling}>
 {gsPulling ? 'Pulling...' : 'Pull dari Sheets'}
 </Button>
 <Button onClick={handleDisconnect} variant="outline" fullWidth icon="x" style={{ gridColumn:'1/-1' }}>
 Putuskan Koneksi
 </Button>
 </div>
 )}
 </Card>

 {/* What gets synced */}
 <Card style={{ marginBottom:14 }}>
 <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:800, color:'#111827' }}>
 Data yang Disinkronisasi
 </h3>
 {[
 { icon:'orders', color:'#1D4ED8', bg:'#DBEAFE', label:'Transaksi', desc:'Otomatis setiap checkout. Tab: Transaksi' },
 { icon:'inventory', color:'#166534', bg:'#DCFCE7', label:'Produk & Inventori', desc:'Manual via tombol Push. Tab: Produk' },
 { icon:'settings', color:'#F97316', bg:'#FFF7ED', label:'Pengaturan Bisnis', desc:'Manual via tombol Push. Tab: Pengaturan' },
 { icon:'reports', color:'#A855F7', bg:'#EDE9FE', label:'Laporan Otomatis', desc:'Dibangun ulang tiap transaksi baru. Tab: Laporan' },
 ].map(item => (
 <div key={item.label} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'9px 0', borderBottom:'1px solid #F9FAFB' }}>
 <div style={{ width:36, height:36, background:item.bg, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <Icon name={item.icon} size={17} color={item.color} />
 </div>
 <div>
 <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'#111827' }}>{item.label}</p>
 <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>{item.desc}</p>
 </div>
 <div style={{ marginLeft:'auto', flexShrink:0 }}>
 <Badge color={gsConfig.connected ? 'green' : 'gray'}>
 {gsConfig.connected ? 'Aktif' : 'Nonaktif'}
 </Badge>
 </div>
 </div>
 ))}
 </Card>

 {/* Setup Guide */}
 <Card style={{ marginBottom:14 }}>
 <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
 <Icon name="info" size={18} color="#2563EB" />
 <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:'#111827' }}>
 Panduan Setup untuk Klien Baru
 </h3>
 </div>
 <div style={{ background:'#EFF6FF', borderRadius:10, padding:14, marginBottom:14 }}>
 {[
 'Buat Google Spreadsheet baru untuk klien ini di Google Drive Anda.',
 'Buka menu Extensions → Apps Script di dalam spreadsheet tersebut.',
 'Hapus kode default, lalu paste template kode GAS dari bagian di bawah.',
 'Klik Deploy → New deployment → pilih tipe Web app.',
 'Set "Execute as: Me" dan "Who has access: Anyone" → klik Deploy.',
 'Salin Web App URL yang muncul (format: https://script.google.com/macros/s/.../exec)',
 'Paste URL tersebut di kolom di atas, lalu klik "Hubungkan ke Google Sheets".',
 '(Opsional) Jalankan fungsi setupDailyTrigger() untuk laporan otomatis harian.',
 ].map((step, i) => (
 <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}>
 <span style={{ width:22, height:22, background:'#2563EB', color:'#fff', borderRadius:'50%', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
 {i + 1}
 </span>
 <span style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{step}</span>
 </div>
 ))}
 </div>
 </Card>

 {/* GAS Template Code */}
 <Card>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
 <div>
 <h3 style={{ margin:'0 0 2px', fontSize:14, fontWeight:800, color:'#111827' }}>Template Google Apps Script</h3>
 <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>
 4 sheet otomatis: Transaksi, Produk, Pengaturan, Laporan
 </p>
 </div>
 <div style={{ display:'flex', gap:8 }}>
 <Button onClick={copyGasCode} variant={codeCopied ? 'success' : 'primary'} size="sm" icon={codeCopied ? 'check' : 'copy'}>
 {codeCopied ? 'Tersalin!' : 'Salin Kode'}
 </Button>
 <Button onClick={() => setShowGasCode(!showGasCode)} variant="secondary" size="sm" icon={showGasCode ? 'chevronUp' : 'chevronDown'}>
 {showGasCode ? 'Tutup' : 'Lihat'}
 </Button>
 </div>
 </div>
 {showGasCode && (
 <div style={{ background:'#0F172A', borderRadius:10, padding:16, overflow:'auto', maxHeight:420, border:'1px solid #1E293B' }}>
 <pre style={{ margin:0, fontSize:11, color:'#94A3B8', fontFamily:'monospace', whiteSpace:'pre', lineHeight:1.7 }}>
 {GAS_TEMPLATE_CODE}
 </pre>
 </div>
 )}
 </Card>
 </div>
 )}

 {/* PROFILE TAB */}
 {activeTab === 'profile' && (
 <Card>
 <h3 style={{ margin:'0 0 18px', fontSize:12, fontWeight:800, color:'#1D4ED8', textTransform:'uppercase', letterSpacing:1 }}>
 Informasi Bisnis
 </h3>
 {profileSaved && <Alert type="success">Perubahan berhasil disimpan!</Alert>}

 {/* Brand Logo — READ-ONLY, dikontrol oleh pemilik sistem */}
 <div style={{ marginBottom:20, padding:'14px 16px', background:'#F9FAFB', borderRadius:14, border:'1.5px solid #E5E7EB', display:'flex', alignItems:'center', gap:14 }}>
 <div style={{ width:52, height:52, background:'linear-gradient(135deg,#1D4ED8,#4F46E5)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(29,78,216,0.3)' }}>
 <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
 <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
 <polyline points="9 22 9 12 15 12 15 22"/>
 </svg>
 </div>
 <div>
 <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:800, color:'#111827' }}>MSME Grow POS</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>Logo brand sistem — tidak dapat diubah dari sini</p>
 </div>
 <div style={{ marginLeft:'auto', flexShrink:0 }}>
 <span style={{ fontSize:10, fontWeight:700, color:'#6B7280', background:'#E5E7EB', padding:'3px 8px', borderRadius:6, textTransform:'uppercase', letterSpacing:0.5 }}>Brand</span>
 </div>
 </div>

 <Input label="Nama Bisnis" value={businessName} onChange={setBusinessName} placeholder="e.g. Warung Bu Sari" icon="store" />
 <Input label="Nama Pemilik" value={ownerName} onChange={setOwnerName} placeholder="Nama lengkap pemilik" icon="user" />
 <Input label="WhatsApp Notifikasi" value={whatsapp} onChange={setWhatsapp} placeholder="+62 812 3456 7890" icon="bell" note="Untuk struk digital dan notifikasi." />
 <Input label="Alamat Bisnis" value={address} onChange={setAddress} placeholder="Jl. Contoh No.1, Kota" type="textarea" rows={2} />
 <Input label="Mata Uang" value={currency} onChange={setCurrency} type="select" options={CURRENCIES.map(c => ({ value:c.code, label:`${c.code} - ${c.name} (${c.symbol})` }))} />
 <Input label="Footer Struk" value={receiptFooter} onChange={setReceiptFooter} placeholder="Terima kasih atas kepercayaan Anda!" note="Teks di bagian bawah setiap struk cetak." />
 <Button onClick={saveProfile} variant="primary" fullWidth icon="check">Simpan Perubahan</Button>
 </Card>
 )}

 {/* TAX TAB */}
 {activeTab === 'tax' && (
 <Card>
 <h3 style={{ margin:'0 0 18px', fontSize:12, fontWeight:800, color:'#1D4ED8', textTransform:'uppercase', letterSpacing:1 }}>
 Pengaturan Pajak & Kasir
 </h3>

 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, padding:'14px 16px', background:'#F9FAFB', borderRadius:12, border:'1px solid #E5E7EB' }}>
 <div>
 <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:700, color:'#111827' }}>Aktifkan Pajak</p>
 <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>Tambahkan pajak ke setiap transaksi</p>
 </div>
 <Toggle value={taxEnabled} onChange={setTaxEnabled} />
 </div>

 {taxEnabled && (
 <Input label="Tarif Pajak (%)" value={taxRate} onChange={setTaxRate} placeholder="5" type="number" suffix="%" note="Berlaku untuk semua transaksi baru." />
 )}

 <div style={{ height:1, background:'#F1F5F9', margin:'4px 0 16px' }} />

 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, padding:'14px 16px', background:'#F9FAFB', borderRadius:12, border:'1px solid #E5E7EB' }}>
 <div>
 <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:700, color:'#111827' }}>Cetak Struk Otomatis</p>
 <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>Langsung cetak setelah transaksi berhasil</p>
 </div>
 <Toggle value={printAuto} onChange={setPrintAuto} />
 </div>

 {/* Receipt mode default */}
 <div style={{ marginBottom:18, padding:'14px 16px', background:'#F9FAFB', borderRadius:12, border:'1px solid #E5E7EB' }}>
 <p style={{ margin:'0 0 8px', fontSize:14, fontWeight:700, color:'#111827' }}>Mode Dokumen Default</p>
 <p style={{ margin:'0 0 12px', fontSize:12, color:'#6B7280' }}>Pilih format dokumen saat kasir mencetak struk. Bisa diubah saat checkout.</p>
 <div style={{ display:'flex', gap:10 }}>
 {[
 { val:'thermal', label:' Struk Thermal 80mm', desc:'Untuk printer thermal kasir' },
 { val:'invoice', label:' Nota A5 Landscape', desc:'Untuk printer biasa / invoice' },
 ].map(opt => (
 <button key={opt.val} onClick={() => setReceiptModeState(opt.val)}
 style={{ flex:1, padding:'12px', borderRadius:10, border: receiptMode===opt.val ? '2px solid #2563EB' : '1.5px solid #E5E7EB', background: receiptMode===opt.val ? '#EFF6FF' : '#fff', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s' }}>
 <p style={{ margin:'0 0 3px', fontSize:13, fontWeight:700, color: receiptMode===opt.val?'#2563EB':'#111827' }}>{opt.label}</p>
 <p style={{ margin:0, fontSize:11, color:'#6B7280' }}>{opt.desc}</p>
 </button>
 ))}
 </div>
 </div>

 {/* QRIS Barcode Upload */}
 <div style={{ marginBottom:18, padding:'14px 16px', background:'#F9FAFB', borderRadius:12, border:'1px solid #E5E7EB' }}>
 <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:700, color:'#111827' }}>Foto Barcode QRIS</p>
 <p style={{ margin:'0 0 12px', fontSize:12, color:'#6B7280' }}>Upload foto QRIS dari bank/e-wallet Anda. Akan tampil saat pelanggan memilih metode QRIS di kasir.</p>
 {qrisImageUrl ? (
 <div style={{ textAlign:'center', marginBottom:10 }}>
 <div style={{ background:'#fff', borderRadius:12, padding:10, border:'1.5px solid #BFDBFE', display:'inline-block', marginBottom:8 }}>
 <img src={qrisImageUrl} alt="QRIS" style={{ width:140, height:140, objectFit:'contain', display:'block' }} />
 </div>
 <br />
 <button onClick={() => setQrisImageUrl('')} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
 Hapus Gambar
 </button>
 </div>
 ) : (
 <label style={{ display:'block', padding:'14px', border:'2px dashed #BFDBFE', borderRadius:12, textAlign:'center', cursor:'pointer', background:'#EFF6FF', transition:'all 0.15s' }}>
 <input type="file" accept="image/*" style={{ display:'none' }}
 onChange={e => {
 const file = e.target.files?.[0]
 if (!file) return
 const reader = new FileReader()
 reader.onload = ev => setQrisImageUrl(ev.target.result)
 reader.readAsDataURL(file)
 e.target.value = ''
 }} />
 <p style={{ margin:'0 0 4px', fontSize:20 }}></p>
 <p style={{ margin:'0 0 3px', fontSize:13, fontWeight:700, color:'#1D4ED8' }}>Klik untuk upload foto QRIS</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>PNG, JPG, JPEG — Max 5MB</p>
 </label>
 )}
 </div>

 {/* Bank Transfer Info */}
 <div style={{ marginBottom:18, padding:'14px 16px', background:'#F9FAFB', borderRadius:12, border:'1px solid #E5E7EB' }}>
 <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:700, color:'#111827' }}>PIN Kasir (6 Digit)</p>
 <p style={{ margin:'0 0 12px', fontSize:12, color:'#6B7280' }}>PIN ini digunakan kasir untuk masuk ke mode kasir. Kosongkan untuk gunakan PIN default: 123456</p>
 <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:18 }}>
 <input
 type="text" inputMode="numeric" maxLength={6}
 value={kasirPin}
 onChange={e => setKasirPin(e.target.value.replace(/\D/g,'').slice(0,6))}
 placeholder="Contoh: 123456"
 style={{ width:160, padding:'10px 14px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:20, fontWeight:700, letterSpacing:6, fontFamily:'monospace', textAlign:'center', outline:'none' }}
 />
 {kasirPin.length > 0 && kasirPin.length < 6 && (
 <span style={{ fontSize:12, color:'#DC2626', fontWeight:600 }}>PIN harus 6 digit</span>
 )}
 {kasirPin.length === 6 && (
 <span style={{ fontSize:12, color:'#166534', fontWeight:600 }}> PIN valid</span>
 )}
 </div>

 <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:700, color:'#111827' }}>Info Transfer Bank</p>
 <p style={{ margin:'0 0 14px', fontSize:12, color:'#6B7280' }}>Maksimal 2 rekening bank. Akan tampil saat kasir memilih metode Transfer.</p>
 {bankAccounts.map((bank, idx) => (
 <div key={idx} style={{ marginBottom:14, padding:'14px', background:'#fff', borderRadius:10, border:'1.5px solid #E5E7EB' }}>
 <p style={{ margin:'0 0 10px', fontSize:12, fontWeight:700, color:'#374151' }}>Rekening {idx+1}</p>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:8, marginBottom:8 }}>
 <div>
 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:4 }}>Nama Bank</label>
 <input value={bank.bankName} onChange={e=>setBankAccounts(prev=>prev.map((b,i)=>i===idx?{...b,bankName:e.target.value}:b))}
 placeholder="BCA, BRI, Mandiri..." style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
 </div>
 <div>
 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:4 }}>No. Rekening</label>
 <input value={bank.noRek} onChange={e=>setBankAccounts(prev=>prev.map((b,i)=>i===idx?{...b,noRek:e.target.value}:b))}
 placeholder="1234567890" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
 </div>
 </div>
 <div>
 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:4 }}>Atas Nama</label>
 <input value={bank.atasNama} onChange={e=>setBankAccounts(prev=>prev.map((b,i)=>i===idx?{...b,atasNama:e.target.value}:b))}
 placeholder="Nama pemilik rekening" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
 </div>
 </div>
 ))}
 </div>

 <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'10px 14px', marginBottom:18 }}>
 <p style={{ margin:0, fontSize:12, color:'#92400E', lineHeight:1.5 }}>
 Perubahan tarif pajak hanya berlaku untuk transaksi <strong>baru</strong>. Transaksi lama tidak terpengaruh.
 </p>
 </div>
 <Button onClick={saveTax} variant="primary" fullWidth icon="check">Simpan Pengaturan</Button>
 </Card>
 )}

 {/* LOYALTY POINTS TAB */}
 {activeTab === 'loyalty' && (
 <Card style={{ marginBottom: 16 }}>
 <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: '#111827' }}> Program Poin Reward</h3>
 <p style={{ margin: '0 0 20px', fontSize: 12, color: '#6B7280' }}>Beri poin ke member setiap transaksi untuk meningkatkan loyalitas pelanggan.</p>

 {/* Toggle */}
 <div onClick={() => updateSettings({ loyaltyEnabled: !settings.loyaltyEnabled })}
 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, cursor: 'pointer', padding: '14px 16px', background: settings.loyaltyEnabled ? '#F0FDF4' : '#F9FAFB', border: `1.5px solid ${settings.loyaltyEnabled ? '#A7F3D0' : '#E5E7EB'}`, borderRadius: 12 }}>
 <div style={{ width: 44, height: 24, borderRadius: 12, background: settings.loyaltyEnabled ? '#22C55E' : '#D1D5DB', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
 <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: settings.loyaltyEnabled ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
 </div>
 <div>
 <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Program Poin Aktif</p>
 <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>{settings.loyaltyEnabled ? 'Member mendapat poin setiap transaksi' : 'Aktifkan untuk mulai memberi reward'}</p>
 </div>
 </div>

 {settings.loyaltyEnabled && (
 <>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 14 }}>
 <div>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>1 Poin per Rp berapa?</label>
 <input type="number"
 value={settings.pointsPerRupiah || 1000}
 onChange={e => updateSettings({ pointsPerRupiah: Number(e.target.value) || 1000 })}
 style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }}
 />
 <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>e.g. 1000 = 1 poin per Rp 1.000</p>
 </div>
 <div>
 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>1 Poin = Rp berapa?</label>
 <input type="number"
 value={settings.pointsRedeemRate || 1}
 onChange={e => updateSettings({ pointsRedeemRate: Number(e.target.value) || 1 })}
 style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }}
 />
 <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>e.g. 1 = 1 poin bisa tukar Rp 1 diskon</p>
 </div>
 </div>
 <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 14px' }}>
 <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#92400E' }}> Contoh Simulasi:</p>
 <p style={{ margin: '0 0 3px', fontSize: 12, color: '#92400E' }}>
 Transaksi Rp 100.000 → +{Math.floor(100000 / (settings.pointsPerRupiah || 1000))} poin
 </p>
 <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
 100 poin bisa tukar Rp {(100 * (settings.pointsRedeemRate || 1)).toLocaleString('id-ID')} diskon
 </p>
 </div>
 </>
 )}
 </Card>
 )}

 {/* SHIFT SETTINGS TAB */}
 {activeTab === 'shift' && (
 <Card style={{ marginBottom: 16 }}>
 <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: '#111827' }}> Pengaturan Shift Kasir</h3>
 <p style={{ margin: '0 0 20px', fontSize: 12, color: '#6B7280' }}>Aktifkan sistem shift untuk memantau kinerja kasir per sesi kerja.</p>

 <div onClick={() => updateSettings({ shiftEnabled: !settings.shiftEnabled })}
 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, cursor: 'pointer', padding: '14px 16px', background: settings.shiftEnabled ? '#EFF6FF' : '#F9FAFB', border: `1.5px solid ${settings.shiftEnabled ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 12 }}>
 <div style={{ width: 44, height: 24, borderRadius: 12, background: settings.shiftEnabled ? '#2563EB' : '#D1D5DB', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
 <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: settings.shiftEnabled ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
 </div>
 <div>
 <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Sistem Shift Aktif</p>
 <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>{settings.shiftEnabled ? 'Kasir perlu buka shift sebelum bertransaksi' : 'Aktifkan untuk mulai tracking shift'}</p>
 </div>
 </div>

 <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
 <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Fitur Shift meliputi:</p>
 {[
 ' Kasir buka shift dengan nama & modal awal kas',
 ' Rekap otomatis penjualan per shift',
 ' Input kas aktual saat tutup shift',
 ' Deteksi selisih kas (lebih/kurang)',
 ' Riwayat shift tersimpan',
 ' Laporan per kasir/shift di Laporan',
 ].map(f => (
 <p key={f} style={{ margin: '0 0 5px', fontSize: 12, color: '#374151' }}>{f}</p>
 ))}
 </div>
 </Card>
 )}

 {activeTab === 'shift' && (
 <Card style={{ marginBottom: 16 }}>
 <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: '#111827' }}> Manajemen Meja</h3>
 <p style={{ margin: '0 0 20px', fontSize: 12, color: '#6B7280' }}>Aktifkan fitur ini untuk bisnis yang memiliki meja (restoran, kafe, dsb). Jika tidak dibutuhkan, menu Meja akan disembunyikan.</p>

 <div onClick={() => updateSettings({ tableEnabled: !settings.tableEnabled })}
 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, cursor: 'pointer', padding: '14px 16px', background: settings.tableEnabled ? '#F0FDF4' : '#F9FAFB', border: `1.5px solid ${settings.tableEnabled ? '#A7F3D0' : '#E5E7EB'}`, borderRadius: 12 }}>
 <div style={{ width: 44, height: 24, borderRadius: 12, background: settings.tableEnabled ? '#059669' : '#D1D5DB', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
 <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: settings.tableEnabled ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
 </div>
 <div>
 <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Fitur Manajemen Meja {settings.tableEnabled ? 'Aktif' : 'Nonaktif'}</p>
 <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>{settings.tableEnabled ? 'Menu Meja tampil di navigasi Admin' : 'Cocok untuk toko/warung tanpa meja'}</p>
 </div>
 </div>

 {settings.tableEnabled && (
 <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 14px' }}>
 {[
 ' Grid visual status meja (Tersedia / Terisi / Reserved / Kotor)',
 ' Kelola area / ruangan meja',
 ' Riwayat transaksi per meja',
 ' Ubah status meja dengan 1 klik',
 ].map(f => (
 <p key={f} style={{ margin: '0 0 5px', fontSize: 12, color: '#065F46' }}>{f}</p>
 ))}
 </div>
 )}
 </Card>
 )}

 {/* KASIR MANAGEMENT TAB */}
 {activeTab === 'kasir' && (() => {
 const saveKasirList = (list) => {
 setKasirList(list)
 localStorage.setItem(`kasirUsers_${settings?.businessName||'default'}`, JSON.stringify(list))
 }
 const addKasir = () => {
 if (!kasirForm.name.trim() || !kasirForm.username.trim()) { setKasirErr('Nama dan username wajib diisi'); return }
 if (kasirList.find(k=>k.username===kasirForm.username)) { setKasirErr('Username sudah digunakan'); return }
 if (kasirForm.pin.length < 4) { setKasirErr('PIN minimal 4 digit'); return }
 saveKasirList([...kasirList, { ...kasirForm, id: Date.now(), createdAt: new Date().toISOString() }])
 setKasirForm({ name:'', username:'', pin:'1234' }); setKasirErr(''); setShowAddKasir(false)
 }
 const removeKasir = (id) => saveKasirList(kasirList.filter(k=>k.id!==id))
 const inp2 = { width:'100%', padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:8 }
 return (
 <div>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
 <div>
 <h3 style={{ margin:'0 0 3px', fontSize:15, fontWeight:800, color:'#111827' }}> Manajemen Kasir</h3>
 <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>Kelola akun kasir yang bisa login ke POS</p>
 </div>
 <button onClick={()=>{setShowAddKasir(true);setKasirErr('')}}
 style={{ padding:'8px 16px', background:'#2563EB', border:'none', borderRadius:10, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
 + Tambah Kasir
 </button>
 </div>

 <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#1E40AF' }}>
 ℹ Kasir login menggunakan <strong>username</strong> dan <strong>PIN</strong>. Daftar ini hanya untuk referensi — tambahkan kasir langsung di database Supabase.
 </div>

 {/* Default kasir from settings */}
 <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F5F9', overflow:'hidden', marginBottom:12 }}>
 <div style={{ padding:'10px 14px', background:'#F9FAFB', borderBottom:'1px solid #F1F5F9' }}>
 <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.5 }}>Kasir Terdaftar</p>
 </div>
 <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#16A34A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <span style={{ fontSize:14, fontWeight:900, color:'#fff' }}>K</span>
 </div>
 <div>
 <p style={{ margin:'0 0 1px', fontSize:13, fontWeight:700, color:'#111827' }}>kasir (default)</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>PIN: {settings?.kasirPin||'1234'} · Role: Kasir</p>
 </div>
 </div>
 <span style={{ fontSize:11, padding:'3px 10px', background:'#F0FDF4', color:'#166534', borderRadius:20, fontWeight:700, border:'1px solid #BBF7D0' }}>Default</span>
 </div>
 {kasirList.map(k => (
 <div key={k.id} style={{ padding:'12px 16px', borderTop:'1px solid #F9FAFB', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <span style={{ fontSize:14, fontWeight:900, color:'#fff' }}>{k.name.charAt(0).toUpperCase()}</span>
 </div>
 <div>
 <p style={{ margin:'0 0 1px', fontSize:13, fontWeight:700, color:'#111827' }}>{k.name}</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>@{k.username} · PIN: {k.pin}</p>
 </div>
 </div>
 <button onClick={()=>removeKasir(k.id)}
 style={{ padding:'5px 10px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, color:'#DC2626', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
 Hapus
 </button>
 </div>
 ))}
 </div>

 {showAddKasir && (
 <div style={{ background:'#fff', borderRadius:12, border:'1.5px solid #BFDBFE', padding:'14px' }}>
 <h4 style={{ margin:'0 0 12px', fontSize:13, fontWeight:800, color:'#111827' }}>Tambah Kasir Baru</h4>
 <input value={kasirForm.name} onChange={e=>setKasirForm(p=>({...p,name:e.target.value}))} placeholder="Nama lengkap" style={inp2} />
 <input value={kasirForm.username} onChange={e=>setKasirForm(p=>({...p,username:e.target.value.toLowerCase().replace(/\s/g,'')}))} placeholder="Username (contoh: budi)" style={inp2} />
 <input value={kasirForm.pin} onChange={e=>setKasirForm(p=>({...p,pin:e.target.value.replace(/\D/g,'').slice(0,8)}))} placeholder="PIN (min 4 digit)" type="password" inputMode="numeric" style={inp2} />
 {kasirErr && <p style={{ margin:'0 0 8px', fontSize:12, color:'#DC2626', fontWeight:600 }}> {kasirErr}</p>}
 <div style={{ display:'flex', gap:8 }}>
 <button onClick={()=>{setShowAddKasir(false);setKasirErr('')}} style={{ flex:1, padding:'9px', background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#374151' }}>Batal</button>
 <button onClick={addKasir} style={{ flex:1, padding:'9px', background:'#2563EB', border:'none', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#fff' }}>Simpan</button>
 </div>
 </div>
 )}
 </div>
 )
 })()}

 {/* ACCOUNT TAB */}
 {activeTab === 'account' && (
 <div>
 <Card style={{ marginBottom:16 }}>
 <h3 style={{ margin:'0 0 16px', fontSize:12, fontWeight:800, color:'#1D4ED8', textTransform:'uppercase', letterSpacing:1 }}>
 Informasi Akun
 </h3>
 <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'#F9FAFB', borderRadius:12, marginBottom:16 }}>
 <div style={{
 width:52, height:52,
 background: isAdmin ? 'linear-gradient(135deg,#2563EB,#7C3AED)' : 'linear-gradient(135deg,#22C55E,#16A34A)',
 borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
 }}>
 <Icon name="user" size={22} color="#fff" />
 </div>
 <div>
 <p style={{ margin:'0 0 3px', fontSize:16, fontWeight:800, color:'#111827' }}>{user?.name}</p>
 <p style={{ margin:'0 0 5px', fontSize:13, color:'#6B7280' }}>{user?.email}</p>
 <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
 <Badge color={isAdmin ? 'blue' : 'green'}>
 {isAdmin ? ' Admin' : ' Kasir'}
 </Badge>
 <Badge color="gray">{user?.clientId}</Badge>
 {user?.clientBusinessName && (
 <Badge color="purple">{user.clientBusinessName}</Badge>
 )}
 </div>
 </div>
 </div>

 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
 {[
 { label:'Username', value: user?.username },
 { label:'Role', value: user?.role },
 { label:'Client ID', value: user?.clientId },
 { label:'Google Sheet', value: gsConfig.connected ? ' Terhubung' : ' Belum' },
 ].map(item => (
 <div key={item.label} style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 14px' }}>
 <p style={{ margin:'0 0 3px', fontSize:11, color:'#9CA3AF', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{item.label}</p>
 <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#111827' }}>{item.value}</p>
 </div>
 ))}
 </div>
 </Card>

 {/* Permissions */}
 <Card style={{ marginBottom:16 }}>
 <h3 style={{ margin:'0 0 14px', fontSize:12, fontWeight:800, color:'#1D4ED8', textTransform:'uppercase', letterSpacing:1 }}>
 Hak Akses
 </h3>
 {[
 { label:'POS Register & Checkout', allowed: true },
 { label:'Lihat Riwayat Pesanan', allowed: true },
 { label:'Lihat Inventori Produk', allowed: true },
 { label:'Tambah / Edit / Hapus Produk', allowed: isAdmin },
 { label:'Business Dashboard', allowed: isAdmin },
 { label:'Admin Insights & Reports', allowed: isAdmin },
 { label:'Pengaturan Pajak', allowed: isAdmin },
 { label:'Integrasi Google Sheets', allowed: isAdmin },
 ].map(p => (
 <div key={p.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #F9FAFB' }}>
 <span style={{ fontSize:13, color: p.allowed ? '#111827' : '#9CA3AF' }}>{p.label}</span>
 <div style={{ display:'flex', alignItems:'center', gap:5 }}>
 <div style={{ width:6, height:6, borderRadius:'50%', background: p.allowed ? '#22C55E' : '#E5E7EB' }} />
 <span style={{ fontSize:12, fontWeight:700, color: p.allowed ? '#166534' : '#9CA3AF' }}>
 {p.allowed ? 'Diizinkan' : 'Tidak ada akses'}
 </span>
 </div>
 </div>
 ))}
 </Card>

 {/* Logout */}
 <button
 onClick={() => setLogoutConfirm(true)}
 style={{
 width:'100%', padding:14, background:'#FEF2F2',
 border:'1.5px solid #FECACA', borderRadius:12,
 color:'#DC2626', fontWeight:700, fontSize:14, cursor:'pointer',
 display:'flex', alignItems:'center', justifyContent:'center',
 gap:8, fontFamily:'inherit', transition:'all 0.15s',
 }}
 onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
 onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
 >
 <Icon name="logout" size={16} color="#DC2626" />
 Keluar dari Akun
 </button>
 </div>
 )}

 {/* Logout Modal */}
 <Modal open={logoutConfirm} onClose={() => setLogoutConfirm(false)} title="Konfirmasi Logout">
 <div style={{ textAlign:'center', marginBottom:20 }}>
 <div style={{ width:60, height:60, background:'#FEF2F2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
 <Icon name="logout" size={26} color="#EF4444" />
 </div>
 <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:800 }}>Keluar dari Akun?</h3>
 <p style={{ margin:0, fontSize:13, color:'#6B7280' }}>Sesi akan berakhir. Pastikan semua transaksi telah tersimpan.</p>
 </div>
 <div style={{ display:'flex', gap:10 }}>
 <Button onClick={() => setLogoutConfirm(false)} variant="secondary" fullWidth>Batal</Button>
 <Button onClick={logout} variant="danger" fullWidth icon="logout">Keluar</Button>
 </div>
 </Modal>
 </div>
 )
}

export default SettingsPage
