export function formatChf(amount: number, opts: { sign?: boolean; compact?: boolean } = {}): string {
  const abs = Math.abs(amount)
  const formatted = opts.compact && abs >= 1000
    ? (abs / 1000).toFixed(1) + 'k'
    : abs.toFixed(2)
  const sign = amount < 0 ? '−' : opts.sign ? '+' : ''
  return `${sign}${formatted} Fr.`
}

export function formatPnl(amount: number): string {
  return formatChf(amount, { sign: true })
}

export function pnlColor(amount: number): string {
  if (amount > 0) return 'var(--long)'
  if (amount < 0) return 'var(--short)'
  return 'var(--text-dim)'
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
