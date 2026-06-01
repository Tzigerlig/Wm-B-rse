import type { Trade, TeamPrice, Debt } from '@/lib/types'

export function calcPosition(trades: Trade[], userId: string, teamName: string) {
  const confirmed = trades.filter(
    t => t.status === 'confirmed' && t.team_name === teamName
  )
  const qtyLong = confirmed
    .filter(t => t.buyer_id === userId)
    .reduce((s, t) => s + t.qty, 0)
  const qtyShort = confirmed
    .filter(t => t.seller_id === userId)
    .reduce((s, t) => s + t.qty, 0)
  return { qtyLong, qtyShort, net: qtyLong - qtyShort }
}

export function calcTradePnl(trade: Trade, userId: string, currentPrice: number | null): number {
  if (currentPrice === null) return 0
  if (trade.buyer_id === userId) {
    return (currentPrice - trade.price_per_unit) * trade.qty
  }
  if (trade.seller_id === userId) {
    return (trade.price_per_unit - currentPrice) * trade.qty
  }
  return 0
}

export function calcTeamPnl(
  trades: Trade[],
  userId: string,
  teamName: string,
  currentPrice: number | null
): number {
  return trades
    .filter(t => t.status === 'confirmed' && t.team_name === teamName)
    .reduce((sum, t) => sum + calcTradePnl(t, userId, currentPrice), 0)
}

export function calcTotalPnl(
  trades: Trade[],
  userId: string,
  teamPrices: TeamPrice[]
): number {
  const priceMap: Partial<Record<string, number>> = {}
  for (const tp of teamPrices) priceMap[tp.team_name] = tp.price

  const teams = [...new Set(trades.filter(t => t.status === 'confirmed').map(t => t.team_name))]
  return teams.reduce(
    (sum, team) => sum + calcTeamPnl(trades, userId, team, priceMap[team] ?? null),
    0
  )
}

export function calcAvgEntry(
  trades: Trade[],
  userId: string,
  teamName: string,
  side: 'long' | 'short'
): number {
  const relevant = trades.filter(
    t =>
      t.status === 'confirmed' &&
      t.team_name === teamName &&
      (side === 'long' ? t.buyer_id === userId : t.seller_id === userId)
  )
  if (!relevant.length) return 0
  const totalQty = relevant.reduce((s, t) => s + t.qty, 0)
  const totalValue = relevant.reduce((s, t) => s + t.price_per_unit * t.qty, 0)
  return totalQty > 0 ? totalValue / totalQty : 0
}

function addDebt(debts: Map<string, number>, from: string, to: string, amount: number) {
  const key = `${from}>${to}`
  debts.set(key, (debts.get(key) ?? 0) + amount)
}

function netDebtsPairwise(debts: Map<string, number>) {
  for (const key of Array.from(debts.keys())) {
    if (!debts.has(key)) continue
    const [from, to] = key.split('>')
    const reverseKey = `${to}>${from}`
    if (!debts.has(reverseKey)) continue
    const fwd = debts.get(key)!
    const rev = debts.get(reverseKey)!
    const net = fwd - rev
    if (net > 0.001) {
      debts.set(key, net)
      debts.delete(reverseKey)
    } else if (net < -0.001) {
      debts.set(reverseKey, -net)
      debts.delete(key)
    } else {
      debts.delete(key)
      debts.delete(reverseKey)
    }
  }
}

export function calcSettlement(
  trades: Trade[],
  teamPrices: TeamPrice[]
): Debt[] {
  const priceMap: Partial<Record<string, number>> = {}
  for (const tp of teamPrices) priceMap[tp.team_name] = tp.price

  const debtAmounts = new Map<string, number>()
  const debtTrades = new Map<string, Trade[]>()

  for (const trade of trades.filter(t => t.status === 'confirmed')) {
    const finalPrice = priceMap[trade.team_name]
    if (finalPrice === undefined) continue
    const diff = (finalPrice - trade.price_per_unit) * trade.qty

    let from: string, to: string
    if (diff > 0.001) {
      from = trade.seller_id
      to = trade.buyer_id
    } else if (diff < -0.001) {
      from = trade.buyer_id
      to = trade.seller_id
    } else {
      continue
    }

    const key = `${from}>${to}`
    addDebt(debtAmounts, from, to, Math.abs(diff))
    if (!debtTrades.has(key)) debtTrades.set(key, [])
    debtTrades.get(key)!.push(trade)
  }

  netDebtsPairwise(debtAmounts)

  return Array.from(debtAmounts.entries()).map(([key, amount]) => {
    const [from, to] = key.split('>')
    return { from, to, amount, trades: debtTrades.get(key) ?? [] }
  })
}
