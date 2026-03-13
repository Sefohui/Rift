import { useState } from 'react'
import { X, Download, Upload } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { SplitEditor } from './SplitEditor'
import { ThemeEditor } from './ThemeEditor'
import { HotkeyEditor } from './HotkeyEditor'
import { GeneralSettings } from './GeneralSettings'

interface SettingsPanelProps {
  onClose: () => void
}

type Tab = 'splits' | 'theme' | 'hotkeys' | 'general'

const TABS: { id: Tab; label: string }[] = [
  { id: 'splits', label: 'Splits' },
  { id: 'theme', label: 'Theme' },
  { id: 'hotkeys', label: 'Hotkeys' },
  { id: 'general', label: 'General' },
]

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings } = useSettingsStore()
  const { exportJSON, importJSON } = useCollectionStore()
  const { theme } = settings
  const [activeTab, setActiveTab] = useState<Tab>('splits')
  const [importError, setImportError] = useState('')

  const handleSave = async () => {
    const json = exportJSON()
    if (window.electronAPI) {
      const result = await window.electronAPI.saveCollection(json)
      if (!result.success) alert('Save cancelled.')
    } else {
      // Web fallback: download
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'splits.rift'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleLoad = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadCollection()
      if (result.success && result.data) {
        const ok = importJSON(result.data)
        if (!ok) setImportError('Invalid file format.')
        else setImportError('')
      }
    } else {
      // Web fallback: file picker
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.rift,.splitapp,.json'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        const text = await file.text()
        const ok = importJSON(text)
        if (!ok) setImportError('Invalid file format.')
        else setImportError('')
      }
      input.click()
    }
  }

  return (
    <div
      className="absolute inset-0 flex flex-col z-50"
      style={{ background: theme.background, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${theme.accent}25` }}
      >
        <span className="font-semibold text-sm" style={{ color: theme.text }}>
          Settings
        </span>
        <div className="flex items-center gap-2">
          {/* Save / Load */}
          <button
            onClick={handleLoad}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{
              background: `${theme.accent}20`,
              color: theme.text,
              border: `1px solid ${theme.accent}30`,
            }}
            title="Load collection"
          >
            <Upload size={11} /> Load
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{
              background: `${theme.accent}20`,
              color: theme.text,
              border: `1px solid ${theme.accent}30`,
            }}
            title="Save collection"
          >
            <Download size={11} /> Save
          </button>
          <button
            onClick={onClose}
            className="close-btn"
            style={{ color: theme.text, '--btn-hover-bg': `${theme.accent}40` } as React.CSSProperties}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex"
        style={{ borderBottom: `1px solid ${theme.accent}25` }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2 text-xs font-medium transition-all"
            style={{
              color: activeTab === tab.id ? theme.accent : theme.subtext,
              borderBottom: activeTab === tab.id ? `2px solid ${theme.accent}` : '2px solid transparent',
              background: 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {importError && (
          <div
            className="mb-3 px-3 py-2 rounded text-xs"
            style={{ background: `${theme.behindColor}20`, color: theme.behindColor }}
          >
            {importError}
          </div>
        )}
        {activeTab === 'splits' && <SplitEditor />}
        {activeTab === 'theme' && <ThemeEditor />}
        {activeTab === 'hotkeys' && <HotkeyEditor />}
        {activeTab === 'general' && <GeneralSettings />}
      </div>
    </div>
  )
}
