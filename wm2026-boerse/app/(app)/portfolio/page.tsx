'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/components/AppProvider'
import EmptyState from '@/components/EmptyState'
import TradeDetailModal from '@/components/TradeDetailModal'
import { calcPosition, calcTeamPnl, calcTotalPnl, calcAvgEntry } from '@/lib/calc'
import { formatPnl, formatChf, pnlColor, timeAgo } from '@/lib/format'
import { TEAMS } from '@/lib/teams'
import type { Trade } from '@/lib/types'

type Tab = 'positionen' | 'history'
type HistoryFilter = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'rejected'
type HistorySort = 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc'

const STATUS_CONFIG: Record<Trade['status'], { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Bestätigt',  color: 'var(--long)',     bg: 'var(--long-dim)'  },
  pending:   { label: 'Ausstehend', color: 'var(--gold)',     bg: 'var(--gold-dim)'  },
  cancelled: { label: 'Storniert',  color: 'var(--text-dim)', bg: 'var(--surface)'   },
  rejected:  { label: 'Abgelehnt', color: 'var(--short)',    bg: 'var(--short-dim)' },
}

const FILTER_LABELS: Record<HistoryFilter, string> = {
  all: 'Alle', confirmed: 'Bestätigt', pending: 'Pending', cancelled: 'Storniert', rejected: 'Abgelehnt',
}

