// ============================================================
// MSME GROW POS — Receipt/Invoice Print Component
// Mode: 'thermal' = struk 80mm | 'invoice' = nota landscape A5
// ============================================================
import { forwardRef } from 'react'
import { formatIDR } from '@/utils/format'

const fmt = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

// ── THERMAL 80mm ─────────────────────────────────────────────
const ThermalReceipt = ({ transaction: t, settings: s }) => {
  const hasMember = !!(t.memberId || t.memberName)
  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 11, width: 302, padding: '14px 10px',
      background: '#fff', color: '#000',
    }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:10, paddingBottom:10, borderBottom:'1px dashed #000' }}>
        <h2 style={{ margin:'0 0 3px', fontSize:15, fontWeight:900, letterSpacing:-0.3 }}>{s?.businessName || 'MSME Grow'}</h2>
        {s?.address && <p style={{ margin:'0 0 1px', fontSize:9 }}>{s.address}</p>}
        {s?.whatsapp && <p style={{ margin:0, fontSize:9 }}>WA: {s.whatsapp}</p>}
      </div>

      {/* Info */}
      <div style={{ marginBottom:8, fontSize:10 }}>
        {[['No.Transaksi', t.id],['Tanggal', fmt(t.date||t.createdAt)],['Kasir', t.cashier],['Pembayaran', t.onlineChannel ? `${t.payment} (${t.onlineChannel})` : t.payment]].map(([l,v])=>(
          <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:1 }}>
            <span>{l}</span><span style={{ fontWeight:700, textAlign:'right', maxWidth:170 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Member */}
      {hasMember && (
        <div style={{ margin:'6px 0', padding:'5px 7px', border:'1px dashed #555' }}>
          <p style={{ margin:'0 0 3px', fontSize:10, fontWeight:900, textTransform:'uppercase' }}>★ Member</p>
          {t.memberName  && <div style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}><span>Nama</span><span style={{ fontWeight:700 }}>{t.memberName}</span></div>}
          {t.memberPhone && <div style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}><span>Telp</span><span>{t.memberPhone}</span></div>}
        </div>
      )}

      {/* Items */}
      <div style={{ borderTop:'1px dashed #000', borderBottom:'1px dashed #000', padding:'7px 0', margin:'6px 0' }}>
        {(t.items||[]).map((item, idx) => (
          <div key={idx} style={{ marginBottom:5 }}>
            <div style={{ fontWeight:700, fontSize:11 }}>{item.name}</div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}>
              <span>{item.qty} {item.unit||'pcs'} × {formatIDR(item.price)}</span>
              <span style={{ fontWeight:700 }}>{formatIDR(item.price*item.qty)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ fontSize:11 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}><span>Subtotal</span><span>{formatIDR(t.subtotal)}</span></div>
        {t.discount>0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}><span>Diskon</span><span>-{formatIDR(t.discount)}</span></div>}
        {t.tax>0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}><span>Pajak ({s?.taxRate||5}%)</span><span>{formatIDR(t.tax)}</span></div>}
        <div style={{ display:'flex', justifyContent:'space-between', fontWeight:900, fontSize:14, marginTop:5, borderTop:'1.5px solid #000', paddingTop:5 }}>
          <span>TOTAL</span><span>{formatIDR(t.total)}</span>
        </div>
        {t.cashReceived>0 && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginTop:4 }}><span>Uang Diterima</span><span>{formatIDR(t.cashReceived)}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:900 }}><span>Kembalian</span><span>{formatIDR(t.changeAmount||0)}</span></div>
          </>
        )}
      </div>

      {/* Note */}
      {t.note && <div style={{ margin:'6px 0', padding:'4px 6px', border:'1px dashed #999', fontSize:10 }}><b>Catatan:</b> {t.note}</div>}

      {/* Footer */}
      <div style={{ textAlign:'center', fontSize:10, borderTop:'1px dashed #000', paddingTop:8, marginTop:8 }}>
        <p style={{ margin:'0 0 2px' }}>{s?.receiptFooter||'Terima kasih atas kepercayaan Anda!'}</p>
        <p style={{ margin:0, fontSize:9, color:'#666' }}>Powered by MSME Grow POS</p>
      </div>
    </div>
  )
}

