'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Profile, Trade, Order, TeamPrice, TournamentState } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' }

type AppContextType = {
  profile: Profile | null
  profiles: Profile[]
  trades: Trade[]
  orders: Order[]
  teamPrices: TeamPrice[]
  tournament: TournamentState | null
  isLive: boolean
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  refreshTrades: () => Promise<void>
  refreshOrders: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

type InitialData = {
  profile: Profile | null
  profiles: Profile[]
  trades: Trade[]
  orders: Order[]
  teamPrices: TeamPrice[]
  tournament: TournamentState | null
}

export default function AppProvider({
  initialData,
  children,
}: {
  initialData: InitialData
  children: React.ReactNode
}) {
  const [profile] = useState(initialData.profile)
  const [profiles] = useState(initialData.profiles)
  const [trades, setTrades] = useState<Trade[]>(initialData.trades)
  const [orders, setOrders] = useState<Order[]>(initialData.orders)
  const [teamPrices, setTeamPrices] = useState<TeamPrice[]>(initialData.teamPrices)
  const [tournament, setTournament] = useState(initialData.tournament)
  const [isLive, setIsLive] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [toastId, setToastId] = useState(0)

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random()
    setToastId(id)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const refreshTrades = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('trades')
      .select('*, buyer:buyer_id(id,name,avatar,color), seller:seller_id(id,name,avatar,color)')
      .order('created_at', { ascending: false })
    if (data) setTrades(data as Trade[])
  }, [])

  const refreshOrders = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select('*, creator:creator_id(id,name,avatar,color)')
      .order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('realtime-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refreshOrders()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => {
        refreshTrades()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_prices' },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setTeamPrices(prev => {
              const next = prev.filter(p => p.team_name !== (payload.new as TeamPrice).team_name)
              return [...next, payload.new as TeamPrice]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournament_state' },
        payload => {
          setTournament(payload.new as TournamentState)
        }
      )
      .subscribe(status => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshOrders, refreshTrades])

  // Suppress unused warning
  void toastId

  return (
    <AppContext.Provider
      value={{
        profile,
        profiles,
        trades,
        orders,
        teamPrices,
        tournament,
        isLive,
        toasts,
        addToast,
        refreshTrades,
        refreshOrders,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
