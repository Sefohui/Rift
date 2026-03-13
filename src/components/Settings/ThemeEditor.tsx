import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_THEME } from '@/types'

const FONTS = [
  'JetBrains Mono',
  'Fira Code',
  'Consolas',
  'monospace',
  'Inter',
  'system-ui',
]

const PRESETS = [
  {
    name: 'Dark (Default)',
    theme: DEFAULT_THEME,
  },
  {
    name: 'Midnight Blue',
    theme: {
      ...DEFAULT_THEME,
      background: '#0a0e1a',
      accent: '#3b82f6',
      timerColor: '#e8e8f0',
    },
  },
  {
    name: 'Forest',
    theme: {
      ...DEFAULT_THEME,
      background: '#0d1f0d',
      accent: '#22c55e',
      aheadColor: '#86efac',
      timerColor: '#d1fae5',
    },
  },
  {
    name: 'Crimson',
    theme: {
      ...DEFAULT_THEME,
      background: '#1a0a0a',
      accent: '#ef4444',
      aheadColor: '#4ade80',
      timerColor: '#fef2f2',
    },
  },
]

interface ColorFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  subtext: string
}

function ColorField({ label, value, onChange, subtext }: ColorFieldProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs flex-1" style={{ color: subtext }}>
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
          style={{ padding: '0' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs w-20 px-1.5 py-1 rounded"
          style={{
            background: '#ffffff10',
            border: '1px solid #ffffff20',
            color: subtext,
          }}
        />
      </div>
    </div>
  )
}

export function ThemeEditor() {
  const { settings, updateTheme, updateSettings } = useSettingsStore()
  const { theme } = settings

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

  return (
    <div className="flex flex-col gap-4">
      {/* Presets */}
      <div>
        <label className="text-xs font-semibold block mb-2" style={{ color: theme.subtext }}>
          PRESETS
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => updateTheme(p.theme)}
              className="px-2.5 py-1 rounded text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: `${theme.accent}25`, color: theme.text, border: `1px solid ${theme.accent}40` }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold" style={{ color: theme.subtext }}>
          COLORS
        </label>
        <ColorField label="Background" value={theme.background} onChange={(v) => updateTheme({ background: v })} subtext={theme.subtext} />
        <ColorField label="Text" value={theme.text} onChange={(v) => updateTheme({ text: v })} subtext={theme.subtext} />
        <ColorField label="Subtext" value={theme.subtext} onChange={(v) => updateTheme({ subtext: v })} subtext={theme.subtext} />
        <ColorField label="Accent" value={theme.accent} onChange={(v) => updateTheme({ accent: v })} subtext={theme.subtext} />
        <ColorField label="Ahead" value={theme.aheadColor} onChange={(v) => updateTheme({ aheadColor: v })} subtext={theme.subtext} />
        <ColorField label="Behind" value={theme.behindColor} onChange={(v) => updateTheme({ behindColor: v })} subtext={theme.subtext} />
        <ColorField label="Gold split" value={theme.goldColor} onChange={(v) => updateTheme({ goldColor: v })} subtext={theme.subtext} />
        <ColorField label="Timer" value={theme.timerColor} onChange={(v) => updateTheme({ timerColor: v })} subtext={theme.subtext} />
        <ColorField label="Timer ahead" value={theme.timerAheadColor} onChange={(v) => updateTheme({ timerAheadColor: v })} subtext={theme.subtext} />
        <ColorField label="Timer behind" value={theme.timerBehindColor} onChange={(v) => updateTheme({ timerBehindColor: v })} subtext={theme.subtext} />
      </div>

      {/* Font */}
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.subtext }}>
          FONT
        </label>
        <select
          style={inputStyle}
          value={settings.font}
          onChange={(e) => updateSettings({ font: e.target.value })}
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ background: theme.background }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Font size */}
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.subtext }}>
          TIMER SIZE
        </label>
        <div className="flex gap-1.5">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <button
              key={size}
              onClick={() => updateSettings({ fontSize: size })}
              className="flex-1 py-1.5 rounded text-sm font-medium transition-all"
              style={{
                background: settings.fontSize === size ? theme.accent : `${theme.accent}15`,
                color: settings.fontSize === size ? '#fff' : theme.text,
                border: `1px solid ${theme.accent}30`,
              }}
            >
              {size.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Background image */}
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.subtext }}>
          BACKGROUND IMAGE URL
        </label>
        <input
          style={inputStyle}
          placeholder="https://... or leave empty"
          value={theme.backgroundImage ?? ''}
          onChange={(e) => updateTheme({ backgroundImage: e.target.value || null })}
        />
      </div>
    </div>
  )
}
