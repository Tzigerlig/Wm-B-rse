'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/components/AppProvider'
import EmptyState from '@/components/EmptyState'
import { calcPosition, calcTeamPnl, calcTotalPnl, calcAvgEntry } from '@/lib/calc'
import { formatPnl, formatChf, pnlColor, formatDate } from '@/lib/format'
import { TEAMS } from '@/lib/teams'

type Tab = 'positionen' | 'history'

export default function PortfolioPage() {
  const { trades, teamPrices, profile } = useApp()
  const [tab, setTab] = useState<Tab>('positionen')
  const [expanded, setExpanded] = useState<string | null>(null)

  const priceMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const tp of teamPrices) m[tp.team_name] = tp.price
    return m
  }, [teamPrices])

  const confirmedTrades = useMemo(
    () => trades.filter(t => t.status === 'confirmed'),
    [trades]
  )

  const myConfirmed = useMemo(
    () =>
      confirmedTrades.filter(
        t => profile && (t.buyer_id === profile.id || t.seller_id === profile.id)
      ),
    [confirmedTrades, profile]
  )

  const totalPnl = useMemo(
    () => (profile ? calcTotalPnl(confirmedTrades, profile.id, teamPrices) : 0),
    [confirmedTrades, profile, teamPrices]
  )

  const teamPositions = useMemo(() => {
    if (!profile) return []
    const names = [...new Set(myConfirmed.map(t => t.team_name))]
    return names
      .map(name => {
        const pos = calcPosition(confirmedTrades, profile.id, name)
        const currentPrice = priceMap[name] ?? 0
        const pnl = calcTeamPnl(confirmedTrades, profile.id, name, currentPrice)
        const avgLong = calcAvgEntry(confirmedTrades, profile.id, name, 'long')
        const avgShort = calcAvgEntry(confirmedTrades, profile.id, name, 'short')
        const team = TEAMS.find(t => t.name === name)
        return { name, pos, pnl, currentPrice, avgLong, avgShort, team }
      })
      .filter(p => p.pos.net !== 0)
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
  }, [myConfirmed, confirmedTrades, profile, priceMap])

  const historyTrades = useMemo(
    () => [...myConfirmed].sort((a, b) => new Date(b.confirmed_at ?? b.created_at).getTime() - new Date(a.confirmed_at ?? a.created_at).getTime()),
    [myConfirmed]
  )

  if (!profile) return null

  return (
    <div>
      {/* Summary card */}
      <div
        className="card fade-up"
        style={{
          margin: 16,
          padding: 20,
          background: 'linear-gradient(135deg, rgba(41,121,255,0.06) 0%, var(--surface) 100%)',
          borderColor: 'rgba(41,121,255,0.2)',
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 4 }}>
          TOTAL UNREALIZED P/L
        </div>
        <div
          className="tabular"
          style={{
            fontFamily: 'var(--font-barlow)',
            fontSize: 40,
            fontWeight: 800,
            color: pnlColor(totalPnl),
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {formatPnl(totalPnl)}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 12,
            fontSize: 12,
            color: 'var(--text-dim)',
          }}
        >
          <span>{myConfirmed.length} Trades</span>
          <span>{teamPositions.length} Teams</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, margin: '0 16px 16px', padding: 4, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
        {(['positionen', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 9,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: tab === t ? 'var(--gold)' : 'transparent',
              color: tab === t ? '#080810' : 'var(--text-dim)',
              transition: 'background 0.15s',
            }}
          >
            {t === 'positionen' ? 'Positionen' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'positionen' ? (
        teamPositions.length === 0 ? (
          <EmptyState
            icon="💼"
            title="Keine aktiven Positionen"
            description="Bestätige Trades unter dem Trades-Tab — sie erscheinen dann hier."
            action={<Link href="/trades"><button className="btn btn-primary" style={{ fontSize: 13 }}>→ Zu den Trades</button></Link>}
          />
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teamPositions.map(({ name, pos, pnl, currentPrice, avgLong, avgShort, team }) => {
              const isExpanded = expanded === name
              const pnlPct = avgLong > 0 && pos.net > 0 ? ((currentPrice - avgLong) / avgLong) * 100 : null

              return (
                <div key={name} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '14px 16px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      gap: 10,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{team?.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
                      <div style={{ fontSize: 12, color: pos.net > 0 ? 'var(--long)' : 'var(--short)', fontWeight: 600 }}>
                        {pos.net > 0 ? `+${pos.net} Long` : `${pos.net} Short`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="tabular" style={{ color: pnlColor(pnl), fontWeight: 700, fontSize: 15 }}>
                        {formatPnl(pnl)}
                      </div>
                      {pnlPct !== null && (
                        <div style={{ fontSize: 11, color: pnlColor(pnl) }}>
                          {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', background: 'rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12 }}>
                        <div>
                          <div style={{ color: 'var(--text-dim)' }}>Aktueller Kurs</div>
                          <div className="tabular" style={{ color: 'var(--gold)', fontWeight: 700 }}>
                            {currentPrice > 0 ? formatChf(currentPrice) : '—'}
                          </div>
                        </div>
                        {pos.net > 0 && avgLong > 0 && (
                          <div>
                            <div style={{ color: 'var(--text-dim)' }}>Ø Long-Einstieg</div>
                            <div className="tabular" style={{ fontWeight: 700 }}>{formatChf(avgLong)}</div>
                          </div>
                        )}
                        {pos.net < 0 && avgShort > 0 && (
                          <div>
                            <div style={{ color: 'var(--text-dim)' }}>Ø Short-Einstieg</div>
                            <div className="tabular" style={{ fontWeight: 700 }}>{formatChf(avgShort)}</div>
                          </div>
                        )}
                      </div>

                      {profile && myConfirmed
                        .filter(t => t.team_name === name)
                        .map(t => {
                          const isBuyer = t.buyer_id === profile.id
                          const partner = isBuyer ? t.seller : t.buyer
                          const tradePnl = (currentPrice - t.price_per_unit) * t.qty * (isBuyer ? 1 : -1)
                          return (
                            <div
                              key={t.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 0',
                                borderBottom: '1px solid var(--border)',
                                fontSize: 13,
                              }}
                            >
                              <div>
                                <span style={{ color: isBuyer ? 'var(--long)' : 'var(--short)', fontWeight: 700 }}>
                                  {isBuyer ? '▲' : '▼'}
                                </span>
                                <span style={{ marginLeft: 6 }}>{t.qty}× @ {formatChf(t.price_per_unit)}</span>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                                  {(partner as { name: string } | undefined)?.name ?? 'Unbekannt'}
                                </div>
                              </div>
                              <div className="tabular" style={{ color: pnlColor(tradePnl), fontWeight: 700 }}>
                                {formatPnl(tradePnl)}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        historyTrades.length === 0 ? (
          <EmptyState icon="📋" title="Keine Trade-History" />
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {historyTrades.map(t => {
              const isBuyer = t.buyer_id === profile.id
              const partner = isBuyer ? t.seller : t.buyer
              const team = TEAMS.find(x => x.name === t.team_name)
              return (
                <div key={t.id} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{team?.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: isBuyer ? 'var(--long)' : 'var(--short)', fontWeight: 700, fontSize: 12 }}>
                          {isBuyer ? '▲ LONG' : '▼ SHORT'}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{t.team_name}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                        {t.qty}× @ {formatChf(t.price_per_unit)} · {(partner as { name: string } | undefined)?.name ?? 'Unbekannt'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {formatDate(t.confirmed_at ?? t.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
