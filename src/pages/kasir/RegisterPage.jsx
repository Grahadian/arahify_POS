// ============================================================
// MSME GROW POS — POS Register v3.0
// Fitur baru: Varian produk, Struk WA, Poin loyalty, Stok otomatis
// ============================================================
import { useState, useRef, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { useCart } from '@/hooks/useCart'
import { formatIDR } from '@/utils/format'
import { CATEGORIES, CATEGORY_COLORS, PAYMENT_METHODS } from '@/config/constants'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Badge } from '@/components/ui/index.jsx'
import ReceiptPrint from '@/components/layout/ReceiptPrint'

// Print utils 
const printElement = (el, pageSize) => {
 if (!el) return
 const iframe = document.createElement('iframe')
 iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;'
 document.body.appendChild(iframe)
 const doc = iframe.contentWindow.document
 doc.open()
 doc.write(`<!DOCTYPE html><html><head><style>
 @page{size:${pageSize};margin:4mm;}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box;}body{margin:0;padding:0;background:#fff;}
 </style></head><body>${el.outerHTML}</body></html>`)
 doc.close()
 iframe.contentWindow.focus()
 setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => { try{document.body.removeChild(iframe)}catch{} }, 2000) }, 300)
}
const savePDF = (el, pageSize) => {
 if (!el) return
 const w = window.open('', '_blank', 'width=900,height=700')
 if (!w) { alert('Pop-up diblokir. Izinkan pop-up untuk Simpan PDF.'); return }
 w.document.open()
 w.document.write(`<!DOCTYPE html><html><head><title>Struk</title><style>
 @page{size:${pageSize};margin:4mm;}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box;}body{margin:0;padding:8px;background:#fff;font-family:'Courier New',monospace;}
 </style></head><body>${el.outerHTML}</body></html>`)
 w.document.close()
 setTimeout(() => { w.focus(); w.print() }, 500)
}