export default function PortfolioPage() {
  const { trades, teamPrices, profile } = useApp()
  const [tab, setTab] = useState<Tab>('positionen')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [historySearch, setHistorySearch] = useState('')
  const [historySort, setHistorySort] = useState<HistorySort>('date_desc')
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)

  const priceMap = useMemo(() => {
    const m: Partial<Record<string, number>> = {}
    for (const tp of teamPrices) m[tp.team_name] = tp.price
    return m
  }, [teamPrices])

  const confirmedTrades = useMemo(() => trades.filter(t => t.status === 'confirmed'), [trades])

  const allMyTrades = useMemo(() => {
    if (!profile) return []
    return trades.filter(t => t.buyer_id === profile.id || t.seller_id === profile.id)
  }, [trades, profile])

  const myConfirmed = useMemo(
    () => confirmedTrades.filter(t => profile && (t.buyer_id === profile.id || t.seller_id === profile.id)),
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
        const currentPrice: number | null = priceMap[name] ?? null
        const pnl = calcTeamPnl(confirmedTrades, profile.id, name, currentPrice)
        const avgLong = calcAvgEntry(confirmedTrades, profile.id, name, 'long')
        const avgShort = calcAvgEntry(confirmedTrades, profile.id, name, 'short')
        const team = TEAMS.find(t => t.name === name)
        return { name, pos, pnl, currentPrice, avgLong, avgShort, team }
      })
      .filter(p => p.pos.net !== 0)
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
  }, [myConfirmed, confirmedTrades, profile, priceMap])

  const filteredHistoryTrades = useMemo(() => {
    let result = allMyTrades
    if (historyFilter !== 'all') result = result.filter(t => t.status === historyFilter)
    if (historySearch) result = result.filter(t => t.team_name.toLowerCase().includes(historySearch.toLowerCase()))
    const sorted = [...result]
    switch (historySort) {
      case 'date_asc':   return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'price_desc': return sorted.sort((a, b) => b.price_per_unit - a.price_per_unit)
      case 'price_asc':  return sorted.sort((a, b) => a.price_per_unit - b.price_per_unit)
      default:           return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }, [allMyTrades, historyFilter, historySearch, historySort])

  const selectedTrade = allMyTrades.find(t => t.id === selectedTradeId) ?? null

  if (!profile) return null

  return (
    <div>
      {/* Summary card */}
      <div className="card fade-up" style={{ margin: 16, padding: 20, background: 'linear-gradient(135deg, rgba(41,121,255,0.06) 0%, var(--surface) 100%)', borderColor: 'rgba(41,121,255,0.2)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 4 }}>TOTAL UNREALIZED P/L</div>
        <div className="tabular" style={{ fontFamily: 'var(--font-barlow)', fontSize: 40, fontWeight: 800, color: pnlColor(totalPnl), lineHeight: 1, letterSpacing: '-0.02em' }}>
          {formatPnl(totalPnl)}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>
          <span>{myConfirmed.length} Trades</span>
          <span>{teamPositions.length} Teams</span>
        </div>
        {teamPositions.some(p => !(p.name in priceMap)) && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)', padding: '6px 10px', background: 'rgba(255,215,0,0.05)', borderRadius: 8, border: '1px solid rgba(255,215,0,0.1)' }}>
            ⏳ Einige Positionen noch nicht bewertet — der Admin setzt Kurse nach jeder Runde.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, margin: '0 16px 16px', padding: 4, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
        {(['positionen', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === t ? 'var(--gold)' : 'transparent', color: tab === t ? '#080810' : 'var(--text-dim)', transition: 'background 0.15s' }}>
            {t === 'positionen' ? 'Positionen' : `History (${allMyTrades.length})`}
          </button>
        ))}
      </div>

      {tab === 'positionen' ? (
        teamPositions.length === 0 ? (
          <EmptyState icon="💼" title="Keine aktiven Positionen" description="Bestätige Trades unter dem Trades-Tab — sie erscheinen dann hier." action={<Link href="/trades"><button className="btn btn-primary" style={{ fontSize: 13 }}>→ Zu den Trades</button></Link>} />
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teamPositions.map(({ name, pos, pnl, currentPrice, avgLong, avgShort, team }) => {
              const isExpanded = expanded === name
              const pnlPct = currentPrice !== null && avgLong > 0 && pos.net > 0 ? ((currentPrice - avgLong) / avgLong) * 100 : null
              return (
                <div key={name} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isExpanded ? null : name)} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', gap: 10, textAlign: 'left' }}>
                    <span style={{ fontSize: 24 }}>{team?.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div>
                      <div style={{ fontSize: 12, color: pos.net > 0 ? 'var(--long)' : 'var(--short)', fontWeight: 600 }}>
                        {pos.net > 0 ? `+${pos.net} Long` : `${pos.net} Short`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {currentPrice !== null
                        ? <div className="tabular" style={{ color: pnlColor(pnl), fontWeight: 700, fontSize: 15 }}>{formatPnl(pnl)}</div>
                        : <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>—</div>
                      }
                      {pnlPct !== null && <div style={{ fontSize: 11, color: pnlColor(pnl) }}>{pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(1)}%</div>}
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', background: 'rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12 }}>
                        <div>
                          <div style={{ color: 'var(--text-dim)' }}>Aktueller Kurs</div>
                          <div className="tabular" style={{ color: 'var(--gold)', fontWeight: 700 }}>
                            {currentPrice !== null ? formatChf(currentPrice) : '—'}
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
                      {myConfirmed.filter(t => t.team_name === name).map(t => {
                        const isBuyer = t.buyer_id === profile.id
                        const partner = isBuyer ? t.seller : t.buyer
                        const tradePnl = currentPrice !== null
                          ? (currentPrice - t.price_per_unit) * t.qty * (isBuyer ? 1 : -1)
                          : null
                        return (
                          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                            <div>
                              <span style={{ color: isBuyer ? 'var(--long)' : 'var(--short)', fontWeight: 700 }}>{isBuyer ? '▲' : '▼'}</span>
                              <span style={{ marginLeft: 6 }}>{t.qty}× @ {formatChf(t.price_per_unit)}</span>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                                {(partner as { name: string } | undefined)?.name ?? 'Unbekannt'}
                              </div>
                            </div>
                            {tradePnl !== null
                              ? <div className="tabular" style={{ color: pnlColor(tradePnl), fontWeight: 700 }}>{formatPnl(tradePnl)}</div>
                              : <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Noch kein Kurs</div>
                            }
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
        <>
          {/* Filter row */}
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {(Object.keys(FILTER_LABELS) as HistoryFilter[]).map(f => (
              <button key={f} onClick={() => setHistoryFilter(f)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: historyFilter === f ? 'var(--gold)' : 'var(--surface)', color: historyFilter === f ? '#080810' : 'var(--text-dim)' }}>
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Search + Sort */}
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
            <input type="search" placeholder="Team suchen..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1 }} />
            <select value={historySort} onChange={e => setHistorySort(e.target.value as HistorySort)} style={{ width: 'auto', flexShrink: 0, fontSize: 12, padding: '8px 10px' }}>
              <option value="date_desc">Neueste zuerst</option>
              <option value="date_asc">Älteste zuerst</option>
              <option value="price_desc">Höchster Preis</option>
              <option value="price_asc">Niedrigster Preis</option>
            </select>
          </div>

          {filteredHistoryTrades.length === 0 ? (
            <EmptyState icon="📋" title="Keine Trades gefunden" description={historySearch || historyFilter !== 'all' ? 'Versuche andere Filter.' : 'Du hast noch keine Trades.'} />
          ) : (
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {filteredHistoryTrades.map(t => {
                const isBuyer = t.buyer_id === profile.id
                const partner = isBuyer ? t.seller : t.buyer
                const team = TEAMS.find(x => x.name === t.team_name)
                const st = STATUS_CONFIG[t.status]
                return (
                  <button key={t.id} className="card" onClick={() => setSelectedTradeId(t.id)} style={{ padding: '12px 14px', textAlign: 'left', width: '100%', cursor: 'pointer', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{team?.flag}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ color: isBuyer ? 'var(--long)' : 'var(--short)', fontWeight: 700, fontSize: 11 }}>
                            {isBuyer ? '▲ LONG' : '▼ SHORT'}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{t.team_name}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 5, color: st.color, background: st.bg, marginLeft: 'auto', flexShrink: 0 }}>
                            {st.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)' }}>
                          <span className="tabular">{t.qty}× @ {formatChf(t.price_per_unit)}</span>
                          {partner && (
                            <>
                              <span>·</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, borderRadius: '50%', background: (partner as { color: string }).color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>
                                  {(partner as { avatar: string }).avatar}
                                </div>
                                <span>{(partner as { name: string }).name}</span>
                              </div>
                            </>
                          )}
                          <span style={{ marginLeft: 'auto', flexShrink: 0 }}>{timeAgo(t.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          myId={profile.id}
          onClose={() => setSelectedTradeId(null)}
        />
      )}
    </div>
  )
}
