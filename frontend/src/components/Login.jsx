import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const ok = await login(password)
    if (ok) navigate('/', { replace: true })
    else { setError(true); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="flex justify-center mb-6">
          <img src="/icon.svg" alt="" className="w-16 h-16 rounded-2xl shadow-lg" />
        </div>
        <h1 className="text-xl font-semibold text-center text-slate-800 dark:text-zinc-100 mb-1">
          Time Tracker
        </h1>
        <p className="text-sm text-center text-slate-400 dark:text-zinc-500 mb-8">
          Enter your password to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            placeholder="Password"
            className={`w-full border rounded-xl px-4 py-3 text-sm bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-colors ${
              error
                ? 'border-red-400 dark:border-red-500 focus:ring-red-300 dark:focus:ring-red-700'
                : 'border-slate-200 dark:border-zinc-700 focus:ring-indigo-300 dark:focus:ring-indigo-600'
            }`}
          />
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center">Incorrect password</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}