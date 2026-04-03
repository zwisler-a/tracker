import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchEntries } from '../api.js'
import { todayStr, addDays } from '../utils/dates.js'
import { CategoryDonut, DailyBars, TimeHeatmap } from './InsightCharts.jsx'

const RANGES = [7, 30, 90]

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-4 flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold truncate ${accent ? '' : 'text-slate-800 dark:text-zinc-100'}`} style={accent ? { color: accent } : {}}>
        {value}
      </span>
      {sub && <span className="text-xs text-slate-400 dark:text-zinc-500">{sub}</span>}
    </div>
  )
}

export default function Insights({ categories }) {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const [entries, setEntries] = useState([])
  const today = todayStr()

  useEffect(() => {
    fetchEntries(addDays(today, -(days - 1)), today).then(setEntries)
  }, [days])

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  // Category totals
  const catHours = {}
  entries.forEach(e => {
    if (e.category_id) catHours[e.category_id] = (catHours[e.category_id] || 0) + 0.5
  })
  const catData = Object.entries(catHours)
    .map(([id, hours]) => ({ id, hours, name: categoryMap[id]?.name, color: categoryMap[id]?.color }))
    .filter(d => d.name)
    .sort((a, b) => b.hours - a.hours)

  // Daily data for stacked bar
  const dailyMap = {}
  entries.forEach(e => {
    if (!dailyMap[e.date]) dailyMap[e.date] = { date: e.date, label: e.date.slice(5) }
    if (e.category_id) dailyMap[e.date][e.category_id] = (dailyMap[e.date][e.category_id] || 0) + 0.5
  })
  const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  // Time-of-day category distribution
  const slotCatCounts = Array.from({ length: 48 }, () => ({}))
  entries.forEach(e => {
    if (e.category_id) slotCatCounts[e.slot][e.category_id] = (slotCatCounts[e.slot][e.category_id] || 0) + 1
  })

  const totalHours = entries.filter(e => e.category_id).length * 0.5
  const activeDays = new Set(entries.filter(e => e.category_id).map(e => e.date)).size
  const topCat = catData[0]

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-700 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-lg leading-none"
        >
          ‹
        </button>
        <h1 className="font-semibold text-slate-800 dark:text-zinc-100">Insights</h1>
        <div className="ml-auto flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                days === r
                  ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Hours tracked" value={totalHours.toFixed(1)} sub={`last ${days} days`} />
          <StatCard label="Active days" value={activeDays} sub={`of ${days}`} />
          <StatCard
            label="Top category"
            value={topCat?.name ?? '—'}
            sub={topCat ? `${topCat.hours.toFixed(1)}h` : 'no data'}
            accent={topCat?.color}
          />
        </div>

        <CategoryDonut catData={catData} totalHours={totalHours} />
        <DailyBars dailyData={dailyData} catData={catData} days={days} />
        <TimeHeatmap slotCatCounts={slotCatCounts} catData={catData} />
      </div>
    </div>
  )
}