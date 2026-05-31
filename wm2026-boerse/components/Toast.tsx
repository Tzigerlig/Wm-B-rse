'use client'

import { useApp } from '@/components/AppProvider'

const PREFIX = { success: '✓', error: '✗', info: 'ℹ' } as const

export default function ToastContainer() {
  const { toasts } = useApp()
  if (!toasts.length) return null
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 448,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast-enter"
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background:
              toast.type === 'success' ? 'rgba(0,200,83,0.18)'
              : toast.type === 'error' ? 'rgba(255,61,61,0.18)'
              : 'rgba(41,121,255,0.18)',
            border: `1px solid ${
              toast.type === 'success' ? 'rgba(0,200,83,0.4)'
              : toast.type === 'error' ? 'rgba(255,61,61,0.4)'
              : 'rgba(41,121,255,0.4)'
            }`,
            color:
              toast.type === 'success' ? 'var(--long)'
              : toast.type === 'error' ? 'var(--short)'
              : 'var(--blue)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>{PREFIX[toast.type]}</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
