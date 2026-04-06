import { useEffect, useRef, useState } from 'react'
import { fetchEntries, upsertEntry, fetchMoods, upsertMood } from '../api.js'
import { addDays, todayStr } from '../utils/dates.js'

const MOODS = [null, '😄', '🙂', '😐', '😔', '😢']

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

export default function Grid({ startDate, dayCount, categories, activeCategory, onPaint }) {
  const [entries, setEntries] = useState({})
  const [moods, setMoods] = useState({})
  const isDragging = useRef(false)
  const paintMode = useRef('paint') // 'paint' | 'erase'

  const dates = Array.from({ length: dayCount }, (_, i) => addDays(startDate, i))
  const endDate = dates[dates.length - 1]

  useEffect(() => {
    fetchEntries(startDate, endDate).then(data => {
      const map = {}
      data.forEach(e => { map[`${e.date}_${e.slot}`] = e })
      setEntries(map)
    })
    fetchMoods(startDate, endDate).then(data => {
      const map = {}
      data.forEach(m => { map[m.date] = m.mood })
      setMoods(map)
    })
  }, [startDate, endDate])

  const handleMoodChange = (e, date) => {
    const next = e.target.value === '' ? null : Number(e.target.value)
    setMoods(prev => ({ ...prev, [date]: next }))
    upsertMood({ date, mood: next })
  }

  useEffect(() => {
    const stop = () => { isDragging.current = false }
    document.addEventListener('mouseup', stop)
    return () => document.removeEventListener('mouseup', stop)
  }, [])

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const applyCell = (date, slot) => {
    if (!activeCategory) return
    const key = `${date}_${slot}`
    const category_id = paintMode.current === 'erase' ? null : activeCategory.id
    setEntries(prev => ({ ...prev, [key]: { date, slot, category_id } }))
    upsertEntry({ date, slot, category_id })
    if (category_id != null) onPaint(category_id)
  }

  const handleMouseDown = (e, date, slot) => {
    if (!activeCategory) return
    e.preventDefault()
    const key = `${date}_${slot}`
    const isSame = entries[key]?.category_id === activeCategory.id
    paintMode.current = isSame ? 'erase' : 'paint'
    isDragging.current = true
    applyCell(date, slot)
  }

  const handleMouseEnter = (date, slot) => {
    if (!isDragging.current) return
    applyCell(date, slot)
  }

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900 select-none">
      <table className="border-collapse min-w-full">
        <thead>
          <tr className="sticky top-0 z-10 bg-white dark:bg-zinc-900">
            <th className="w-12 border-b border-slate-200 dark:border-zinc-700" />
            {dates.map(date => {
              const isToday = date === TODAY
              const mood = moods[date] ?? 0
              return (
                <th
                  key={date}
                  className={`border-b border-l border-slate-200 dark:border-zinc-700 px-2 py-1 text-xs font-semibold text-center min-w-[90px] ${
                    isToday
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'text-slate-500 dark:text-zinc-400'
                  }`}
                >
                  <div>{formatDayHeader(date)}</div>
                  <select
                    value={mood || ''}
                    onMouseDown={e => e.stopPropagation()}
                    onChange={e => handleMoodChange(e, date)}
                    className="mt-0.5 text-base leading-none bg-transparent border-none outline-none cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <option value="">·</option>
                    {MOODS.slice(1).map((emoji, i) => (
                      <option key={i + 1} value={i + 1}>{emoji}</option>
                    ))}
                  </select>
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
                <td className={`sticky left-0 z-10 bg-white dark:bg-zinc-900 w-12 pr-2 text-right text-[10px] leading-none select-none
                  ${isHour
                    ? 'text-slate-400 dark:text-zinc-500 border-t border-slate-200 dark:border-zinc-700 align-top pt-0.5'
                    : 'text-transparent border-t border-slate-100 dark:border-zinc-800'}`}
                >
                  {isHour ? slotToLabel(slot) : '·'}
                </td>
                {dates.map(date => {
                  const entry = entries[`${date}_${slot}`]
                  const cat = entry?.category_id ? categoryMap[entry.category_id] : null
                  const isToday = date === TODAY
                  return (
                    <td
                      key={date}
                      onMouseDown={e => handleMouseDown(e, date, slot)}
                      onMouseEnter={() => handleMouseEnter(date, slot)}
                      className={`border-l relative
                        ${isHour
                          ? 'border-t border-slate-200 dark:border-zinc-700'
                          : 'border-t border-slate-100 dark:border-zinc-800'}
                        ${isToday && !cat ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}
                        ${activeCategory ? 'cursor-crosshair' : 'cursor-default'}
                      `}
                      style={{ backgroundColor: cat?.color }}
                    >
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