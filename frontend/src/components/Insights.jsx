import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchEntries } from '../api.js'
import { todayStr, addDays } from '../utils/dates.js'
import { CategoryDonut, DailyBars, TimeHeatmap, UsageOverDays, CategoryHourProfile, HourHeatmap, WeekdayHeatmap, ConcentrationBlocks } from './InsightCharts.jsx'

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
  const [excluded, setExcluded] = useState(new Set())
  const today = todayStr()

  useEffect(() => {
    fetchEntries(addDays(today, -(days - 1)), today).then(setEntries)
  }, [days])

  const toggleExclude = (id) => setExcluded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const visible = entries.filter(e => !excluded.has(e.category_id))

  // Category totals
  const catHours = {}
  visible.forEach(e => {
    if (e.category_id) catHours[e.category_id] = (catHours[e.category_id] || 0) + 0.5
  })
  const catData = Object.entries(catHours)
    .map(([id, hours]) => ({ id, hours, name: categoryMap[id]?.name, color: categoryMap[id]?.color }))
    .filter(d => d.name)
    .sort((a, b) => b.hours - a.hours)

  // Daily data for stacked bar
  const dailyMap = {}
  visible.forEach(e => {
    if (!dailyMap[e.date]) dailyMap[e.date] = { date: e.date, label: e.date.slice(5) }
    if (e.category_id) dailyMap[e.date][e.category_id] = (dailyMap[e.date][e.category_id] || 0) + 0.5
  })
  const catIds = catData.map(d => d.id)
  const dailyData = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(row => {
      const filled = { ...row }
      catIds.forEach(id => { if (filled[id] === undefined) filled[id] = 0 })
      return filled
    })

  // Time-of-day category distribution
  const slotCatCounts = Array.from({ length: 48 }, () => ({}))
  visible.forEach(e => {
    if (e.category_id) slotCatCounts[e.slot][e.category_id] = (slotCatCounts[e.slot][e.category_id] || 0) + 1
  })

  // Weekday distribution (0=Mon … 6=Sun)
  const weekdayCatCounts = Array.from({ length: 7 }, () => ({}))
  visible.forEach(e => {
    if (!e.category_id) return
    const d = new Date(e.date + 'T12:00:00')
    const dow = (d.getDay() + 6) % 7 // shift Sun(0)→6, Mon(1)→0
    weekdayCatCounts[dow][e.category_id] = (weekdayCatCounts[dow][e.category_id] || 0) + 1
  })

  // Concentration blocks: consecutive same-category slots within a day
  const blocksByCat = {} // id → [{ slots }]
  const byDate = {}
  visible.forEach(e => {
    if (!e.category_id) return
    if (!byDate[e.date]) byDate[e.date] = []
    byDate[e.date].push(e)
  })
  Object.values(byDate).forEach(dayEntries => {
    dayEntries.sort((a, b) => a.slot - b.slot)
    let i = 0
    while (i < dayEntries.length) {
      const catId = dayEntries[i].category_id
      let j = i + 1
      while (j < dayEntries.length && dayEntries[j].category_id === catId && dayEntries[j].slot === dayEntries[j - 1].slot + 1) j++
      const len = j - i
      if (!blocksByCat[catId]) blocksByCat[catId] = []
      blocksByCat[catId].push(len)
      i = j
    }
  })

  const totalHours = visible.filter(e => e.category_id).length * 0.5
  const activeDays = new Set(visible.filter(e => e.category_id).map(e => e.date)).size
  const topCat = catData[0]

  // All categories that appear in raw entries (for filter chips)
  const allCatIds = [...new Set(entries.map(e => e.category_id).filter(Boolean))]
  const allCats = allCatIds.map(id => categoryMap[id]).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))

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
        {/* Category filter chips */}
        {allCats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allCats.map(cat => {
              const off = excluded.has(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleExclude(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    off
                      ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 line-through'
                      : 'border-transparent text-white'
                  }`}
                  style={off ? {} : { backgroundColor: cat.color }}
                >
                  {!off && <span className="w-1.5 h-1.5 rounded-full bg-white/50" />}
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}
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
        <UsageOverDays dailyData={dailyData} catData={catData} days={days} />
        <TimeHeatmap slotCatCounts={slotCatCounts} catData={catData} />
        <HourHeatmap slotCatCounts={slotCatCounts} catData={catData} />
        <WeekdayHeatmap weekdayCatCounts={weekdayCatCounts} catData={catData} />
        <ConcentrationBlocks blocksByCat={blocksByCat} catData={catData} />
        <CategoryHourProfile slotCatCounts={slotCatCounts} catData={catData} />
      </div>
    </div>
  )
}