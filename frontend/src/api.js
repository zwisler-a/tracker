const BASE = '/api'

const json = (r) => r.json()
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const put  = (url, body) => fetch(url, { method: 'PUT',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const del  = (url)       => fetch(url, { method: 'DELETE' })

export const fetchCategories  = ()           => fetch(`${BASE}/categories`).then(json)
export const createCategory   = (data)       => post(`${BASE}/categories`, data).then(json)
export const updateCategory   = (id, data)   => put(`${BASE}/categories/${id}`, data).then(json)
export const deleteCategory   = (id)         => del(`${BASE}/categories/${id}`).then(json)

export const fetchEntries     = (from, to)   => fetch(`${BASE}/entries?from=${from}&to=${to}`).then(json)
export const upsertEntry      = (data)       => put(`${BASE}/entries`, data).then(json)
export const bulkUpsertEntries = (entries)   => put(`${BASE}/entries/bulk`, entries).then(json)