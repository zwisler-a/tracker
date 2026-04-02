import { useRef, useEffect, useState } from 'react'

export default function CategoryLegend({ categories, activeCategory, onSelect }) {
  const scrollRef = useRef(null)
  const [fades, setFades] = useState({ left: false, right: false })

  const checkFades = () => {
    const el = scrollRef.current
    if (!el) return
    setFades({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    })
  }

  useEffect(() => {
    checkFades()
  }, [categories])

  return (
    <div className="shrink-0 bg-white border-t border-slate-200">
      <div className="relative">
        {/* Fade indicators */}
        {fades.left && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        )}
        {fades.right && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollRef}
          onScroll={checkFades}
          className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.length === 0 ? (
            <span className="text-xs text-slate-400 py-1 whitespace-nowrap">
              No categories yet — add one in settings ⚙
            </span>
          ) : (
            <>
              {activeCategory ? (
                <button
                  onClick={() => onSelect(null)}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  ✕ deselect
                </button>
              ) : (
                <span className="shrink-0 text-xs text-slate-400 pr-1 whitespace-nowrap">Paint:</span>
              )}

              {categories.map(cat => {
                const isActive = activeCategory?.id === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelect(isActive ? null : cat)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'text-white shadow-sm scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    style={isActive ? { backgroundColor: cat.color } : {}}
                  >
                    {!isActive && (
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    )}
                    {cat.name}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}