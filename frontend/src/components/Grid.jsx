import { useEffect, useState } from 'react'
import { fetchEntries, upsertEntry } from '../api.js'
import { addDays, todayStr } from '../utils/dates.js'

const SLOTS = Array.from({ length: 48 }, (_, i) => i)
const TODAY = todayStr()

function slotToLabel(slot) {
  const h = String(Math.floor(slot / 2)).padStart(2, '0')
  return `${h}:00`
}

function formatDayHeader(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Grid({ startDate, dayCount, categories, activeCategory }) {
  const [entries, setEntries] = useState({})

  const dates = Array.from({ length: dayCount }, (_, i) => addDays(startDate, i))
  const endDate = dates[dates.length - 1]

  useEffect(() => {
    fetchEntries(startDate, endDate).then(data => {
      const map = {}
      data.forEach(e => { map[`${e.date}_${e.slot}`] = e })
      setEntries(map)
    })
  }, [startDate, endDate])

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const handleCellClick = (date, slot) => {
    if (!activeCategory) return
    const key = `${date}_${slot}`
    const current = entries[key]
    const category_id = current?.category_id === activeCategory.id ? null : activeCategory.id
    upsertEntry({ date, slot, category_id }).then(updated => {
      setEntries(prev => ({ ...prev, [key]: updated }))
    })
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="border-collapse min-w-full">
        <thead>
          <tr className="sticky top-0 z-10 bg-white">
            {/* Time gutter header */}
            <th className="w-12 border-b border-slate-200" />
            {dates.map(date => {
              const isToday = date === TODAY
              return (
                <th
                  key={date}
                  className={`border-b border-l border-slate-200 px-2 py-2 text-xs font-semibold text-center min-w-[90px] ${
                    isToday ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 bg-white'
                  }`}
                >
                  {formatDayHeader(date)}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map(slot => {
            const isHour = slot % 2 === 0
            return (
              <tr key={slot} className="h-7">
                {/* Time label — only on full hours */}
                <td className={`sticky left-0 z-10 bg-white w-12 pr-2 text-right text-[10px] leading-none select-none
                  ${isHour ? 'text-slate-400 border-t border-slate-200 align-top pt-0.5' : 'text-transparent border-t border-slate-100'}`}>
                  {isHour ? slotToLabel(slot) : '·'}
                </td>
                {dates.map(date => {
                  const entry = entries[`${date}_${slot}`]
                  const cat = entry?.category_id ? categoryMap[entry.category_id] : null
                  const isToday = date === TODAY
                  return (
                    <td
                      key={date}
                      onClick={() => handleCellClick(date, slot)}
                      className={`border-l relative transition-opacity
                        ${isHour ? 'border-t border-slate-200' : 'border-t border-slate-100'}
                        ${isToday && !cat ? 'bg-indigo-50/40' : ''}
                        ${activeCategory ? 'cursor-pointer' : 'cursor-default'}
                      `}
                      style={{ backgroundColor: cat?.color }}
                    >
                      {/* Hover overlay for paint mode */}
                      {activeCategory && !cat && (
                        <div
                          className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity"
                          style={{ backgroundColor: activeCategory.color }}
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}