'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'register'

const ERRORS: Record<string, string> = {
  'Invalid login credentials':    'E-Mail oder Passwort falsch.',
  'Email not confirmed':          'E-Mail-Adresse noch nicht bestätigt.',
  'User already registered':      'Diese E-Mail ist bereits registriert.',
  'Password should be at least 6 characters': 'Passwort muss mindestens 6 Zeichen lang sein.',
  'Unable to validate email address: invalid format': 'Ungültige E-Mail-Adresse.',
  'signup is disabled':           'Registrierung ist momentan deaktiviert.',
  'email rate limit exceeded':    'Zu viele Versuche. Bitte warte kurz.',
}

function translateError(msg: string): string {
  for (const [key, val] of Object.entries(ERRORS)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return val
  }
  return msg
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--text-dim)',
  marginBottom: 8,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(translateError(error.message))
        setLoading(false)
      } else {
        router.push('/home')
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() || email.split('@')[0] } },
      })

      if (error) {
        setError(translateError(error.message))
        setLoading(false)
        return
      }

      // If email confirmation is disabled, session is immediately available
      if (data.session) {
        router.push('/home')
        return
      }

      // Fallback: try signing in right away
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) {
        setError('Konto erstellt — bitte jetzt einloggen.')
        setMode('login')
      } else {
        router.push('/home')
      }
      setLoading(false)
    }
  }

  const canSubmit =
    email.trim() !== '' &&
    password.length >= 6 &&
    (mode === 'login' || name.trim() !== '')

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
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
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
          <div style={{ marginTop: 10, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            Peer-to-Peer Trading auf WM-Teams
          </div>
        </div>

        {/* Mode toggle */}
        <div
          className="fade-up stagger-1"
          style={{
            display: 'flex',
            padding: 4,
            background: 'var(--surface)',
            borderRadius: 14,
            border: '1px solid var(--border)',
            marginBottom: 20,
          }}
        >
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 11,
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                background: mode === m ? 'var(--gold)' : 'transparent',
                color: mode === m ? '#080810' : 'var(--text-dim)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {m === 'login' ? 'Anmelden' : 'Registrieren'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="fade-up stagger-2">
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {mode === 'register' && (
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Dein Anzeigename"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>E-Mail-Adresse</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.ch"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Passwort</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mindestens 6 Zeichen' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </div>

            {error && (
              <div
                style={{
                  color: 'var(--short)',
                  fontSize: 13,
                  padding: '10px 12px',
                  background: 'var(--short-dim)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,61,61,0.2)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4 }}
            >
              {loading
                ? mode === 'login' ? 'Anmelden...' : 'Konto erstellen...'
                : mode === 'login' ? '🔑 Anmelden' : '🚀 Konto erstellen'}
            </button>
          </div>
        </form>

        {mode === 'register' && (
          <div
            className="fade-up stagger-3"
            style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.6 }}
          >
            Der erste User wird automatisch Admin.
          </div>
        )}
      </div>
    </div>
  )
}