// Build WA message 
const buildWAMessage = (trx, settings) => {
 const biz = settings?.businessName || 'MSME Grow'
 const rp = (n) => 'Rp ' + (n||0).toLocaleString('id-ID')
 const dt = new Date(trx.date||trx.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
 let msg = ` *STRUK PEMBAYARAN*\n*${biz}*\n${settings?.address?settings.address+'\n':''}\n`
 msg += `No. Transaksi: ${trx.id}\nTanggal: ${dt}\nKasir: ${trx.cashier||'-'}\n`
 if (trx.memberName) msg += `Member: ${trx.memberName}\n`
 msg += `\n*Pesanan:*\n`
 ;(trx.items||[]).forEach(i => { msg += `- ${i.name} x${i.qty} = ${rp(i.price*i.qty)}\n` })
 msg += `\n`
 if (trx.tax>0) msg += `Pajak: ${rp(trx.tax)}\n`
 if (trx.discount>0) msg += `Diskon: -${rp(trx.discount)}\n`
 msg += `*TOTAL: ${rp(trx.total)}*\n`
 if (trx.payment==='Cash'&&trx.cashReceived) msg += `Bayar: ${rp(trx.cashReceived)}\nKembali: ${rp(trx.changeAmount)}\n`
 msg += `\n${settings?.receiptFooter||'Terima kasih!'}`
 return encodeURIComponent(msg)
}

const ONLINE_CH = [
 { key:'GoFood', label:'GoFood', icon:'' },
 { key:'ShopeeFood', label:'ShopeeFood', icon:'' },
 { key:'GrabFood', label:'GrabFood', icon:'' },
]

// 
const RegisterPage = () => {
 const { products, user, settings, addTransaction, members, addMember, activeShift } = useApp()
 const { cart, subtotal, taxAmount, taxRate, total, totalItems, isEmpty, cartAdd, cartUpdateQty, cartRemove, cartClear } = useCart()

 const [step, setStep] = useState('order')
 const [search, setSearch] = useState('')
 const [category, setCategory] = useState('Semua')
 const [note, setNote] = useState('')
 const [discount, setDiscount] = useState(0)
 const [discountInput, setDiscountInput] = useState('')
 const [onlineChannel, setOnlineChannel] = useState(null)
 const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH)
 const [cashReceived, setCashReceived] = useState('')

 // Poin loyalty
 const [redeemPoints, setRedeemPoints] = useState(false)

 // Hold Orders
 const [heldOrders, setHeldOrders] = useState([])
 const [showHoldModal, setShowHoldModal] = useState(false)
 const [holdNote, setHoldNote] = useState('')

 // Per-item notes
 const [itemNotes, setItemNotes] = useState({}) // key: cartKey -> note
 const [editNoteKey, setEditNoteKey] = useState(null)
 const [editNoteVal, setEditNoteVal] = useState('')

 // Barcode scan di POS
 const [posScanMode, setPosScanMode] = useState(false)
 const posBarcodeRef = useRef()

 // Harga Grosir/Eceran
 const [priceType, setPriceType] = useState('retail') // 'retail' | 'grosir'

 // Resizable divider
 const [cartWidth, setCartWidth] = useState(360)
 const dragging = useRef(false), startX = useRef(0), startW = useRef(360)
 const CART_MIN = 280, CART_MAX = 520
 const onDividerDown = (e) => {
 dragging.current = true; startX.current = e.clientX; startW.current = cartWidth
 document.body.style.userSelect = 'none'; document.body.style.cursor = 'col-resize'
 const onMove = (ev) => { if (!dragging.current) return; setCartWidth(Math.min(CART_MAX, Math.max(CART_MIN, startW.current + startX.current - ev.clientX))) }
 const onUp = () => { dragging.current = false; document.body.style.userSelect = ''; document.body.style.cursor = ''; document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp) }
 document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
 }

 // Member
 const [selectedMember, setSelectedMember] = useState(null)
 const [showMemberModal, setShowMemberModal] = useState(false)
 const [memberSearch, setMemberSearch] = useState('')
 const [showNewMember, setShowNewMember] = useState(false)
 const [newMember, setNewMember] = useState({ name:'', phone:'', email:'', address:'' })
 const [savingMember, setSavingMember] = useState(false)

 // Variant picker
 const [variantProduct, setVariantProduct] = useState(null)

 // Modals
 const [qrisModal, setQrisModal] = useState(false)
 const [transferModal,setTransferModal]= useState(false)
 const [successModal, setSuccessModal] = useState(false)
 const [lastTrx, setLastTrx] = useState(null)
 const [processing, setProcessing] = useState(false)
 const [qrisChecking, setQrisChecking] = useState(false)
 const [receiptMode, setReceiptMode] = useState(settings?.defaultReceiptMode || 'thermal')

 const receiptRef = useRef()
 const invoiceRef = useRef()

 // Hitung poin member
 const memberPoints = selectedMember?.points || 0
 const redeemRate = settings?.pointsRedeemRate || 1
 const maxRedeemDiscount= memberPoints * redeemRate
 const pointsDiscount = redeemPoints && selectedMember ? Math.min(maxRedeemDiscount, total) : 0
 const grandTotal = Math.max(0, total - discount - pointsDiscount)
 const pointsEarned = settings?.loyaltyEnabled ? Math.floor(grandTotal / (settings?.pointsPerRupiah || 1000)) : 0

 const cashNum = parseFloat((cashReceived||'0').replace(/\D/g,'')) || 0
 const changeAmount = Math.max(0, cashNum - grandTotal)
 const notEnoughCash = paymentMethod === PAYMENT_METHODS.CASH && cashNum > 0 && cashNum < grandTotal
 const quickCash = [...new Set([grandTotal, Math.ceil(grandTotal/10000)*10000, Math.ceil(grandTotal/50000)*50000, Math.ceil(grandTotal/100000)*100000])].slice(0,4)

 const filteredProducts = products.filter(p =>
 p.active &&
 (category === 'Semua' || p.category === category) &&
 p.name.toLowerCase().includes(search.toLowerCase())
 )

 // Hanya tampilkan kategori yang benar-benar ada di produk aktif
 const activeCategories = useMemo(() => {
 const cats = [...new Set(products.filter(p => p.active).map(p => p.category).filter(Boolean))]
 return cats.sort()
 }, [products])
 const filteredMembers = members.filter(m => {
 const q = memberSearch.toLowerCase()
 return !q || m.name.toLowerCase().includes(q) || (m.phone||'').includes(q) || (m.email||'').toLowerCase().includes(q)
 })

 // Click on product: if has variants → open picker, else add directly
 const handleProductClick = (p) => {
 if (p.hasVariants && (p.variants||[]).length > 0) {
 setVariantProduct(p)
 } else {
 cartAddWithPrice(p)
 }
 }

 const catColors = CATEGORY_COLORS

 const goToPayment = () => { if (isEmpty) return; setCashReceived(''); setStep('payment') }
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
 date : new Date().toISOString(),
 items : cart.map(i => ({ productId:i.productId, variantId:i.variantId||null, name:i.name, qty:i.qty, price:i.price, hpp:i.hpp||0, unit:i.unit })),
 subtotal, tax:taxAmount, discount:discount+pointsDiscount, total:grandTotal,
 payment : onlineChannel ? 'Online' : paymentMethod,
 onlineChannel: onlineChannel || null,
 cashReceived : paymentMethod===PAYMENT_METHODS.CASH && !onlineChannel ? cashNum : null,
 changeAmount : paymentMethod===PAYMENT_METHODS.CASH && !onlineChannel ? changeAmount : null,
 cashier : user?.name || 'Kasir',
 cashierId : user?.id,
 memberId : selectedMember?.id || null,
 memberName : selectedMember?.name || null,
 memberPhone : selectedMember?.phone || null,
 memberEmail : selectedMember?.email || null,
 pointsRedeemed: redeemPoints ? Math.round(pointsDiscount / redeemRate) : 0,
 pointsEarned,
 note, status:'completed',
 shiftId: activeShift?.id || null,
 })
 setLastTrx(trx)
 cartClear()
 setNote(''); setDiscount(0); setDiscountInput(''); setRedeemPoints(false)
 setOnlineChannel(null); setPaymentMethod(PAYMENT_METHODS.CASH)
 setSelectedMember(null)
 setQrisModal(false); setTransferModal(false); setStep('order')
 setSuccessModal(true)
 if (settings.printAutomatically) {
 setTimeout(() => {
 const el = receiptMode==='invoice' ? invoiceRef.current : receiptRef.current
 printElement(el, receiptMode==='invoice' ? 'A5 landscape' : '80mm auto')
 }, 700)
 }
 } catch (err) { console.error('[Register] finalize error:', err) }
 finally { setProcessing(false) }
 }

 const handlePrint = () => printElement(receiptMode==='invoice'?invoiceRef.current:receiptRef.current, receiptMode==='invoice'?'A5 landscape':'80mm auto')
 const handleSavePDF = () => savePDF(receiptMode==='invoice'?invoiceRef.current:receiptRef.current, receiptMode==='invoice'?'A5 landscape':'80mm auto')
 const handleSendWA = () => {
 if (!lastTrx) return
 const msg = buildWAMessage(lastTrx, settings)
 const phone = selectedMember?.phone || lastTrx?.memberPhone || ''
 const num = phone.replace(/\D/g,'').replace(/^0/,'62')
 window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
 }

 const checkQrisStatus = async () => { setQrisChecking(true); await new Promise(r=>setTimeout(r,1500)); setQrisChecking(false); await finalize() }
 const handleAddNewMember = async () => {
 if (!newMember.name.trim()) return
 setSavingMember(true)
 try { addMember(newMember); setShowNewMember(false); setNewMember({name:'',phone:'',email:'',address:''}) }
 finally { setSavingMember(false) }
 }

 // Hold Order handlers 
 const holdCurrentOrder = () => {
 if (isEmpty) return
 const held = {
 id: `HOLD-${Date.now()}`,
 cart: [...cart],
 note: holdNote || `Pesanan ${heldOrders.length + 1}`,
 member: selectedMember,
 discount, discountInput,
 itemNotes: { ...itemNotes },
 savedAt: new Date().toISOString(),
 }
 setHeldOrders(prev => [held, ...prev])
 cartClear()
 setNote(''); setDiscount(0); setDiscountInput(''); setSelectedMember(null)
 setItemNotes({}); setRedeemPoints(false)
 setHoldNote('')
 setShowHoldModal(false)
 }

 const restoreHeldOrder = (held) => {
 cartClear()
 held.cart.forEach(item => {
 for (let i = 0; i < item.qty; i++) {
 cartAdd({ id: item.productId, name: item.name, price: item.price, hpp: item.hpp, unit: item.unit, category: item.category, hasVariants: false },
 item.variantId ? { id: item.variantId, name: '', price: item.price, hpp: item.hpp } : null)
 }
 })
 setSelectedMember(held.member || null)
 setDiscount(held.discount || 0)
 setDiscountInput(held.discountInput || '')
 setItemNotes(held.itemNotes || {})
 setHeldOrders(prev => prev.filter(h => h.id !== held.id))
 }

 const deleteHeldOrder = (id) => setHeldOrders(prev => prev.filter(h => h.id !== id))

 // Per-item note 
 const openItemNote = (cartKey, currentNote) => {
 setEditNoteKey(cartKey)
 setEditNoteVal(currentNote || '')
 }
 const saveItemNote = () => {
 if (editNoteKey) setItemNotes(prev => ({ ...prev, [editNoteKey]: editNoteVal }))
 setEditNoteKey(null)
 }

 // Barcode scan di POS 
 const handlePosBarcodeSearch = (code) => {
 const q = code.trim()
 if (!q) return
 const found = products.find(p => p.active && (p.sku === q || p.barcode === q || p.name.toLowerCase() === q.toLowerCase()))
 if (found) {
 handleProductClick(found)
 } else {
 setSearch(q)
 }
 }

 // Harga Grosir: get effective price 
 const getEffectivePrice = (product, variant = null) => {
 if (priceType === 'grosir') {
 if (variant) return variant.hargaGrosir || variant.price
 return product.hargaGrosir || product.price
 }
 return variant ? variant.price : product.price
 }

 const cartAddWithPrice = (p, variant = null) => {
 const price = getEffectivePrice(p, variant)
 const payload = variant
 ? { productId: p.id, variantId: variant.id, name: `${p.name} - ${variant.name}`, price, hpp: variant.hpp || 0, unit: p.unit, category: p.category }
 : { productId: p.id, variantId: null, name: p.name, price, hpp: p.hpp || 0, unit: p.unit, category: p.category }
 const cartKey = variant ? `${p.id}_${variant.id}` : p.id
 const existing = cart.find(i => (i.variantId ? `${i.productId}_${i.variantId}` : i.productId) === cartKey)
 if (existing) cartUpdateQty(p.id, existing.qty + 1, variant?.id || null)
 else cartAdd(p, variant)
 }

 const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }

 return (
 <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>

 {/* LEFT: Product Grid */}
 <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid #F1F5F9', minWidth:0 }}>
 <div style={{ padding:'14px 16px 10px', background:'#fff', borderBottom:'1px solid #F1F5F9', flexShrink:0 }}>
 {/* Barcode scan bar */}
 {posScanMode && (
 <div style={{ marginBottom:8, background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:10, padding:'7px 10px', display:'flex', gap:8, alignItems:'center' }}>
 <span style={{ fontSize:12, color:'#1E40AF', fontWeight:700, flexShrink:0 }}> Scan:</span>
 <input ref={posBarcodeRef} type="text" placeholder="Scan atau ketik SKU/barcode..."
 onKeyDown={e=>{ if(e.key==='Enter'){handlePosBarcodeSearch(e.target.value);e.target.value=''}}}
 style={{ flex:1, padding:'6px 10px', border:'1px solid #93C5FD', borderRadius:7, fontSize:12, fontFamily:'inherit', outline:'none' }}
 autoFocus />
 <button onClick={()=>setPosScanMode(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:16, lineHeight:1, padding:0 }}>×</button>
 </div>
 )}
 {/* Price type + scan button toolbar */}
 <div style={{ display:'flex', gap:6, marginBottom:8, alignItems:'center' }}>
 {/* Grosir/Eceran toggle */}
 <div style={{ display:'flex', background:'#F3F4F6', borderRadius:8, padding:2, gap:2 }}>
 {[['retail','Eceran'],['grosir','Grosir']].map(([k,l])=>(
 <button key={k} onClick={()=>setPriceType(k)}
 style={{ padding:'4px 10px', borderRadius:6, border:'none', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
 background:priceType===k?'#fff':'transparent', color:priceType===k?'#2563EB':'#6B7280',
 boxShadow:priceType===k?'0 1px 3px rgba(0,0,0,0.1)':'none' }}>
 {l}
 </button>
 ))}
 </div>
 {/* Hold orders badge */}
 {heldOrders.length > 0 && (
 <button onClick={()=>setShowHoldModal(true)}
 style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:8, border:'1.5px solid #FCD34D', background:'#FFFBEB', cursor:'pointer', fontFamily:'inherit' }}>
 <span style={{ fontSize:11, fontWeight:800, color:'#D97706' }}>⏸ {heldOrders.length} Ditahan</span>
 </button>
 )}
 <div style={{ flex:1 }} />
 <button onClick={()=>{ setPosScanMode(true); setTimeout(()=>posBarcodeRef.current?.focus(),80) }}
 style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit', color:'#374151' }}>
 Scan
 </button>
 </div>
 <div style={{ position:'relative', marginBottom:10 }}>
 <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}><Icon name="search" size={16} color="#9CA3AF" /></span>
 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari produk..."
 style={{ ...inp, padding:'10px 12px 10px 38px' }}
 onFocus={e=>e.target.style.borderColor='#2563EB'} onBlur={e=>e.target.style.borderColor='#E5E7EB'} />
 </div>
 <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
 <button onClick={()=>setCategory('Semua')} style={{ padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', whiteSpace:'nowrap', fontSize:12, fontWeight:700, fontFamily:'inherit', background:category==='Semua'?'#2563EB':'#F3F4F6', color:category==='Semua'?'#fff':'#6B7280', transition:'all 0.15s', flexShrink:0 }}>Semua</button>
 {activeCategories.map(c => {
 const cc = CATEGORY_COLORS[c] || {}
 return (
 <button key={c} onClick={()=>setCategory(c)} style={{ padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', whiteSpace:'nowrap', fontSize:12, fontWeight:700, fontFamily:'inherit', background:category===c?(cc.accent||'#2563EB'):'#F3F4F6', color:category===c?'#fff':'#6B7280', transition:'all 0.15s', flexShrink:0 }}>{c}</button>
 )
 })}
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
 const inCart = cart.filter(i=>i.productId===p.id).reduce((s,i)=>s+i.qty,0)
 const catEmoji = p.category==='Makanan'?'':p.category==='Minuman'?'':p.category==='Fashion'?'':p.category==='Kecantikan'?'':p.category==='Elektronik'?'':p.category==='Kesehatan'?'':''
 return (
 <div key={p.id} onClick={()=>handleProductClick(p)}
 style={{ background:'#fff', borderRadius:14, padding:'14px 12px', border:inCart>0?'2px solid #2563EB':'1.5px solid #F1F5F9', cursor:'pointer', transition:'all 0.15s', position:'relative', boxShadow:inCart>0?'0 0 0 3px rgba(37,99,235,0.1)':'0 1px 4px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column' }}
 onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
 onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
 {inCart>0&&<div style={{ position:'absolute', top:8, right:8, background:'#2563EB', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:11, fontWeight:900, color:'#fff' }}>{inCart}</span></div>}
 {p.hasVariants&&<div style={{ position:'absolute', top:8, left:8, background:'#7C3AED', borderRadius:4, padding:'1px 5px' }}><span style={{ fontSize:8, fontWeight:700, color:'#fff' }}>VARIAN</span></div>}
 <div style={{ width:38, height:38, background:cc.bg, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:9, flexShrink:0, fontSize:20 }}>{catEmoji}</div>
 <p style={{ margin:'0 0 4px', fontSize:12, fontWeight:800, color:'#111827', lineHeight:1.3, flex:1 }}>{p.name}</p>
 <div style={{ marginBottom:6 }}>
 {p.category&&<span style={{ fontSize:10, color:cc.text, fontWeight:700, background:cc.bg, padding:'2px 7px', borderRadius:6, display:'inline-block' }}>{p.category}</span>}
 </div>
 <div style={{ marginTop:'auto' }}>
 {p.hasVariants ? (
 <p style={{ margin:0, fontSize:12, fontWeight:900, color:'#2563EB' }}>
 {formatIDR(Math.min(...(p.variants||[{price:0}]).map(v=>v.price)))}+
 </p>
 ) : (
 <p style={{ margin:0, fontSize:14, fontWeight:900, color:'#2563EB' }}>{formatIDR(p.price)}</p>
 )}
 {p.unit&&<p style={{ margin:'1px 0 0', fontSize:10, color:'#9CA3AF' }}>/ {p.unit}</p>}
 {!p.hasVariants&&p.stock!=null&&<p style={{ margin:'2px 0 0', fontSize:10, color:p.stock<=5?'#EF4444':'#9CA3AF' }}>Stok: {p.stock}</p>}
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>
 </div>

 {/* DRAG DIVIDER */}
 <div onMouseDown={onDividerDown}
 style={{ width:6, flexShrink:0, cursor:'col-resize', background:'#F1F5F9', borderLeft:'1px solid #E5E7EB', borderRight:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', userSelect:'none' }}
 onMouseEnter={e=>e.currentTarget.style.background='#BFDBFE'}
 onMouseLeave={e=>e.currentTarget.style.background='#F1F5F9'}>
 <div style={{ width:2, height:32, background:'#CBD5E1', borderRadius:4 }} />
 </div>

 {/* RIGHT: 2-step panel */}
 <div style={{ width:cartWidth, flexShrink:0, display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }}>

 {/* Step tabs */}
 <div style={{ display:'flex', flexShrink:0, borderBottom:'1px solid #F1F5F9' }}>
 {[{key:'order',label:'1 Pesanan'},{key:'payment',label:'2 Pembayaran'}].map(s=>(
 <div key={s.key} onClick={()=>{ if(s.key==='payment'&&!isEmpty)setStep('payment'); if(s.key==='order')setStep('order') }}
 style={{ flex:1, padding:'12px 8px', textAlign:'center', fontSize:12, fontWeight:700, cursor:s.key==='payment'&&isEmpty?'not-allowed':'pointer', color:step===s.key?'#2563EB':'#9CA3AF', borderBottom:step===s.key?'2.5px solid #2563EB':'2.5px solid transparent', background:step===s.key?'#EFF6FF':'#fff', transition:'all 0.2s' }}>
 {s.label}
 </div>
 ))}
 </div>

 {/* PESANAN */}
 {step==='order'&&(
 <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
 <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid #F9FAFB', flexShrink:0 }}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
 <div style={{ display:'flex', alignItems:'center', gap:6 }}>
 <Icon name="register" size={15} color="#2563EB" />
 <span style={{ fontSize:13, fontWeight:800, color:'#111827' }}>Keranjang</span>
 {!isEmpty&&<Badge color="blue">{totalItems} item</Badge>}
 </div>
 {!isEmpty&&<button onClick={cartClear} style={{ background:'#FEF2F2', border:'none', borderRadius:8, padding:'4px 10px', color:'#EF4444', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Kosongkan</button>}
 </div>
 {/* Member selector */}
 <div onClick={()=>setShowMemberModal(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:selectedMember?'#EFF6FF':'#F9FAFB', border:`1.5px solid ${selectedMember?'#BFDBFE':'#E5E7EB'}`, borderRadius:10, cursor:'pointer' }}>
 <div style={{ width:26, height:26, borderRadius:'50%', background:selectedMember?'#2563EB':'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="user" size={13} color={selectedMember?'#fff':'#9CA3AF'} /></div>
 <div style={{ flex:1, minWidth:0 }}>
 {selectedMember?(
 <>
 <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#1D4ED8' }}>{selectedMember.name}</p>
 {settings?.loyaltyEnabled&&<p style={{ margin:0, fontSize:10, color:'#6B7280' }}> {selectedMember.points||0} poin</p>}
 </>
 ):(
 <p style={{ margin:0, fontSize:12, color:'#9CA3AF' }}>+ Pilih / Tambah Member</p>
 )}
 </div>
 {selectedMember&&<button onClick={e=>{e.stopPropagation();setSelectedMember(null);setRedeemPoints(false)}} style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'#9CA3AF', flexShrink:0 }}></button>}
 </div>
 </div>

 {/* Cart items */}
 <div style={{ flex:1, overflowY:'auto', padding:'8px 12px', minHeight:0 }}>
 {isEmpty?(
 <div style={{ textAlign:'center', padding:'40px 20px', color:'#D1D5DB' }}>
 <Icon name="register" size={40} color="#E5E7EB" />
 <p style={{ margin:'10px 0 0', fontSize:13, color:'#9CA3AF' }}>Keranjang kosong</p>
 <p style={{ margin:'4px 0 0', fontSize:11, color:'#D1D5DB' }}>Tap produk untuk menambahkan</p>
 </div>
 ):(
 cart.map(item=>{
 const cartKey = item.variantId ? `${item.productId}_${item.variantId}` : item.productId
 const iNote = itemNotes[cartKey] || ''
 return (
 <div key={cartKey} style={{ padding:'8px 0', borderBottom:'1px solid #F9FAFB' }}>
 <div style={{ display:'flex', alignItems:'center', gap:8 }}>
 <div style={{ flex:1, minWidth:0 }}>
 <p style={{ margin:'0 0 1px', fontSize:12, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
 <p style={{ margin:0, fontSize:11, color:'#6B7280' }}>{formatIDR(item.price)} / {item.unit||'pcs'}</p>
 </div>
 <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
 <button onClick={()=>cartUpdateQty(item.productId,item.qty-1,item.variantId)} style={{ width:24, height:24, borderRadius:8, border:'1.5px solid #E5E7EB', background:'#F9FAFB', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="minus" size={12} color="#374151" /></button>
 <span style={{ width:20, textAlign:'center', fontSize:13, fontWeight:800, color:'#111827' }}>{item.qty}</span>
 <button onClick={()=>cartAdd({id:item.productId,name:item.name,price:item.price,hpp:item.hpp,unit:item.unit,category:item.category,hasVariants:false}, item.variantId?{id:item.variantId,name:'',price:item.price,hpp:item.hpp}:null)} style={{ width:24, height:24, borderRadius:8, border:'none', background:'#2563EB', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="plus" size={12} color="#fff" /></button>
 </div>
 <span style={{ fontSize:12, fontWeight:800, color:'#111827', minWidth:56, textAlign:'right' }}>{formatIDR(item.price*item.qty)}</span>
 <button onClick={()=>openItemNote(cartKey, iNote)} title="Catatan item"
 style={{ background:iNote?'#FFFBEB':'none', border:iNote?'1px solid #FCD34D':'none', borderRadius:6, cursor:'pointer', padding:'2px 5px', flexShrink:0, fontSize:12 }}></button>
 <button onClick={()=>cartRemove(item.productId,item.variantId)} style={{ background:'none', border:'none', cursor:'pointer', padding:2, flexShrink:0 }}><Icon name="x" size={13} color="#D1D5DB" /></button>
 </div>
 {iNote && <p style={{ margin:'3px 0 0', fontSize:10, color:'#D97706', fontStyle:'italic', paddingLeft:2 }}> {iNote}</p>}
 </div>
 )
 })
 )}
 </div>

 {/* Footer order */}
 {!isEmpty&&(
 <div style={{ padding:'12px 14px', borderTop:'1px solid #F1F5F9', flexShrink:0 }}>
 {/* Diskon manual */}
 <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
 <span style={{ fontSize:12, color:'#6B7280', flexShrink:0 }}>Diskon (Rp)</span>
 <input value={discountInput} onChange={e=>{const v=e.target.value.replace(/\D/g,'');setDiscountInput(v);setDiscount(parseFloat(v)||0)}} placeholder="0"
 style={{ flex:1, padding:'6px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:12, fontFamily:'inherit', outline:'none', textAlign:'right' }} />
 </div>

 {/* Tukar poin */}
 {settings?.loyaltyEnabled && selectedMember && memberPoints > 0 && (
 <div onClick={()=>setRedeemPoints(r=>!r)} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'7px 10px', background:redeemPoints?'#FFFBEB':'#F9FAFB', border:`1.5px solid ${redeemPoints?'#FCD34D':'#E5E7EB'}`, borderRadius:8, cursor:'pointer' }}>
 <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${redeemPoints?'#D97706':'#D1D5DB'}`, background:redeemPoints?'#D97706':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 {redeemPoints&&<span style={{ color:'#fff', fontSize:10, fontWeight:900 }}></span>}
 </div>
 <div style={{ flex:1 }}>
 <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#92400E' }}> Tukar {memberPoints} Poin = {formatIDR(maxRedeemDiscount)} diskon</p>
 </div>
 </div>
 )}

 <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Catatan (opsional)..." rows={1}
 style={{ ...inp, padding:'7px 10px', resize:'none', marginBottom:8 }} />

 {/* Totals */}
 <div style={{ marginBottom:10 }}>
 <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:2 }}><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
 {settings.taxEnabled&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:2 }}><span>Pajak ({taxRate}%)</span><span>{formatIDR(taxAmount)}</span></div>}
 {discount>0&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#22C55E', marginBottom:2 }}><span>Diskon</span><span>-{formatIDR(discount)}</span></div>}
 {pointsDiscount>0&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#D97706', marginBottom:2 }}><span> Poin ({Math.round(pointsDiscount/redeemRate)} poin)</span><span>-{formatIDR(pointsDiscount)}</span></div>}
 <div style={{ display:'flex', justifyContent:'space-between', fontSize:17, fontWeight:900, marginTop:6, paddingTop:6, borderTop:'1.5px solid #F1F5F9' }}><span>Total</span><span style={{ color:'#2563EB' }}>{formatIDR(grandTotal)}</span></div>
 {settings?.loyaltyEnabled&&pointsEarned>0&&<p style={{ margin:'4px 0 0', fontSize:10, color:'#D97706', textAlign:'right' }}> +{pointsEarned} poin dari transaksi ini</p>}
 </div>

 {/* Online channels */}
 <div style={{ marginBottom:10 }}>
 <p style={{ margin:'0 0 6px', fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.6 }}>Pesan Online</p>
 <div style={{ display:'flex', gap:5 }}>
 {ONLINE_CH.map(ch=>{ const isActive=onlineChannel===ch.key; return(
 <button key={ch.key} onClick={()=>setOnlineChannel(isActive?null:ch.key)} style={{ flex:1, padding:'7px 4px', borderRadius:9, border:isActive?'2px solid #2563EB':'1.5px solid #E5E7EB', background:isActive?'#EFF6FF':'#fff', color:isActive?'#2563EB':'#6B7280', fontSize:9, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:2, transition:'all 0.15s' }}>
 <span style={{ fontSize:13 }}>{ch.icon}</span><span style={{ fontSize:8, lineHeight:1.2 }}>{ch.label}</span>
 </button>
 )})}
 </div>
 </div>

 <button onClick={goToPayment} style={{ width:'100%', padding:'13px', background:'#2563EB', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(37,99,235,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
 Lanjut ke Pembayaran →
 </button>
 {/* Hold Order button */}
 <button onClick={()=>setShowHoldModal(true)}
 style={{ width:'100%', marginTop:6, padding:'9px', background:'#FFFBEB', color:'#D97706', border:'1.5px solid #FCD34D', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
 ⏸ Tahan Pesanan
 </button>
 </div>
 )}
 </div>
 )}

 {/* PEMBAYARAN */}
 {step==='payment'&&(
 <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
 <div style={{ padding:'12px 14px', borderBottom:'1px solid #F9FAFB', flexShrink:0, display:'flex', alignItems:'center', gap:10 }}>
 <button onClick={goBackToOrder} style={{ background:'#F3F4F6', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="chevronLeft" size={15} color="#374151" /></button>
 <div style={{ flex:1 }}>
 <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#111827' }}>Konfirmasi Pembayaran</p>
 <p style={{ margin:0, fontSize:11, color:'#6B7280' }}>{cart.length} produk{selectedMember?` · ${selectedMember.name}`:''}</p>
 </div>
 </div>

 <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', minHeight:0 }}>
 {/* Summary */}
 <div style={{ background:'#F9FAFB', borderRadius:12, padding:'10px 12px', marginBottom:14 }}>
 {cart.map(i=>(<div key={i.variantId?`${i.productId}_${i.variantId}`:i.productId} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}><span style={{ color:'#374151', flex:1, marginRight:8 }}>{i.qty}× {i.name}</span><span style={{ fontWeight:700, flexShrink:0 }}>{formatIDR(i.price*i.qty)}</span></div>))}
 <div style={{ borderTop:'1px dashed #E5E7EB', paddingTop:8, marginTop:6 }}>
 {settings.taxEnabled&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:3 }}><span>Pajak ({taxRate}%)</span><span>{formatIDR(taxAmount)}</span></div>}
 {discount>0&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#22C55E', marginBottom:3 }}><span>Diskon</span><span>-{formatIDR(discount)}</span></div>}
 {pointsDiscount>0&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#D97706', marginBottom:3 }}><span> Poin</span><span>-{formatIDR(pointsDiscount)}</span></div>}
 {onlineChannel&&<div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:3 }}><span>Via</span><span style={{ fontWeight:700 }}>{onlineChannel}</span></div>}
 <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:900 }}><span>Total</span><span style={{ color:'#2563EB' }}>{formatIDR(grandTotal)}</span></div>
 </div>
 </div>

 {onlineChannel?(
 <div style={{ background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:12, padding:14, marginBottom:14, textAlign:'center' }}>
 <p style={{ margin:'0 0 4px', fontSize:24 }}>{ONLINE_CH.find(c=>c.key===onlineChannel)?.icon}</p>
 <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:800, color:'#1D4ED8' }}>Order via {onlineChannel}</p>
 <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>Pembayaran diterima di aplikasi {onlineChannel}</p>
 </div>
 ):(
 <>
 {/* Metode bayar */}
 <div style={{ marginBottom:14 }}>
 <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.6 }}>Metode Pembayaran</p>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
 {Object.values(PAYMENT_METHODS).map(method=>(
 <button key={method} onClick={()=>setPaymentMethod(method)} style={{ padding:'10px 8px', borderRadius:10, border:paymentMethod===method?'2px solid #2563EB':'1.5px solid #E5E7EB', background:paymentMethod===method?'#EFF6FF':'#fff', color:paymentMethod===method?'#2563EB':'#6B7280', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.15s' }}>
 <Icon name={method==='Cash'?'cash':method==='Card'?'card':method==='QRIS'?'qris':'transfer'} size={16} color={paymentMethod===method?'#2563EB':'#9CA3AF'} />
 {method}
 </button>
 ))}
 </div>
 </div>

 {paymentMethod===PAYMENT_METHODS.CASH&&(
 <div style={{ marginBottom:14 }}>
 <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:7 }}>Uang Diterima (Rp)</label>
 <input type="number" value={cashReceived} onChange={e=>setCashReceived(e.target.value)} placeholder={`Min. ${grandTotal.toLocaleString('id-ID')}`}
 style={{ ...inp, fontSize:16, fontWeight:800, textAlign:'right', border:`2px solid ${notEnoughCash?'#EF4444':'#E5E7EB'}` }} />
 <div style={{ display:'flex', gap:6, marginTop:7 }}>
 {quickCash.map(v=>(
 <button key={v} onClick={()=>setCashReceived(String(v))} style={{ flex:1, padding:'6px 4px', borderRadius:8, border:'1.5px solid #E5E7EB', background:cashNum===v?'#EFF6FF':'#F9FAFB', color:cashNum===v?'#2563EB':'#374151', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
 {v>=1000000?`${v/1000000}jt`:v>=1000?`${v/1000}rb`:v}
 </button>
 ))}
 </div>
 {cashNum>=grandTotal&&<div style={{ marginTop:10, padding:'10px 14px', background:'#F0FDF4', border:'1.5px solid #BBF7D0', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}><span style={{ fontSize:13, fontWeight:700, color:'#166534' }}> Kembalian</span><span style={{ fontSize:20, fontWeight:900, color:'#16A34A' }}>{formatIDR(changeAmount)}</span></div>}
 {notEnoughCash&&<p style={{ margin:'6px 0 0', fontSize:12, color:'#EF4444', fontWeight:700 }}>Uang kurang {formatIDR(grandTotal-cashNum)}</p>}
 </div>
 )}

 {paymentMethod===PAYMENT_METHODS.TRANSFER&&(
 <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
 <p style={{ margin:0, fontSize:12, color:'#1E40AF', fontWeight:600 }}>Detail rekening akan tampil saat konfirmasi pembayaran</p>
 </div>
 )}

 {paymentMethod===PAYMENT_METHODS.QRIS&&(
 <div style={{ marginBottom:14, textAlign:'center' }}>
 {settings?.qrisImageUrl?(
 <div style={{ background:'#F9FAFB', borderRadius:14, padding:12, display:'inline-block', border:'1px solid #E5E7EB' }}>
 <img src={settings.qrisImageUrl} alt="QRIS" style={{ width:180, height:180, objectFit:'contain', display:'block' }} />
 </div>
 ):(
 <div style={{ background:'#F3F4F6', borderRadius:14, padding:16, display:'inline-block' }}>
 <div style={{ width:130, height:130, background:'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#9CA3AF', borderRadius:8 }}>Upload QRIS di Pengaturan</div>
 </div>
 )}
 <p style={{ fontSize:12, color:'#6B7280', marginTop:8 }}>Scan QRIS · GoPay · OVO · Dana · m-Banking</p>
 </div>
 )}
 </>
 )}
 {note&&<div style={{ background:'#FFF7ED', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:12, color:'#92400E' }}> {note}</div>}
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

 {/* MODAL: Pilih Varian */}
 <Modal open={!!variantProduct} onClose={()=>setVariantProduct(null)} title={`Pilih Varian — ${variantProduct?.name||''}`} maxWidth={380}>
 {variantProduct&&(
 <div>
 <p style={{ margin:'0 0 14px', fontSize:13, color:'#6B7280' }}>Pilih varian yang ingin ditambahkan ke keranjang:</p>
 <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
 {(variantProduct.variants||[]).map(v=>{
 const inCartQty = cart.find(i=>i.productId===variantProduct.id&&i.variantId===v.id)?.qty||0
 const isLow = v.stock <= 5
 return (
 <button key={v.id} onClick={()=>{ cartAdd(variantProduct,v); setVariantProduct(null) }}
 disabled={v.stock<=0}
 style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', border:`1.5px solid ${inCartQty>0?'#2563EB':'#E5E7EB'}`, borderRadius:12, background:inCartQty>0?'#EFF6FF':v.stock<=0?'#F9FAFB':'#fff', cursor:v.stock<=0?'not-allowed':'pointer', fontFamily:'inherit', transition:'all 0.15s', opacity:v.stock<=0?0.5:1 }}>
 <div style={{ textAlign:'left' }}>
 <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#111827' }}>{v.name} {inCartQty>0&&`(${inCartQty} di keranjang)`}</p>
 <p style={{ margin:'2px 0 0', fontSize:11, color:isLow?'#EF4444':'#9CA3AF' }}>Stok: {v.stock}{isLow?' (menipis!)':''}</p>
 </div>
 <div style={{ textAlign:'right' }}>
 <p style={{ margin:0, fontSize:16, fontWeight:900, color:'#2563EB' }}>{formatIDR(v.price)}</p>
 <p style={{ margin:'2px 0 0', fontSize:10, color:'#9CA3AF' }}>/ {variantProduct.unit}</p>
 </div>
 </button>
 )
 })}
 </div>
 </div>
 )}
 </Modal>

 {/* MODAL: Member */}
 <Modal open={showMemberModal} onClose={()=>{setShowMemberModal(false);setShowNewMember(false);setMemberSearch('')}} title="Pilih Member">
 {!showNewMember?(
 <div>
 <div style={{ position:'relative', marginBottom:14 }}>
 <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}><Icon name="search" size={14} color="#9CA3AF" /></span>
 <input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="Cari nama, telepon, email..." style={{ ...inp, padding:'9px 12px 9px 32px' }} />
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
 {settings?.loyaltyEnabled&&<p style={{ margin:'0 0 1px', fontSize:11, color:'#D97706', fontWeight:700 }}> {m.points||0} poin</p>}
 <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#2563EB' }}>{formatIDR(m.totalSpent||0)}</p>
 </div>
 </div>
 ))
 )}
 </div>
 ):(
 <div>
 <button onClick={()=>setShowNewMember(false)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'#2563EB', fontSize:13, fontWeight:700, fontFamily:'inherit', marginBottom:16, padding:0 }}><Icon name="chevronLeft" size={14} color="#2563EB" /> Kembali</button>
 <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:800, color:'#111827' }}>Daftar Member Baru</h3>
 {[{label:'Nama Lengkap *',key:'name',type:'text'},{label:'No. Telepon',key:'phone',type:'tel'},{label:'Email',key:'email',type:'email'},{label:'Alamat',key:'address',type:'text'}].map(f=>(
 <div key={f.key} style={{ marginBottom:12 }}>
 <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>{f.label}</label>
 <input type={f.type} value={newMember[f.key]} onChange={e=>setNewMember(p=>({...p,[f.key]:e.target.value}))} style={inp} />
 </div>
 ))}
 <div style={{ display:'flex', gap:10, marginTop:4 }}>
 <Button onClick={()=>setShowNewMember(false)} variant="secondary" fullWidth>Batal</Button>
 <Button onClick={handleAddNewMember} variant="primary" fullWidth icon="check" loading={savingMember} disabled={!newMember.name.trim()}>Simpan Member</Button>
 </div>
 </div>
 )}
 </Modal>

 {/* MODAL: QRIS */}
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
 <div style={{ width:160, height:160, background:'#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, fontSize:12, color:'#9CA3AF' }}>Upload QRIS di Pengaturan</div>
 </div>
 )}
 <p style={{ fontSize:13, color:'#6B7280', marginBottom:16 }}>Scan QRIS dengan GoPay, OVO, Dana, atau m-Banking</p>
 <Button onClick={checkQrisStatus} variant="primary" fullWidth icon="refresh" loading={qrisChecking}>Cek Status Pembayaran</Button>
 <button onClick={()=>setQrisModal(false)} style={{ width:'100%', marginTop:10, padding:12, background:'none', border:'none', color:'#9CA3AF', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Batalkan Transaksi</button>
 </div>
 </Modal>

 {/* MODAL: Transfer */}
 <Modal open={transferModal} onClose={()=>!processing&&setTransferModal(false)} title="Konfirmasi Transfer Bank">
 <div style={{ textAlign:'center' }}>
 <h3 style={{ margin:'0 0 4px', fontSize:18, fontWeight:800, color:'#111827' }}>{settings.businessName||'MSME Grow'}</h3>
 <p style={{ fontSize:30, fontWeight:900, color:'#2563EB', margin:'0 0 20px' }}>{formatIDR(grandTotal)}</p>
 {(settings?.bankAccounts||[]).filter(b=>b.bankName).length>0?(
 <div style={{ marginBottom:18, display:'flex', flexDirection:'column', gap:10 }}>
 {(settings.bankAccounts||[]).filter(b=>b.bankName).map((bank,idx)=>(
 <div key={idx} style={{ background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:14, padding:'14px 16px', textAlign:'left' }}>
 <p style={{ margin:'0 0 6px', fontSize:14, fontWeight:800, color:'#111827' }}>{bank.bankName}</p>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
 <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, padding:'8px 10px' }}>
 <p style={{ margin:'0 0 2px', fontSize:10, color:'#9CA3AF', fontWeight:700 }}>NO. REKENING</p>
 <p style={{ margin:0, fontSize:15, fontWeight:900, color:'#111827', fontFamily:'monospace', letterSpacing:1 }}>{bank.noRek}</p>
 </div>
 <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, padding:'8px 10px' }}>
 <p style={{ margin:'0 0 2px', fontSize:10, color:'#9CA3AF', fontWeight:700 }}>ATAS NAMA</p>
 <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#111827' }}>{bank.atasNama}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 ):(
 <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:12, padding:'14px 16px', marginBottom:18, textAlign:'left' }}>
 <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:700, color:'#D97706' }}> Info Bank Belum Diatur</p>
 <p style={{ margin:0, fontSize:12, color:'#92400E' }}>Isi rekening di Pengaturan → Pajak & Kasir</p>
 </div>
 )}
 <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'10px 14px', marginBottom:18, textAlign:'left' }}>
 <p style={{ margin:0, fontSize:13, color:'#1E40AF' }}> Pastikan pelanggan sudah transfer <strong>{formatIDR(grandTotal)}</strong> sebelum konfirmasi</p>
 </div>
 <Button onClick={()=>finalize()} variant="primary" fullWidth loading={processing} icon="check"> Konfirmasi Transfer Diterima</Button>
 <button onClick={()=>setTransferModal(false)} style={{ width:'100%', marginTop:10, padding:12, background:'none', border:'none', color:'#9CA3AF', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Batalkan Transaksi</button>
 </div>
 </Modal>

 {/* MODAL: Sukses */}
 <Modal open={successModal} onClose={()=>setSuccessModal(false)} title="Pembayaran Berhasil">
 {lastTrx&&(
 <div>
 <div style={{ textAlign:'center', marginBottom:16 }}>
 <div style={{ width:64, height:64, background:'#DCFCE7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}><Icon name="check" size={28} color="#16A34A" strokeWidth={3} /></div>
 <h3 style={{ margin:'0 0 4px', fontSize:20, fontWeight:900, color:'#111827' }}>Pembayaran Berhasil!</h3>
 <p style={{ margin:'0 0 2px', color:'#6B7280', fontSize:12 }}>ID: <strong>{lastTrx.id}</strong></p>
 <p style={{ fontSize:27, fontWeight:900, color:'#111827', margin:'0 0 3px' }}>{formatIDR(lastTrx.total)}</p>
 {lastTrx.memberName&&<p style={{ margin:0, fontSize:13, color:'#6B7280' }}> {lastTrx.memberName}</p>}
 {settings?.loyaltyEnabled&&lastTrx.pointsEarned>0&&<p style={{ margin:'4px 0 0', fontSize:12, color:'#D97706', fontWeight:700 }}> +{lastTrx.pointsEarned} poin diterima member</p>}
 </div>

 <div style={{ background:'#F9FAFB', borderRadius:12, padding:'10px 14px', marginBottom:12 }}>
 {lastTrx.items.map((item,idx)=>(<div key={idx} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}><span style={{ color:'#374151' }}>{item.qty}× {item.name}</span><span style={{ fontWeight:700 }}>{formatIDR(item.price*item.qty)}</span></div>))}
 <div style={{ borderTop:'1px dashed #E5E7EB', marginTop:7, paddingTop:7 }}>
 {lastTrx.cashReceived&&<><div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6B7280', marginBottom:3 }}><span>Uang Diterima</span><span>{formatIDR(lastTrx.cashReceived)}</span></div><div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:800, color:'#22C55E', marginBottom:5 }}><span>Kembalian</span><span>{formatIDR(lastTrx.changeAmount)}</span></div></>}
 <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:900 }}><span>Total</span><span style={{ color:'#2563EB' }}>{formatIDR(lastTrx.total)}</span></div>
 </div>
 </div>

 {/* Format struk */}
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F8FAFC', borderRadius:10, padding:'8px 12px', marginBottom:10 }}>
 <span style={{ fontSize:11, color:'#6B7280' }}>Format:</span>
 <div style={{ display:'flex', gap:4 }}>
 {[['thermal',' Struk'],['invoice',' Nota A5']].map(([m,l])=>(
 <button key={m} onClick={()=>setReceiptMode(m)} style={{ padding:'4px 10px', borderRadius:7, border:receiptMode===m?'1.5px solid #2563EB':'1.5px solid #E5E7EB', background:receiptMode===m?'#EFF6FF':'#fff', color:receiptMode===m?'#2563EB':'#6B7280', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{l}</button>
 ))}
 </div>
 </div>

 {/* Action buttons */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6 }}>
 <button onClick={handlePrint} style={{ padding:'11px 6px', background:'#2563EB', color:'#fff', border:'none', borderRadius:11, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
 <span>Cetak</span>
 </button>
 <button onClick={handleSavePDF} style={{ padding:'11px 6px', background:'#fff', color:'#374151', border:'1.5px solid #E5E7EB', borderRadius:11, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
 <span>PDF</span>
 </button>
 <button onClick={handleSendWA} style={{ padding:'11px 6px', background:'#ECFDF5', color:'#059669', border:'1.5px solid #A7F3D0', borderRadius:11, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
 <span>WA</span>
 </button>
 <button onClick={()=>{setSuccessModal(false)}} style={{ padding:'11px 6px', background:'#F8FAFC', color:'#374151', border:'1.5px solid #E5E7EB', borderRadius:11, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
 <span>Baru</span>
 </button>
 </div>
 </div>
 )}
 </Modal>

 {/* Hold Order Modal (Konfirmasi tahan) */}
 <Modal open={showHoldModal && !heldOrders.length || (showHoldModal && isEmpty)} onClose={()=>setShowHoldModal(false)} title="Tahan Pesanan">
 <p style={{ margin:'0 0 12px', fontSize:13, color:'#6B7280' }}>Pesanan akan disimpan dan bisa dilanjutkan nanti.</p>
 <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Nama / Label Pesanan</label>
 <input value={holdNote} onChange={e=>setHoldNote(e.target.value)} placeholder={`Pesanan ${heldOrders.length+1}`}
 style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:14 }} />
 <div style={{ display:'flex', gap:10 }}>
 <button onClick={()=>setShowHoldModal(false)} style={{ flex:1, padding:'11px', background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#374151' }}>Batal</button>
 <button onClick={holdCurrentOrder} style={{ flex:1, padding:'11px', background:'#D97706', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#fff' }}>⏸ Tahan</button>
 </div>
 </Modal>

 {/* Held Orders List Modal */}
 <Modal open={showHoldModal && heldOrders.length > 0 && !isEmpty} onClose={()=>setShowHoldModal(false)} title={`Pesanan Ditahan (${heldOrders.length})`}>
 <div style={{ marginBottom:12 }}>
 {heldOrders.map(h => (
 <div key={h.id} style={{ background:'#F9FAFB', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1.5px solid #F1F5F9' }}>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
 <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#111827' }}>{h.note}</p>
 <span style={{ fontSize:11, color:'#9CA3AF' }}>{new Date(h.savedAt).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span>
 </div>
 <p style={{ margin:'0 0 8px', fontSize:12, color:'#6B7280' }}>{h.cart.length} item{h.member?` · ${h.member.name}`:''}</p>
 <div style={{ display:'flex', gap:6 }}>
 <button onClick={()=>{restoreHeldOrder(h);setShowHoldModal(false)}}
 style={{ flex:1, padding:'7px', background:'#2563EB', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}> Lanjutkan</button>
 <button onClick={()=>deleteHeldOrder(h.id)}
 style={{ padding:'7px 12px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, color:'#EF4444', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Hapus</button>
 </div>
 </div>
 ))}
 </div>
 {!isEmpty && (
 <button onClick={()=>{ setHoldNote(''); holdCurrentOrder() }}
 style={{ width:'100%', padding:'11px', background:'#FFFBEB', border:'1.5px solid #FCD34D', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#D97706' }}>
 ⏸ Tahan Pesanan Saat Ini Juga
 </button>
 )}
 </Modal>

 {/* Item Note Modal */}
 <Modal open={editNoteKey !== null} onClose={()=>setEditNoteKey(null)} title="Catatan Item">
 <p style={{ margin:'0 0 10px', fontSize:13, color:'#6B7280' }}>Tambahkan catatan khusus untuk item ini (contoh: pedas, tidak pakai bawang)</p>
 <textarea value={editNoteVal} onChange={e=>setEditNoteVal(e.target.value)} rows={3} placeholder="Catatan item..."
 style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', resize:'none', boxSizing:'border-box', marginBottom:12 }} />
 <div style={{ display:'flex', gap:10 }}>
 <button onClick={()=>{ setItemNotes(prev=>{ const n={...prev}; delete n[editNoteKey]; return n }); setEditNoteKey(null) }}
 style={{ padding:'10px 16px', background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#6B7280' }}>Hapus Catatan</button>
 <button onClick={saveItemNote}
 style={{ flex:1, padding:'10px', background:'#2563EB', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#fff' }}>Simpan</button>
 </div>
 </Modal>

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
