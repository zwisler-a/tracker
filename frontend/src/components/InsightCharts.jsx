import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

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
          <span className="font-semibold text-slate-800 dark:text-zinc-100 ml-auto pl-3">{p.value}</span>
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

  // Raw distribution: % of category total per hour
  const rawData = hourRows.map(row => {
    const point = { label: row.label }
    catData.forEach(d => {
      const total = catTotals[d.id]
      point[d.id] = total > 0 ? (row[d.id] || 0) / total * 100 : 0
    })
    return point
  })

  // Peak-normalise: scale each category so its max = 100
  const catPeaks = {}
  catData.forEach(d => {
    catPeaks[d.id] = Math.max(...rawData.map(r => r[d.id]), 1)
  })
  const data = rawData.map(row => {
    const point = { label: row.label }
    catData.forEach(d => {
      point[d.id] = +(row[d.id] / catPeaks[d.id] * 100).toFixed(1)
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
              <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={v => v === 100 ? 'peak' : v === 50 ? '50%' : ''} />
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

function UsageTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value > 0).sort((a, b) => b.value - a.value)
  if (!items.length) return null
  return (
    <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-slate-500 dark:text-zinc-400">{label}</p>
      {items.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600 dark:text-zinc-300">{p.name}</span>
          <span className="font-semibold text-slate-800 dark:text-zinc-100 ml-auto pl-3">{p.value?.toFixed(1)}h</span>
        </div>
      ))}
    </div>
  )
}

function HourTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-500 dark:text-zinc-400 mb-1">{label}:00 – {label}:59</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
        <span className="text-slate-600 dark:text-zinc-300">{p.name}</span>
        <span className="font-semibold text-slate-800 dark:text-zinc-100 ml-auto pl-3">{p.value?.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export function CategoryHourProfile({ slotCatCounts, catData }) {
  const [selectedId, setSelectedId] = useState(() => catData[0]?.id ?? null)

  // Keep selectedId valid when catData changes
  const selected = catData.find(d => d.id === selectedId) ?? catData[0]

  const hourData = Array.from({ length: 24 }, (_, h) => {
    const count = (slotCatCounts[h * 2][selected?.id] || 0) + (slotCatCounts[h * 2 + 1][selected?.id] || 0)
    return { h, label: String(h).padStart(2, '0'), count }
  })

  const total = hourData.reduce((s, r) => s + r.count, 0)
  const data = hourData.map(r => ({ ...r, pct: total > 0 ? +(r.count / total * 100).toFixed(1) : 0 }))
  const peak = data.reduce((best, r) => r.pct > best.pct ? r : best, data[0])

  if (catData.length === 0) {
    return (
      <div className={card}>
        <p className={sectionLabel}>Peak Hour by Category</p>
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">No data yet</p>
      </div>
    )
  }

  return (
    <div className={card}>
      <p className={sectionLabel}>Peak Hour by Category</p>

      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {catData.map(d => {
          const active = d.id === selected?.id
          return (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                active
                  ? 'border-transparent text-white'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400'
              }`}
              style={active ? { backgroundColor: d.color } : {}}
            >
              {active && <span className="w-1.5 h-1.5 rounded-full bg-white/50" />}
              {d.name}
            </button>
          )
        })}
      </div>

      {/* Peak annotation */}
      {total > 0 && (
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">
          Peak: <span className="font-semibold" style={{ color: selected?.color }}>{peak.label}:00 – {peak.label}:59</span>
          <span className="ml-1 text-slate-400 dark:text-zinc-500">({peak.pct.toFixed(1)}% of activity)</span>
        </p>
      )}

      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} barSize={8} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" interval={3} />
          <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" tickFormatter={v => `${v}%`} />
          <Tooltip content={<HourTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          {total > 0 && <ReferenceLine x={peak.label} stroke={selected?.color} strokeDasharray="3 3" strokeOpacity={0.6} />}
          <Bar dataKey="pct" name={selected?.name} radius={[3, 3, 0, 0]}>
            {data.map(r => (
              <Cell key={r.h} fill={selected?.color} fillOpacity={r.h === peak.h && total > 0 ? 1 : 0.35} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HourHeatmap({ slotCatCounts, catData }) {
  const [tooltip, setTooltip] = useState(null) // { cat, h, pct, x, y }

  if (catData.length === 0) {
    return (
      <div className={card}>
        <p className={sectionLabel}>Hour Heatmap</p>
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">No data yet</p>
      </div>
    )
  }

  // Per-category, per-hour counts and peak-normalised intensity
  const rows = catData.map(d => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      h,
      count: (slotCatCounts[h * 2][d.id] || 0) + (slotCatCounts[h * 2 + 1][d.id] || 0),
    }))
    const total = hours.reduce((s, r) => s + r.count, 0)
    const peak = Math.max(...hours.map(r => r.count), 1)
    return {
      ...d,
      hours: hours.map(r => ({
        ...r,
        intensity: r.count / peak,
        pct: total > 0 ? +(r.count / total * 100).toFixed(1) : 0,
      })),
      total,
    }
  })

  const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'))

  return (
    <div className={card}>
      <p className={sectionLabel}>Hour Heatmap</p>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 520 }}>
          {/* Hour axis */}
          <div className="flex mb-1 pl-20">
            {HOURS.map((h, i) => (
              <div key={h} className="flex-1 text-center text-[9px] text-slate-400 dark:text-zinc-500 leading-none">
                {i % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map(row => (
            <div key={row.id} className="flex items-center mb-1 gap-1">
              {/* Category label */}
              <div className="w-20 shrink-0 flex items-center gap-1.5 overflow-hidden">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                <span className="text-[11px] text-slate-600 dark:text-zinc-300 truncate leading-none">{row.name}</span>
              </div>

              {/* Cells */}
              {row.hours.map(cell => (
                <div
                  key={cell.h}
                  className="flex-1 h-6 rounded-sm cursor-default relative"
                  style={{
                    backgroundColor: row.color,
                    opacity: row.total === 0 ? 0.08 : Math.max(cell.intensity * 0.9 + 0.1, cell.intensity === 0 ? 0.05 : 0.1),
                  }}
                  onMouseEnter={e => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({ cat: row.name, color: row.color, h: cell.h, pct: cell.pct, count: cell.count, rect })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}

          {/* Bottom axis repeated for scrolled views */}
          <div className="flex mt-1 pl-20">
            {HOURS.map((h, i) => (
              <div key={h} className="flex-1 text-center text-[9px] text-slate-400 dark:text-zinc-500 leading-none">
                {i % 6 === 0 ? h : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip (portal-style fixed overlay) */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs"
          style={{ left: tooltip.rect.left + tooltip.rect.width / 2, top: tooltip.rect.top - 8, transform: 'translate(-50%, -100%)' }}
        >
          <p className="font-semibold text-slate-500 dark:text-zinc-400 mb-1">
            {String(tooltip.h).padStart(2, '0')}:00 – {String(tooltip.h).padStart(2, '0')}:59
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tooltip.color }} />
            <span className="text-slate-600 dark:text-zinc-300">{tooltip.cat}</span>
            <span className="font-semibold text-slate-800 dark:text-zinc-100 ml-auto pl-3">{tooltip.pct}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function UsageOverDays({ dailyData, catData, days }) {
  const hasData = dailyData.length > 0

  return (
    <div className={card}>
      <p className={sectionLabel}>Usage Over Days</p>
      {!hasData
        ? <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">No data yet</p>
        : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" />
              <Tooltip content={<UsageTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.15)', strokeWidth: 1 }} />
              {catData.map(d => (
                <Line key={d.id} type="monotone" dataKey={d.id} name={d.name} stroke={d.color} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )
      }
    </div>
  )
}