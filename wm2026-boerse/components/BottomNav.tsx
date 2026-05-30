'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/components/AppProvider'

const tabs = [
  { href: '/home',       icon: '🏠', label: 'Home'      },
  { href: '/markt',      icon: '📈', label: 'Markt'     },
  { href: '/portfolio',  icon: '💼', label: 'Portfolio' },
  { href: '/trades',     icon: '🤝', label: 'Trades'    },
  { href: '/settlement', icon: '⚖️', label: 'Settlement'},
]

export default function BottomNav() {
  const pathname = usePathname()
  const { trades, profile } = useApp()

  const pendingCount = trades.filter(
    t => t.status === 'pending' &&
      ((t.buyer_id === profile?.id && t.proposed_by !== profile?.id) ||
       (t.seller_id === profile?.id && t.proposed_by !== profile?.id))
  ).length

  return (
    <nav className="bottom-nav">
      <div
        style={{
          display: 'flex',
          padding: '6px 0',
        }}
      >
        {tabs.map(tab => {
          const active = pathname.startsWith(tab.href)
          const showBadge = tab.href === '/trades' && pendingCount > 0

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '4px 0',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  style={{
                    fontSize: 22,
                    filter: active ? 'none' : 'grayscale(0.7) opacity(0.5)',
                    transition: 'filter 0.15s',
                  }}
                >
                  {tab.icon}
                </span>
                {showBadge && (
                  <span
                    className="badge"
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      fontSize: 9,
                      minWidth: 15,
                      height: 15,
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: active ? 'var(--gold)' : 'var(--text-mute)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'color 0.15s',
                }}
              >
                {tab.label}
              </span>
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -6,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--gold)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
