interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-surface-500 hover:bg-surface-100 disabled:opacity-30 transition"
      >
        ‹
      </button>

      {visible.reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis')
        acc.push(p)
        return acc
      }, []).map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-surface-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition ${
              page === p ? 'bg-dental-600 text-white shadow-sm' : 'text-surface-600 hover:bg-surface-100'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-surface-500 hover:bg-surface-100 disabled:opacity-30 transition"
      >
        ›
      </button>
    </div>
  )
}