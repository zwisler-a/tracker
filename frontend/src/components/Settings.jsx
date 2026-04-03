import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCategory, updateCategory, deleteCategory } from '../api.js'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
  '#14b8a6', '#64748b',
]

function ColorPicker({ value, onChange }) {
  const isCustom = !PRESET_COLORS.includes(value)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-full transition-transform ${
            value === c ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900' : 'hover:scale-110'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      {/* Custom color via native picker */}
      <label
        className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform ${
          isCustom
            ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900'
            : 'border-2 border-dashed border-slate-300 dark:border-zinc-600 hover:scale-110'
        }`}
        style={isCustom ? { backgroundColor: value } : {}}
        title="Custom color"
      >
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
        />
        {!isCustom && <span className="text-slate-400 dark:text-zinc-500 text-sm leading-none">+</span>}
      </label>
    </div>
  )
}

export default function Settings({ categories, onDone, dark, onToggleDark, onLogout }) {
  const navigate = useNavigate()
  const back = () => { onDone?.(); navigate('/') }
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName]   = useState('')
  const [editColor, setEditColor] = useState('')

  const [newName, setNewName]   = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[4])

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  const cancelEdit = () => setEditingId(null)

  const handleSave = async (id) => {
    if (!editName.trim()) return
    await updateCategory(id, { name: editName.trim(), color: editColor })
    setEditingId(null)
    back()
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    await createCategory({ name: newName.trim(), color: newColor })
    setNewName('')
    back()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Logged entries will become unlogged.')) return
    await deleteCategory(id)
    setEditingId(null)
    back()
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-700 shrink-0">
        <button
          onClick={back}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-lg leading-none"
        >
          ‹
        </button>
        <h1 className="font-semibold text-slate-800 dark:text-zinc-100">Settings</h1>
        <div className="ml-auto flex items-center gap-1">
          {onToggleDark && (
            <button
              onClick={onToggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle dark mode"
            >
              {dark ? '☀︎' : '☾'}
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Lock"
            >
              ⏏
            </button>
          )}
        </div>
      </div>

      {/* Category list */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {categories.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-8">No categories yet</p>
        )}
        {categories.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
            {editingId === cat.id ? (
              /* Edit mode */
              <div className="p-3 space-y-3">
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(cat.id); if (e.key === 'Escape') cancelEdit() }}
                  className="w-full border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                />
                <ColorPicker value={editColor} onChange={setEditColor} />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(cat.id)}
                    disabled={!editName.trim()}
                    className="flex-1 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-2 text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-3 py-2 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <button
                onClick={() => startEdit(cat)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-200">{cat.name}</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">Edit</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new category */}
      <div className="px-4 py-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700 shrink-0 space-y-3">
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">New category</p>
        <input
          className="w-full border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-800 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600"
          placeholder="Name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <ColorPicker value={newColor} onChange={setNewColor} />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="w-full py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add Category
        </button>
      </div>
    </div>
  )
}
