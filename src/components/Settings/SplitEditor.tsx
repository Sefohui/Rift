import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { useCollectionStore } from '@/stores/collectionStore'
import { useSettingsStore } from '@/stores/settingsStore'

export function SplitEditor() {
  const { collection, addSplit, removeSplit, renameSplit, moveSplit, updateMeta } =
    useCollectionStore()
  const { settings } = useSettingsStore()
  const { theme } = settings

  const [newSplitName, setNewSplitName] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const inputStyle = {
    background: `${theme.accent}10`,
    border: `1px solid ${theme.accent}30`,
    color: theme.text,
    borderRadius: '0.375rem',
    padding: '0.35rem 0.6rem',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
  }

  const handleAdd = () => {
    const name = newSplitName.trim()
    if (!name) return
    addSplit(name)
    setNewSplitName('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Game / Category */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold" style={{ color: theme.subtext }}>
          GAME INFO
        </label>
        <input
          style={inputStyle}
          placeholder="Game name"
          value={collection.game}
          onChange={(e) => updateMeta({ game: e.target.value })}
        />
        <input
          style={inputStyle}
          placeholder="Category"
          value={collection.category}
          onChange={(e) => updateMeta({ category: e.target.value })}
        />
        <input
          style={inputStyle}
          placeholder="Collection name"
          value={collection.name}
          onChange={(e) => updateMeta({ name: e.target.value })}
        />
      </div>

      {/* Split list */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: theme.subtext }}>
          SPLITS ({collection.splits.length})
        </label>
        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
          {collection.splits.map((split, index) => (
            <div
              key={split.id}
              className="flex items-center gap-1.5"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) {
                  moveSplit(dragIndex, index)
                }
                setDragIndex(null)
              }}
            >
              <GripVertical
                size={14}
                className="cursor-grab flex-shrink-0"
                style={{ color: theme.subtext }}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={split.name}
                onChange={(e) => renameSplit(split.id, e.target.value)}
              />
              <button
                onClick={() => removeSplit(split.id)}
                className="flex-shrink-0 p-1 rounded transition-opacity opacity-50 hover:opacity-100"
                style={{ color: theme.behindColor }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Add split */}
        <div className="flex gap-1.5 mt-1">
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="New split name..."
            value={newSplitName}
            onChange={(e) => setNewSplitName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium"
            style={{ background: theme.accent, color: '#fff' }}
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
