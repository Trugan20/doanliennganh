import { useAuth } from '../../context/AuthContext'

interface Props { title: string }

export default function Navbar({ title }: Props) {
  const { user } = useAuth()
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header className="h-16 bg-white border-b border-surface-100 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="font-display font-bold text-xl text-surface-900">{title}</h1>
        <p className="text-xs text-surface-400">{now}</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-xl hover:bg-surface-100 transition text-surface-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M15 17H20L18.595 15.595A1 1 0 0118 14.816V11a6 6 0 10-12 0v3.816a1 1 0 01-.405.784L4 17H9M15 17V18a3 3 0 11-6 0V17M15 17H9"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-dental-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-dental flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0) || '?'}
          </div>
          <span className="text-sm font-semibold text-surface-700">{user?.name}</span>
        </div>
      </div>
    </header>
  )
}