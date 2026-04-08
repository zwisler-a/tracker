import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const card = 'bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-4'
const sectionLabel = 'text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-3'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs space-y-1">
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-600 dark:text-zinc-300">{p.name}</span>
          <span className="font-semibold text-slate-800 dark:text-zinc-100 ml-auto pl-3">{p.value?.toFixed(1)}h</span>
        </div>
      ))}
    </div>
  )
}

export function CategoryDonut({ catData, totalHours }) {
  return (
    <div className={card}>
      <p className={sectionLabel}>By Category</p>
      {catData.length === 0
        ? <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">No data yet</p>
        : (
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={catData} dataKey="hours" innerRadius={38} outerRadius={62} paddingAngle={3} startAngle={90} endAngle={450}>
                    {catData.map(d => <Cell key={d.id} fill={d.color} stroke="transparent" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {catData.map(d => (
                <div key={d.id} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-slate-700 dark:text-zinc-200 flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 shrink-0">{d.hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
    </div>
  )
}

export function DailyBars({ dailyData, catData, days }) {
  const barSize = days <= 7 ? 22 : days <= 30 ? 10 : 4
  return (
    <div className={card}>
      <p className={sectionLabel}>Daily Activity</p>
      {dailyData.length === 0
        ? <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">No data yet</p>
        : (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={dailyData} barSize={barSize} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              {catData.map(d => <Bar key={d.id} dataKey={d.id} name={d.name} stackId="a" fill={d.color} radius={catData.indexOf(d) === catData.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />)}
            </BarChart>
          </ResponsiveContainer>
        )
      }
    </div>
  )
}

function TimeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value > 0).sort((a, b) => b.value - a.value)
  if (!items.length) return null
  return (
    <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-slate-500 dark:text-zinc-400">{label}:00</p>
      {items.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-600 dark:text-zinc-300">{p.name}</span>
          <span className="font-semibold text-slate-800 dark:text-zinc-100 ml-auto pl-3">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

export function TimeHeatmap({ slotCatCounts, catData }) {
  // Merge two half-hour slots into one hour bucket
  const hourRows = Array.from({ length: 24 }, (_, h) => {
    const merged = {}
    ;[slotCatCounts[h * 2], slotCatCounts[h * 2 + 1]].forEach(slot => {
      Object.entries(slot).forEach(([id, n]) => { merged[id] = (merged[id] || 0) + n })
    })
    return { h, label: String(h).padStart(2, '0'), ...merged }
  })

  // Total count per category across all hours (for normalisation)
  const catTotals = {}
  catData.forEach(d => {
    catTotals[d.id] = hourRows.reduce((s, row) => s + (row[d.id] || 0), 0)
  })

  // Each data point: what % of a category's total occurred in this hour
  const data = hourRows.map(row => {
    const point = { label: row.label }
    catData.forEach(d => {
      const total = catTotals[d.id]
      point[d.id] = total > 0 ? +((row[d.id] || 0) / total * 100).toFixed(1) : 0
    })
    return point
  })

  const hasData = catData.some(d => catTotals[d.id] > 0)

  return (
    <div className={card}>
      <p className={sectionLabel}>Time of Day</p>
      {!hasData
        ? <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">No data yet</p>
        : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" interval={3} />
              <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" tickFormatter={v => `${v}%`} />
              <Tooltip content={<TimeTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.15)', strokeWidth: 1 }} />
              {catData.map(d => (
                <Area key={d.id} type="monotone" dataKey={d.id} name={d.name} stroke={d.color} fill={d.color} fillOpacity={0.15} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )
      }
    </div>
  )
}