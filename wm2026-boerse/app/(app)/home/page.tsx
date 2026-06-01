'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/AppProvider'
import EmptyState from '@/components/EmptyState'
import CreateTradeModal from '@/components/CreateTradeModal'
import { calcTotalPnl, calcTeamPnl } from '@/lib/calc'
import { formatPnl, formatChf, pnlColor, timeAgo } from '@/lib/format'
import { TEAMS } from '@/lib/teams'

export default function HomePage() {
  const { profile, trades, teamPrices, priceUpdates, tournament } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const router = useRouter()

  const priceMap = useMemo(() => {
    const m: Partial<Record<string, number>> = {}
    for (const tp of teamPrices) m[tp.team_name] = tp.price
    return m
  }, [teamPrices])

  const confirmedTrades = useMemo(
    () => trades.filter(t => t.status === 'confirmed'),
    [trades]
  )

  const pendingForMe = useMemo(
    () =>
      trades.filter(
        t =>
          t.status === 'pending' &&
          ((t.buyer_id === profile?.id && t.proposed_by !== profile?.id) ||
            (t.seller_id === profile?.id && t.proposed_by !== profile?.id))
      ),
    [trades, profile]
  )

  const totalPnl = useMemo(
    () => (profile ? calcTotalPnl(confirmedTrades, profile.id, teamPrices) : 0),
    [confirmedTrades, profile, teamPrices]
  )

  const myTeams = useMemo(() => {
    if (!profile) return []
    const teamNames = [
      ...new Set(confirmedTrades.filter(t => t.buyer_id === profile.id || t.seller_id === profile.id).map(t => t.team_name)),
    ]
    return teamNames
      .map(name => ({
        name,
        team: TEAMS.find(t => t.name === name),
        pnl: calcTeamPnl(confirmedTrades, profile.id, name, priceMap[name] ?? null),
      }))
      .sort((a, b) => b.pnl - a.pnl)
  }, [confirmedTrades, profile, priceMap])

  const recentPriceUpdates = useMemo(() => priceUpdates.slice(0, 10), [priceUpdates])

  const hasActivity = confirmedTrades.length > 0

  if (!profile) return null

  return (
    <div style={{ padding: 16 }}>
      {/* Hero card */}
      <div
        className="card fade-up"
        style={{
          padding: 20,
          marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, var(--surface) 100%)',
          borderColor: 'rgba(255,215,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: profile.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              border: '2px solid var(--border-strong)',
            }}
          >
            {profile.avatar}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{profile.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              {myTeams.length} Position{myTeams.length !== 1 ? 'en' : ''}
            </div>
          </div>
          {pendingForMe.length > 0 && (
            <div style={{ marginLeft: 'auto' }}>
              <span
                className="badge"
                style={{ background: 'var(--orange)' }}
              >
                {pendingForMe.length}
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 4, fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>
          UNREALIZED P/L
        </div>
        <div
          className="tabular"
          style={{
            fontFamily: 'var(--font-barlow)',
            fontSize: 42,
            fontWeight: 800,
            color: pnlColor(totalPnl),
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {formatPnl(totalPnl)}
        </div>

        {!tournament?.ended && myTeams.length > 0 && myTeams.some(({ name }) => !(name in priceMap)) && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)', padding: '6px 10px', background: 'rgba(255,215,0,0.05)', borderRadius: 8, border: '1px solid rgba(255,215,0,0.1)' }}>
            ⏳ Noch keine Bewertung — der Admin setzt Kurse nach jeder Runde.
          </div>
        )}
        {tournament?.ended && (
          <div
            style={{
              marginTop: 12,
              padding: '6px 12px',
              background: 'var(--gold-dim)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--gold)',
              fontWeight: 600,
            }}
          >
            📌 TURNIER BEENDET — Endabrechnung aktiv
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div
        className="fade-up stagger-2"
        style={{ display: 'flex', gap: 8, marginBottom: 24 }}
      >
        <button
          className="btn btn-primary"
          style={{ flex: 1, fontSize: 13, padding: '10px 12px' }}
          onClick={() => setShowCreate(true)}
          disabled={!!tournament?.ended}
        >
          + Neue Order
        </button>
        {pendingForMe.length > 0 && (
          <button
            className="btn btn-ghost"
            style={{
              flex: 1,
              fontSize: 13,
              padding: '10px 12px',
              borderColor: 'var(--orange)',
              color: 'var(--orange)',
            }}
            onClick={() => router.push('/trades')}
          >
            ⏳ Pending ({pendingForMe.length})
          </button>
        )}
        <Link href="/markt" style={{ textDecoration: 'none', flex: pendingForMe.length > 0 ? 0 : 1 }}>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 13, padding: '10px 12px' }}>
            📈 Markt
          </button>
        </Link>
      </div>

      {!hasActivity ? (
        <EmptyState
          icon="⚽"
          title="Noch keine Trades"
          description="Schau im Markt-Tab nach Teams und stell deine erste Order!"
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Neue Order</button>
              <Link href="/markt"><button className="btn btn-ghost">📈 Zum Markt</button></Link>
            </div>
          }
        />
      ) : (
        <>
          {/* Top performers */}
          {myTeams.filter(t => t.pnl > 0).length > 0 && (
            <>
              <div className="section-header">🚀 Meine Top-Performer</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingInline: 16 }}>
                {myTeams.filter(t => t.pnl > 0).slice(0, 3).map(({ name, team, pnl }) => (
                  <div key={name} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{team?.flag}</span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{name}</span>
                    </div>
                    <span className="tabular" style={{ color: 'var(--long)', fontWeight: 700 }}>
                      {formatPnl(pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Biggest losses */}
          {myTeams.filter(t => t.pnl < 0).length > 0 && (
            <>
              <div className="section-header">📉 Größte Verluste</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingInline: 16 }}>
                {myTeams.filter(t => t.pnl < 0).slice(-3).reverse().map(({ name, team, pnl }) => (
                  <div key={name} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{team?.flag}</span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{name}</span>
                    </div>
                    <span className="tabular" style={{ color: 'var(--short)', fontWeight: 700 }}>
                      {formatPnl(pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Price update log */}
          {recentPriceUpdates.length > 0 && (
            <>
              <div className="section-header">⚡ Kursänderungen</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingInline: 16, marginBottom: 8 }}>
                {recentPriceUpdates.map(pu => {
                  const team = TEAMS.find(t => t.name === pu.team_name)
                  const up = pu.old_price !== null && pu.new_price > pu.old_price
                  const down = pu.old_price !== null && pu.new_price < pu.old_price
                  return (
                    <div key={pu.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{team?.flag ?? '🏳'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{pu.team_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {pu.old_phase ? `${pu.old_phase} → ` : ''}{pu.new_phase} · {timeAgo(pu.created_at)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {pu.old_price !== null && (
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                            {formatChf(pu.old_price)}
                          </div>
                        )}
                        <div className="tabular" style={{ fontSize: 14, fontWeight: 700, color: up ? 'var(--long)' : down ? 'var(--short)' : 'var(--gold)' }}>
                          {up ? '▲' : down ? '▼' : ''} {formatChf(pu.new_price)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {showCreate && <CreateTradeModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
