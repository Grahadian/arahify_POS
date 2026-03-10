// ============================================================
// MSME GROW POS — POS Register
// Layout 2-step panel: PESANAN | PEMBAYARAN
// ============================================================
import { useState, useRef } from 'react'
import { useApp }  from '@/context/AppContext'
import { useCart } from '@/hooks/useCart'
import { formatIDR } from '@/utils/format'
import { CATEGORIES, CATEGORY_COLORS, PAYMENT_METHODS } from '@/config/constants'
import Icon   from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Modal  from '@/components/ui/Modal'
import { Badge } from '@/components/ui/index.jsx'
import ReceiptPrint from '@/components/layout/ReceiptPrint'

// ── Print & PDF utils ────────────────────────────────────────
const printElement = (el, pageSize) => {
  if (!el) return
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><style>
    @page { size: ${pageSize}; margin: 4mm; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #fff; }
  </style></head><body>${el.outerHTML}</body></html>`)
  doc.close()
  iframe.contentWindow.focus()
  setTimeout(() => {
    iframe.contentWindow.print()
    setTimeout(() => { try { document.body.removeChild(iframe) } catch {} }, 2000)
  }, 300)
}

const savePDF = (el, pageSize) => {
  if (!el) return
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { alert('Pop-up diblokir browser. Izinkan pop-up untuk Simpan PDF.'); return }
  w.document.open()
  w.document.write(`<!DOCTYPE html><html><head>
    <title>Struk MSME Grow POS</title>
    <style>
      @page { size: ${pageSize}; margin: 4mm; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
      body { margin: 0; padding: 8px; background: #fff; font-family: 'Courier New', monospace; }
    </style>
  </head><body>${el.outerHTML}</body></html>`)
  w.document.close()
  setTimeout(() => { w.focus(); w.print() }, 500)
}

// ── Online food channels ─────────────────────────────────────
const ONLINE_CH = [
  { key:'GoFood',     label:'GoFood',     icon:'🛵' },
  { key:'ShopeeFood', label:'ShopeeFood', icon:'🧡' },
  { key:'GrabFood',   label:'GrabFood',   icon:'🚗' },
]

// ════════════════════════════════════════════════════════════
const RegisterPage = () => {
  const { products, user, settings, addTransaction, members, addMember } = useApp()
  const { cart, subtotal, taxAmount, taxRate, total, totalItems, isEmpty, cartAdd, cartUpdateQty, cartRemove, cartClear } = useCart()

  const [step, setStep] = useState('order') // 'order' | 'payment'

  const [search,        setSearch]        = useState('')
  const [category,      setCategory]      = useState('Semua')
  const [note,          setNote]          = useState('')
  const [discount,      setDiscount]      = useState(0)
  const [discountInput, setDiscountInput] = useState('')
  const [onlineChannel, setOnlineChannel] = useState(null)

  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH)
  const [cashReceived,  setCashReceived]  = useState('')

  // Resizable cart panel
  const [cartWidth,  setCartWidth]  = useState(360)
  const dragging    = useRef(false)
  const startX      = useRef(0)
  const startW      = useRef(360)
  const CART_MIN    = 280
  const CART_MAX    = 520

  const onDividerDown = (e) => {
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = cartWidth
    document.body.style.userSelect = 'none'
    document.body.style.cursor     = 'col-resize'
    const onMove = (ev) => {
      if (!dragging.current) return
      const delta = startX.current - ev.clientX
      setCartWidth(Math.min(CART_MAX, Math.max(CART_MIN, startW.current + delta)))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor     = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }

  const [selectedMember,  setSelectedMember]  = useState(null)
  const [showMemberModal, setShowMemberModal]  = useState(false)
  const [memberSearch,    setMemberSearch]     = useState('')
  const [showNewMember,   setShowNewMember]    = useState(false)
  const [newMember,       setNewMember]        = useState({ name:'', phone:'', email:'', address:'' })
  const [savingMember,    setSavingMember]     = useState(false)

  const [qrisModal,    setQrisModal]    = useState(false)
  const [transferModal,setTransferModal]= useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [lastTrx,      setLastTrx]      = useState(null)
  const [processing,   setProcessing]   = useState(false)
  const [qrisChecking, setQrisChecking] = useState(false)
  const [receiptMode,  setReceiptMode]  = useState(settings?.defaultReceiptMode || 'thermal')

  const receiptRef = useRef()
  const invoiceRef = useRef()

  const grandTotal    = Math.max(0, total - discount)
  const cashNum       = parseFloat((cashReceived || '0').replace(/\D/g,'')) || 0
  const changeAmount  = Math.max(0, cashNum - grandTotal)
  const notEnoughCash = paymentMethod === PAYMENT_METHODS.CASH && cashNum > 0 && cashNum < grandTotal
  const quickCash     = [...new Set([grandTotal, Math.ceil(grandTotal/10000)*10000, Math.ceil(grandTotal/50000)*50000, Math.ceil(grandTotal/100000)*100000])].slice(0,4)

  const filteredProducts = products.filter(p =>
    p.active &&
    (category === 'Semua' || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredMembers = members.filter(m => {
    const q = memberSearch.toLowerCase()
    return !q || m.name.toLowerCase().includes(q) || (m.phone||'').includes(q) || (m.email||'').toLowerCase().includes(q)
  })

  const goToPayment  = () => { if (isEmpty) return; setCashReceived(''); setStep('payment') }
  const goBackToOrder = () => setStep('order')

  const processPayment = async () => {
    if (paymentMethod === PAYMENT_METHODS.QRIS && !onlineChannel) { setQrisModal(true); return }
    if (paymentMethod === PAYMENT_METHODS.TRANSFER && !onlineChannel) { setTransferModal(true); return }
    await finalize()
  }

  const finalize = async () => {
    setProcessing(true)
    try {
      const trx = await addTransaction({
        date         : new Date().toISOString(),
        items        : cart.map(i => ({ productId: i.productId, name: i.name, qty: i.qty, price: i.price, unit: i.unit })),
        subtotal, tax: taxAmount, discount, total: grandTotal,
        payment      : onlineChannel ? 'Online' : paymentMethod,
        onlineChannel: onlineChannel || null,
        cashReceived : paymentMethod === PAYMENT_METHODS.CASH && !onlineChannel ? cashNum : null,
        changeAmount : paymentMethod === PAYMENT_METHODS.CASH && !onlineChannel ? changeAmount : null,
        cashier      : user?.name || 'Kasir',
        cashierId    : user?.id,
        memberId     : selectedMember?.id    || null,
        memberName   : selectedMember?.name  || null,
        memberPhone  : selectedMember?.phone || null,
        memberEmail  : selectedMember?.email || null,
        note, status : 'completed',
      })
      setLastTrx(trx)
      cartClear()
      setNote(''); setDiscount(0); setDiscountInput('')
      setOnlineChannel(null); setPaymentMethod(PAYMENT_METHODS.CASH)
      setQrisModal(false); setTransferModal(false); setStep('order')
      setSuccessModal(true)
      if (settings.printAutomatically) {
        setTimeout(() => {
          const el = receiptMode === 'invoice' ? invoiceRef.current : receiptRef.current
          const ps = receiptMode === 'invoice' ? 'A5 landscape' : '80mm auto'
          printElement(el, ps)
        }, 700)
      }
    } catch (err) { console.error('[Register] error:', err) }
    finally { setProcessing(false) }
  }

  const handlePrint    = () => printElement(receiptMode==='invoice'?invoiceRef.current:receiptRef.current, receiptMode==='invoice'?'A5 landscape':'80mm auto')
  const handleSavePDF  = () => savePDF     (receiptMode==='invoice'?invoiceRef.current:receiptRef.current, receiptMode==='invoice'?'A5 landscape':'80mm auto')

  const checkQrisStatus = async () => { setQrisChecking(true); await new Promise(r=>setTimeout(r,1500)); setQrisChecking(false); await finalize() }
  const handleAddNewMember = async () => {
    if (!newMember.name.trim()) return
    setSavingMember(true)
    try { addMember(newMember); setShowNewMember(false); setNewMember({name:'',phone:'',email:'',address:''}) }
    finally { setSavingMember(false) }
  }

  const catColors = CATEGORY_COLORS
  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>

      {/* ── LEFT: Product Grid ────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid #F1F5F9', minWidth:0 }}>
        <div style={{ padding:'14px 16px 10px', background:'#fff', borderBottom:'1px solid #F1F5F9', flexShrink:0 }}>
          <div style={{ position:'relative', marginBottom:10 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}><Icon name="search" size={16} color="#9CA3AF" /></span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari produk..."
              style={{ ...inp, padding:'10px 12px 10px 38px' }} />
          </div>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
            {CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setCategory(c)} style={{ padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', whiteSpace:'nowrap', fontSize:12, fontWeight:700, fontFamily:'inherit', background:category===c?'#2563EB':'#F3F4F6', color:category===c?'#fff':'#6B7280', transition:'all 0.15s' }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
          {filteredProducts.length===0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#9CA3AF' }}>
              <Icon name="inventory" size={36} color="#E5E7EB" />
              <p style={{ margin:'10px 0 0', fontSize:13 }}>Tidak ada produk</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
              {filteredProducts.map(p=>{
                const cc = catColors[p.category] || catColors['Lainnya'] || {bg:'#F9FAFB',text:'#374151',accent:'#6B7280'}
                const inCart = cart.find(i=>i.productId===p.id)
                return (
                  <div key={p.id} onClick={()=>cartAdd(p)} style={{ background:'#fff', borderRadius:14, padding:'14px 12px', border:inCart?'2px solid #2563EB':'1.5px solid #F1F5F9', cursor:'pointer', transition:'all 0.15s', position:'relative', boxShadow:inCart?'0 0 0 3px rgba(37,99,235,0.1)':'0 1px 4px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column' }}
                    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                    {inCart&&<div style={{ position:'absolute', top:8, right:8, background:'#2563EB', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:11, fontWeight:900, color:'#fff' }}>{inCart.qty}</span></div>}
                    <div style={{ width:38, height:38, background:cc.bg, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:9, flexShrink:0 }}><Icon name="inventory" size={19} color={cc.accent} /></div>
                    <p style={{ margin:'0 0 4px', fontSize:12, fontWeight:800, color:'#111827', lineHeight:1.3, flex:1 }}>{p.name}</p>
                    <div style={{ marginBottom:6 }}>
                      {p.category&&<span style={{ fontSize:10, color:cc.text, fontWeight:700, background:cc.bg, padding:'2px 7px', borderRadius:6, display:'inline-block' }}>{p.category}</span>}
                    </div>
                    <div style={{ marginTop:'auto' }}>
                      <p style={{ margin:0, fontSize:14, fontWeight:900, color:'#2563EB' }}>{formatIDR(p.price)}</p>
                      {p.unit&&<p style={{ margin:'1px 0 0', fontSize:10, color:'#9CA3AF' }}>/ {p.unit}</p>}
                      {p.stock!=null&&<p style={{ margin:'2px 0 0', fontSize:10, color:p.stock<5?'#EF4444':'#9CA3AF' }}>Stok: {p.stock}</p>}
                    </div>
                  </div>
                
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── DRAG DIVIDER ── */}
      <div onMouseDown={onDividerDown}
        style={{ width:6, flexShrink:0, cursor:'col-resize', background:'#F1F5F9', borderLeft:'1px solid #E5E7EB', borderRight:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', userSelect:'none' }}
        onMouseEnter={e=>e.currentTarget.style.background='#BFDBFE'}
        onMouseLeave={e=>e.currentTarget.style.background='#F1F5F9'}>
        <div style={{ width:2, height:32, background:'#CBD5E1', borderRadius:4 }} />
      </div>

      {/* ── RIGHT: 2-step panel ───────────────────── */}
      <div style={{ width:cartWidth, flexShrink:0, display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }}>

        {/* Step tabs */}
        <div style={{ display:'flex', flexShrink:0, borderBottom:'1px solid #F1F5F9' }}>
          {[{key:'order',label:'1  Pesanan'},{key:'payment',label:'2  Pembayaran'}].map(s=>(
            <div key={s.key} onClick={()=>{ if(s.key==='payment'&&!isEmpty)setStep('payment'); if(s.key==='order')setStep('order') }}
              style={{ flex:1, padding:'12px 8px', textAlign:'center', fontSize:12, fontWeight:700, cursor:s.key==='payment'&&isEmpty?'not-allowed':'pointer', color:step===s.key?'#2563EB':'#9CA3AF', borderBottom:step===s.key?'2.5px solid #2563EB':'2.5px solid transparent', background:step===s.key?'#EFF6FF':'#fff', transition:'all 0.2s' }}>
              {s.label}
            </div>
          ))}
        </div>

        {/* ══ STEP: PESANAN ══ */}
        {step==='order'&&(
          <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid #F9FAFB', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Icon name="register" size={15} color="#2563EB" />
                  <span style={{ fontSize:13, fontWeight:800, color:'#111827' }}>Keranjang</span>
                  {!isEmpty&&<Badge color="blue">{totalItems} item</Badge>}
                </div>
                {!isEmpty&&<button onClick={cartClear} style={{ background:'#FEF2F2', border:'none', borderRadius:8, padding:'4px 10px', color:'#EF4444', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Kosongkan</button>}
              </div>
              {/* Member */}
              <div onClick={()=>setShowMemberModal(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:selectedMember?'#EFF6FF':'#F9FAFB', border:`1.5px solid ${selectedMember?'#BFDBFE':'#E5E7EB'}`, borderRadius:10, cursor:'pointer' }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:selectedMember?'#2563EB':'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="user" size={13} color={selectedMember?'#fff':'#9CA3AF'} /></div>
                <div style={{ flex:1, minWidth:0 }}>
                  {selectedMember?(<><p style={{ margin:0, fontSize:12, fontWeight:700, color:'#1D4ED8' }}>{selectedMember.name}</p><p style={{ margin:0, fontSize:10, color:'#6B7280' }}>{selectedMember.phone||'Member'}</p></>):(<p style={{ margin:0, fontSize:12, color:'#9CA3AF' }}>+ Pilih / Tambah Member</p>)}
                </div>
                {selectedMember&&<button onClick={e=>{e.stopPropagation();setSelectedMember(null)}} style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'#9CA3AF', flexShrink:0 }}>✕</button>}
              </div>
            </div>

            {/* Cart items — all visible, scrollable */}
            <div style={{ flex:1, overflowY:'auto', padding:'8px 12px', minHeight:0 }}>
              {isEmpty?(
                <div style={{ textAlign:'center', padding:'40px 20px', color:'#D1D5DB' }}>
                  <Icon name="register" size={40} color="#E5E7EB" />
                  <p style={{ margin:'10px 0 0', fontSize:13, color:'#9CA3AF' }}>Keranjang kosong</p>
                  <p style={{ margin:'4px 0 0', fontSize:11, color:'#D1D5DB' }}>Tap produk untuk menambahkan</p>
                </div>
              ):(
                cart.map(item=>(
                  <div key={item.productId} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 0', borderBottom:'1px solid #F9FAFB' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:'0 0 2px', fontSize:12, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
                      <p style={{ margin:0, fontSize:11, color:'#6B7280' }}>{formatIDR(item.price)} / {item.unit||'pcs'}</p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                      <button onClick={()=>cartUpdateQty(item.productId,item.qty-1)} style={{ width:24, height:24, borderRadius:8, border:'1.5px solid #E5E7EB', background:'#F9FAFB', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="minus" size={12} color="#374151" /></button>
                      <span style={{ width:20, textAlign:'center', fontSize:13, fontWeight:800, color:'#111827' }}>{item.qty}</span>
                      <button onClick={()=>cartAdd(item)} style={{ width:24, height:24, borderRadius:8, border:'none', background:'#2563EB', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="plus" size={12} color="#fff" /></button>
                    </div>
                    <span style={{ fontSize:12, fontWeight:800, color:'#111827', minWidth:60, textAlign:'right' }}>{formatIDR(item.price*item.qty)}</span>
                    <button onClick={()=>cartRemove(item.productId)} style={{ background:'none', border:'none', cursor:'pointer', padding:2, flexShrink:0 }}><Icon name="x" size={13} color="#D1D5DB" /></button>
                  </div>
                ))
              )}
            </div>

            {/* Order footer */}
            {!isEmpty&&(
              <div style={{ padding:'12px 14px', borderTop:'1px solid #F1F5F9', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'#6B7280', flexShrink:0 }}>Diskon (Rp)</span>
                  <input value={discountInput} onChange={e=>{const v=e.target.value.replace(/\D/g,'');setDiscountInput(v);setDiscount(parseFloat(v)||0)}} placeholder="0"
                    style={{ flex:1, padding:'6px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:12, fontFamily:'inherit', outline:'none', textAlign:'right' }} />
                </div>
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Catatan (opsional)..." rows={1}
                  style={{ ...inp, padding:'7px 10px', resize:'none', marginBottom:8 }} />

                {/* Totals */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:2 }}><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
                  {settings.taxEnabled&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:2 }}><span>Pajak ({taxRate}%)</span><span>{formatIDR(taxAmount)}</span></div>}
                  {discount>0&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#22C55E', marginBottom:2 }}><span>Diskon</span><span>-{formatIDR(discount)}</span></div>}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:17, fontWeight:900, marginTop:6, paddingTop:6, borderTop:'1.5px solid #F1F5F9' }}><span>Total</span><span style={{ color:'#2563EB' }}>{formatIDR(grandTotal)}</span></div>
                </div>

                {/* Online channels — same style as regular buttons */}
                <div style={{ marginBottom:10 }}>
                  <p style={{ margin:'0 0 6px', fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.6 }}>Pesan Online</p>
                  <div style={{ display:'flex', gap:5 }}>
                    {ONLINE_CH.map(ch=>{
                      const isActive=onlineChannel===ch.key
                      return(
                        <button key={ch.key} onClick={()=>setOnlineChannel(isActive?null:ch.key)}
                          style={{ flex:1, padding:'7px 4px', borderRadius:9, border:isActive?'2px solid #2563EB':'1.5px solid #E5E7EB', background:isActive?'#EFF6FF':'#fff', color:isActive?'#2563EB':'#6B7280', fontSize:9, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:2, transition:'all 0.15s' }}>
                          <span style={{ fontSize:13 }}>{ch.icon}</span>
                          <span style={{ fontSize:8, lineHeight:1.2 }}>{ch.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  {onlineChannel&&<p style={{ margin:'5px 0 0', fontSize:11, color:'#2563EB', fontWeight:700 }}>📦 Order via {onlineChannel}</p>}
                </div>

                <button onClick={goToPayment} style={{ width:'100%', padding:'13px', background:'#2563EB', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(37,99,235,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  Lanjut ke Pembayaran →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ STEP: PEMBAYARAN ══ */}
        {step==='payment'&&(
          <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid #F9FAFB', flexShrink:0, display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={goBackToOrder} style={{ background:'#F3F4F6', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="chevronLeft" size={15} color="#374151" /></button>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#111827' }}>Konfirmasi Pembayaran</p>
                <p style={{ margin:0, fontSize:11, color:'#6B7280' }}>{cart.length} produk · {totalItems} item{selectedMember?` · 👤 ${selectedMember.name}`:''}</p>
              </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', minHeight:0 }}>
              {/* Summary */}
              <div style={{ background:'#F9FAFB', borderRadius:12, padding:'10px 12px', marginBottom:14 }}>
                {cart.map(i=>(
                  <div key={i.productId} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                    <span style={{ color:'#374151', flex:1, marginRight:8 }}>{i.qty}× {i.name}</span>
                    <span style={{ fontWeight:700, flexShrink:0 }}>{formatIDR(i.price*i.qty)}</span>
                  </div>
                ))}
                <div style={{ borderTop:'1px dashed #E5E7EB', paddingTop:8, marginTop:6 }}>
                  {settings.taxEnabled&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:3 }}><span>Pajak ({taxRate}%)</span><span>{formatIDR(taxAmount)}</span></div>}
                  {discount>0&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#22C55E', marginBottom:3 }}><span>Diskon</span><span>-{formatIDR(discount)}</span></div>}
                  {onlineChannel&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:3 }}><span>Via</span><span style={{ fontWeight:700 }}>{onlineChannel}</span></div>}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:900 }}><span>Total</span><span style={{ color:'#2563EB' }}>{formatIDR(grandTotal)}</span></div>
                </div>
              </div>

              {/* Online order info box */}
              {onlineChannel?(
                <div style={{ background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:12, padding:14, marginBottom:14, textAlign:'center' }}>
                  <p style={{ margin:'0 0 4px', fontSize:24 }}>{ONLINE_CH.find(c=>c.key===onlineChannel)?.icon}</p>
                  <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:800, color:'#1D4ED8' }}>Order via {onlineChannel}</p>
                  <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>Pembayaran diterima di aplikasi {onlineChannel}</p>
                </div>
              ):(
                <>
                  {/* Payment method grid */}
                  <div style={{ marginBottom:14 }}>
                    <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.6 }}>Metode Pembayaran</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                      {Object.values(PAYMENT_METHODS).map(method=>(
                        <button key={method} onClick={()=>setPaymentMethod(method)}
                          style={{ padding:'10px 8px', borderRadius:10, border:paymentMethod===method?'2px solid #2563EB':'1.5px solid #E5E7EB', background:paymentMethod===method?'#EFF6FF':'#fff', color:paymentMethod===method?'#2563EB':'#6B7280', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.15s' }}>
                          <Icon name={method==='Cash'?'cash':method==='Card'?'card':method==='QRIS'?'qris':'transfer'} size={16} color={paymentMethod===method?'#2563EB':'#9CA3AF'} />
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cash input */}
                  {paymentMethod===PAYMENT_METHODS.CASH&&(
                    <div style={{ marginBottom:14 }}>
                      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:7 }}>Uang Diterima (Rp)</label>
                      <input type="number" value={cashReceived} onChange={e=>setCashReceived(e.target.value)} placeholder={`Min. ${grandTotal.toLocaleString('id-ID')}`}
                        style={{ ...inp, fontSize:16, fontWeight:800, textAlign:'right', border:`2px solid ${notEnoughCash?'#EF4444':'#E5E7EB'}` }} />
                      <div style={{ display:'flex', gap:6, marginTop:7 }}>
                        {quickCash.map(v=>(
                          <button key={v} onClick={()=>setCashReceived(String(v))}
                            style={{ flex:1, padding:'6px 4px', borderRadius:8, border:'1.5px solid #E5E7EB', background:cashNum===v?'#EFF6FF':'#F9FAFB', color:cashNum===v?'#2563EB':'#374151', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                            {v>=1000000?`${v/1000000}jt`:v>=1000?`${v/1000}rb`:v}
                          </button>
                        ))}
                      </div>
                      {cashNum>=grandTotal&&<div style={{ marginTop:10, padding:'10px 14px', background:'#F0FDF4', border:'1.5px solid #BBF7D0', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}><span style={{ fontSize:13, fontWeight:700, color:'#166534' }}>💰 Kembalian</span><span style={{ fontSize:20, fontWeight:900, color:'#16A34A' }}>{formatIDR(changeAmount)}</span></div>}
                      {notEnoughCash&&<p style={{ margin:'6px 0 0', fontSize:12, color:'#EF4444', fontWeight:700 }}>Uang kurang {formatIDR(grandTotal-cashNum)}</p>}
                    </div>
                  )}

                  {/* Transfer — info sudah ada di modal konfirmasi saat Proses Bayar */}
                  {paymentMethod===PAYMENT_METHODS.TRANSFER&&(
                    <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', gap:8, alignItems:'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      <p style={{ margin:0, fontSize:12, color:'#1E40AF', fontWeight:600 }}>
                        Detail rekening tujuan akan tampil saat konfirmasi pembayaran
                      </p>
                    </div>
                  )}                  {paymentMethod===PAYMENT_METHODS.QRIS&&(
                    <div style={{ marginBottom:14, textAlign:'center' }}>
                      {settings?.qrisImageUrl?(
                        <div style={{ background:'#F9FAFB', borderRadius:14, padding:12, display:'inline-block', border:'1px solid #E5E7EB' }}>
                          <img src={settings.qrisImageUrl} alt="QRIS Barcode" style={{ width:180, height:180, objectFit:'contain', display:'block' }} />
                        </div>
                      ):(
                        <div style={{ background:'#F3F4F6', borderRadius:14, padding:16, display:'inline-block' }}>
                          <svg viewBox="0 0 100 100" width="130" height="130">
                            <rect x="5" y="5" width="35" height="35" fill="none" stroke="#1F2937" strokeWidth="3"/>
                            <rect x="12" y="12" width="21" height="21" fill="#1F2937"/>
                            <rect x="60" y="5" width="35" height="35" fill="none" stroke="#1F2937" strokeWidth="3"/>
                            <rect x="67" y="12" width="21" height="21" fill="#1F2937"/>
                            <rect x="5" y="60" width="35" height="35" fill="none" stroke="#1F2937" strokeWidth="3"/>
                            <rect x="12" y="67" width="21" height="21" fill="#1F2937"/>
                            {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i=>(
                              <rect key={i} x={45+(i%4)*7} y={45+Math.floor(i/4)*7} width="5" height="5" fill="#1F2937" opacity={[1,0,1,0,0,1,1,0,1,0,0,1,1,0,1,0][i]} />
                            ))}
                          </svg>
                          <p style={{ margin:'8px 0 0', fontSize:11, color:'#9CA3AF' }}>Upload barcode QRIS di Pengaturan → Pajak & Kasir</p>
                        </div>
                      )}
                      <p style={{ margin:'8px 0 0', fontSize:12, color:'#6B7280' }}>Scan QRIS · GoPay · OVO · Dana · m-Banking</p>
                    </div>
                  )}
                </>
              )}
              {note&&<div style={{ background:'#FFF7ED', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:12, color:'#92400E' }}>📝 {note}</div>}
            </div>

            <div style={{ padding:'12px 14px', borderTop:'1px solid #F1F5F9', flexShrink:0 }}>
              <Button onClick={processPayment} variant="primary" fullWidth size="lg" icon="check" loading={processing}
                disabled={!onlineChannel&&paymentMethod===PAYMENT_METHODS.CASH&&cashReceived&&cashNum<grandTotal}>
                {onlineChannel?`Konfirmasi — ${formatIDR(grandTotal)}`:`Proses Bayar — ${formatIDR(grandTotal)}`}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ══════ MODALS ══════ */}

      <Modal open={showMemberModal} onClose={()=>{setShowMemberModal(false);setShowNewMember(false);setMemberSearch('')}} title="Pilih Member">
        {!showNewMember?(
          <div>
            <div style={{ position:'relative', marginBottom:14 }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}><Icon name="search" size={14} color="#9CA3AF" /></span>
              <input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="Cari nama, telepon, email..."
                style={{ ...inp, padding:'9px 12px 9px 32px' }} />
            </div>
            <Button onClick={()=>setShowNewMember(true)} variant="secondary" fullWidth icon="plus" style={{ marginBottom:12 }}>Daftarkan Member Baru</Button>
            {filteredMembers.length===0?(
              <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:13, padding:'20px 0' }}>{memberSearch?'Member tidak ditemukan.':'Belum ada member.'}</p>
            ):(
              filteredMembers.map(m=>(
                <div key={m.id} onClick={()=>{setSelectedMember(m);setShowMemberModal(false);setMemberSearch('')}}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:'1.5px solid #F1F5F9', marginBottom:8, cursor:'pointer', transition:'all 0.15s', background:'#fff' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#EFF6FF'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><span style={{ fontSize:15, fontWeight:900, color:'#fff' }}>{m.name.charAt(0).toUpperCase()}</span></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:700, color:'#111827' }}>{m.name}</p>
                    <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>{m.phone||''}{m.phone&&m.email?' · ':''}{m.email||''}</p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ margin:'0 0 1px', fontSize:11, color:'#9CA3AF' }}>{m.totalOrders||0} transaksi</p>
                    <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#2563EB' }}>{formatIDR(m.totalSpent||0)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ):(
          <div>
            <button onClick={()=>setShowNewMember(false)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'#2563EB', fontSize:13, fontWeight:700, fontFamily:'inherit', marginBottom:16, padding:0 }}><Icon name="chevronLeft" size={14} color="#2563EB" /> Kembali ke daftar</button>
            <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:800, color:'#111827' }}>Daftar Member Baru</h3>
            {[{label:'Nama Lengkap *',key:'name',placeholder:'Budi Santoso',type:'text'},{label:'No. Telepon',key:'phone',placeholder:'+62 812 3456 7890',type:'tel'},{label:'Email',key:'email',placeholder:'email@example.com',type:'email'},{label:'Alamat',key:'address',placeholder:'Jl. Contoh No.1...',type:'text'}].map(f=>(
              <div key={f.key} style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>{f.label}</label>
                <input type={f.type} value={newMember[f.key]} onChange={e=>setNewMember(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={inp} />
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <Button onClick={()=>setShowNewMember(false)} variant="secondary" fullWidth>Batal</Button>
              <Button onClick={handleAddNewMember} variant="primary" fullWidth icon="check" loading={savingMember} disabled={!newMember.name.trim()}>Simpan Member</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* QRIS full-screen confirm modal (non-online payment) */}
      <Modal open={qrisModal} onClose={()=>!processing&&setQrisModal(false)} title="QRIS Payment">
        <div style={{ textAlign:'center' }}>
          <h3 style={{ margin:'0 0 4px', fontSize:18, fontWeight:800 }}>{settings.businessName||'MSME Grow'}</h3>
          <p style={{ fontSize:28, fontWeight:900, color:'#111827', margin:'0 0 16px' }}>{formatIDR(grandTotal)}</p>
          {settings?.qrisImageUrl?(
            <div style={{ background:'#F9FAFB', borderRadius:16, padding:12, display:'inline-block', border:'1px solid #E5E7EB', marginBottom:14 }}>
              <img src={settings.qrisImageUrl} alt="QRIS" style={{ width:200, height:200, objectFit:'contain', display:'block' }} />
            </div>
          ):(
            <div style={{ background:'#F3F4F6', borderRadius:16, padding:20, display:'inline-block', marginBottom:14 }}>
              <svg viewBox="0 0 100 100" width="160" height="160">
                <rect x="5" y="5" width="35" height="35" fill="none" stroke="#1F2937" strokeWidth="3"/>
                <rect x="12" y="12" width="21" height="21" fill="#1F2937"/>
                <rect x="60" y="5" width="35" height="35" fill="none" stroke="#1F2937" strokeWidth="3"/>
                <rect x="67" y="12" width="21" height="21" fill="#1F2937"/>
                <rect x="5" y="60" width="35" height="35" fill="none" stroke="#1F2937" strokeWidth="3"/>
                <rect x="12" y="67" width="21" height="21" fill="#1F2937"/>
                {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i=>(
                  <rect key={i} x={45+(i%4)*7} y={45+Math.floor(i/4)*7} width="5" height="5" fill="#1F2937" opacity={[1,0,1,0,0,1,1,0,1,0,0,1,1,0,1,0][i]} />
                ))}
              </svg>
              <p style={{ margin:'8px 0 0', fontSize:11, color:'#9CA3AF' }}>Upload foto QRIS di Pengaturan → Pajak & Kasir</p>
            </div>
          )}
          <p style={{ fontSize:13, color:'#6B7280', marginBottom:16 }}>Scan QRIS dengan GoPay, OVO, Dana, atau m-Banking</p>
          <Button onClick={checkQrisStatus} variant="primary" fullWidth icon="refresh" loading={qrisChecking}>Cek Status Pembayaran</Button>
          <button onClick={()=>setQrisModal(false)} style={{ width:'100%', marginTop:10, padding:12, background:'none', border:'none', color:'#9CA3AF', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Batalkan Transaksi</button>
        </div>
      </Modal>

      {/* Transfer Confirmation Modal */}
      <Modal open={transferModal} onClose={()=>!processing&&setTransferModal(false)} title="Konfirmasi Transfer Bank">
        <div style={{ textAlign:'center' }}>
          <div style={{ width:56, height:56, background:'#EFF6FF', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <h3 style={{ margin:'0 0 4px', fontSize:18, fontWeight:800, color:'#111827' }}>{settings.businessName||'MSME Grow'}</h3>
          <p style={{ fontSize:30, fontWeight:900, color:'#2563EB', margin:'0 0 20px' }}>{formatIDR(grandTotal)}</p>

          {/* Bank accounts */}
          {(settings?.bankAccounts||[]).filter(b=>b.bankName).length > 0 ? (
            <div style={{ marginBottom:18, display:'flex', flexDirection:'column', gap:10 }}>
              {(settings.bankAccounts||[]).filter(b=>b.bankName).map((bank, idx) => (
                <div key={idx} style={{ background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:14, padding:'14px 16px', textAlign:'left' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ width:32, height:32, background:'#EFF6FF', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:'#111827' }}>{bank.bankName}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, padding:'8px 10px' }}>
                      <p style={{ margin:'0 0 2px', fontSize:10, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>No. Rekening</p>
                      <p style={{ margin:0, fontSize:15, fontWeight:900, color:'#111827', fontFamily:'monospace', letterSpacing:1 }}>{bank.noRek}</p>
                    </div>
                    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, padding:'8px 10px' }}>
                      <p style={{ margin:'0 0 2px', fontSize:10, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>Atas Nama</p>
                      <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#111827' }}>{bank.atasNama}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:12, padding:'14px 16px', marginBottom:18, textAlign:'left' }}>
              <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:700, color:'#D97706' }}>⚠ Info Bank Belum Diatur</p>
              <p style={{ margin:0, fontSize:12, color:'#92400E' }}>Isi rekening tujuan di Pengaturan → Pajak & Kasir → Info Transfer Bank</p>
            </div>
          )}

          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'10px 14px', marginBottom:18, textAlign:'left' }}>
            <p style={{ margin:0, fontSize:13, color:'#1E40AF' }}>
              💡 Pastikan pelanggan sudah transfer <strong>{formatIDR(grandTotal)}</strong> sebelum menekan "Konfirmasi Diterima"
            </p>
          </div>

          <Button onClick={()=>finalize()} variant="primary" fullWidth loading={processing} icon="check">
            ✅ Konfirmasi Transfer Diterima
          </Button>
          <button onClick={()=>setTransferModal(false)} style={{ width:'100%', marginTop:10, padding:12, background:'none', border:'none', color:'#9CA3AF', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Batalkan Transaksi
          </button>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal open={successModal} onClose={()=>setSuccessModal(false)} title="Pembayaran Berhasil">
        {lastTrx&&(
          <div>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ width:64, height:64, background:'#DCFCE7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}><Icon name="check" size={28} color="#16A34A" strokeWidth={3} /></div>
              <h3 style={{ margin:'0 0 4px', fontSize:20, fontWeight:900, color:'#111827' }}>Pembayaran Berhasil!</h3>
              <p style={{ margin:'0 0 2px', color:'#6B7280', fontSize:12 }}>ID: <strong>{lastTrx.id}</strong></p>
              <p style={{ fontSize:27, fontWeight:900, color:'#111827', margin:'0 0 3px' }}>{formatIDR(lastTrx.total)}</p>
              {lastTrx.onlineChannel&&<p style={{ margin:'0 0 3px', fontSize:12, color:'#2563EB', fontWeight:700 }}>📦 {lastTrx.onlineChannel}</p>}
              {lastTrx.memberName&&<p style={{ margin:0, fontSize:13, color:'#6B7280' }}>👤 {lastTrx.memberName}</p>}
            </div>

            <div style={{ background:'#F9FAFB', borderRadius:12, padding:'10px 14px', marginBottom:12 }}>
              {lastTrx.items.map((item,idx)=>(
                <div key={idx} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                  <span style={{ color:'#374151' }}>{item.qty}× {item.name}</span>
                  <span style={{ fontWeight:700 }}>{formatIDR(item.price*item.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px dashed #E5E7EB', marginTop:7, paddingTop:7 }}>
                {lastTrx.cashReceived&&<><div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:3 }}><span>Uang Diterima</span><span>{formatIDR(lastTrx.cashReceived)}</span></div><div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:800, color:'#22C55E', marginBottom:5 }}><span>Kembalian</span><span>{formatIDR(lastTrx.changeAmount)}</span></div></>}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:900 }}><span>Total</span><span style={{ color:'#2563EB' }}>{formatIDR(lastTrx.total)}</span></div>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F8FAFC', borderRadius:10, padding:'8px 12px', marginBottom:10 }}>
              <span style={{ fontSize:11, color:'#6B7280' }}>Format:</span>
              <div style={{ display:'flex', gap:4 }}>
                {[['thermal','🧾 Struk'],['invoice','📄 Nota A5']].map(([m,l])=>(
                  <button key={m} onClick={()=>setReceiptMode(m)}
                    style={{ padding:'4px 10px', borderRadius:7, border:receiptMode===m?'1.5px solid #2563EB':'1.5px solid #E5E7EB', background:receiptMode===m?'#EFF6FF':'#fff', color:receiptMode===m?'#2563EB':'#6B7280', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handlePrint} style={{ flex:1, padding:'11px 6px', background:'#2563EB', color:'#fff', border:'none', borderRadius:11, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5, boxShadow:'0 3px 10px rgba(37,99,235,0.25)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Cetak
              </button>
              <button onClick={handleSavePDF} style={{ flex:1, padding:'11px 6px', background:'#fff', color:'#374151', border:'1.5px solid #E5E7EB', borderRadius:11, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Simpan PDF
              </button>
              <button onClick={()=>{setSuccessModal(false);setReceiptMode(settings?.defaultReceiptMode||'thermal')}} style={{ flex:1, padding:'11px 6px', background:'#F8FAFC', color:'#374151', border:'1.5px solid #E5E7EB', borderRadius:11, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Trx Baru
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden print targets */}
      <div style={{ position:'fixed', top:'-9999px', left:'-9999px' }}>
        <ReceiptPrint ref={receiptRef} transaction={lastTrx} settings={settings} mode="thermal" />
      </div>
      <div style={{ position:'fixed', top:'-9999px', left:'-9999px' }}>
        <ReceiptPrint ref={invoiceRef} transaction={lastTrx} settings={settings} mode="invoice" />
      </div>
    </div>
  )
}

export default RegisterPage
