import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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

const MENU_ITEMS = [
  { label: 'Insights', icon: '◎', path: '/insights' },
  { label: 'Categories', icon: '⊞', path: '/categories' },
  { label: 'Settings', icon: '⚙', path: '/settings' },
]

const iconBtn = 'w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 dark:active:bg-zinc-700 transition-colors'

export default function Toolbar({ dayCount, onDayCountChange, startDate, onNavigate }) {
  const navigate = useNavigate()
  const shift = (delta) => onNavigate(addDays(startDate, delta * dayCount))
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-700 shrink-0">
      <div className="flex items-center gap-1">
        <button onClick={() => shift(-1)} className={iconBtn}>‹</button>
        <button onClick={() => shift(1)}  className={iconBtn}>›</button>
      </div>

      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-200 text-center select-none">
        {formatRange(startDate, dayCount)}
      </span>

      <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
        {[1, 3, 7].map(n => (
          <button key={n} onClick={() => onDayCountChange(n)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              dayCount === n
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >{n}d</button>
        ))}
      </div>

      <div ref={menuRef} className="relative">
        <button onClick={() => setOpen(v => !v)} className={`${iconBtn} ${open ? 'bg-slate-100 dark:bg-zinc-800' : ''}`}>
          ···
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden z-50">
            {MENU_ITEMS.map(item => (
              <button
                key={item.path}
                onClick={() => { setOpen(false); navigate(item.path) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="text-slate-400 dark:text-zinc-500 w-4 text-center">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}