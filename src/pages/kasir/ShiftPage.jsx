// ============================================================
// MSME GROW POS - Shift Kasir v4.0
// ============================================================
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR } from '@/utils/format'
import Icon from '@/components/ui/Icon'

const fmt = (iso) => iso ? new Date(iso).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '-'
const durasi = (start, end) => { const ms=new Date(end||new Date())-new Date(start); return `${Math.floor(ms/3600000)}j ${Math.floor((ms%3600000)/60000)}m` }

const INP = { width:'100%', padding:'11px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#F8FAFC', transition:'border 0.15s, background 0.15s' }
const BTN = {
  primary : { background:'#1E293B', color:'#F1F5F9', border:'none', borderRadius:10, padding:'11px 18px', fontSize:14, fontWeight:700, fontFamily:'inherit', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
  green   : { background:'#059669', color:'#fff', border:'none', borderRadius:10, padding:'11px 18px', fontSize:14, fontWeight:700, fontFamily:'inherit', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
  danger  : { background:'#DC2626', color:'#fff', border:'none', borderRadius:10, padding:'11px 18px', fontSize:14, fontWeight:700, fontFamily:'inherit', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
  ghost   : { background:'#F1F5F9', color:'#334155', border:'1.5px solid #E2E8F0', borderRadius:10, padding:'11px 18px', fontSize:14, fontWeight:700, fontFamily:'inherit', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
}
const OVERLAY = { position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
const MODAL   = { background:'#fff', borderRadius:18, padding:'24px', width:'100%', maxWidth:420, boxShadow:'0 24px 64px rgba(0,0,0,0.25)', maxHeight:'90vh', overflowY:'auto' }

export default function ShiftPage() {
  const { shifts, activeShift, transactions, startShift, endShift } = useApp()
  const [step,        setStep]        = useState('idle')
  const [kasirName,   setKasirName]   = useState('')
  const [modalKas,    setModalKas]    = useState('')
  const [closingKas,  setClosingKas]  = useState('')
  const [closeNotes,  setCloseNotes]  = useState('')
  const [detailShift, setDetailShift] = useState(null)
  const [nameError,   setNameError]   = useState('')

  const shiftTrx = useMemo(()=> !activeShift ? [] : transactions.filter(t=>t.shiftId===activeShift.id&&(!t.status||t.status==='completed')), [activeShift, transactions])
  const shiftRevenue  = shiftTrx.reduce((s,t)=>s+(t.total||0),0)
  const shiftCash     = shiftTrx.filter(t=>t.payment==='Cash').reduce((s,t)=>s+(t.total||0),0)
  const totalKasAkhir = (activeShift?.modalKas||0) + shiftCash
  const selisih       = (Number(closingKas)||0) - totalKasAkhir
  const allShifts     = useMemo(()=>[...shifts].sort((a,b)=>new Date(b.startTime)-new Date(a.startTime)),[shifts])

  const focusOn  = e => { e.target.style.borderColor='#3B82F6'; e.target.style.background='#fff' }
  const focusOff = e => { e.target.style.borderColor='#E2E8F0'; e.target.style.background='#F8FAFC' }

  return (
    <div style={{ padding:'16px 18px', maxWidth:740, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:'0 0 3px', fontSize:20, fontWeight:800, color:'#0F172A', letterSpacing:-0.3 }}>Shift Kasir</h2>
        <p style={{ margin:0, color:'#64748B', fontSize:13 }}>Kelola shift kerja dan rekap kas harian</p>
      </div>

      {activeShift ? (
        <div style={{ background:'#1E293B', borderRadius:16, padding:'20px 22px', marginBottom:14, color:'#F1F5F9', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(16,185,129,0.08)' }}/>
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 0 3px rgba(52,211,153,0.2)' }}/>
                <span style={{ fontSize:14, fontWeight:800, color:'#A7F3D0' }}>Shift Sedang Berjalan</span>
              </div>
              <span style={{ fontSize:12, background:'rgba(255,255,255,0.1)', padding:'3px 10px', borderRadius:20, fontWeight:700, color:'#94A3B8' }}>{durasi(activeShift.startTime, null)}</span>
            </div>
            <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:11, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:9 }}>
              <Icon name="user" size={14} color="#64748B" />
              <div>
                <p style={{ margin:0, fontSize:15, fontWeight:900 }}>{activeShift.kasirName}</p>
                <p style={{ margin:0, fontSize:11, color:'#64748B' }}>Mulai: {fmt(activeShift.startTime)}</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
              {[['Modal Awal',formatIDR(activeShift.modalKas||0),'cash'],['Penjualan',formatIDR(shiftRevenue),'trending'],['Transaksi',`${shiftTrx.length} trx`,'orders']].map(([l,v,ic])=>(
                <div key={l} style={{ background:'rgba(255,255,255,0.07)', borderRadius:11, padding:'11px 12px' }}>
                  <Icon name={ic} size={13} color="#475569" />
                  <p style={{ margin:'5px 0 2px', fontSize:10, color:'#64748B' }}>{l}</p>
                  <p style={{ margin:0, fontSize:13, fontWeight:900 }}>{v}</p>
                </div>
              ))}
            </div>
            <button style={{ ...BTN.ghost, background:'rgba(255,255,255,0.1)', color:'#F1F5F9', border:'1px solid rgba(255,255,255,0.15)', width:'100%' }}
              onClick={()=>{ setClosingKas(String(totalKasAkhir)); setStep('closing') }}>
              <Icon name="x" size={15} color="#94A3B8" /> Tutup Shift
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background:'#F8FAFC', border:'2px dashed #CBD5E1', borderRadius:16, padding:'36px 24px', marginBottom:14, textAlign:'center' }}>
          <div style={{ width:60, height:60, background:'#EFF6FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', border:'2px solid #BFDBFE' }}>
            <Icon name="shift" size={26} color="#2563EB" />
          </div>
          <h3 style={{ margin:'0 0 6px', fontSize:17, fontWeight:800, color:'#0F172A' }}>Belum Ada Shift Aktif</h3>
          <p style={{ margin:'0 0 20px', fontSize:13, color:'#64748B', lineHeight:1.6 }}>Buka shift baru untuk mulai mencatat transaksi</p>
          <button style={{ ...BTN.primary, display:'inline-flex', padding:'11px 26px' }}
            onClick={()=>{ setKasirName(''); setModalKas(''); setNameError(''); setStep('openForm') }}>
            <Icon name="plus" size={16} color="#fff" /> Buka Shift Baru
          </button>
        </div>
      )}

      {/* Rekap Kas */}
      {activeShift && (
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:13, padding:'15px 17px', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ background:'#DCFCE7', borderRadius:8, padding:6 }}><Icon name="cash" size={14} color="#166534" /></div>
            <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#0F172A' }}>Rekap Kas Shift Ini</p>
          </div>
          {[['Modal Awal Kas',formatIDR(activeShift.modalKas||0),'#475569',false],['Penjualan Tunai',formatIDR(shiftCash),'#1D4ED8',false],['Estimasi Kas di Laci',formatIDR(totalKasAkhir),'#166534',true]].map(([l,v,c,b])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 11px', background:'#F8FAFC', borderRadius:9, marginBottom:5, border: b ? '1.5px solid #86EFAC' : '1px solid #F1F5F9' }}>
              <span style={{ fontSize:13, color:'#475569' }}>{l}</span>
              <span style={{ fontSize:13, fontWeight:b?900:700, color:c }}>{v}</span>
            </div>
          ))}
          {shiftTrx.length > 0 && (
            <div style={{ marginTop:11, paddingTop:11, borderTop:'1px solid #F1F5F9' }}>
              <p style={{ margin:'0 0 8px', fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.5 }}>Breakdown Pembayaran</p>
              <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                {['Cash','Transfer','QRIS','Card','Online'].map(m=>{
                  const t=shiftTrx.filter(x=>x.payment===m).reduce((s,x)=>s+(x.total||0),0)
                  const c=shiftTrx.filter(x=>x.payment===m).length
                  if(!t) return null
                  return <div key={m} style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:9, padding:'6px 12px' }}><p style={{ margin:'0 0 1px', fontSize:11, color:'#1D4ED8', fontWeight:700 }}>{m}</p><p style={{ margin:'0 0 1px', fontSize:12, fontWeight:900, color:'#0F172A' }}>{formatIDR(t)}</p><p style={{ margin:0, fontSize:10, color:'#64748B' }}>{c} trx</p></div>
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Riwayat */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ background:'#EDE9FE', borderRadius:8, padding:6 }}><Icon name="orders" size={14} color="#6D28D9" /></div>
          <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#0F172A' }}>Riwayat Shift</p>
        </div>
        {allShifts.filter(s=>s.status==='closed').length === 0 ? (
          <div style={{ textAlign:'center', padding:'28px 0', background:'#F8FAFC', borderRadius:13, border:'1px solid #E2E8F0' }}>
            <Icon name="orders" size={26} color="#CBD5E1" />
            <p style={{ margin:'8px 0 0', fontSize:13, color:'#94A3B8' }}>Belum ada riwayat shift</p>
          </div>
        ) : allShifts.filter(s=>s.status==='closed').map(shift=>{
          const dTrx   = transactions.filter(t=>t.shiftId===shift.id&&(!t.status||t.status==='completed'))
          const dSales = dTrx.reduce((s,t)=>s+(t.total||0),0)
          const dCash  = dTrx.filter(t=>t.payment==='Cash').reduce((s,t)=>s+(t.total||0),0)
          const dSel   = (shift.totalKas||0) - ((shift.modalKas||0) + dCash)
          return (
            <div key={shift.id} onClick={()=>{setDetailShift(shift);setStep('detail')}}
              style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:13, padding:'14px 16px', marginBottom:9, cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='translateY(0)'}}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'#F1F5F9', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="user" size={14} color="#475569" />
                  </div>
                  <div>
                    <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:800, color:'#0F172A' }}>{shift.kasirName}</p>
                    <p style={{ margin:0, fontSize:11, color:'#94A3B8' }}>{fmt(shift.startTime)}</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:10, background:'#DCFCE7', color:'#166534', padding:'3px 9px', borderRadius:20, fontWeight:700, border:'1px solid #86EFAC' }}>SELESAI</span>
                  <span style={{ fontSize:11, color:'#94A3B8' }}>{durasi(shift.startTime, shift.endTime)}</span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[{l:'Penjualan',v:formatIDR(dSales),c:'#1D4ED8',bg:'#EFF6FF',bd:'#BFDBFE'},{l:'Transaksi',v:`${dTrx.length} trx`,c:'#334155',bg:'#F8FAFC',bd:'#E2E8F0'},{l:'Selisih',v:(dSel>=0?'+':'')+formatIDR(dSel),c:dSel===0?'#166534':dSel>0?'#1D4ED8':'#DC2626',bg:dSel===0?'#DCFCE7':dSel>0?'#DBEAFE':'#FEE2E2',bd:dSel===0?'#86EFAC':dSel>0?'#93C5FD':'#FCA5A5'}].map(x=>(
                  <div key={x.l} style={{ background:x.bg, border:`1px solid ${x.bd}`, borderRadius:9, padding:'7px 10px' }}>
                    <p style={{ margin:'0 0 2px', fontSize:10, color:'#94A3B8' }}>{x.l}</p>
                    <p style={{ margin:0, fontSize:12, fontWeight:900, color:x.c }}>{x.v}</p>
                  </div>
                ))}
              </div>
              {shift.notes && <p style={{ margin:'8px 0 0', fontSize:12, color:'#64748B', fontStyle:'italic' }}>{shift.notes}</p>}
            </div>
          )
        })}
      </div>

      {/* MODAL: Buka Shift */}
      {step === 'openForm' && (
        <div style={OVERLAY} onClick={()=>setStep('idle')}>
          <div style={MODAL} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ background:'#DBEAFE', borderRadius:10, padding:9 }}><Icon name="shift" size={20} color="#1D4ED8" /></div>
              <div><h3 style={{ margin:0, fontSize:17, fontWeight:900, color:'#0F172A' }}>Buka Shift Baru</h3><p style={{ margin:0, fontSize:12, color:'#64748B' }}>Masukkan nama kasir dan modal awal</p></div>
            </div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Nama Kasir *</label>
            <input value={kasirName} onChange={e=>{setKasirName(e.target.value);setNameError('')}} placeholder="Contoh: Budi Santoso" style={{ ...INP, marginBottom:14 }} onFocus={focusOn} onBlur={focusOff} autoFocus />
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Modal Awal Kas (Rp) *</label>
            <input type="number" value={modalKas} onChange={e=>{setModalKas(e.target.value);setNameError('')}} placeholder="Contoh: 200000" style={{ ...INP, fontSize:20, fontWeight:800, textAlign:'right', marginBottom:4 }} onFocus={focusOn} onBlur={focusOff} />
            {modalKas && Number(modalKas)>=0 && <p style={{ margin:'4px 0 12px', fontSize:14, color:'#059669', fontWeight:700, textAlign:'right' }}>{formatIDR(Number(modalKas))}</p>}
            {nameError && <div style={{ background:'#FEE2E2', border:'1px solid #FCA5A5', borderRadius:9, padding:'9px 12px', marginBottom:12, fontSize:12, color:'#DC2626', fontWeight:600 }}>{nameError}</div>}
            <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:9, padding:'10px 13px', marginBottom:18, display:'flex', gap:8 }}>
              <Icon name="info" size={14} color="#2563EB" style={{ flexShrink:0 }} />
              <p style={{ margin:0, fontSize:12, color:'#1E40AF' }}>Hitung uang di laci kasir sebelum memulai shift.</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button style={{ ...BTN.ghost, flex:1 }} onClick={()=>setStep('idle')}>Batal</button>
              <button style={{ ...BTN.primary, flex:2 }} onClick={()=>{ if(!kasirName.trim()){setNameError('Nama kasir wajib diisi');return} if(!modalKas||isNaN(Number(modalKas))||Number(modalKas)<0){setNameError('Modal awal wajib diisi');return} setNameError('');setStep('confirm') }}>Lanjut</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi */}
      {step === 'confirm' && (
        <div style={OVERLAY} onClick={()=>setStep('openForm')}>
          <div style={{ ...MODAL, maxWidth:380 }} onClick={e=>e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ width:54, height:54, background:'#DCFCE7', border:'1.5px solid #86EFAC', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                <Icon name="check" size={22} color="#166534" />
              </div>
              <h3 style={{ margin:'0 0 4px', fontSize:17, fontWeight:900, color:'#0F172A' }}>Konfirmasi Data Shift</h3>
              <p style={{ margin:0, fontSize:12, color:'#64748B' }}>Periksa kembali sebelum memulai</p>
            </div>
            <div style={{ background:'#F8FAFC', borderRadius:11, padding:'13px 15px', marginBottom:18 }}>
              {[['Nama Kasir',kasirName],['Modal Awal',formatIDR(Number(modalKas))],['Waktu Mulai',fmt(new Date().toISOString())]].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                  <span style={{ fontSize:13, color:'#64748B' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:'#0F172A' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button style={{ ...BTN.ghost, flex:1 }} onClick={()=>setStep('openForm')}>Ubah</button>
              <button style={{ ...BTN.green, flex:2 }} onClick={()=>{ startShift(Number(modalKas), kasirName.trim()); setKasirName(''); setModalKas(''); setStep('idle') }}>Mulai Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tutup Shift */}
      {step === 'closing' && activeShift && (
        <div style={OVERLAY} onClick={()=>setStep('idle')}>
          <div style={MODAL} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ background:'#FEE2E2', borderRadius:10, padding:9 }}><Icon name="x" size={18} color="#DC2626" /></div>
              <div><h3 style={{ margin:0, fontSize:17, fontWeight:900, color:'#0F172A' }}>Tutup Shift</h3><p style={{ margin:0, fontSize:12, color:'#64748B' }}>Masukkan kas aktual untuk cek selisih</p></div>
            </div>
            <div style={{ background:'#F8FAFC', borderRadius:11, padding:'12px 14px', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}><Icon name="user" size={13} color="#475569" /><span style={{ fontSize:14, fontWeight:800, color:'#334155' }}>{activeShift.kasirName}</span></div>
              {[['Modal Awal',formatIDR(activeShift.modalKas||0)],['Penjualan Tunai',formatIDR(shiftCash)],['Total Penjualan',formatIDR(shiftRevenue)]].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}><span style={{ color:'#64748B' }}>{l}</span><span style={{ fontWeight:700 }}>{v}</span></div>
              ))}
              <div style={{ borderTop:'1px dashed #E2E8F0', paddingTop:8, display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:900 }}>
                <span>Estimasi Kas Akhir</span><span style={{ color:'#059669' }}>{formatIDR(totalKasAkhir)}</span>
              </div>
            </div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Kas Aktual di Laci (Rp)</label>
            <input type="number" value={closingKas} onChange={e=>setClosingKas(e.target.value)} style={{ ...INP, fontSize:20, fontWeight:800, textAlign:'right', marginBottom:8 }} onFocus={focusOn} onBlur={focusOff} autoFocus />
            {closingKas && (
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, padding:'9px 12px', borderRadius:10, background:selisih>=0?'#DCFCE7':'#FEE2E2', border:`1.5px solid ${selisih>=0?'#86EFAC':'#FCA5A5'}` }}>
                <span style={{ fontSize:13, fontWeight:700, color:selisih>=0?'#166534':'#DC2626' }}>{selisih===0?'Kas Pas':selisih>0?'Lebih':'Kurang'}</span>
                <span style={{ fontSize:14, fontWeight:900, color:selisih>=0?'#166534':'#DC2626' }}>{selisih>=0?'+':''}{formatIDR(selisih)}</span>
              </div>
            )}
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Catatan (opsional)</label>
            <textarea value={closeNotes} onChange={e=>setCloseNotes(e.target.value)} rows={2} style={{ ...INP, resize:'none', marginBottom:18 }} onFocus={focusOn} onBlur={focusOff} />
            <div style={{ display:'flex', gap:10 }}>
              <button style={{ ...BTN.ghost, flex:1 }} onClick={()=>setStep('idle')}>Batal</button>
              <button style={{ ...BTN.danger, flex:2 }} onClick={()=>{ endShift(shiftRevenue, Number(closingKas)||0, closeNotes); setClosingKas(''); setCloseNotes(''); setStep('idle') }}>Tutup Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detail Shift */}
      {step === 'detail' && detailShift && (() => {
        const dTrx=transactions.filter(t=>t.shiftId===detailShift.id&&(!t.status||t.status==='completed'))
        const dSales=dTrx.reduce((s,t)=>s+(t.total||0),0)
        const dCash=dTrx.filter(t=>t.payment==='Cash').reduce((s,t)=>s+(t.total||0),0)
        const dSel=(detailShift.totalKas||0)-((detailShift.modalKas||0)+dCash)
        return (
          <div style={OVERLAY} onClick={()=>setStep('idle')}>
            <div style={MODAL} onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div><h3 style={{ margin:'0 0 2px', fontSize:16, fontWeight:900, color:'#0F172A' }}>Detail Shift</h3><p style={{ margin:0, fontSize:12, color:'#64748B' }}>{fmt(detailShift.startTime)}</p></div>
                <button style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#94A3B8', padding:0, lineHeight:1 }} onClick={()=>setStep('idle')}>×</button>
              </div>
              <div style={{ background:'#DCFCE7', border:'1px solid #86EFAC', borderRadius:11, padding:'11px 13px', marginBottom:13 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}><Icon name="user" size={13} color="#166534" /><span style={{ fontSize:14, fontWeight:900, color:'#166534' }}>{detailShift.kasirName}</span></div>
                <span style={{ fontSize:12, color:'#166534' }}>Durasi: {durasi(detailShift.startTime, detailShift.endTime)}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:13 }}>
                {[['Modal Awal Kas',formatIDR(detailShift.modalKas||0),'#475569',false],['Total Penjualan',formatIDR(dSales),'#1D4ED8',false],['Jumlah Transaksi',`${dTrx.length} trx`,'#334155',false],['Penjualan Tunai',formatIDR(dCash),'#334155',false],['Kas Aktual',formatIDR(detailShift.totalKas||0),'#7C3AED',true],['Selisih',( dSel>=0?'+':'')+formatIDR(dSel),dSel>=0?'#166534':'#DC2626',true]].map(([l,v,c,b])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 11px', background:'#F8FAFC', borderRadius:8 }}>
                    <span style={{ fontSize:13, color:'#64748B' }}>{l}</span>
                    <span style={{ fontSize:13, fontWeight:b?900:700, color:c }}>{v}</span>
                  </div>
                ))}
              </div>
              {detailShift.notes && <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:9, padding:'9px 12px', marginBottom:12 }}><p style={{ margin:0, fontSize:13, color:'#92400E' }}>{detailShift.notes}</p></div>}
              <button style={{ ...BTN.ghost, width:'100%' }} onClick={()=>setStep('idle')}>Tutup</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
