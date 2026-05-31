'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/components/AppProvider'
import { createClient } from '@/lib/supabase/client'
import { TEAMS } from '@/lib/teams'
import { calcPosition } from '@/lib/calc'
import { formatChf } from '@/lib/format'

type ModalTab = 'direct' | 'order'

export default function CreateTradeModal({ onClose }: { onClose: () => void }) {
  const { profile, profiles, trades, tournament, addToast, refreshTrades, refreshOrders } = useApp()
  const [tab, setTab] = useState<ModalTab>('order')
  const [loading, setLoading] = useState(false)

  // Shared
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [teamSearch, setTeamSearch] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')

  // Direct trade only
  const [counterpartyId, setCounterpartyId] = useState('')

  const confirmedTrades = useMemo(() => trades.filter(t => t.status === 'confirmed'), [trades])

  const teamOptions = useMemo(() => {
    if (!teamSearch) return TEAMS
    return TEAMS.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
  }, [teamSearch])

  const otherProfiles = useMemo(
    () => profiles.filter(p => p.id !== profile?.id),
    [profiles, profile]
  )

  const nakedShortWarning = useMemo(() => {
    if (!profile || !selectedTeam || side !== 'sell') return false
    const pos = calcPosition(confirmedTrades, profile.id, selectedTeam)
    return pos.net <= 0
  }, [confirmedTrades, profile, selectedTeam, side])

  const total = parseFloat(qty) * parseFloat(price)

  async function handleSubmit() {
    console.log('🎯 [DirectTrade] BUTTON CLICKED', {
      tab, selectedTeam, qty, price, counterpartyId,
      hasProfile: !!profile, tournamentEnded: !!tournament?.ended,
      loading,
    })

    if (!profile) {
      console.warn('🎯 [DirectTrade] BLOCKED — no profile')
      addToast('Nicht eingeloggt', 'error')
      return
    }
    if (!selectedTeam) {
      console.warn('🎯 [DirectTrade] BLOCKED — no team selected')
      addToast('Bitte Team auswählen', 'error')
      return
    }
    if (!qty || parseFloat(qty) <= 0) {
      console.warn('🎯 [DirectTrade] BLOCKED — invalid qty:', qty)
      addToast('Bitte Menge eingeben', 'error')
      return
    }
    if (price === '' || isNaN(parseFloat(price))) {
      console.warn('🎯 [DirectTrade] BLOCKED — invalid price:', price)
      addToast('Bitte Preis eingeben', 'error')
      return
    }
    if (tab === 'direct' && !counterpartyId) {
      console.warn('🎯 [DirectTrade] BLOCKED — no counterparty')
      addToast('Bitte Gegenpartei auswählen', 'error')
      return
    }
    if (tournament?.ended) {
      addToast('Turnier ist beendet — keine neuen Trades möglich', 'error')
      return
    }
    if (loading) {
      console.warn('🎯 [DirectTrade] BLOCKED — already loading')
      return
    }

    setLoading(true)
    const supabase = createClient()

    if (tab === 'order') {
      const { error } = await supabase.from('orders').insert({
        creator_id: profile.id,
        side,
        team_name: selectedTeam,
        qty: parseInt(qty),
        price_per_unit: parseFloat(price),
        note: note || null,
        status: 'open',
      })
      if (error) {
        console.error('🎯 [DirectTrade] orders insert error:', error)
        addToast(`Fehler: ${error.message}`, 'error')
      } else {
        addToast('Order ins Buch gestellt ✓', 'success')
        await refreshOrders()
        onClose()
      }
    } else {
      const buyer_id = side === 'buy' ? profile.id : counterpartyId
      const seller_id = side === 'sell' ? profile.id : counterpartyId
      const tradeData = {
        buyer_id,
        seller_id,
        team_name: selectedTeam,
        qty: parseInt(qty),
        price_per_unit: parseFloat(price),
        proposed_by: profile.id,
        status: 'pending' as const,
      }
      console.log('🎯 [DirectTrade] sending trade:', tradeData)

      const { data, error } = await supabase.from('trades').insert(tradeData).select()
      console.log('🎯 [DirectTrade] response:', { data, error })

      if (error) {
        addToast(`Fehler: ${error.message}`, 'error')
      } else {
        const partnerName = otherProfiles.find(p => p.id === counterpartyId)?.name ?? '?'
        addToast(`Trade-Vorschlag an ${partnerName} gesendet ✓`, 'success')
        await refreshTrades()
        onClose()
      }
    }

    setLoading(false)
  }

  const canSubmit =
    !!selectedTeam &&
    !!qty &&
    parseFloat(qty) > 0 &&
    price !== '' &&
    !isNaN(parseFloat(price)) &&
    parseFloat(price) >= 0 &&
    (tab === 'order' || !!counterpartyId)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 22, fontWeight: 800 }}>
            Neuer Trade
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>
            ×
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
          {([['order', '📋 Order ins Buch'], ['direct', '🎯 Direct Trade']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 9,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: tab === id ? 'var(--gold)' : 'transparent',
                color: tab === id ? '#080810' : 'var(--text-dim)',
                transition: 'background 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Direct trade: counterparty picker */}
        {tab === 'direct' && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Gegenpartei</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {otherProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setCounterpartyId(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${counterpartyId === p.id ? 'var(--gold)' : 'var(--border)'}`,
                    background: counterpartyId === p.id ? 'var(--gold-dim)' : 'var(--surface)',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {p.avatar}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                  {counterpartyId === p.id && <span style={{ marginLeft: 'auto', color: 'var(--gold)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Buy/Sell toggle */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Seite</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['buy', '▲ Kaufen (Long)'], ['sell', '▼ Verkaufen (Short)']] as const).map(([s, label]) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: `1px solid ${side === s ? (s === 'buy' ? 'rgba(0,200,83,0.5)' : 'rgba(255,61,61,0.5)') : 'var(--border)'}`,
                  background: side === s ? (s === 'buy' ? 'var(--long-dim)' : 'var(--short-dim)') : 'var(--surface)',
                  color: side === s ? (s === 'buy' ? 'var(--long)' : 'var(--short)') : 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Naked short warning */}
        {nakedShortWarning && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--orange-dim)', borderRadius: 8, fontSize: 12, color: 'var(--orange)', border: '1px solid rgba(255,140,0,0.3)' }}>
            ⚠️ Naked Short — du besitzt dieses Team nicht. Dein Risiko ist unbegrenzt.
          </div>
        )}

        {/* Team picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Team</label>
          <input
            type="search"
            placeholder="Team suchen..."
            value={selectedTeam ? selectedTeam : teamSearch}
            onChange={e => {
              setTeamSearch(e.target.value)
              setSelectedTeam('')
            }}
            style={{ marginBottom: 6 }}
          />
          {!selectedTeam && teamSearch && (
            <div style={{ maxHeight: 200, overflowY: 'auto', background: 'var(--bg-alt)', borderRadius: 10, border: '1px solid var(--border)' }}>
              {teamOptions.slice(0, 12).map(team => (
                <button
                  key={team.name}
                  onClick={() => {
                    setSelectedTeam(team.name)
                    setTeamSearch(team.name)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    textAlign: 'left',
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{team.flag}</span>
                  <span style={{ flex: 1 }}>{team.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Gr. {team.group}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Qty + Price */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Menge (Stück)</label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="z.B. 5"
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Preis / Stück (Fr.)</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              placeholder="z.B. 25.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Total */}
        {qty && price && !isNaN(total) && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--gold-dim)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: 'var(--text-dim)' }}>Gesamtwert</span>
            <span className="tabular" style={{ color: 'var(--gold)', fontWeight: 700 }}>
              {formatChf(total)}
            </span>
          </div>
        )}

        {/* Note */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notiz (optional)</label>
          <input
            type="text"
            placeholder="z.B. Freundschaftspreis"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleSubmit}
        >
          {loading ? 'Sende...' : tab === 'order' ? '📋 Order stellen' : '🎯 Trade senden'}
        </button>

        {tournament?.ended && (
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--short)' }}>
            Turnier ist beendet — keine neuen Trades möglich
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-dim)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 6,
}
