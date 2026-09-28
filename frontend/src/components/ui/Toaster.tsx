import type { Toast } from '../../hooks/useToast'

const icons: Record<string, string> = {
  success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️',
}
const colors: Record<string, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error:   'border-red-200 bg-red-50 text-red-800',
  info:    'border-dental-200 bg-dental-50 text-dental-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
}

interface Props {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export default function Toaster({ toasts, onRemove }: Props) {
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-up ${colors[t.type]}`}
        >
          <span>{icons[t.type]}</span>
          <p className="text-sm font-medium flex-1">{t.message}</p>
          <button onClick={() => onRemove(t.id)} className="opacity-50 hover:opacity-100 transition text-xs">✕</button>
        </div>
      ))}
    </div>
  )
}