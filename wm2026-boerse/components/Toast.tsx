'use client'

import { useApp } from '@/components/AppProvider'

export default function ToastContainer() {
  const { toasts } = useApp()

  if (!toasts.length) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
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
          className="fade-up"
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            background:
              toast.type === 'success'
                ? 'rgba(0,200,83,0.15)'
                : toast.type === 'error'
                  ? 'rgba(255,61,61,0.15)'
                  : 'rgba(255,255,255,0.08)',
            border: `1px solid ${
              toast.type === 'success'
                ? 'rgba(0,200,83,0.3)'
                : toast.type === 'error'
                  ? 'rgba(255,61,61,0.3)'
                  : 'var(--border)'
            }`,
            color:
              toast.type === 'success'
                ? 'var(--long)'
                : toast.type === 'error'
                  ? 'var(--short)'
                  : 'var(--text)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            pointerEvents: 'auto',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
