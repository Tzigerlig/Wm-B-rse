'use client'

import { useState } from 'react'
import { useApp } from '@/components/AppProvider'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingModal() {
  const { profile, refreshProfile } = useApp()
  const [screen, setScreen] = useState(0)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!profile || done || profile.onboarding_completed) return null

  async function handleFinish() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', profile!.id)
    await refreshProfile()
    setDone(true)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 150, alignItems: 'center' }}>
      <div className="modal-sheet" style={{ borderRadius: 24, maxWidth: 380, textAlign: 'center', padding: 32 }}>
        {screen === 0 && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 26, fontWeight: 800, marginBottom: 16 }}>
              Willkommen, {profile.name}!
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 32 }}>
              Das ist eine private Trading-Börse für die WM 2026. Kein echtes Geld — alles wird am Turnierende verrechnet.
            </div>
          </>
        )}
        {screen === 1 && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📈</div>
            <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 26, fontWeight: 800, marginBottom: 20 }}>
              So funktioniert&apos;s
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, textAlign: 'left' }}>
              <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>📈</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--long)' }}>Long (Kaufen)</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Du wettest, dass das Team weit kommt</div>
                </div>
              </div>
              <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>📉</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--short)' }}>Short (Verkaufen)</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Du wettest, dass das Team früh ausscheidet</div>
                </div>
              </div>
              <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>💰</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)' }}>Endkurs je nach Runde</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>0 / 10 / 15 / 25 / 50 / 75 / 100 Fr.</div>
                </div>
              </div>
            </div>
          </>
        )}
        {screen === 2 && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🚀</div>
            <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 26, fontWeight: 800, marginBottom: 16 }}>
              Los geht&apos;s!
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 32 }}>
              Schau im <strong style={{ color: 'var(--gold)' }}>Markt-Tab</strong> nach Teams, stell <strong style={{ color: 'var(--gold)' }}>Orders ins Buch</strong>, oder mach <strong style={{ color: 'var(--gold)' }}>Direct Trades</strong> mit Freunden.
            </div>
          </>
        )}

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === screen ? 20 : 8, height: 8, borderRadius: 4,
              background: i === screen ? 'var(--gold)' : 'var(--border-strong)',
              transition: 'width 0.2s, background 0.2s',
              cursor: 'pointer',
            }} onClick={() => setScreen(i)} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {screen > 0 && (
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setScreen(s => s - 1)}>
              ← Zurück
            </button>
          )}
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={loading}
            onClick={screen < 2 ? () => setScreen(s => s + 1) : handleFinish}
          >
            {screen < 2 ? 'Weiter →' : loading ? '...' : '✓ Los geht\'s!'}
          </button>
        </div>
      </div>
    </div>
  )
}
