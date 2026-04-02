import { useState } from 'react'

const QUICK_COUNT = 4


export default function CategoryLegend({ categories, activeCategory, onSelect, usageCounts }) {
  const [open, setOpen] = useState(false)

  // Sort by usage descending for quick picks
  const sorted = [...categories].sort((a, b) => (usageCounts[b.id] ?? 0) - (usageCounts[a.id] ?? 0))

  // Quick bar: active category always included, fill rest from top used
  const quickCats = activeCategory
    ? [activeCategory, ...sorted.filter(c => c.id !== activeCategory.id)].slice(0, QUICK_COUNT)
    : sorted.slice(0, QUICK_COUNT)

  const hasMore = categories.length > QUICK_COUNT

  const handleSelect = (cat) => {
    onSelect(activeCategory?.id === cat.id ? null : cat)
    setOpen(false)
  }

  return (
    <>
      <div className="shrink-0 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700 px-2 py-2 flex items-center gap-1.5">
        {categories.length === 0 ? (
          <span className="flex-1 text-xs text-slate-400 dark:text-zinc-500 text-center py-1">
            No categories yet — add one in ⚙ settings
          </span>
        ) : (
          <>
            {quickCats.map(cat => {
              const isActive = activeCategory?.id === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelect(isActive ? null : cat)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium transition-all min-w-0 ${
                    isActive ? 'text-white shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                  style={isActive ? { backgroundColor: cat.color } : {}}
                >
                  {!isActive && (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  )}
                  <span className="truncate">{cat.name}</span>
                </button>
              )
            })}

            {/* More button */}
            {hasMore && (
              <button
                onClick={() => setOpen(true)}
                className="w-10 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors shrink-0 text-sm"
              >
                ···
              </button>
            )}
          </>
        )}
      </div>

      {/* Full sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
            </div>
            <div className="px-4 pb-2 pt-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">All categories</span>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="px-3 pb-8 grid grid-cols-2 gap-2">
              {sorted.map(cat => {
                const isActive = activeCategory?.id === cat.id
                const count = usageCounts[cat.id] ?? 0
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelect(cat)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-left transition-all ${
                      isActive ? 'text-white shadow-md' : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                    style={isActive ? { backgroundColor: cat.color } : {}}
                  >
                    {!isActive && <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
                    <span className="flex-1 truncate">{cat.name}</span>
                    {count > 0 && (
                      <span className={`text-xs shrink-0 ${isActive ? 'text-white/70' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
