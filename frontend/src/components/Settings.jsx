import { useState } from 'react'
import { createCategory, deleteCategory } from '../api.js'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
  '#14b8a6', '#64748b',
]

export default function Settings({ categories, onBack }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[4])

  const handleAdd = async () => {
    if (!name.trim()) return
    await createCategory({ name: name.trim(), color })
    setName('')
    onBack()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Logged entries will become unlogged.')) return
    await deleteCategory(id)
    onBack()
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-700 shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-lg leading-none"
        >
          ‹
        </button>
        <h1 className="font-semibold text-slate-800 dark:text-zinc-100">Categories</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {categories.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-8">No categories yet</p>
        )}
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700">
            <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-200">{cat.name}</span>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-xs text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-1 py-1"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700 shrink-0 space-y-3">
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">New category</p>
        <input
          className="w-full border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-800 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-zinc-900' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add Category
        </button>
      </div>
    </div>
  )
}
