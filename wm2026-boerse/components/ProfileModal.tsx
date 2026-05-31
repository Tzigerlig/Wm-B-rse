'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/AppProvider'
import { createClient } from '@/lib/supabase/client'

const AVATARS = ['🦁', '🦊', '🐺', '🐯', '🦅', '🦈', '🐙', '🐉', '⚽', '🏆', '🎯', '🚀']

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, refreshProfile } = useApp()
  const router = useRouter()
  const [name, setName] = useState(profile?.name ?? '')
  const [avatar, setAvatar] = useState(profile?.avatar ?? '🦁')
  const [loading, setLoading] = useState(false)

  if (!profile) return null

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ name: name.trim() || profile!.name, avatar }).eq('id', profile!.id)
    await refreshProfile()
    setLoading(false)
    onClose()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 22, fontWeight: 800 }}>Profil</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Avatar preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: profile.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, border: '3px solid var(--gold)' }}>
            {avatar}
          </div>
        </div>

        {/* Avatar picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Avatar wählen</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)} style={{
                aspectRatio: '1', borderRadius: 10, fontSize: 24, cursor: 'pointer',
                border: `2px solid ${avatar === a ? 'var(--gold)' : 'var(--border)'}`,
                background: avatar === a ? 'var(--gold-dim)' : 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Anzeigename</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" />
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 10 }} disabled={loading} onClick={handleSave}>
          {loading ? 'Speichern...' : '✓ Speichern'}
        </button>
        <button className="btn btn-reject" style={{ width: '100%' }} onClick={handleLogout}>
          Abmelden
        </button>
      </div>
    </div>
  )
}
