const BASE = '/api'

// Token is read fresh from localStorage on every request so it's always current
const authHeader = () => {
  const token = localStorage.getItem('auth_token')
  return token && token !== 'no-auth' ? { 'Authorization': `Bearer ${token}` } : {}
}

const handle = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
    return Promise.reject(new Error('Unauthorized'))
  }
  return res.json()
}

const get  = (url)        => fetch(url, { headers: authHeader() }).then(handle)
const post = (url, body)  => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(body) }).then(handle)
const put  = (url, body)  => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(body) }).then(handle)
const del  = (url)        => fetch(url, { method: 'DELETE', headers: authHeader() }).then(handle)

export const fetchCategories   = ()           => get(`${BASE}/categories`)
export const createCategory    = (data)       => post(`${BASE}/categories`, data)
export const updateCategory    = (id, data)   => put(`${BASE}/categories/${id}`, data)
export const deleteCategory    = (id)         => del(`${BASE}/categories/${id}`)

export const fetchEntries      = (from, to)   => get(`${BASE}/entries?from=${from}&to=${to}`)
export const upsertEntry       = (data)       => put(`${BASE}/entries`, data)
export const bulkUpsertEntries = (entries)    => put(`${BASE}/entries/bulk`, entries)

export const fetchMoods        = (from, to)   => get(`${BASE}/moods?from=${from}&to=${to}`)
export const upsertMood        = (data)       => put(`${BASE}/moods`, data)

export const login = (password) =>
  fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })