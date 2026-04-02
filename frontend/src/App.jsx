import { useState, useEffect } from 'react'
import { fetchCategories } from './api.js'
import { todayStr, addDays } from './utils/dates.js'
import { useUsageCounts } from './hooks/useUsageCounts.js'
import { useDarkMode } from './hooks/useDarkMode.js'
import { useAuth } from './hooks/useAuth.js'
import Login from './components/Login.jsx'
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

  const { counts, increment } = useUsageCounts()
  const [dark, toggleDark] = useDarkMode()
  const { token, login, logout } = useAuth()

  if (!token) return <Login onLogin={login} />

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
        dark={dark}
        onToggleDark={toggleDark}
        onLogout={logout}
      />
      <Grid
        startDate={startDate}
        dayCount={dayCount}
        categories={categories}
        activeCategory={activeCategory}
        onPaint={increment}
      />
      <CategoryLegend
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
        usageCounts={counts}
      />
    </div>
  )
}