'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/format'
import { useApp } from '@/components/AppProvider'
import type { TradeMessage } from '@/lib/types'

export default function TradeChat({ tradeId }: { tradeId: string }) {
  const { profile } = useApp()
  const [messages, setMessages] = useState<TradeMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('trade_messages')
      .select('*, sender:sender_id(name,avatar,color)')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as TradeMessage[])
      })

    const channel = supabase
      .channel(`trade-chat-${tradeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trade_messages', filter: `trade_id=eq.${tradeId}` },
        async payload => {
          const { data } = await supabase
            .from('trade_messages')
            .select('*, sender:sender_id(name,avatar,color)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages(prev => [...prev, data as TradeMessage])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tradeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || !profile || sending) return
    setSending(true)
    setInput('')
    const supabase = createClient()
    await supabase.from('trade_messages').insert({ trade_id: tradeId, sender_id: profile.id, message: text })
    setSending(false)
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: 10 }}>
        CHAT
      </div>

      <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: '16px 0' }}>
            Noch keine Nachrichten
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === profile?.id
          const sender = msg.sender as { name: string; avatar: string; color: string } | undefined
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: sender?.color ?? 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                {sender?.avatar}
              </div>
              <div style={{ maxWidth: '70%' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 3, textAlign: isMe ? 'right' : 'left' }}>
                  {isMe ? 'Du' : sender?.name} · {timeAgo(msg.created_at)}
                </div>
                <div style={{ padding: '8px 12px', borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: isMe ? 'var(--gold)' : 'var(--surface)', color: isMe ? '#080810' : 'var(--text)', fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {msg.message}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Nachricht..."
          value={input}
          onChange={e => setInput(e.target.value.slice(0, 500))}
          onKeyDown={e => e.key === 'Enter' && send()}
          style={{ flex: 1, fontSize: 13, padding: '9px 12px' }}
        />
        <button
          className="btn btn-primary"
          onClick={send}
          disabled={!input.trim() || sending}
          style={{ flexShrink: 0, padding: '9px 16px', fontSize: 13 }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}
