'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/AppProvider'
import EmptyState from '@/components/EmptyState'
import CreateTradeModal from '@/components/CreateTradeModal'
import { calcTotalPnl, calcTeamPnl } from '@/lib/calc'
import { formatPnl, formatChf, pnlColor } from '@/lib/format'
import { TEAMS } from '@/lib/teams'

export default function HomePage() {
  const { profile, trades, teamPrices, tournament } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const router = useRouter()

  const priceMap = useMemo(() => {
    const m: Record<string, number> = {}
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
        pnl: calcTeamPnl(confirmedTrades, profile.id, name, priceMap[name] ?? 0),
      }))
      .sort((a, b) => b.pnl - a.pnl)
  }, [confirmedTrades, profile, priceMap])

  const recentlyMoved = useMemo(() => {
    const now = new Date()
    return teamPrices.filter(tp => {
      const diff = now.getTime() - new Date(tp.set_at).getTime()
      return diff < 24 * 3600 * 1000
    })
  }, [teamPrices])

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
          icon="🏆"
          title="Noch keine Trades"
          description="Stell eine Order ins Buch oder schick deinen Freunden einen Direct Trade."
          action={
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              Erste Order erstellen
            </button>
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

          {/* Recently moved */}
          {recentlyMoved.length > 0 && (
            <>
              <div className="section-header">⚡ Heute bewegt</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingInline: 16, marginBottom: 8 }}>
                {recentlyMoved.map(tp => {
                  const team = TEAMS.find(t => t.name === tp.team_name)
                  return (
                    <div key={tp.team_name} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{team?.flag ?? '🏳'}</span>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{tp.team_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{tp.phase}</div>
                        </div>
                      </div>
                      <span className="tabular" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>
                        {formatChf(tp.price)}
                      </span>
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
