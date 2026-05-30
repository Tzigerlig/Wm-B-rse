'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              fontFamily: 'var(--font-barlow)',
              fontSize: 52,
              fontWeight: 800,
              color: 'var(--gold)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            WM-Börse
          </div>
          <div
            style={{
              fontFamily: 'var(--font-barlow)',
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--text-dim)',
              marginTop: 4,
            }}
          >
            2026
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              color: 'var(--text-dim)',
              lineHeight: 1.5,
            }}
          >
            Peer-to-Peer Trading auf WM-Teams
          </div>
        </div>

        {sent ? (
          <div
            className="fade-up card"
            style={{ textAlign: 'center', padding: 32 }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Magic Link gesendet!
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6 }}>
              Schau in dein Postfach unter{' '}
              <span style={{ color: 'var(--gold)' }}>{email}</span>
              <br />
              und klick auf den Link um dich einzuloggen.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="fade-up stagger-2">
            <div className="card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--text-dim)',
                    marginBottom: 8,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="deine@email.ch"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div
                  style={{
                    color: 'var(--short)',
                    fontSize: 13,
                    marginBottom: 16,
                    padding: '8px 12px',
                    background: 'var(--short-dim)',
                    borderRadius: 8,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Sende Link...' : '✉️ Magic Link senden'}
              </button>
            </div>

            <div
              style={{
                textAlign: 'center',
                marginTop: 20,
                fontSize: 13,
                color: 'var(--text-mute)',
                lineHeight: 1.6,
              }}
            >
              Kein Passwort nötig. Du bekommst einen
              <br />
              Einmal-Link per E-Mail.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
