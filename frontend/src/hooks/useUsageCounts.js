import { useState } from 'react'

const KEY = 'category_usage'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}

export function useUsageCounts() {
  const [counts, setCounts] = useState(load)

  const increment = (categoryId) => {
    setCounts(prev => {
      const next = { ...prev, [categoryId]: (prev[categoryId] ?? 0) + 1 }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  return { counts, increment }
}
