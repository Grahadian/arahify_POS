// ============================================================
// MSME GROW POS - Kasir Settings Page (Logout only)
// ============================================================
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import AppLogo from '@/assets/AppLogo'

export default function KasirSettingsPage() {
  const { user, logout } = useApp()
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <div style={{ padding:'24px 20px', maxWidth:480, margin:'0 auto', fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      {/* User info card */}
      <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', marginBottom:16, border:'1px solid #F1F5F9', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#16A34A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ margin:'0 0 2px', fontSize:16, fontWeight:800, color:'#111827' }}>{user?.name || user?.username}</p>
          <p style={{ margin:0, fontSize:12, color:'#059669', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>Kasir</p>
        </div>
        <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:8, padding:'4px 10px' }}>
          <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#059669' }}>Aktif</p>
        </div>
      </div>

      {/* Info box */}
      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:700, color:'#1E40AF' }}>Mode Kasir Aktif</p>
            <p style={{ margin:0, fontSize:12, color:'#3B82F6', lineHeight:1.5 }}>
              Anda sedang login sebagai Kasir. Akses terbatas pada POS, Laporan transaksi, dan Produk (lihat saja).
              Untuk mengubah pengaturan aplikasi, hubungi Admin.
            </p>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #F1F5F9', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #F9FAFB' }}>
          <p style={{ margin:'0 0 2px', fontSize:12, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.5 }}>Sesi</p>
        </div>
        <button onClick={() => setConfirmLogout(true)}
          style={{ width:'100%', padding:'16px 20px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:14, fontFamily:'inherit', textAlign:'left' }}
          onMouseEnter={e=>e.currentTarget.style.background='#FEF2F2'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}>
          <div style={{ width:38, height:38, borderRadius:10, background:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:700, color:'#EF4444' }}>Logout</p>
            <p style={{ margin:0, fontSize:12, color:'#9CA3AF' }}>Keluar dari sesi kasir ini</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Confirm modal */}
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
    </div>
  )
}
