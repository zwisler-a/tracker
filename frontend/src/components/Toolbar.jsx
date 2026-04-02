import { addDays } from '../utils/dates.js'

function formatRange(startDate, dayCount) {
  const [y, m, d] = startDate.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(y, m - 1, d + dayCount - 1)
  const fmt = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return dayCount === 1
    ? start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : `${fmt(start)} – ${fmt(end)}`
}

const iconBtn = 'w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 dark:active:bg-zinc-700 transition-colors'

export default function Toolbar({ dayCount, onDayCountChange, startDate, onNavigate, onSettings, dark, onToggleDark }) {
  const navigate = (delta) => onNavigate(addDays(startDate, delta * dayCount))

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-700 shrink-0">
      <div className="flex items-center gap-1">
        <button onClick={() => navigate(-1)} className={iconBtn}>‹</button>
        <button onClick={() => navigate(1)}  className={iconBtn}>›</button>
      </div>

      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-200 text-center select-none">
        {formatRange(startDate, dayCount)}
      </span>

      <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
        {[1, 3, 7].map(n => (
          <button
            key={n}
            onClick={() => onDayCountChange(n)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              dayCount === n
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            {n}d
          </button>
        ))}
      </div>

      <button onClick={onToggleDark} className={iconBtn} title="Toggle dark mode">
        {dark ? '☀︎' : '☾'}
      </button>
      <button onClick={onSettings} className={iconBtn}>⚙</button>
    </div>
  )
}
