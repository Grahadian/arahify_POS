// ============================================================
// MSME GROW POS - Shift Kasir v3.0 — Professional, no emoji
// ============================================================
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR } from '@/utils/format'
import Icon from '@/components/ui/Icon'

const fmt = (iso) => iso ? new Date(iso).toLocaleString('id-ID', { timeZone:'Asia/Jakarta', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-'
const durasi = (start, end) => { const ms = new Date(end||new Date()) - new Date(start); const h = Math.floor(ms/3600000); const m = Math.floor((ms%3600000)/60000); return `${h}j ${m}m` }

const S = {
  page  : { padding:'16px 20px', maxWidth:760, margin:'0 auto' },
  card  : { background:'#fff', border:'1px solid #F1F5F9', borderRadius:14, padding:'16px 18px', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  label : { display:'block', fontSize:11, fontWeight:700, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 },
  inp   : { width:'100%', padding:'11px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#F8FAFC', transition:'border 0.15s' },
  overlay: { position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal : { background:'#fff', borderRadius:18, padding:26, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' },
  btn   : (v) => ({ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 18px', borderRadius:10, fontSize:14, fontWeight:700, fontFamily:'inherit', cursor:'pointer', border:'none', transition:'all 0.15s', ...(v==='primary'?{background:'#2563EB',color:'#fff'}:v==='danger'?{background:'#EF4444',color:'#fff'}:v==='green'?{background:'#059669',color:'#fff'}:{background:'#F1F5F9',color:'#374151',border:'1.5px solid #E2E8F0'}) }),
}

export default function ShiftPage() {
  const { shifts, activeShift, transactions, startShift, endShift } = useApp()

  const [step,        setStep]        = useState('idle')
  const [kasirName,   setKasirName]   = useState('')
  const [modalKas,    setModalKas]    = useState('')
  const [closingKas,  setClosingKas]  = useState('')
  const [closeNotes,  setCloseNotes]  = useState('')
  const [detailShift, setDetailShift] = useState(null)
  const [nameError,   setNameError]   = useState('')

  const shiftTrx = useMemo(() => {
    if (!activeShift) return []
    return transactions.filter(t => t.shiftId === activeShift.id && (!t.status||t.status==='completed'))
  }, [activeShift, transactions])

  const shiftRevenue  = shiftTrx.reduce((s,t) => s+(t.total||0), 0)
  const shiftCash     = shiftTrx.filter(t => t.payment==='Cash').reduce((s,t) => s+(t.total||0), 0)
  const totalKasAkhir = (activeShift?.modalKas||0) + shiftCash
  const selisih       = (Number(closingKas)||0) - totalKasAkhir

  const allShifts = useMemo(() => [...shifts].sort((a,b) => new Date(b.startTime)-new Date(a.startTime)), [shifts])

  const focusIn  = e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff' }
  const focusOut = e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }

  const handleProceedToConfirm = () => {
    if (!kasirName.trim()) { setNameError('Nama kasir wajib diisi'); return }
    if (!modalKas || isNaN(Number(modalKas)) || Number(modalKas) < 0) { setNameError('Modal awal wajib diisi (boleh 0)'); return }
    setNameError(''); setStep('confirm')
  }

  const handleConfirmOpen = () => { startShift(Number(modalKas), kasirName.trim()); setKasirName(''); setModalKas(''); setStep('idle') }
  const handleCloseShift  = () => { endShift(shiftRevenue, Number(closingKas)||0, closeNotes); setClosingKas(''); setCloseNotes(''); setStep('idle') }

  return (
    <div style={S.page}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:'0 0 3px', fontSize:20, fontWeight:800, color:'#0F172A', letterSpacing:-0.4 }}>Shift Kasir</h2>
        <p style={{ margin:0, color:'#64748B', fontSize:13 }}>Kelola shift kerja dan rekap kas harian</p>
      </div>

      {activeShift ? (
        /* Shift Aktif Banner */
        <div style={{ background:'linear-gradient(135deg,#059669,#047857)', borderRadius:18, padding:'20px 22px', marginBottom:16, color:'#fff', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#86EFAC', boxShadow:'0 0 0 3px rgba(134,239,172,0.25)' }}/>
                <span style={{ fontSize:14, fontWeight:800 }}>Shift Sedang Berjalan</span>
              </div>
              <span style={{ fontSize:12, background:'rgba(255,255,255,0.2)', padding:'4px 10px', borderRadius:20, fontWeight:700 }}>{durasi(activeShift.startTime, null)}</span>
            </div>
            <div style={{ marginBottom:14, padding:'10px 13px', background:'rgba(255,255,255,0.12)', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Icon name="user" size={14} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize:15, fontWeight:900 }}>{activeShift.kasirName}</span>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:2 }}>Mulai: {fmt(activeShift.startTime)}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
              {[
                { label:'Modal Awal',  value:formatIDR(activeShift.modalKas||0), icon:'cash'    },
                { label:'Penjualan',   value:formatIDR(shiftRevenue),             icon:'trending' },
                { label:'Transaksi',   value:`${shiftTrx.length} trx`,            icon:'orders'  },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'11px 12px' }}>
                  <Icon name={icon} size={13} color="rgba(255,255,255,0.7)" style={{ marginBottom:4 }} />
                  <p style={{ margin:'4px 0 2px', fontSize:10, color:'rgba(255,255,255,0.7)' }}>{label}</p>
                  <p style={{ margin:0, fontSize:14, fontWeight:900 }}>{value}</p>
                </div>
              ))}
            </div>
            <button style={{ ...S.btn('ghost'), background:'#fff', color:'#059669', width:'100%', fontWeight:800 }}
              onClick={() => { setClosingKas(String(totalKasAkhir)); setStep('closing') }}>
              <Icon name="x" size={15} color="#059669" /> Tutup Shift
            </button>
          </div>
        </div>
      ) : (
        /* No Shift State */
        <div style={{ background:'#F8FAFC', border:'2px dashed #CBD5E1', borderRadius:18, padding:'36px 24px', marginBottom:16, textAlign:'center' }}>
          <div style={{ width:64, height:64, background:'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Icon name="shift" size={28} color="#2563EB" />
          </div>
          <h3 style={{ margin:'0 0 6px', fontSize:17, fontWeight:800, color:'#0F172A' }}>Belum Ada Shift Aktif</h3>
          <p style={{ margin:'0 0 22px', fontSize:13, color:'#64748B', lineHeight:1.6 }}>Buka shift baru untuk mulai mencatat transaksi. Masukkan nama kasir dan modal awal kas.</p>
          <button style={{ ...S.btn('primary'), display:'inline-flex', padding:'12px 28px', fontSize:14 }}
            onClick={() => { setKasirName(''); setModalKas(''); setNameError(''); setStep('openForm') }}>
            <Icon name="plus" size={16} color="#fff" /> Buka Shift Baru
          </button>
        </div>
      )}

      {/* Rekap Kas Shift Aktif */}
      {activeShift && (
        <div style={S.card}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ background:'#F0FDF4', borderRadius:8, padding:6 }}><Icon name="cash" size={14} color="#059669" /></div>
            <h4 style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Rekap Kas Shift Ini</h4>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {[
              ['Modal Awal Kas',     formatIDR(activeShift.modalKas||0), '#64748B', false],
              ['Penjualan Tunai',    formatIDR(shiftCash),               '#2563EB', false],
              ['Estimasi Kas Laci',  formatIDR(totalKasAkhir),           '#059669', true ],
            ].map(([label, value, color, bold]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'#F8FAFC', borderRadius:10, border: bold ? '1px solid #BBF7D0' : 'none' }}>
                <span style={{ fontSize:13, color:'#374151' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight: bold ? 900 : 700, color }}>{value}</span>
              </div>
            ))}
          </div>
          {shiftTrx.length > 0 && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F1F5F9' }}>
              <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.5 }}>Breakdown Metode Bayar</p>
              <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                {['Cash','Transfer','QRIS','Card','Online'].map(method => {
                  const total = shiftTrx.filter(t=>t.payment===method).reduce((s,t)=>s+(t.total||0),0)
                  const count = shiftTrx.filter(t=>t.payment===method).length
                  if (!total) return null
                  return (
                    <div key={method} style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:10, padding:'7px 12px', minWidth:90 }}>
                      <div style={{ fontSize:11, color:'#0369A1', fontWeight:700 }}>{method}</div>
                      <div style={{ fontSize:13, fontWeight:900, color:'#0C4A6E' }}>{formatIDR(total)}</div>
                      <div style={{ fontSize:11, color:'#7CB9E8' }}>{count} trx</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Riwayat Shift */}
      <div style={{ marginTop:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ background:'#F5F3FF', borderRadius:8, padding:6 }}><Icon name="orders" size={14} color="#7C3AED" /></div>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#0F172A' }}>Riwayat Shift</h3>
        </div>
        {allShifts.filter(s=>s.status==='closed').length === 0 ? (
          <div style={{ textAlign:'center', padding:'28px 0', color:'#94A3B8', background:'#F9FAFB', borderRadius:14 }}>
            <Icon name="orders" size={28} color="#CBD5E1" />
            <p style={{ margin:'10px 0 0', fontSize:13 }}>Belum ada riwayat shift</p>
          </div>
        ) : allShifts.filter(s=>s.status==='closed').map(shift => {
          const dTrx   = transactions.filter(t=>t.shiftId===shift.id&&(!t.status||t.status==='completed'))
          const dSales = dTrx.reduce((s,t)=>s+(t.total||0),0)
          const dCash  = dTrx.filter(t=>t.payment==='Cash').reduce((s,t)=>s+(t.total||0),0)
          const dSel   = (shift.totalKas||0) - ((shift.modalKas||0) + dCash)
          return (
            <div key={shift.id} onClick={() => { setDetailShift(shift); setStep('detail') }}
              style={{ ...S.card, cursor:'pointer', transition:'all 0.15s', marginBottom:10 }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.08)';e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)';e.currentTarget.style.transform='translateY(0)'}}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'#F0F9FF', border:'1px solid #BAE6FD', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="user" size={15} color="#0369A1" />
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#0F172A' }}>{shift.kasirName}</div>
                    <div style={{ fontSize:11, color:'#94A3B8' }}>{fmt(shift.startTime)}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:10, background:'#F0FDF4', color:'#166534', padding:'3px 9px', borderRadius:20, fontWeight:700, border:'1px solid #BBF7D0' }}>SELESAI</span>
                  <span style={{ fontSize:12, color:'#94A3B8' }}>{durasi(shift.startTime, shift.endTime)}</span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[
                  { label:'Penjualan',   value:formatIDR(dSales), color:'#2563EB', bg:'#EFF6FF' },
                  { label:'Transaksi',   value:`${dTrx.length} trx`, color:'#374151', bg:'#F9FAFB' },
                  { label:'Selisih Kas', value:(dSel>=0?'+':'')+formatIDR(dSel), color:dSel===0?'#059669':dSel>0?'#2563EB':'#EF4444', bg:dSel===0?'#F0FDF4':dSel>0?'#EFF6FF':'#FEF2F2' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ background:bg, borderRadius:9, padding:'7px 10px' }}>
                    <p style={{ margin:'0 0 2px', fontSize:10, color:'#94A3B8' }}>{label}</p>
                    <p style={{ margin:0, fontSize:12, fontWeight:900, color }}>{value}</p>
                  </div>
                ))}
              </div>
              {shift.notes && <p style={{ margin:'8px 0 0', fontSize:12, color:'#64748B', fontStyle:'italic' }}>{shift.notes}</p>}
            </div>
          )
        })}
      </div>

      {/* MODAL: Buka Shift Form */}
      {step === 'openForm' && (
        <div style={S.overlay} onClick={() => setStep('idle')}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ background:'#EFF6FF', borderRadius:10, padding:8 }}><Icon name="shift" size={20} color="#2563EB" /></div>
              <div>
                <h3 style={{ margin:0, fontSize:17, fontWeight:900, color:'#0F172A' }}>Buka Shift Baru</h3>
                <p style={{ margin:0, fontSize:12, color:'#64748B' }}>Masukkan nama kasir dan modal awal</p>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={S.label}>Nama Kasir *</label>
              <input value={kasirName} onChange={e=>{setKasirName(e.target.value);setNameError('')}} placeholder="Contoh: Budi Santoso" style={S.inp} onFocus={focusIn} onBlur={focusOut} autoFocus />
            </div>
            <div style={{ marginBottom:8 }}>
              <label style={S.label}>Modal Awal Kas (Rp) *</label>
              <input type="number" value={modalKas} onChange={e=>{setModalKas(e.target.value);setNameError('')}} placeholder="Contoh: 200000"
                style={{ ...S.inp, fontSize:20, fontWeight:800, textAlign:'right' }} onFocus={focusIn} onBlur={focusOut} />
              {modalKas && Number(modalKas) >= 0 && <p style={{ margin:'5px 0 0', fontSize:13, color:'#059669', fontWeight:700, textAlign:'right' }}>{formatIDR(Number(modalKas))}</p>}
            </div>
            {nameError && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 12px', marginBottom:12, fontSize:12, color:'#DC2626', fontWeight:600 }}>{nameError}</div>}
            <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'10px 13px', marginBottom:18, display:'flex', gap:8, alignItems:'flex-start' }}>
              <Icon name="info" size={14} color="#2563EB" style={{ flexShrink:0, marginTop:1 }} />
              <p style={{ margin:0, fontSize:12, color:'#1E40AF' }}>Hitung uang di laci kasir sebelum memulai. Ini menjadi acuan rekap kas saat shift ditutup.</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button style={{ ...S.btn('ghost'), flex:1 }} onClick={() => setStep('idle')}>Batal</button>
              <button style={{ ...S.btn('primary'), flex:2 }} onClick={handleProceedToConfirm}>Lanjut</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi */}
      {step === 'confirm' && (
        <div style={S.overlay} onClick={() => setStep('openForm')}>
          <div style={{ ...S.modal, maxWidth:400 }} onClick={e=>e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ width:56, height:56, background:'#F0FDF4', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                <Icon name="check" size={24} color="#059669" />
              </div>
              <h3 style={{ margin:'0 0 4px', fontSize:17, fontWeight:900, color:'#0F172A' }}>Konfirmasi Data Shift</h3>
              <p style={{ margin:0, fontSize:12, color:'#64748B' }}>Periksa kembali sebelum memulai shift</p>
            </div>
            <div style={{ background:'#F8FAFC', borderRadius:12, padding:'14px 16px', marginBottom:18 }}>
              {[['Nama Kasir', kasirName], ['Modal Awal', formatIDR(Number(modalKas))], ['Waktu Mulai', fmt(new Date().toISOString())]].map(([label, value]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #F1F5F9' }}>
                  <span style={{ fontSize:13, color:'#64748B' }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:'#0F172A' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button style={{ ...S.btn('ghost'), flex:1 }} onClick={() => setStep('openForm')}>Ubah Data</button>
              <button style={{ ...S.btn('green'), flex:2 }} onClick={handleConfirmOpen}>Mulai Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tutup Shift */}
      {step === 'closing' && activeShift && (
        <div style={S.overlay} onClick={() => setStep('idle')}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ background:'#FEF2F2', borderRadius:10, padding:8 }}><Icon name="x" size={18} color="#EF4444" /></div>
              <div>
                <h3 style={{ margin:0, fontSize:17, fontWeight:900, color:'#0F172A' }}>Tutup Shift</h3>
                <p style={{ margin:0, fontSize:12, color:'#64748B' }}>Masukkan kas aktual untuk cek selisih</p>
              </div>
            </div>
            <div style={{ background:'#F8FAFC', borderRadius:12, padding:'13px 15px', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Icon name="user" size={14} color="#64748B" />
                <span style={{ fontSize:14, fontWeight:800, color:'#374151' }}>{activeShift.kasirName}</span>
              </div>
              {[['Modal Awal',formatIDR(activeShift.modalKas||0)],['Penjualan Tunai',formatIDR(shiftCash)],['Total Penjualan',formatIDR(shiftRevenue)]].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
                  <span style={{ color:'#64748B' }}>{l}</span><span style={{ fontWeight:700 }}>{v}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px dashed #E2E8F0', paddingTop:9, display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:900 }}>
                <span>Estimasi Kas Akhir</span><span style={{ color:'#059669' }}>{formatIDR(totalKasAkhir)}</span>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={S.label}>Kas Aktual di Laci (Rp)</label>
              <input type="number" value={closingKas} onChange={e=>setClosingKas(e.target.value)}
                style={{ ...S.inp, fontSize:20, fontWeight:800, textAlign:'right' }} onFocus={focusIn} onBlur={focusOut} autoFocus />
              {closingKas && (
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:7, padding:'9px 12px', borderRadius:10, background:selisih>=0?'#F0FDF4':'#FEF2F2', border:`1px solid ${selisih>=0?'#A7F3D0':'#FECACA'}` }}>
                  <span style={{ fontSize:13, fontWeight:700, color:selisih>=0?'#059669':'#EF4444' }}>{selisih===0?'Kas Pas':selisih>0?'Lebih':'Kurang'}</span>
                  <span style={{ fontSize:14, fontWeight:900, color:selisih>=0?'#059669':'#EF4444' }}>{selisih>=0?'+':''}{formatIDR(selisih)}</span>
                </div>
              )}
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={S.label}>Catatan (opsional)</label>
              <textarea value={closeNotes} onChange={e=>setCloseNotes(e.target.value)} placeholder="Catatan untuk shift ini..." rows={2}
                style={{ ...S.inp, resize:'none' }} onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button style={{ ...S.btn('ghost'), flex:1 }} onClick={() => setStep('idle')}>Batal</button>
              <button style={{ ...S.btn('danger'), flex:2 }} onClick={handleCloseShift}>Tutup Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detail Shift */}
      {step === 'detail' && detailShift && (() => {
        const dTrx   = transactions.filter(t=>t.shiftId===detailShift.id&&(!t.status||t.status==='completed'))
        const dSales = dTrx.reduce((s,t)=>s+(t.total||0),0)
        const dCash  = dTrx.filter(t=>t.payment==='Cash').reduce((s,t)=>s+(t.total||0),0)
        const dSel   = (detailShift.totalKas||0) - ((detailShift.modalKas||0) + dCash)
        return (
          <div style={S.overlay} onClick={() => setStep('idle')}>
            <div style={S.modal} onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <h3 style={{ margin:'0 0 3px', fontSize:16, fontWeight:900, color:'#0F172A' }}>Detail Shift</h3>
                  <p style={{ margin:0, fontSize:12, color:'#64748B' }}>{fmt(detailShift.startTime)}</p>
                </div>
                <button style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#94A3B8', padding:4, lineHeight:1 }} onClick={() => setStep('idle')}>×</button>
              </div>
              <div style={{ background:'#F0FDF4', border:'1px solid #A7F3D0', borderRadius:12, padding:'11px 13px', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <Icon name="user" size={14} color="#166534" />
                  <span style={{ fontSize:14, fontWeight:900, color:'#166534' }}>{detailShift.kasirName}</span>
                </div>
                <div style={{ fontSize:12, color:'#166534' }}>Durasi: {durasi(detailShift.startTime, detailShift.endTime)}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
                {[['Modal Awal Kas', formatIDR(detailShift.modalKas||0),'#64748B',false], ['Total Penjualan', formatIDR(dSales),'#2563EB',false], ['Jumlah Transaksi',`${dTrx.length} transaksi`,'#374151',false], ['Penjualan Tunai', formatIDR(dCash),'#374151',false], ['Kas Aktual (tutup)', formatIDR(detailShift.totalKas||0),'#7C3AED',true], ['Selisih Kas', (dSel>=0?'+':'')+formatIDR(dSel), dSel>=0?'#059669':'#EF4444', true]].map(([label,value,color,bold]) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'#F9FAFB', borderRadius:8 }}>
                    <span style={{ fontSize:13, color:'#64748B' }}>{label}</span>
                    <span style={{ fontSize:13, fontWeight:bold?900:700, color }}>{value}</span>
                  </div>
                ))}
              </div>
              {detailShift.notes && <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'10px 12px', marginBottom:12 }}><p style={{ margin:0, fontSize:13, color:'#92400E' }}>{detailShift.notes}</p></div>}
              <button style={{ ...S.btn('ghost'), width:'100%' }} onClick={() => setStep('idle')}>Tutup</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
