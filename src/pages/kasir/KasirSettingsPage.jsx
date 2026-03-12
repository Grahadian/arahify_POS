// ============================================================
// MSME GROW POS - Kasir Settings Page v2.0
// + Ubah PIN, Info shift aktif, Info bisnis, Detail profil
// ============================================================
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import AppLogo from '@/assets/AppLogo'

export default function KasirSettingsPage() {
 const { user, logout, settings, activeShift, updateSettings } = useApp()
 const [confirmLogout, setConfirmLogout] = useState(false)
 const [showPinModal, setShowPinModal] = useState(false)
 const [pinStep, setPinStep] = useState('old') // 'old' | 'new' | 'confirm'
 const [pinOld, setPinOld] = useState('')
 const [pinNew, setPinNew] = useState('')
 const [pinConfirm, setPinConfirm] = useState('')
 const [pinError, setPinError] = useState('')
 const [pinSuccess, setPinSuccess] = useState(false)

 const handlePinChange = () => {
 setPinError('')
 if (pinStep === 'old') {
 if (pinOld !== String(settings?.kasirPin || '1234')) {
 setPinError('PIN lama tidak sesuai'); return
 }
 setPinStep('new'); setPinOld('')
 } else if (pinStep === 'new') {
 if (pinNew.length < 4) { setPinError('PIN minimal 4 digit'); return }
 setPinStep('confirm')
 } else {
 if (pinNew !== pinConfirm) { setPinError('Konfirmasi PIN tidak cocok'); setPinConfirm(''); return }
 updateSettings({ ...settings, kasirPin: pinNew })
 setPinSuccess(true)
 setTimeout(() => { setShowPinModal(false); setPinStep('old'); setPinNew(''); setPinConfirm(''); setPinSuccess(false) }, 1500)
 }
 }

 const closePinModal = () => { setShowPinModal(false); setPinStep('old'); setPinOld(''); setPinNew(''); setPinConfirm(''); setPinError(''); setPinSuccess(false) }

 const pinInput = {
 width:'100%', padding:'12px 14px', border:'1.5px solid #E5E7EB', borderRadius:10,
 fontSize:20, fontFamily:'monospace', outline:'none', textAlign:'center', letterSpacing:8,
 boxSizing:'border-box', marginBottom:8
 }

 return (
 <div style={{ padding:'20px', maxWidth:480, margin:'0 auto', fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>

 {/* User info card */}
 <div style={{ background:'#fff', borderRadius:16, padding:'18px 20px', marginBottom:14, border:'1px solid #F1F5F9', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:14 }}>
 <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#16A34A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
 </div>
 <div style={{ flex:1 }}>
 <p style={{ margin:'0 0 2px', fontSize:16, fontWeight:800, color:'#111827' }}>{user?.name || user?.username}</p>
 <p style={{ margin:'0 0 2px', fontSize:12, color:'#059669', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>Kasir</p>
 {user?.username && user?.name && <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>@{user.username}</p>}
 </div>
 <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:8, padding:'4px 10px' }}>
 <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#059669' }}>Aktif</p>
 </div>
 </div>

 {/* Nama toko / bisnis */}
 {settings?.businessName && (
 <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12, padding:'12px 16px', marginBottom:14, display:'flex', gap:10, alignItems:'center' }}>
 <span style={{ fontSize:18 }}></span>
 <div>
 <p style={{ margin:'0 0 1px', fontSize:11, fontWeight:700, color:'#1D4ED8', textTransform:'uppercase', letterSpacing:0.4 }}>Nama Toko</p>
 <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#1E40AF' }}>{settings.businessName}</p>
 {settings.address && <p style={{ margin:'2px 0 0', fontSize:11, color:'#3B82F6' }}> {settings.address}</p>}
 </div>
 </div>
 )}

 {/* Shift aktif */}
 {activeShift && (
 <div style={{ background:'#F0FDF4', border:'1.5px solid #BBF7D0', borderRadius:12, padding:'12px 16px', marginBottom:14 }}>
 <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
 <span style={{ fontSize:16 }}>⏰</span>
 <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#166534' }}>Shift Sedang Aktif</p>
 <span style={{ fontSize:10, background:'#22C55E', color:'#fff', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>LIVE</span>
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
 {[
 ['Dibuka', new Date(activeShift.openedAt||activeShift.startTime).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})],
 ['Modal Awal', `Rp ${(activeShift.openingBalance||0).toLocaleString('id-ID')}`],
 ].map(([l,v])=>(
 <div key={l} style={{ background:'#fff', borderRadius:8, padding:'6px 10px' }}>
 <p style={{ margin:'0 0 1px', fontSize:10, color:'#9CA3AF', fontWeight:700 }}>{l}</p>
 <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#166534' }}>{v}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 {settings?.shiftEnabled && !activeShift && (
 <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:12, padding:'10px 14px', marginBottom:14, display:'flex', gap:8, alignItems:'center' }}>
 <span style={{ fontSize:14 }}></span>
 <p style={{ margin:0, fontSize:12, color:'#D97706', fontWeight:600 }}>Shift belum dibuka. Buka shift terlebih dahulu sebelum mulai transaksi.</p>
 </div>
 )}

 {/* Menu items */}
 <div style={{ background:'#fff', borderRadius:16, border:'1px solid #F1F5F9', overflow:'hidden', marginBottom:14 }}>
 <div style={{ padding:'10px 18px', borderBottom:'1px solid #F9FAFB' }}>
 <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.5 }}>Akun & Keamanan</p>
 </div>

 {/* Ubah PIN */}
 <button onClick={()=>setShowPinModal(true)}
 style={{ width:'100%', padding:'14px 18px', background:'none', border:'none', borderBottom:'1px solid #F9FAFB', cursor:'pointer', display:'flex', alignItems:'center', gap:12, fontFamily:'inherit', textAlign:'left' }}
 onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'}
 onMouseLeave={e=>e.currentTarget.style.background='none'}>
 <div style={{ width:36, height:36, borderRadius:10, background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
 </div>
 <div style={{ flex:1 }}>
 <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'#111827' }}>Ubah PIN Kasir</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>Ganti PIN login kasir Anda</p>
 </div>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
 </button>

 {/* Logout */}
 <button onClick={() => setConfirmLogout(true)}
 style={{ width:'100%', padding:'14px 18px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:12, fontFamily:'inherit', textAlign:'left' }}
 onMouseEnter={e=>e.currentTarget.style.background='#FEF2F2'}
 onMouseLeave={e=>e.currentTarget.style.background='none'}>
 <div style={{ width:36, height:36, borderRadius:10, background:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
 </div>
 <div style={{ flex:1 }}>
 <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'#EF4444' }}>Logout</p>
 <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>Keluar dari sesi kasir ini</p>
 </div>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
 </button>
 </div>

 {/* Info */}
 <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12, padding:'12px 16px' }}>
 <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
 <p style={{ margin:0, fontSize:12, color:'#3B82F6', lineHeight:1.5 }}>
 Mode Kasir Aktif — Akses terbatas pada POS, Transaksi, dan Produk (lihat saja). Untuk mengubah pengaturan aplikasi, hubungi Admin.
 </p>
 </div>
 </div>

 {/* Confirm Logout */}
 {confirmLogout && (
 <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}>
 <div style={{ background:'#fff', borderRadius:20, padding:'28px 24px', width:'100%', maxWidth:360, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
 <div style={{ width:52, height:52, background:'#FEF2F2', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
 </div>
 <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:900, color:'#111827', textAlign:'center' }}>Konfirmasi Logout</h3>
 <p style={{ margin:'0 0 24px', fontSize:13, color:'#6B7280', textAlign:'center', lineHeight:1.6 }}>
 Yakin ingin logout? Anda harus memasukkan PIN lagi untuk masuk kembali sebagai Kasir.
 </p>
 <div style={{ display:'flex', gap:10 }}>
 <button onClick={() => setConfirmLogout(false)}
 style={{ flex:1, padding:'12px', background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#374151' }}>
 Batal
 </button>
 <button onClick={logout}
 style={{ flex:1, padding:'12px', background:'#EF4444', border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#fff' }}>
 Ya, Logout
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Change PIN Modal */}
 {showPinModal && (
 <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}>
 <div style={{ background:'#fff', borderRadius:20, padding:'28px 24px', width:'100%', maxWidth:360, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
 <div style={{ width:52, height:52, background:'#F0FDF4', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
 </div>
 {pinSuccess ? (
 <div style={{ textAlign:'center' }}>
 <p style={{ fontSize:32, margin:'0 0 8px' }}></p>
 <p style={{ margin:0, fontSize:15, fontWeight:800, color:'#166534' }}>PIN berhasil diubah!</p>
 </div>
 ) : (
 <>
 <h3 style={{ margin:'0 0 4px', fontSize:17, fontWeight:900, color:'#111827', textAlign:'center' }}>
 {pinStep==='old' ? 'Masukkan PIN Lama' : pinStep==='new' ? 'PIN Baru' : 'Konfirmasi PIN Baru'}
 </h3>
 <p style={{ margin:'0 0 20px', fontSize:12, color:'#9CA3AF', textAlign:'center' }}>
 {pinStep==='old' ? 'Verifikasi identitas Anda' : pinStep==='new' ? 'Minimal 4 digit angka' : 'Ulangi PIN baru'}
 </p>
 <input type="password" inputMode="numeric" maxLength={8} placeholder="••••"
 value={pinStep==='old'?pinOld:pinStep==='new'?pinNew:pinConfirm}
 onChange={e=>{
 const v=e.target.value.replace(/\D/g,'')
 if(pinStep==='old')setPinOld(v)
 else if(pinStep==='new')setPinNew(v)
 else setPinConfirm(v)
 setPinError('')
 }}
 onKeyDown={e=>e.key==='Enter'&&handlePinChange()}
 style={{ ...pinInput }} autoFocus />
 {pinError && <p style={{ margin:'0 0 12px', fontSize:12, color:'#EF4444', textAlign:'center', fontWeight:600 }}> {pinError}</p>}
 <div style={{ display:'flex', gap:10, marginTop:8 }}>
 <button onClick={closePinModal}
 style={{ flex:1, padding:'12px', background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#374151' }}>
 Batal
 </button>
 <button onClick={handlePinChange}
 style={{ flex:1, padding:'12px', background:'#22C55E', border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#fff' }}>
 {pinStep==='confirm' ? 'Simpan PIN' : 'Lanjut →'}
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 )}
 </div>
 )
}
