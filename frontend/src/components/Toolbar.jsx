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

export default function Toolbar({ dayCount, onDayCountChange, startDate, onNavigate, onSettings }) {
  const navigate = (delta) => onNavigate(addDays(startDate, delta * dayCount))

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-200 shrink-0">
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          ‹
        </button>
        <button
          onClick={() => navigate(1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Date range */}
      <span className="flex-1 text-sm font-medium text-slate-700 text-center">
        {formatRange(startDate, dayCount)}
      </span>

      {/* Day count toggle */}
      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
        {[1, 3, 7].map(n => (
          <button
            key={n}
            onClick={() => onDayCountChange(n)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              dayCount === n
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {n}d
          </button>
        ))}
      </div>

      {/* Settings */}
      <button
        onClick={onSettings}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors text-base"
      >
        ⚙
      </button>
    </div>
  )
}
