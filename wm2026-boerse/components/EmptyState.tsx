export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 48 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>{title}</div>
      {description && (
        <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 280 }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
