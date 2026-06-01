'use client'

import { TEAMS } from '@/lib/teams'
import { formatChf, timeAgo } from '@/lib/format'
import type { Trade } from '@/lib/types'

const STATUS_CONFIG = {
  confirmed: { label: 'Bestätigt',  color: 'var(--long)',     bg: 'var(--long-dim)'  },
  pending:   { label: 'Ausstehend', color: 'var(--gold)',     bg: 'var(--gold-dim)'  },
  cancelled: { label: 'Storniert',  color: 'var(--text-dim)', bg: 'var(--surface)'   },
  rejected:  { label: 'Abgelehnt', color: 'var(--short)',    bg: 'var(--short-dim)' },
}

export default function TradeDetailModal({
  trade,
  myId,
  onClose,
}: {
  trade: Trade
  myId: string
  onClose: () => void
}) {
  const team = TEAMS.find(t => t.name === trade.team_name)
  const isBuyer = trade.buyer_id === myId
  const partner = isBuyer
    ? (trade.seller as { name: string; avatar: string; color: string } | undefined)
    : (trade.buyer  as { name: string; avatar: string; color: string } | undefined)
  const total = trade.qty * trade.price_per_unit
  const status = STATUS_CONFIG[trade.status]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32 }}>{team?.flag}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-barlow)', fontSize: 20, fontWeight: 800 }}>
                {trade.team_name}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, color: status.color, background: status.bg }}>
                {status.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Seite</span>
            <span style={{ fontWeight: 700, color: isBuyer ? 'var(--long)' : 'var(--short)' }}>
              {isBuyer ? '▲ Long (Kauf)' : '▼ Short (Verkauf)'}
            </span>
          </div>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Menge × Preis</span>
            <span className="tabular" style={{ fontWeight: 700 }}>
              {trade.qty}× @ {formatChf(trade.price_per_unit)}
            </span>
          </div>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', background: 'var(--gold-dim)', borderColor: 'rgba(255,215,0,0.2)' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Gesamtwert</span>
            <span className="tabular" style={{ fontWeight: 800, color: 'var(--gold)', fontSize: 16 }}>
              {formatChf(total)}
            </span>
          </div>
          {partner && (
            <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Gegenpartei</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: partner.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                  {partner.avatar}
                </div>
                <span style={{ fontWeight: 600 }}>{partner.name}</span>
              </div>
            </div>
          )}
          <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Erstellt</span>
            <span style={{ fontSize: 13 }}>{timeAgo(trade.created_at)}</span>
          </div>
          {trade.confirmed_at && (
            <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Bestätigt</span>
              <span style={{ fontSize: 13 }}>{timeAgo(trade.confirmed_at)}</span>
            </div>
          )}
        </div>

        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  )
}
