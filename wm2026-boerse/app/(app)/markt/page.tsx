'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/components/AppProvider'
import { TEAMS } from '@/lib/teams'
import { calcPosition } from '@/lib/calc'
import { formatChf } from '@/lib/format'

type SortMode = 'gruppe' | 'ref' | 'kurs' | 'alpha'

export default function MarktPage() {
  const { trades, teamPrices, profile } = useApp()
  const [sort, setSort] = useState<SortMode>('gruppe')
  const [search, setSearch] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  const priceMap = useMemo(() => {
    const m: Record<string, { price: number; phase: string }> = {}
    for (const tp of teamPrices) m[tp.team_name] = { price: tp.price, phase: tp.phase }
    return m
  }, [teamPrices])

  const confirmedTrades = useMemo(() => trades.filter(t => t.status === 'confirmed'), [trades])

  const sorted = useMemo(() => {
    let list = [...TEAMS]
    if (search) {
      list = list.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    }
    switch (sort) {
      case 'ref':   return list.sort((a, b) => b.ref - a.ref)
      case 'kurs':  return list.sort((a, b) => (priceMap[b.name]?.price ?? 0) - (priceMap[a.name]?.price ?? 0))
      case 'alpha': return list.sort((a, b) => a.name.localeCompare(b.name, 'de'))
      default:      return list.sort((a, b) => a.group.localeCompare(b.group) || b.ref - a.ref)
    }
  }, [sort, search, priceMap])

  const sortBtns: { mode: SortMode; label: string }[] = [
    { mode: 'gruppe', label: 'Gruppe' },
    { mode: 'ref',    label: 'Ref.' },
    { mode: 'kurs',   label: 'Kurs' },
    { mode: 'alpha',  label: 'A–Z' },
  ]

  return (
    <div>
      {/* Controls */}
      <div style={{ padding: '12px 16px', position: 'sticky', top: 53, background: 'var(--bg)', zIndex: 20 }}>
        <input
          type="search"
          placeholder="Team suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {sortBtns.map(btn => (
            <button
              key={btn.mode}
              onClick={() => setSort(btn.mode)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: sort === btn.mode ? 'var(--gold)' : 'var(--surface)',
                color: sort === btn.mode ? '#080810' : 'var(--text-dim)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team list */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map(team => {
          const price = priceMap[team.name]
          const pos = profile ? calcPosition(confirmedTrades, profile.id, team.name) : null

          return (
            <button
              key={team.name}
              onClick={() => setSelectedTeam(team.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                color: 'var(--text)',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: 28, minWidth: 36, textAlign: 'center' }}>{team.flag}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{team.name}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: 'var(--gold-dim)',
                      color: 'var(--gold)',
                    }}
                  >
                    {team.wk}%
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-mute)', marginLeft: 'auto' }}>
                    Gr. {team.group}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    Ref. {formatChf(team.ref)}
                  </span>
                  {pos && pos.net !== 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: pos.net > 0 ? 'var(--long)' : 'var(--short)',
                        marginLeft: 4,
                      }}
                    >
                      {pos.net > 0 ? `+${pos.net} Long` : `${pos.net} Short`}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: 70 }}>
                {price ? (
                  <>
                    <div
                      className="tabular"
                      style={{
                        fontFamily: 'var(--font-barlow)',
                        fontSize: 20,
                        fontWeight: 800,
                        color: 'var(--gold)',
                        lineHeight: 1,
                      }}
                    >
                      {formatChf(price.price)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                      {price.phase}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>—</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Team detail modal */}
      {selectedTeam && (
        <TeamDetailModal teamName={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}
    </div>
  )
}

function TeamDetailModal({ teamName, onClose }: { teamName: string; onClose: () => void }) {
  const { orders, trades, profile, teamPrices } = useApp()
  const team = TEAMS.find(t => t.name === teamName)
  const price = teamPrices.find(p => p.team_name === teamName)

  const teamOrders = orders.filter(o => o.team_name === teamName && o.status === 'open')
  const myTeamTrades = trades.filter(
    t =>
      t.team_name === teamName &&
      t.status === 'confirmed' &&
      (t.buyer_id === profile?.id || t.seller_id === profile?.id)
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 40 }}>{team?.flag}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 24, fontWeight: 800 }}>
              {teamName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Gruppe {team?.group} · WK {team?.wk}% · Ref. {formatChf(team?.ref ?? 0)}
            </div>
          </div>
          {price && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div
                className="tabular"
                style={{ fontFamily: 'var(--font-barlow)', fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}
              >
                {formatChf(price.price)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{price.phase}</div>
            </div>
          )}
        </div>

        {teamOrders.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Offene Orders
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {teamOrders.map(order => (
                <div key={order.id} className="card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: order.side === 'buy' ? 'var(--long)' : 'var(--short)', fontWeight: 700, fontSize: 12 }}>
                      {order.side === 'buy' ? '▲ KAUFE' : '▼ VERKAUFE'}
                    </span>
                    <span style={{ marginLeft: 8, fontSize: 13 }}>{order.qty}× @ {formatChf(order.price_per_unit)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    {(order.creator as { name: string } | undefined)?.name ?? '?'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {myTeamTrades.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Meine Trades
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {myTeamTrades.map(t => {
                const isBuyer = t.buyer_id === profile?.id
                const partner = isBuyer ? t.seller : t.buyer
                return (
                  <div key={t.id} className="card" style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: isBuyer ? 'var(--long)' : 'var(--short)', fontWeight: 700, fontSize: 12 }}>
                        {isBuyer ? '▲ LONG' : '▼ SHORT'}
                      </span>
                      <span style={{ fontSize: 13 }}>{t.qty}× @ {formatChf(t.price_per_unit)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                      Partner: {(partner as { name: string } | undefined)?.name ?? 'Unbekannt'}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {teamOrders.length === 0 && myTeamTrades.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px 0', fontSize: 14 }}>
            Keine offenen Orders oder Trades
          </div>
        )}

        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 20 }} onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  )
}
