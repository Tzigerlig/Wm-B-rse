'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/components/AppProvider'
import EmptyState from '@/components/EmptyState'
import { calcSettlement } from '@/lib/calc'
import { formatChf, formatPnl } from '@/lib/format'
import { TEAMS } from '@/lib/teams'

export default function SettlementPage() {
  const { trades, teamPrices, profile, profiles, tournament } = useApp()
  const [expanded, setExpanded] = useState<string | null>(null)

  const profileName = (id: string) => profiles.find(p => p.id === id)?.name ?? 'Unbekannt'
  const profileAvatar = (id: string) => profiles.find(p => p.id === id)?.avatar ?? '🦁'

  const allDebts = useMemo(() => calcSettlement(trades, teamPrices), [trades, teamPrices])

  const myDebts = useMemo(() => {
    if (!profile) return []
    return allDebts.filter(d => d.from === profile.id || d.to === profile.id)
  }, [allDebts, profile])

  const iReceive = myDebts.filter(d => d.to === profile?.id)
  const iPay = myDebts.filter(d => d.from === profile?.id)

  const netReceivable = iReceive.reduce((s, d) => s + d.amount, 0)
  const netPayable = iPay.reduce((s, d) => s + d.amount, 0)
  const netAmount = netReceivable - netPayable

  if (!profile) return null

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        className="card fade-up"
        style={{
          padding: 20,
          marginBottom: 20,
          background: tournament?.ended
            ? 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, var(--surface) 100%)'
            : 'var(--surface)',
          borderColor: tournament?.ended ? 'rgba(255,215,0,0.2)' : 'var(--border)',
        }}
      >
        {tournament?.ended ? (
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
            📌 ENDABRECHNUNG (final)
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
            Hypothetische Endabrechnung — basierend auf aktuellen Kursen
          </div>
        )}

        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 4 }}>
          NETTO {netAmount >= 0 ? 'FORDERUNG' : 'SCHULD'}
        </div>
        <div
          className="tabular"
          style={{
            fontFamily: 'var(--font-barlow)',
            fontSize: 40,
            fontWeight: 800,
            color: netAmount >= 0 ? 'var(--long)' : 'var(--short)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {netAmount >= 0
            ? `+${formatChf(netAmount)}`
            : `−${formatChf(Math.abs(netAmount))}`}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8 }}>
          {netAmount >= 0
            ? `Du bekommst netto ${formatChf(netAmount)}`
            : `Du schuldest netto ${formatChf(Math.abs(netAmount))}`}
        </div>
      </div>

      {myDebts.length === 0 ? (
        <EmptyState icon="🎉" title="Alles ausgeglichen!" description="Du schuldest niemandem etwas — und niemand schuldet dir etwas." />
      ) : (
        <>
          {/* Receivables */}
          {iReceive.length > 0 && (
            <>
              <div className="section-header" style={{ paddingInline: 0 }}>💚 Du bekommst</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {iReceive.map(debt => {
                  const key = `${debt.from}>${debt.to}`
                  const isExpanded = expanded === key
                  return (
                    <div key={key} className="card" style={{ padding: 0, overflow: 'hidden', borderColor: 'rgba(0,200,83,0.2)' }}>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : key)}
                        style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', gap: 12, textAlign: 'left' }}
                      >
                        <span style={{ fontSize: 24 }}>{profileAvatar(debt.from)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{profileName(debt.from)}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                            {debt.trades.length} Trade{debt.trades.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="tabular" style={{ color: 'var(--long)', fontWeight: 700, fontSize: 18 }}>
                            +{formatChf(debt.amount)}
                          </div>
                        </div>
                        <span style={{ color: 'var(--text-mute)', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                      </button>
                      {isExpanded && <DebtDetail debt={debt} myId={profile.id} />}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Payables */}
          {iPay.length > 0 && (
            <>
              <div className="section-header" style={{ paddingInline: 0 }}>🔴 Du schuldest</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {iPay.map(debt => {
                  const key = `${debt.from}>${debt.to}`
                  const isExpanded = expanded === key
                  return (
                    <div key={key} className="card" style={{ padding: 0, overflow: 'hidden', borderColor: 'rgba(255,61,61,0.2)' }}>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : key)}
                        style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', gap: 12, textAlign: 'left' }}
                      >
                        <span style={{ fontSize: 24 }}>{profileAvatar(debt.to)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{profileName(debt.to)}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                            {debt.trades.length} Trade{debt.trades.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="tabular" style={{ color: 'var(--short)', fontWeight: 700, fontSize: 18 }}>
                          −{formatChf(debt.amount)}
                        </div>
                        <span style={{ color: 'var(--text-mute)', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                      </button>
                      {isExpanded && <DebtDetail debt={debt} myId={profile.id} />}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function DebtDetail({ debt, myId }: { debt: { trades: import('@/lib/types').Trade[]; from: string; to: string }; myId: string }) {
  const { teamPrices } = useApp()
  const priceMap: Record<string, number> = {}
  for (const tp of teamPrices) priceMap[tp.team_name] = tp.price

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', background: 'rgba(0,0,0,0.2)' }}>
      {debt.trades.map(t => {
        const isBuyer = t.buyer_id === myId
        const finalPrice = priceMap[t.team_name] ?? 0
        const diff = (finalPrice - t.price_per_unit) * t.qty * (isBuyer ? 1 : -1)
        const team = TEAMS.find(x => x.name === t.team_name)
        return (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{team?.flag}</span>
              <div>
                <div>{t.team_name} {t.qty}× @ {formatChf(t.price_per_unit)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  Endkurs: {formatChf(finalPrice)}
                </div>
              </div>
            </div>
            <div className="tabular" style={{ color: diff >= 0 ? 'var(--long)' : 'var(--short)', fontWeight: 700 }}>
              {formatPnl(diff)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
