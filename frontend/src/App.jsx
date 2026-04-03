import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

function GridView({ categories }) {
  const [activeCategory, setActiveCategory] = useState(null)
  const [dayCount, setDayCount] = useState(3)
  const [startDate, setStartDate] = useState(() => startForDayCount(3))
  const { counts, increment } = useUsageCounts()

  const handleDayCountChange = (n) => {
    setDayCount(n)
    setStartDate(startForDayCount(n))
  }

  return (
    <div className="flex flex-col h-screen">
      <Toolbar
        dayCount={dayCount}
        onDayCountChange={handleDayCountChange}
        startDate={startDate}
        onNavigate={setStartDate}
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

function SettingsRoute({ categories, onDone }) {
  const [dark, toggleDark] = useDarkMode()
  const { logout } = useAuth()
  return <Settings categories={categories} onDone={onDone} dark={dark} onToggleDark={toggleDark} onLogout={logout} />
}

function RequireAuth({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [categories, setCategories] = useState([])
  const { token } = useAuth()

  const loadCategories = () => fetchCategories().then(setCategories)
  useEffect(() => { if (token) loadCategories() }, [token])

  return (
    <Routes>
      <Route path="/login" element={
        token ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/settings" element={
        <RequireAuth>
          <SettingsRoute categories={categories} onDone={loadCategories} />
        </RequireAuth>
      } />
      <Route path="/" element={
        <RequireAuth>
          <GridView categories={categories} />
        </RequireAuth>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}