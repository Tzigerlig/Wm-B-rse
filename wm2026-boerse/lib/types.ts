export type Profile = {
  id: string
  name: string
  avatar: string
  color: string
  is_admin: boolean
  onboarding_completed: boolean
  created_at: string
}

export type TeamPrice = {
  team_name: string
  phase: 'Gruppe' | 'SF16' | 'AF' | 'VF' | 'HF' | 'Finale' | 'Weltmeister'
  price: number
  set_at: string
  set_by: string | null
}

export type Order = {
  id: string
  creator_id: string
  side: 'buy' | 'sell'
  team_name: string
  qty: number
  price_per_unit: number
  note: string | null
  status: 'open' | 'accepted' | 'cancelled'
  accepted_by: string | null
  accepted_at: string | null
  created_at: string
  creator?: Profile
}

export type Trade = {
  id: string
  buyer_id: string
  seller_id: string
  team_name: string
  qty: number
  price_per_unit: number
  proposed_by: string
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled'
  from_order_id: string | null
  confirmed_at: string | null
  rejected_at: string | null
  created_at: string
  buyer?: Profile
  seller?: Profile
}

export type TradeMessage = {
  id: string
  trade_id: string
  sender_id: string
  message: string
  created_at: string
  sender?: { name: string; avatar: string; color: string }
}

export type TournamentState = {
  id: 1
  ended: boolean
  ended_at: string | null
}

export type Debt = {
  from: string
  to: string
  amount: number
  trades: Trade[]
}

export const PHASE_PRICES: Record<TeamPrice['phase'], number> = {
  Gruppe: 0,
  SF16: 10,
  AF: 15,
  VF: 25,
  HF: 50,
  Finale: 75,
  Weltmeister: 100,
}
