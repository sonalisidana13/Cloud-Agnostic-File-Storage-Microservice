import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastList toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastList({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm text-white shadow-[0_20px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl
              ${t.type === 'success'
                ? 'border-emerald-400/20 bg-emerald-500/12'
                : 'border-red-400/20 bg-red-500/12'
              }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                t.type === 'success'
                  ? 'bg-emerald-400/20 text-emerald-200'
                  : 'bg-red-400/20 text-red-200'
              }`}
            >
              {t.type === 'success' ? 'OK' : '!'}
            </span>
            <span className="leading-6 text-slate-100">{t.message}</span>
          </div>
          <button
            onClick={() => onRemove(t.id)}
            className="shrink-0 text-slate-400 transition hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
