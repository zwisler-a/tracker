import { useNavigate } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode.js'
import { useAuth } from '../hooks/useAuth.js'

const row = 'flex items-center justify-between px-4 py-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700'
const label = 'text-sm font-medium text-slate-700 dark:text-zinc-200'
const sub = 'text-xs text-slate-400 dark:text-zinc-500 mt-0.5'

export default function Settings() {
  const navigate = useNavigate()
  const [dark, toggleDark] = useDarkMode()
  const { logout } = useAuth()

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-700 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-lg leading-none"
        >
          ‹
        </button>
        <h1 className="font-semibold text-slate-800 dark:text-zinc-100">Settings</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide px-1 pb-1">Appearance</p>
        <div className={row}>
          <div>
            <p className={label}>Dark mode</p>
            <p className={sub}>{dark ? 'On' : 'Off'}</p>
          </div>
          <button
            onClick={toggleDark}
            className={`relative w-11 h-6 rounded-full transition-colors ${dark ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide px-1 pb-1 pt-3">Account</p>
        <button onClick={logout} className={`${row} w-full text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-red-100 dark:border-red-900/30`}>
          <div>
            <p className="text-sm font-medium text-red-500 dark:text-red-400">Lock / Log out</p>
            <p className={sub}>Requires password to unlock</p>
          </div>
          <span className="text-red-400 dark:text-red-500 text-lg">⏏</span>
        </button>
      </div>
    </div>
  )
}