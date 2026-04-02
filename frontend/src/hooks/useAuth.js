import { useState } from 'react'
import { login as apiLogin } from '../api.js'

const TOKEN_KEY = 'auth_token'

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))

  const login = async (password) => {
    const res = await apiLogin(password)
    if (!res.ok) return false
    const { token } = await res.json()
    const stored = token ?? 'no-auth'  // null token = auth disabled on server
    localStorage.setItem(TOKEN_KEY, stored)
    setToken(stored)
    return true
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  return { token, login, logout }
}