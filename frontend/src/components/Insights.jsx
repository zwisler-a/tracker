import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchEntries, fetchMoods } from '../api.js'
import { todayStr, addDays } from '../utils/dates.js'
import { CategoryDonut, DailyBars, UsageOverDays, CategoryHourProfile, HourHeatmap, WeekdayHeatmap, ConcentrationBlocks, MoodOverTime, MoodCorrelation, MoodActivityBreakdown } from './InsightCharts.jsx'

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

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full py-2 group"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors">
          {title}
        </span>
        <span className="flex-1 h-px bg-slate-200 dark:bg-zinc-700" />
        <span className={`text-slate-300 dark:text-zinc-600 text-xs transition-transform duration-200 ${open ? '' : '-rotate-90'}`}>▾</span>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  )
}

export default function Insights({ categories }) {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const [entries, setEntries] = useState([])
  const [moods, setMoods] = useState([])
  const [excluded, setExcluded] = useState(new Set())
  const today = todayStr()

  useEffect(() => {
    const from = addDays(today, -(days - 1))
    Promise.all([
      fetchEntries(from, today),
      fetchMoods(from, today),
    ]).then(([ents, ms]) => {
      setEntries(ents)
      setMoods(ms)
    })
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

  // Daily data for stacked bar / line
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

  // Time-of-day distribution
  const slotCatCounts = Array.from({ length: 48 }, () => ({}))
  visible.forEach(e => {
    if (e.category_id) slotCatCounts[e.slot][e.category_id] = (slotCatCounts[e.slot][e.category_id] || 0) + 1
  })

  // Weekday distribution (0=Mon … 6=Sun)
  const weekdayCatCounts = Array.from({ length: 7 }, () => ({}))
  visible.forEach(e => {
    if (!e.category_id) return
    const d = new Date(e.date + 'T12:00:00')
    const dow = (d.getDay() + 6) % 7
    weekdayCatCounts[dow][e.category_id] = (weekdayCatCounts[dow][e.category_id] || 0) + 1
  })

  // Concentration blocks
  const blocksByCat = {}
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
      if (!blocksByCat[catId]) blocksByCat[catId] = []
      blocksByCat[catId].push(j - i)
      i = j
    }
  })

  const totalHours = visible.filter(e => e.category_id).length * 0.5
  const activeDays = new Set(visible.filter(e => e.category_id).map(e => e.date)).size
  const topCat = catData[0]

  // ── Mood data ──────────────────────────────────────────────────────────────
  // happiness = 6 - moodRaw so 5=😄 and 1=😢 (higher = better)
  const moodByDate = Object.fromEntries(moods.map(m => [m.date, m.mood]))

  // All dates: union of entry dates and mood-logged dates
  const allDatesSet = new Set([...Object.keys(dailyMap), ...moods.map(m => m.date)])
  const dailyDataWithMood = Array.from(allDatesSet)
    .sort()
    .map(date => {
      const row = dailyMap[date] || { date, label: date.slice(5) }
      const moodRaw = moodByDate[date] ?? null
      return {
        ...row,
        date,
        label: date.slice(5),
        moodRaw,
        happiness: moodRaw != null ? 6 - moodRaw : null,
        totalHours: catIds.reduce((s, id) => s + (row[id] || 0), 0),
      }
    })

  // Pearson correlation per category (happiness vs daily hours)
  const moodDaysAll = dailyDataWithMood.filter(d => d.happiness !== null)
  const catMoodCorr = catData.map(d => {
    if (moodDaysAll.length < 3) return { ...d, corr: null }
    const pairs = moodDaysAll.map(day => ({ x: day[d.id] || 0, y: day.happiness }))
    const n = pairs.length
    const mx = pairs.reduce((s, p) => s + p.x, 0) / n
    const my = pairs.reduce((s, p) => s + p.y, 0) / n
    const num = pairs.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0)
    const dx = Math.sqrt(pairs.reduce((s, p) => s + (p.x - mx) ** 2, 0))
    const dy = Math.sqrt(pairs.reduce((s, p) => s + (p.y - my) ** 2, 0))
    const corr = dx * dy > 0 ? num / (dx * dy) : 0
    return { ...d, corr: +corr.toFixed(2) }
  }).filter(d => d.corr !== null)

  // Group days by mood level for activity comparison
  const moodGroups = { good: [], neutral: [], poor: [] }
  dailyDataWithMood.forEach(day => {
    if (day.happiness === null) return
    if (day.happiness >= 4) moodGroups.good.push(day)
    else if (day.happiness === 3) moodGroups.neutral.push(day)
    else moodGroups.poor.push(day)
  })

  // Average mood summary
  const avgMoodRaw = moods.length > 0 ? moods.reduce((s, m) => s + m.mood, 0) / moods.length : null
  const avgHappiness = avgMoodRaw != null ? +(6 - avgMoodRaw).toFixed(1) : null

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
      <div className="flex-1 overflow-auto p-4 space-y-4">

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

        {/* ── Summary ── */}
        <Section title="Summary">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Hours tracked" value={totalHours.toFixed(1)} sub={`last ${days} days`} />
            <StatCard label="Active days" value={activeDays} sub={`of ${days}`} />
            <StatCard
              label="Top category"
              value={topCat?.name ?? '—'}
              sub={topCat ? `${topCat.hours.toFixed(1)}h` : 'no data'}
              accent={topCat?.color}
            />
            <StatCard
              label="Avg mood"
              value={avgHappiness != null ? (['', '😢', '😔', '😐', '🙂', '😄'][Math.round(avgHappiness)]) : '—'}
              sub={moods.length > 0 ? `${moods.length} day${moods.length !== 1 ? 's' : ''} tracked` : 'no mood data'}
            />
          </div>
          <CategoryDonut catData={catData} totalHours={totalHours} />
        </Section>

        {/* ── Activity ── */}
        <Section title="Activity over time">
          <DailyBars dailyData={dailyData} catData={catData} days={days} />
          <UsageOverDays dailyData={dailyData} catData={catData} days={days} />
        </Section>

        {/* ── Patterns ── */}
        <Section title="Patterns">
          <HourHeatmap slotCatCounts={slotCatCounts} catData={catData} />
          <WeekdayHeatmap weekdayCatCounts={weekdayCatCounts} catData={catData} />
          <CategoryHourProfile slotCatCounts={slotCatCounts} catData={catData} />
        </Section>

        {/* ── Focus ── */}
        <Section title="Focus & flow">
          <ConcentrationBlocks blocksByCat={blocksByCat} catData={catData} />
        </Section>

        {/* ── Mood ── */}
        <Section title="Mood & correlation">
          <MoodOverTime dailyDataWithMood={dailyDataWithMood} />
          <MoodCorrelation catMoodCorr={catMoodCorr} />
          <MoodActivityBreakdown moodGroups={moodGroups} catData={catData} />
        </Section>

      </div>
    </div>
  )
}