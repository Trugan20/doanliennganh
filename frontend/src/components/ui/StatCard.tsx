interface Props {
  label: string
  value: string | number
  icon: string
  color?: 'blue' | 'teal' | 'amber' | 'red' | 'green'
  change?: string
}

const colors = {
  blue:  'bg-dental-100 text-dental-600',
  teal:  'bg-mint-100 text-mint-600',
  amber: 'bg-amber-100 text-amber-600',
  red:   'bg-red-100 text-red-600',
  green: 'bg-emerald-100 text-emerald-600',
}

export default function StatCard({ label, value, icon, color = 'blue', change }: Props) {
  return (
    <div className="stat-card animate-slide-up">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-surface-900">{value}</p>
        <p className="text-xs font-semibold text-surface-500 mt-0.5">{label}</p>
        {change && <p className="text-xs text-emerald-600 font-medium mt-0.5">{change}</p>}
      </div>
    </div>
  )
}