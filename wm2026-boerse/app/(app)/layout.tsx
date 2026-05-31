import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppProvider from '@/components/AppProvider'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import ToastContainer from '@/components/Toast'
import OnboardingModal from '@/components/OnboardingModal'
import type { Profile, Trade, Order, TeamPrice, TournamentState } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [profileRes, profilesRes, tradesRes, ordersRes, pricesRes, tournamentRes] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('*'),
      supabase
        .from('trades')
        .select(
          '*, buyer:buyer_id(id,name,avatar,color), seller:seller_id(id,name,avatar,color)'
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('*, creator:creator_id(id,name,avatar,color)')
        .order('created_at', { ascending: false }),
      supabase.from('team_prices').select('*'),
      supabase.from('tournament_state').select('*').single(),
    ])

  return (
    <AppProvider
      initialData={{
        profile: profileRes.data as Profile | null,
        profiles: (profilesRes.data ?? []) as Profile[],
        trades: (tradesRes.data ?? []) as Trade[],
        orders: (ordersRes.data ?? []) as Order[],
        teamPrices: (pricesRes.data ?? []) as TeamPrice[],
        tournament: tournamentRes.data as TournamentState | null,
      }}
    >
      <div className="app-shell">
        <TopBar />
        <main className="app-content">{children}</main>
        <BottomNav />
        <ToastContainer />
        <OnboardingModal />
      </div>
    </AppProvider>
  )
}
