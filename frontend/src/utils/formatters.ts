/** Format a date string to a human-readable form */
export function formatDate(dateStr: string, locale = 'vi-VN'): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/** Format VND currency */
export function formatCurrency(amount: number, locale = 'vi-VN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'VND' }).format(amount)
}

/** Format seconds to MM:SS */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Truncate a string to a max length */
export function truncate(str: string, max = 60): string {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

/** Return initials from a full name */
export function initials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/** Map appointment status to badge variant */
export function statusVariant(status: string): 'blue' | 'green' | 'amber' | 'red' | 'gray' {
  const map: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'gray'> = {
    confirmed: 'blue',
    completed: 'green',
    pending:   'amber',
    cancelled: 'red',
  }
  return map[status] ?? 'gray'
}