import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, LineChart, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

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

function fmtDur(slots) {
  const h = Math.floor(slots / 2)
  const m = slots % 2 === 1 ? '30' : '00'
  return h > 0 ? (m === '00' ? `${h}h` : `${h}h ${m}m`) : `${m}m`
}

export function ConcentrationBlocks({ blocksByCat, catData }) {
  const [selectedId, setSelectedId] = useState(() => catData[0]?.id ?? null)
  const selected = catData.find(d => d.id === selectedId) ?? catData[0]

  if (catData.length === 0) {
    return (
      <div className={card}>
        <p className={sectionLabel}>Concentration Blocks</p>
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">No data yet</p>
      </div>
    )
  }

  // Per-category summary stats
  const stats = catData.map(d => {
    const blocks = blocksByCat[d.id] ?? []
    const total = blocks.reduce((s, b) => s + b, 0)
    const avg = blocks.length ? total / blocks.length : 0
    const max = blocks.length ? Math.max(...blocks) : 0
    return { ...d, count: blocks.length, avg, max }
  })

  // Distribution histogram for selected category (bucket by slot count)
  const blocks = blocksByCat[selected?.id] ?? []
  const maxLen = blocks.length ? Math.max(...blocks) : 0
  const buckets = Array.from({ length: maxLen }, (_, i) => ({
    slots: i + 1,
    label: fmtDur(i + 1),
    count: blocks.filter(b => b === i + 1).length,
  })).filter(b => b.count > 0 || b.slots <= maxLen)

  // Build a full 1..maxLen distribution for the bar chart (include zeros so the axis is continuous)
  const distData = maxLen > 0
    ? Array.from({ length: Math.min(maxLen, 32) }, (_, i) => ({
        slots: i + 1,
        label: fmtDur(i + 1),
        count: blocks.filter(b => b === i + 1).length,
      }))
    : []

  const selectedStats = stats.find(s => s.id === selected?.id)

  return (
    <div className={card}>
      <p className={sectionLabel}>Concentration Blocks</p>

      {/* Per-category summary rows */}
      <div className="space-y-2 mb-4">
        {stats.map(s => {
          const active = s.id === selected?.id
          const barW = s.max > 0 ? (s.avg / s.max) * 100 : 0
          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`w-full text-left rounded-xl p-2.5 border transition-all ${
                active
                  ? 'border-transparent shadow-sm'
                  : 'border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 hover:border-slate-200 dark:hover:border-zinc-700'
              }`}
              style={active ? { backgroundColor: s.color + '18', borderColor: s.color + '55' } : {}}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-200 flex-1 truncate">{s.name}</span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 shrink-0">{s.count} block{s.count !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${barW}%`, backgroundColor: s.color }} />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 shrink-0 w-24 text-right">
                  avg {fmtDur(Math.round(s.avg))} · max {fmtDur(s.max)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Distribution chart for selected */}
      {distData.length > 0 && (
        <>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mb-2">
            Block length distribution —{' '}
            <span className="font-semibold" style={{ color: selected?.color }}>{selected?.name}</span>
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={distData} barSize={Math.max(6, Math.min(20, Math.floor(260 / distData.length)))} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" interval={distData.length > 12 ? Math.ceil(distData.length / 8) - 1 : 0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs">
                      <p className="font-semibold text-slate-500 dark:text-zinc-400 mb-1">{d.label} blocks</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selected?.color }} />
                        <span className="text-slate-600 dark:text-zinc-300">{selected?.name}</span>
                        <span className="font-semibold text-slate-800 dark:text-zinc-100 ml-auto pl-3">{d.count}×</span>
                      </div>
                    </div>
                  )
                }}
                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} fill={selected?.color} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function WeekdayHeatmap({ weekdayCatCounts, catData }) {
  const [tooltip, setTooltip] = useState(null)

  if (catData.length === 0) {
    return (
      <div className={card}>
        <p className={sectionLabel}>Weekday Distribution</p>
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">No data yet</p>
      </div>
    )
  }

  const rows = catData.map(d => {
    const days = WEEKDAYS.map((label, i) => ({
      i,
      label,
      count: weekdayCatCounts[i][d.id] || 0,
    }))
    const total = days.reduce((s, r) => s + r.count, 0)
    const peak = Math.max(...days.map(r => r.count), 1)
    return {
      ...d,
      days: days.map(r => ({
        ...r,
        intensity: r.count / peak,
        pct: total > 0 ? +(r.count / total * 100).toFixed(1) : 0,
      })),
      total,
    }
  })

  return (
    <div className={card}>
      <p className={sectionLabel}>Weekday Distribution</p>

      {/* Header row */}
      <div className="flex mb-1 pl-20 gap-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="flex-1 text-center text-[10px] font-medium text-slate-400 dark:text-zinc-500">{d}</div>
        ))}
      </div>

      {rows.map(row => (
        <div key={row.id} className="flex items-center mb-1 gap-1">
          <div className="w-20 shrink-0 flex items-center gap-1.5 overflow-hidden">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
            <span className="text-[11px] text-slate-600 dark:text-zinc-300 truncate leading-none">{row.name}</span>
          </div>
          {row.days.map(cell => (
            <div
              key={cell.i}
              className="flex-1 h-7 rounded-sm cursor-default"
              style={{
                backgroundColor: row.color,
                opacity: row.total === 0 ? 0.08 : Math.max(cell.intensity * 0.9 + 0.1, cell.intensity === 0 ? 0.05 : 0.1),
              }}
              onMouseEnter={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltip({ cat: row.name, color: row.color, label: cell.label, pct: cell.pct, rect })
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </div>
      ))}

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs"
          style={{ left: tooltip.rect.left + tooltip.rect.width / 2, top: tooltip.rect.top - 8, transform: 'translate(-50%, -100%)' }}
        >
          <p className="font-semibold text-slate-500 dark:text-zinc-400 mb-1">{tooltip.label}</p>
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

// ── Mood charts ─────────────────────────────────────────────────────────────

const HAPPINESS_EMOJIS = ['', '😢', '😔', '😐', '🙂', '😄'] // index = happiness (1-5)

function MoodTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const hoursEntry = payload.find(p => p.dataKey === 'totalHours')
  const moodEntry = payload.find(p => p.dataKey === 'happiness')
  return (
    <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-slate-500 dark:text-zinc-400">{label}</p>
      {moodEntry?.value != null && (
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{HAPPINESS_EMOJIS[Math.round(moodEntry.value)]}</span>
          <span className="text-slate-600 dark:text-zinc-300">Mood</span>
        </div>
      )}
      {hoursEntry?.value > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-slate-600 dark:text-zinc-300">Activity</span>
          <span className="font-semibold ml-auto pl-3">{hoursEntry.value.toFixed(1)}h</span>
        </div>
      )}
    </div>
  )
}

export function MoodOverTime({ dailyDataWithMood }) {
  const hasMood = dailyDataWithMood.some(d => d.happiness !== null)

  return (
    <div className={card}>
      <p className={sectionLabel}>Mood Over Time</p>
      {!hasMood
        ? <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">No mood data yet — log your mood in the grid view</p>
        : (
          <>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mb-2">
              Bars = total tracked hours &nbsp;·&nbsp; Line = mood &nbsp;·&nbsp; {HAPPINESS_EMOJIS[5]} great &nbsp;→&nbsp; {HAPPINESS_EMOJIS[1]} rough
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={dailyDataWithMood} margin={{ top: 4, right: 28, left: -28, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" interval="preserveStartEnd" />
                <YAxis yAxisId="hours" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" />
                <YAxis
                  yAxisId="mood"
                  orientation="right"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                  className="text-slate-400 dark:text-zinc-500"
                  tickFormatter={v => HAPPINESS_EMOJIS[v] || ''}
                  width={22}
                />
                <Tooltip content={<MoodTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar yAxisId="hours" dataKey="totalHours" fill="#6366f1" fillOpacity={0.2} radius={[2, 2, 0, 0]} />
                <Line yAxisId="mood" type="monotone" dataKey="happiness" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )
      }
    </div>
  )
}

export function MoodCorrelation({ catMoodCorr }) {
  if (catMoodCorr.length === 0) {
    return (
      <div className={card}>
        <p className={sectionLabel}>Activity → Mood Correlation</p>
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">Need at least 3 days of mood data</p>
      </div>
    )
  }

  const sorted = [...catMoodCorr].sort((a, b) => b.corr - a.corr)
  const chartHeight = Math.max(sorted.length * 40 + 20, 80)

  return (
    <div className={card}>
      <p className={sectionLabel}>Activity → Mood Correlation</p>
      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mb-3">
        Positive = more of this activity tends to coincide with better mood
      </p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart layout="vertical" data={sorted} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <XAxis
            type="number"
            domain={[-1, 1]}
            tick={{ fontSize: 9, fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
            className="text-slate-400 dark:text-zinc-500"
            ticks={[-1, -0.5, 0, 0.5, 1]}
            tickFormatter={v => v === 0 ? '0' : v > 0 ? `+${v}` : String(v)}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
            className="text-slate-600 dark:text-zinc-300"
            width={80}
          />
          <ReferenceLine x={0} stroke="currentColor" strokeOpacity={0.15} className="text-slate-400 dark:text-zinc-600" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              const sign = d.corr > 0 ? '+' : ''
              const color = d.corr > 0.1 ? '#22c55e' : d.corr < -0.1 ? '#ef4444' : '#94a3b8'
              return (
                <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="font-medium text-slate-700 dark:text-zinc-200">{d.name}</span>
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400">
                    r = <span className="font-semibold" style={{ color }}>{sign}{d.corr}</span>
                  </p>
                </div>
              )
            }}
            cursor={{ fill: 'rgba(99,102,241,0.06)' }}
          />
          <Bar dataKey="corr" radius={[0, 3, 3, 0]}>
            {sorted.map(d => (
              <Cell
                key={d.id}
                fill={d.corr > 0.1 ? '#22c55e' : d.corr < -0.1 ? '#ef4444' : '#94a3b8'}
                fillOpacity={0.5 + Math.min(Math.abs(d.corr) * 0.5, 0.5)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MoodActivityBreakdown({ moodGroups, catData }) {
  const groups = [
    { key: 'good',    label: '😄 Good',    days: moodGroups.good },
    { key: 'neutral', label: '😐 Neutral',  days: moodGroups.neutral },
    { key: 'poor',    label: '😔 Poor',     days: moodGroups.poor },
  ].filter(g => g.days.length > 0)

  const hasVariety = groups.length >= 2

  if (!hasVariety) {
    return (
      <div className={card}>
        <p className={sectionLabel}>Activity on Good vs Bad Days</p>
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">Need mood data across different days</p>
      </div>
    )
  }

  const data = groups.map(g => {
    const row = { label: g.label, _count: g.days.length }
    catData.forEach(d => {
      row[d.id] = g.days.length > 0
        ? +(g.days.reduce((s, day) => s + (day[d.id] || 0), 0) / g.days.length).toFixed(2)
        : 0
    })
    return row
  })

  return (
    <div className={card}>
      <p className={sectionLabel}>Activity on Good vs Bad Days</p>
      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mb-3">Average hours per category by mood level</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" />
          <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} className="text-slate-400 dark:text-zinc-500" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const items = payload.filter(p => p.value > 0).sort((a, b) => b.value - a.value)
              const row = payload[0]?.payload
              return (
                <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl px-3 py-2 shadow-lg text-xs space-y-1">
                  <p className="font-semibold text-slate-500 dark:text-zinc-400">{label} <span className="font-normal">({row?._count} day{row?._count !== 1 ? 's' : ''})</span></p>
                  {items.map(p => (
                    <div key={p.dataKey} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                      <span className="text-slate-600 dark:text-zinc-300">{p.name}</span>
                      <span className="font-semibold ml-auto pl-3">{p.value?.toFixed(1)}h</span>
                    </div>
                  ))}
                </div>
              )
            }}
            cursor={{ fill: 'rgba(99,102,241,0.06)' }}
          />
          {catData.map((d, i) => (
            <Bar
              key={d.id}
              dataKey={d.id}
              name={d.name}
              stackId="a"
              fill={d.color}
              radius={i === catData.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}