'use client'

import { useMemo } from 'react'
import { useApp } from '@/components/AppProvider'
import { TEAMS } from '@/lib/teams'
import { formatChf } from '@/lib/format'
import type { TeamPrice } from '@/lib/types'

const PHASES: TeamPrice['phase'][] = ['Weltmeister', 'Finale', 'HF', 'VF', 'AF', 'SF16', 'Gruppe']

const PHASE_LABELS: Record<TeamPrice['phase'], string> = {
  Weltmeister: '🏆 Weltmeister',
  Finale:      '🥈 Finale',
  HF:          '4️⃣ Halbfinale',
  VF:          '8️⃣ Viertelfinale',
  AF:          '1️⃣6️⃣ Achtelfinale',
  SF16:        '3️⃣2️⃣ Runde der 32',
  Gruppe:      '⚽ Gruppenphase',
}

const PHASE_ACCENT: Record<TeamPrice['phase'], string> = {
  Weltmeister: 'var(--gold)',
  Finale:      '#C0C0C0',
  HF:          '#CD7F32',
  VF:          'var(--blue)',
  AF:          'var(--long)',
  SF16:        'var(--text)',
  Gruppe:      'var(--text-dim)',
}

export default function BracketPage() {
  const { teamPrices } = useApp()

  const priceMap = useMemo(() => {
    const m: Record<string, TeamPrice> = {}
    for (const tp of teamPrices) m[tp.team_name] = tp
    return m
  }, [teamPrices])

  const byPhase = useMemo(() => {
    const map: Partial<Record<TeamPrice['phase'], typeof TEAMS[number][]>> = {}
    for (const team of TEAMS) {
      const phase = priceMap[team.name]?.phase ?? 'Gruppe'
      if (!map[phase]) map[phase] = []
      map[phase]!.push(team)
    }
    return map
  }, [priceMap])

  const hasData = teamPrices.length > 0

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 24, fontWeight: 800, color: 'var(--gold)', marginBottom: 4 }}>
        🏆 Turnier-Bracket
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 20 }}>
        Teams nach aktuellem Turnierstand
      </div>

      {!hasData && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-dim)', fontSize: 14 }}>
          Noch keine Kurse gesetzt. Admin setzt Kurse im Kurse-Panel.
        </div>
      )}

      {PHASES.map(phase => {
        const teams = byPhase[phase]
        if (!teams || teams.length === 0) return null
        const accent = PHASE_ACCENT[phase]
        return (
          <div key={phase} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ height: 2, width: 16, background: accent, borderRadius: 1 }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: accent, textTransform: 'uppercase' }}>
                {PHASE_LABELS[phase]}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                {teams.length} Team{teams.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {teams.map(team => {
                const tp = priceMap[team.name]
                return (
                  <div
                    key={team.name}
                    className="card"
                    style={{
                      padding: '10px 12px',
                      borderColor: phase === 'Weltmeister' ? 'var(--gold)' : undefined,
                      background: phase === 'Weltmeister' ? 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, var(--surface) 100%)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{team.flag}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {team.name}
                        </div>
                        <div className="tabular" style={{ fontSize: 11, color: tp ? accent : 'var(--text-dim)', fontWeight: 700 }}>
                          {tp ? formatChf(tp.price) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
