import { useState, useEffect } from 'react'
import { fetchCategories } from './api.js'
import { todayStr, addDays } from './utils/dates.js'
import Grid from './components/Grid.jsx'
import Toolbar from './components/Toolbar.jsx'
import CategoryLegend from './components/CategoryLegend.jsx'
import Settings from './components/Settings.jsx'

function startForDayCount(dayCount) {
  return addDays(todayStr(), -Math.floor(dayCount / 2))
}

export default function App() {
  const [view, setView] = useState('grid')
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [dayCount, setDayCount] = useState(3)
  const [startDate, setStartDate] = useState(() => startForDayCount(3))

  const loadCategories = () => fetchCategories().then(setCategories)

  useEffect(() => { loadCategories() }, [])

  const handleDayCountChange = (n) => {
    setDayCount(n)
    setStartDate(startForDayCount(n))
  }

  if (view === 'settings') {
    return (
      <Settings
        categories={categories}
        onBack={() => { setView('grid'); loadCategories() }}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Toolbar
        dayCount={dayCount}
        onDayCountChange={handleDayCountChange}
        startDate={startDate}
        onNavigate={setStartDate}
        onSettings={() => setView('settings')}
      />
      <Grid
        startDate={startDate}
        dayCount={dayCount}
        categories={categories}
        activeCategory={activeCategory}
      />
      <CategoryLegend
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />
    </div>
  )
}