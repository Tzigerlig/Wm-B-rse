'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/AppProvider'
import { createClient } from '@/lib/supabase/client'
import { TEAMS } from '@/lib/teams'
import { formatChf } from '@/lib/format'
import type { TeamPrice } from '@/lib/types'

const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PW ?? 'wm2026admin'
const PHASES: TeamPrice['phase'][] = ['Gruppe', 'SF16', 'AF', 'VF', 'HF', 'Finale', 'Weltmeister']
const PHASE_PRICES: Record<TeamPrice['phase'], number> = {
  Gruppe: 0, SF16: 10, AF: 15, VF: 25, HF: 50, Finale: 75, Weltmeister: 100,
}

type AdminTab = 'kurse' | 'accounts' | 'turnier' | 'reset'

export default function AdminPage() {
  const { profile, profiles, teamPrices, tournament, addToast } = useApp()
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [tab, setTab] = useState<AdminTab>('kurse')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (profile && !profile.is_admin) router.push('/home')
  }, [profile, router])

  const priceMap = useMemo(() => {
    const m: Record<string, TeamPrice> = {}
    for (const tp of teamPrices) m[tp.team_name] = tp
    return m
  }, [teamPrices])

  async function handleSetPrice(teamName: string, phase: TeamPrice['phase']) {
    if (!profile) return
    setLoadingId(teamName)
    const supabase = createClient()
    const price = PHASE_PRICES[phase]
    const { error } = await supabase.from('team_prices').upsert({
      team_name: teamName,
      phase,
      price,
      set_at: new Date().toISOString(),
      set_by: profile.id,
    }, { onConflict: 'team_name' })
    if (error) addToast('Fehler beim Setzen des Kurses', 'error')
    else addToast(`${teamName} → ${phase} (${formatChf(price)})`, 'success')
    setLoadingId(null)
  }

  async function handleToggleAdmin(userId: string, current: boolean) {
    setLoadingId(userId)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId)
    if (error) addToast('Fehler', 'error')
    else addToast(`Admin-Rechte ${!current ? 'vergeben' : 'entzogen'}`, 'success')
    setLoadingId(null)
  }

  async function handleToggleTournament() {
    const supabase = createClient()
    const nowEnded = !tournament?.ended
    const { error } = await supabase.from('tournament_state').update({
      ended: nowEnded,
      ended_at: nowEnded ? new Date().toISOString() : null,
    }).eq('id', 1)
    if (error) addToast('Fehler', 'error')
    else addToast(`Turnier ${nowEnded ? 'beendet' : 'wieder geöffnet'}`, nowEnded ? 'info' : 'success')
  }

  async function handleReset() {
    if (!confirm('⚠️ Wirklich alle Trades, Orders und Kurse löschen? Das ist NICHT umkehrbar!')) return
    if (!confirm('Bist du absolut sicher? ALLE Daten werden gelöscht.')) return
    const supabase = createClient()
    await Promise.all([
      supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('team_prices').delete().neq('team_name', ''),
      supabase.from('tournament_state').update({ ended: false, ended_at: null }).eq('id', 1),
    ])
    addToast('Reset durchgeführt', 'info')
  }

  if (!profile?.is_admin) return null

  if (!authenticated) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>
          ⚙️ Admin Panel
        </div>
        <div className="card" style={{ padding: 24, width: '100%', maxWidth: 380 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Admin-Passwort
          </label>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Passwort eingeben..."
            onKeyDown={e => { if (e.key === 'Enter' && pw === ADMIN_PW) setAuthenticated(true) }}
          />
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => {
              if (pw === ADMIN_PW) setAuthenticated(true)
              else addToast('Falsches Passwort', 'error')
            }}
          >
            Entsperren
          </button>
        </div>
      </div>
    )
  }

  const adminTabs: { id: AdminTab; label: string }[] = [
    { id: 'kurse',    label: '⚽ Kurse'   },
    { id: 'accounts', label: '👥 Accounts'},
    { id: 'turnier',  label: '🏁 Turnier' },
    { id: 'reset',    label: '⚙️ Reset'   },
  ]

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 24, fontWeight: 800, color: 'var(--gold)', marginBottom: 16 }}>
        ⚙️ Admin Panel
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {adminTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: tab === t.id ? 'var(--gold)' : 'var(--surface)',
              color: tab === t.id ? '#080810' : 'var(--text-dim)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Kurse setzen */}
      {tab === 'kurse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TEAMS.map(team => {
            const current = priceMap[team.name]
            return (
              <div key={team.name} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{team.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{team.name}</div>
                  {current && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {current.phase} · {formatChf(current.price)}
                    </div>
                  )}
                </div>
                <select
                  value={current?.phase ?? ''}
                  disabled={loadingId === team.name}
                  style={{ width: 120, padding: '6px 10px', fontSize: 12 }}
                  onChange={e => handleSetPrice(team.name, e.target.value as TeamPrice['phase'])}
                >
                  <option value="" disabled>Phase wählen</option>
                  {PHASES.map(phase => (
                    <option key={phase} value={phase}>
                      {phase} ({formatChf(PHASE_PRICES[phase])})
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}

      {/* Accounts */}
      {tab === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profiles.map(p => (
            <div key={p.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {p.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                {p.is_admin && <div style={{ fontSize: 11, color: 'var(--gold)' }}>Admin</div>}
              </div>
              <button
                className={`btn ${p.is_admin ? 'btn-ghost' : 'btn-confirm'}`}
                style={{ fontSize: 12, padding: '6px 12px' }}
                disabled={p.id === profile.id || loadingId === p.id}
                onClick={() => handleToggleAdmin(p.id, p.is_admin)}
              >
                {p.is_admin ? 'Admin entziehen' : 'Admin machen'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Turnier Status */}
      {tab === 'turnier' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
            Turnier-Status
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 20 }}>
            Aktuell: <strong style={{ color: tournament?.ended ? 'var(--short)' : 'var(--long)' }}>
              {tournament?.ended ? '🏁 Beendet' : '🟢 Läuft'}
            </strong>
          </div>
          {tournament?.ended && (
            <div style={{ fontSize: 12, color: 'var(--orange)', padding: '8px 12px', background: 'var(--orange-dim)', borderRadius: 8, marginBottom: 16 }}>
              ⚠️ Alle Trade-Erstellungen sind gesperrt. Settlement ist final.
            </div>
          )}
          <button
            className={`btn ${tournament?.ended ? 'btn-confirm' : 'btn-reject'}`}
            style={{ width: '100%' }}
            onClick={handleToggleTournament}
          >
            {tournament?.ended ? '▶️ Turnier wieder öffnen' : '🏁 Turnier beenden'}
          </button>
        </div>
      )}

      {/* Reset */}
      {tab === 'reset' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: 'var(--short)' }}>
            ⚠️ Komplett-Reset
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 20, lineHeight: 1.6 }}>
            Löscht alle Trades, Orders und Team-Kurse. Diese Aktion ist nicht umkehrbar.
            User-Accounts bleiben erhalten.
          </div>
          <button
            className="btn btn-reject"
            style={{ width: '100%' }}
            onClick={handleReset}
          >
            🗑️ Alles zurücksetzen
          </button>
        </div>
      )}
    </div>
  )
}
