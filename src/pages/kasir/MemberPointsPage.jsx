// ============================================================
// MSME GROW POS - Member Points History Page
// ============================================================
import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatIDR, formatDate } from '@/utils/format'
import Icon from '@/components/ui/Icon'

export default function MemberPointsPage() {
  const { members, transactions, settings } = useApp()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const membersWithStats = useMemo(() => {
    return members.map(m => {
      const trx = transactions.filter(t => t.memberId === m.id && (!t.status || t.status === 'completed'))
      const totalSpend    = trx.reduce((s,t) => s+(t.total||0), 0)
      const totalEarned   = trx.reduce((s,t) => s+(t.pointsEarned||0), 0)
      const totalRedeemed = trx.reduce((s,t) => s+(t.pointsRedeemed||0), 0)
      return { ...m, trx, totalSpend, totalEarned, totalRedeemed, currentPoints: m.points || 0 }
    })
  }, [members, transactions])

  const filtered = membersWithStats.filter(m => {
    const q = search.toLowerCase()
    return !q || m.name.toLowerCase().includes(q) || (m.phone||'').includes(q)
  })

  const selectedMember = selected ? membersWithStats.find(m => m.id === selected) : null

  return (
    <div style={{ padding:'14px' }}>
      <div style={{ marginBottom:18 }}>
        <h2 style={{ margin:'0 0 3px', fontSize:20, fontWeight:800, color:'#0F172A' }}>Riwayat Poin Member</h2>
        <p style={{ margin:0, color:'#64748B', fontSize:13 }}>Kelola dan pantau poin reward setiap member</p>
      </div>

      {/* Summary */}
      {settings?.loyaltyEnabled && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:10, marginBottom:16 }}>
          {[
            { label:'Total Member',    value: members.length,                                          color:'#1D4ED8', bg:'#DBEAFE', icon:'members' },
            { label:'Total Poin Aktif',value: members.reduce((s,m)=>s+(m.points||0),0).toLocaleString(), color:'#92400E', bg:'#FEF3C7', icon:'loyalty' },
            { label:'Nilai Poin',      value: formatIDR(members.reduce((s,m)=>s+(m.points||0),0) * (settings?.pointsRedeemRate||1)), color:'#166534', bg:'#DCFCE7', icon:'profit' },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'14px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ background:'#fff', borderRadius:8, padding:7, flexShrink:0 }}><Icon name={s.icon} size={16} color={s.color} /></div>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:10, color:s.color, fontWeight:700, textTransform:'uppercase' }}>{s.label}</p>
                <p style={{ margin:0, fontSize:18, fontWeight:900, color:s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!settings?.loyaltyEnabled && (
        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:12, padding:'14px', marginBottom:16, display:'flex', gap:10, alignItems:'center' }}>
          <Icon name="warning" size={16} color="#D97706" />
          <p style={{ margin:0, fontSize:13, color:'#92400E', fontWeight:600 }}>Fitur Loyalty belum diaktifkan. Aktifkan di Pengaturan &rarr; Poin Reward.</p>
        </div>
      )}

      {/* Search */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <Icon name="search" size={15} color="#94A3B8" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama atau nomor telepon..."
          style={{ width:'100%', padding:'10px 14px 10px 38px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor='#2563EB'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
      </div>

      {/* Member List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'36px 0', color:'#94A3B8' }}>
          <Icon name="members" size={32} color="#CBD5E1" />
          <p style={{ margin:'10px 0 0', fontSize:14 }}>Tidak ada member ditemukan</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(m => (
            <div key={m.id} onClick={() => setSelected(m.id === selected ? null : m.id)}
              style={{ background:'#fff', border:`1.5px solid ${m.id===selected?'#2563EB':'#F1F5F9'}`, borderRadius:14, padding:'14px 16px', cursor:'pointer', transition:'all 0.15s', boxShadow: m.id===selected ? '0 0 0 3px #DBEAFE' : '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: m.id===selected ? 14 : 0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:15, fontWeight:900, color:'#fff' }}>{m.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:800, color:'#0F172A' }}>{m.name}</p>
                    <p style={{ margin:0, fontSize:11, color:'#94A3B8' }}>{m.phone || 'Tanpa no. telepon'}</p>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ margin:'0 0 2px', fontSize:18, fontWeight:900, color:'#92400E' }}>{(m.currentPoints||0).toLocaleString()}</p>
                  <p style={{ margin:0, fontSize:10, color:'#94A3B8', fontWeight:600 }}>POIN AKTIF</p>
                </div>
              </div>

              {m.id === selected && (
                <div>
                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:8, marginBottom:14 }}>
                    {[
                      { label:'Total Belanja', value:formatIDR(m.totalSpend), color:'#1D4ED8', bg:'#DBEAFE' },
                      { label:'Poin Diperoleh', value:m.totalEarned.toLocaleString(), color:'#166534', bg:'#DCFCE7' },
                      { label:'Poin Ditukar', value:m.totalRedeemed.toLocaleString(), color:'#7C3AED', bg:'#EDE9FE' },
                    ].map(s => (
                      <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'9px 10px', textAlign:'center' }}>
                        <p style={{ margin:'0 0 2px', fontSize:10, color:s.color, fontWeight:700, textTransform:'uppercase' }}>{s.label}</p>
                        <p style={{ margin:0, fontSize:13, fontWeight:900, color:s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Transaction history */}
                  <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.5 }}>Riwayat Transaksi</p>
                  {m.trx.length === 0 ? (
                    <p style={{ fontSize:13, color:'#94A3B8', textAlign:'center', padding:'12px 0' }}>Belum ada transaksi</p>
                  ) : m.trx.slice(0,8).map(t => (
                    <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'#F9FAFB', borderRadius:9, marginBottom:5 }}>
                      <div>
                        <p style={{ margin:'0 0 1px', fontSize:12, fontWeight:700, color:'#374151', fontFamily:'monospace' }}>{t.id}</p>
                        <p style={{ margin:0, fontSize:11, color:'#94A3B8' }}>{formatDate(t.date||t.createdAt)}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:800, color:'#0F172A' }}>{formatIDR(t.total)}</p>
                        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                          {t.pointsEarned > 0 && <span style={{ fontSize:10, background:'#F0FDF4', color:'#166534', padding:'1px 7px', borderRadius:10, fontWeight:700, border:'1px solid #BBF7D0' }}>+{t.pointsEarned} poin</span>}
                          {t.pointsRedeemed > 0 && <span style={{ fontSize:10, background:'#FEF2F2', color:'#991B1B', padding:'1px 7px', borderRadius:10, fontWeight:700, border:'1px solid #FECACA' }}>-{t.pointsRedeemed} poin</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {m.trx.length > 8 && (
                    <p style={{ fontSize:12, color:'#64748B', textAlign:'center', marginTop:6 }}>... dan {m.trx.length-8} transaksi lainnya</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
