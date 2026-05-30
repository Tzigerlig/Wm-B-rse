'use client'

import { useApp } from '@/components/AppProvider'

export default function TopBar({ title }: { title?: string }) {
  const { profile, isLive } = useApp()

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,8,16,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-barlow)',
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--gold)',
          letterSpacing: '-0.01em',
        }}
      >
        {title ?? 'WM-Börse'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Live indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10,
            color: isLive ? 'var(--long)' : 'var(--text-mute)',
            fontWeight: 600,
          }}
        >
          <div
            className={isLive ? 'pulse-dot' : ''}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isLive ? 'var(--long)' : 'var(--text-mute)',
            }}
          />
          {isLive ? 'LIVE' : 'OFFLINE'}
        </div>

        {/* Avatar */}
        {profile && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: profile.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              border: '2px solid var(--border-strong)',
            }}
          >
            {profile.avatar}
          </div>
        )}
      </div>
    </header>
  )
}
