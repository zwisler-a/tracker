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
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors text-lg leading-none"
        >
          ‹
        </button>
        <h1 className="font-semibold text-slate-800">Categories</h1>
      </div>

      {/* Category list */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {categories.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No categories yet</p>
        )}
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200">
            <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 text-sm font-medium text-slate-700">{cat.name}</span>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors px-1 py-1"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add category */}
      <div className="px-4 py-4 bg-white border-t border-slate-200 shrink-0 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">New category</p>
        <input
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
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
