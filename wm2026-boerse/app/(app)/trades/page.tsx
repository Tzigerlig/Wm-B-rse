'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/components/AppProvider'
import EmptyState from '@/components/EmptyState'
import CreateTradeModal from '@/components/CreateTradeModal'
import { createClient } from '@/lib/supabase/client'
import { formatChf, formatDate } from '@/lib/format'
import { TEAMS } from '@/lib/teams'

type OrderFilter = 'all' | 'mine'

export default function TradesPage() {
  const { trades, orders, profile, profiles, tournament, addToast, refreshTrades, refreshOrders } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const pendingForMe = useMemo(
    () =>
      trades.filter(
        t =>
          t.status === 'pending' &&
          ((t.buyer_id === profile?.id && t.proposed_by !== profile?.id) ||
            (t.seller_id === profile?.id && t.proposed_by !== profile?.id))
      ),
    [trades, profile]
  )

  const myPending = useMemo(
    () =>
      trades.filter(
        t =>
          t.status === 'pending' &&
          (t.buyer_id === profile?.id || t.seller_id === profile?.id) &&
          t.proposed_by === profile?.id
      ),
    [trades, profile]
  )

  const openOrders = useMemo(
    () => orders.filter(o => o.status === 'open' &&
      (orderFilter === 'all' || o.creator_id === profile?.id)),
    [orders, orderFilter, profile]
  )

  async function handleConfirmTrade(tradeId: string, action: 'confirmed' | 'rejected') {
    setLoadingId(tradeId)
    const supabase = createClient()
    const { error } = await supabase
      .from('trades')
      .update({
        status: action,
        [action === 'confirmed' ? 'confirmed_at' : 'rejected_at']: new Date().toISOString(),
      })
      .eq('id', tradeId)

    if (error) {
      addToast('Fehler beim Aktualisieren', 'error')
    } else {
      addToast(action === 'confirmed' ? '✓ Trade bestätigt' : '✕ Trade abgelehnt', action === 'confirmed' ? 'success' : 'info')
      await refreshTrades()
    }
    setLoadingId(null)
  }

  async function handleCancelTrade(tradeId: string) {
    setLoadingId(tradeId)
    const supabase = createClient()
    const { error } = await supabase.from('trades').update({ status: 'cancelled' }).eq('id', tradeId)
    if (error) {
      addToast('Fehler beim Zurückziehen', 'error')
    } else {
      addToast('Trade zurückgezogen', 'info')
      await refreshTrades()
    }
    setLoadingId(null)
  }

  async function handleAcceptOrder(orderId: string, order: { side: 'buy' | 'sell'; team_name: string; qty: number; price_per_unit: number; creator_id: string }) {
    if (!profile) return
    setLoadingId(orderId)
    const supabase = createClient()

    const { data, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'accepted', accepted_by: profile.id, accepted_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'open')
      .select()
      .single()

    if (updateError || !data) {
      addToast('Order nicht mehr verfügbar', 'error')
      await refreshOrders()
      setLoadingId(null)
      return
    }

    const buyer_id = order.side === 'buy' ? order.creator_id : profile.id
    const seller_id = order.side === 'sell' ? order.creator_id : profile.id

    const { error: tradeError } = await supabase.from('trades').insert({
      buyer_id,
      seller_id,
      team_name: order.team_name,
      qty: order.qty,
      price_per_unit: order.price_per_unit,
      proposed_by: order.creator_id,
      status: 'pending',
      from_order_id: orderId,
    })

    if (tradeError) {
      addToast('Fehler beim Erstellen des Trades', 'error')
    } else {
      addToast('Order akzeptiert — Trade erstellt', 'success')
      await Promise.all([refreshOrders(), refreshTrades()])
    }
    setLoadingId(null)
  }

  async function handleCancelOrder(orderId: string) {
    setLoadingId(orderId)
    const supabase = createClient()
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    if (error) {
      addToast('Fehler', 'error')
    } else {
      addToast('Order zurückgezogen', 'info')
      await refreshOrders()
    }
    setLoadingId(null)
  }

  function getProfileName(id: string) {
    return profiles.find(p => p.id === id)?.name ?? 'Unbekannt'
  }

  return (
    <div style={{ padding: '16px 16px 8px' }}>

      {/* A: Pending for me */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-header" style={{ paddingInline: 0, marginTop: 0 }}>
          ⏳ Wartet auf meine Bestätigung
          {pendingForMe.length > 0 && (
            <span className="badge" style={{ marginLeft: 8 }}>{pendingForMe.length}</span>
          )}
        </div>
        {pendingForMe.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-mute)', padding: '8px 0' }}>Keine</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingForMe.map(t => {
              const iAmBuyer = t.buyer_id === profile?.id
              const proposerName = getProfileName(t.proposed_by)
              const team = TEAMS.find(x => x.name === t.team_name)
              return (
                <div key={t.id} className="card" style={{ padding: '14px 16px', borderColor: 'var(--orange-dim)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 22 }}>{team?.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        <strong>{proposerName}</strong> will dir{' '}
                        <strong>{t.qty}×</strong> {t.team_name} für{' '}
                        <strong>{formatChf(t.price_per_unit)}/Stück</strong>{' '}
                        {iAmBuyer ? 'verkaufen' : 'abkaufen'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                        {formatDate(t.created_at)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-confirm"
                      style={{ flex: 1, padding: '10px' }}
                      disabled={loadingId === t.id}
                      onClick={() => handleConfirmTrade(t.id, 'confirmed')}
                    >
                      ✓ Bestätigen
                    </button>
                    <button
                      className="btn btn-reject"
                      style={{ flex: 1, padding: '10px' }}
                      disabled={loadingId === t.id}
                      onClick={() => handleConfirmTrade(t.id, 'rejected')}
                    >
                      ✕ Ablehnen
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* B: My submitted trades */}
      {myPending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-header" style={{ paddingInline: 0 }}>⏰ Meine eingereichten Trades</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myPending.map(t => {
              const iAmBuyer = t.buyer_id === profile?.id
              const partnerName = getProfileName(iAmBuyer ? t.seller_id : t.buyer_id)
              const team = TEAMS.find(x => x.name === t.team_name)
              return (
                <div key={t.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{team?.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {iAmBuyer ? '▲ Kaufe' : '▼ Verkaufe'} {t.qty}× {t.team_name} @ {formatChf(t.price_per_unit)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                      Warte auf {partnerName}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '6px 10px', fontSize: 12 }}
                    disabled={loadingId === t.id}
                    onClick={() => handleCancelTrade(t.id)}
                  >
                    Zurückziehen
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* C: Open orders */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-header" style={{ paddingInline: 0, marginTop: 0, marginBottom: 0 }}>📋 Offene Orders</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'mine'] as const).map(f => (
              <button
                key={f}
                onClick={() => setOrderFilter(f)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: orderFilter === f ? 'var(--gold)' : 'var(--surface)',
                  color: orderFilter === f ? '#080810' : 'var(--text-dim)',
                }}
              >
                {f === 'all' ? 'Alle' : 'Meine'}
              </button>
            ))}
          </div>
        </div>

        {openOrders.length === 0 ? (
          <EmptyState icon="📋" title="Keine offenen Orders" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 80 }}>
            {openOrders.map(order => {
              const team = TEAMS.find(t => t.name === order.team_name)
              const isOwn = order.creator_id === profile?.id
              return (
                <div key={order.id} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isOwn && !tournament?.ended ? 10 : 0 }}>
                    <span style={{ fontSize: 22 }}>{team?.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: order.side === 'buy' ? 'var(--long)' : 'var(--short)', fontWeight: 700, fontSize: 12 }}>
                          {order.side === 'buy' ? '▲ KAUFE' : '▼ VERKAUFE'}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{order.team_name}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                        {order.qty}× @ {formatChf(order.price_per_unit)} · {(order.creator as { name: string } | undefined)?.name ?? '?'}
                      </div>
                      {order.note && (
                        <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2, fontStyle: 'italic' }}>
                          &ldquo;{order.note}&rdquo;
                        </div>
                      )}
                    </div>
                    {!isOwn && !tournament?.ended && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 12px', fontSize: 12 }}
                        disabled={loadingId === order.id}
                        onClick={() => handleAcceptOrder(order.id, order)}
                      >
                        Akzeptieren
                      </button>
                    )}
                  </div>
                  {isOwn && (
                    <button
                      className="btn btn-ghost"
                      style={{ width: '100%', padding: '8px', fontSize: 12 }}
                      disabled={loadingId === order.id}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Order zurückziehen
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      {!tournament?.ended && (
        <button className="fab" onClick={() => setShowCreate(true)}>+</button>
      )}

      {showCreate && <CreateTradeModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