// ── INVOICE / NOTA A5 LANDSCAPE ──────────────────────────────
const InvoiceReceipt = ({ transaction: t, settings: s }) => {
  const no = (t.id||'').replace('TRX-','')
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      fontSize: 11, width: 560, padding: '20px 24px',
      background: '#fff', color: '#000',
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14, paddingBottom:12, borderBottom:'2px solid #111' }}>
        <div>
          <h2 style={{ margin:'0 0 3px', fontSize:16, fontWeight:900, letterSpacing:-0.3 }}>{s?.businessName||'MSME Grow'}</h2>
          {s?.address && <p style={{ margin:'0 0 2px', fontSize:10 }}>{s.address}</p>}
          {s?.whatsapp && <p style={{ margin:0, fontSize:10 }}>WA: {s.whatsapp}</p>}
        </div>
        <div style={{ textAlign:'right' }}>
          <p style={{ margin:'0 0 2px', fontSize:16, fontWeight:900, letterSpacing:2, textTransform:'uppercase' }}>NOTA</p>
          <p style={{ margin:'0 0 2px', fontSize:10 }}>No. : {no}</p>
          <p style={{ margin:'0 0 2px', fontSize:10 }}>Tanggal : {fmt(t.date||t.createdAt)}</p>
          <p style={{ margin:0, fontSize:10 }}>Kasir : {t.cashier}</p>
        </div>
      </div>

      {/* Member / Customer */}
      {(t.memberName||t.note) && (
        <div style={{ marginBottom:10 }}>
          {t.memberName && <p style={{ margin:'0 0 2px', fontSize:10 }}>Kepada : <strong>{t.memberName}</strong>{t.memberPhone ? ` — ${t.memberPhone}` : ''}</p>}
          <p style={{ margin:0, fontSize:10 }}>Pembayaran : <strong>{t.onlineChannel ? `${t.payment} (${t.onlineChannel})` : t.payment}</strong></p>
        </div>
      )}

      {/* Items table */}
      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:10 }}>
        <thead>
          <tr style={{ background:'#111', color:'#fff' }}>
            {['No','Deskripsi','Qty','Satuan','Harga','Jumlah'].map(h => (
              <th key={h} style={{ padding:'5px 7px', textAlign: h==='No'||h==='Qty'||h==='Harga'||h==='Jumlah' ? 'center' : 'left', fontSize:10, fontWeight:700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(t.items||[]).map((item, idx) => (
            <tr key={idx} style={{ background: idx%2===0 ? '#FAFAFA' : '#fff' }}>
              <td style={{ padding:'4px 7px', textAlign:'center', fontSize:10, borderBottom:'1px solid #E5E7EB' }}>{idx+1}</td>
              <td style={{ padding:'4px 7px', fontSize:10, borderBottom:'1px solid #E5E7EB' }}>{item.name}</td>
              <td style={{ padding:'4px 7px', textAlign:'center', fontSize:10, borderBottom:'1px solid #E5E7EB' }}>{item.qty}</td>
              <td style={{ padding:'4px 7px', textAlign:'center', fontSize:10, borderBottom:'1px solid #E5E7EB' }}>{item.unit||'pcs'}</td>
              <td style={{ padding:'4px 7px', textAlign:'right', fontSize:10, borderBottom:'1px solid #E5E7EB' }}>{formatIDR(item.price)}</td>
              <td style={{ padding:'4px 7px', textAlign:'right', fontSize:10, fontWeight:700, borderBottom:'1px solid #E5E7EB' }}>{formatIDR(item.price*item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <table style={{ width:200, borderCollapse:'collapse' }}>
          {[
            ['Subtotal', formatIDR(t.subtotal)],
            ...(t.discount>0 ? [['Diskon', `-${formatIDR(t.discount)}`]] : []),
            ...(t.tax>0 ? [`Pajak (${s?.taxRate||5}%)`, formatIDR(t.tax)] : []),
          ].filter(r=>Array.isArray(r)).map(([l,v])=>(
            <tr key={l}><td style={{ padding:'2px 6px', fontSize:10, color:'#555' }}>{l}</td><td style={{ padding:'2px 6px', fontSize:10, textAlign:'right' }}>{v}</td></tr>
          ))}
          <tr style={{ background:'#111', color:'#fff' }}>
            <td style={{ padding:'5px 6px', fontSize:12, fontWeight:900 }}>TOTAL</td>
            <td style={{ padding:'5px 6px', fontSize:12, fontWeight:900, textAlign:'right' }}>{formatIDR(t.total)}</td>
          </tr>
          {t.cashReceived>0 && (
            <>
              <tr><td style={{ padding:'2px 6px', fontSize:10 }}>Uang Diterima</td><td style={{ padding:'2px 6px', fontSize:10, textAlign:'right' }}>{formatIDR(t.cashReceived)}</td></tr>
              <tr><td style={{ padding:'2px 6px', fontSize:10, fontWeight:700 }}>Kembalian</td><td style={{ padding:'2px 6px', fontSize:10, fontWeight:700, textAlign:'right' }}>{formatIDR(t.changeAmount||0)}</td></tr>
            </>
          )}
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop:14, paddingTop:10, borderTop:'1px solid #ccc', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <p style={{ margin:0, fontSize:10, color:'#666' }}>{s?.receiptFooter||'Terima kasih atas kepercayaan Anda!'}</p>
        <div style={{ textAlign:'center', fontSize:10 }}>
          <div style={{ borderTop:'1px solid #000', paddingTop:4, width:100 }}>Tanda Tangan</div>
        </div>
      </div>
      <p style={{ margin:'6px 0 0', fontSize:8, color:'#aaa', textAlign:'center' }}>Powered by MSME Grow POS</p>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────
const ReceiptPrint = forwardRef(({ transaction, settings, mode = 'thermal' }, ref) => {
  if (!transaction) return null
  return (
    <div ref={ref} className="print-only">
      {mode === 'invoice'
        ? <InvoiceReceipt transaction={transaction} settings={settings} />
        : <ThermalReceipt transaction={transaction} settings={settings} />
      }
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            margin: 0 !important; padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
})
ReceiptPrint.displayName = 'ReceiptPrint'
export default ReceiptPrint
