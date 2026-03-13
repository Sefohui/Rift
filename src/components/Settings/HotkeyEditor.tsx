import { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

const HOTKEY_LABELS: Record<string, string> = {
  split: 'Split / Start',
  reset: 'Reset',
  undo: 'Undo split',
  skip: 'Skip split',
  pause: 'Pause',
}

export function HotkeyEditor() {
  const { settings, updateHotkeys } = useSettingsStore()
  const { theme, hotkeys } = settings
  const [listening, setListening] = useState<string | null>(null)

  const inputStyle = {
    background: `${theme.accent}10`,
    border: `1px solid ${theme.accent}30`,
    color: theme.text,
    borderRadius: '0.375rem',
    padding: '0.35rem 0.6rem',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
    textAlign: 'center' as const,
  }

  const handleCapture = (action: string, e: React.KeyboardEvent) => {
    e.preventDefault()
    const parts: string[] = []
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey) parts.push('Meta')

    const key = e.key
    if (key === 'Escape') {
      setListening(null)
      return
    }
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      parts.push(key === ' ' ? 'Space' : key)
    }

    if (parts.length > 0) {
      updateHotkeys({ [action]: parts.join('+') })
      setListening(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: theme.subtext }}>
        Click a field then press the desired key combination. Press Escape to cancel.
      </p>
      {Object.entries(HOTKEY_LABELS).map(([action, label]) => (
        <div key={action} className="flex items-center justify-between gap-3">
          <label className="text-sm flex-1" style={{ color: theme.text }}>
            {label}
          </label>
          <input
            readOnly
            style={{
              ...inputStyle,
              width: '120px',
              background: listening === action ? `${theme.accent}35` : inputStyle.background,
              border: `1px solid ${listening === action ? theme.accent : `${theme.accent}30`}`,
            }}
            value={listening === action ? 'Press key...' : hotkeys[action as keyof typeof hotkeys] || '—'}
            onFocus={() => setListening(action)}
            onBlur={() => setListening(null)}
            onKeyDown={(e) => listening === action && handleCapture(action, e)}
          />
        </div>
      ))}
    </div>
  )
}
