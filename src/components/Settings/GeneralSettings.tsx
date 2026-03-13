import { useSettingsStore } from '@/stores/settingsStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { playSplit, playPB, playNoPB } from '@/utils/sounds'

interface ToggleProps {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  subtext: string
  accent: string
}

function Toggle({ label, value, onChange, subtext, accent }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: subtext }}>
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
        style={{ background: value ? accent : '#444' }}
      >
        <span
          className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
          style={{ transform: value ? 'translateX(18px)' : 'translateX(3px)' }}
        />
      </button>
    </div>
  )
}

export function GeneralSettings() {
  const { settings, updateSettings } = useSettingsStore()
  const { collection, resetBests } = useCollectionStore()
  const { theme } = settings

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold" style={{ color: theme.subtext }}>
          DISPLAY OPTIONS
        </label>
        <Toggle
          label="Show best possible time"
          value={settings.showBestPossible}
          onChange={(v) => updateSettings({ showBestPossible: v })}
          subtext={theme.text}
          accent={theme.accent}
        />
        <Toggle
          label="Show best run splits"
          value={settings.showBestRun}
          onChange={(v) => updateSettings({ showBestRun: v })}
          subtext={theme.text}
          accent={theme.accent}
        />
        <Toggle
          label="Show last run splits"
          value={settings.showLastRun}
          onChange={(v) => updateSettings({ showLastRun: v })}
          subtext={theme.text}
          accent={theme.accent}
        />
        <Toggle
          label="Show attempt count"
          value={settings.showAttempts}
          onChange={(v) => updateSettings({ showAttempts: v })}
          subtext={theme.text}
          accent={theme.accent}
        />
        <Toggle
          label="Show performance graph"
          value={settings.showGraph}
          onChange={(v) => updateSettings({ showGraph: v })}
          subtext={theme.text}
          accent={theme.accent}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold" style={{ color: theme.subtext }}>
          SOUND
        </label>
        <Toggle
          label="Sound effects"
          value={settings.soundEnabled}
          onChange={(v) => updateSettings({ soundEnabled: v })}
          subtext={theme.text}
          accent={theme.accent}
        />
        {settings.soundEnabled && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: theme.subtext }}>Volume</span>
              <span className="font-mono text-xs" style={{ color: theme.subtext }}>
                {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={settings.soundVolume}
              onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: theme.accent }}
            />
            <div className="flex gap-1.5 mt-0.5">
              <button
                onClick={() => playSplit(settings.soundVolume)}
                className="flex-1 py-1 rounded text-xs"
                style={{ background: `${theme.accent}20`, color: theme.text, border: `1px solid ${theme.accent}30` }}
              >
                Test split
              </button>
              <button
                onClick={() => playPB(settings.soundVolume)}
                className="flex-1 py-1 rounded text-xs"
                style={{ background: `${theme.aheadColor}20`, color: theme.aheadColor, border: `1px solid ${theme.aheadColor}40` }}
              >
                Test PB
              </button>
              <button
                onClick={() => playNoPB(settings.soundVolume)}
                className="flex-1 py-1 rounded text-xs"
                style={{ background: `${theme.behindColor}20`, color: theme.behindColor, border: `1px solid ${theme.behindColor}40` }}
              >
                Test fail
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold" style={{ color: theme.subtext }}>
          TIMER DECIMALS
        </label>
        <div className="flex gap-1.5">
          {([2, 3] as const).map((d) => (
            <button
              key={d}
              onClick={() => updateSettings({ decimalPlaces: d })}
              className="flex-1 py-1.5 rounded text-sm font-medium"
              style={{
                background: settings.decimalPlaces === d ? theme.accent : `${theme.accent}15`,
                color: settings.decimalPlaces === d ? '#fff' : theme.text,
                border: `1px solid ${theme.accent}30`,
              }}
            >
              .{Array(d).fill('0').join('')}
            </button>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${theme.accent}20` }}>
        <label className="text-xs font-semibold" style={{ color: theme.subtext }}>
          DATA
        </label>
        <p className="text-xs" style={{ color: theme.subtext }}>
          Attempts: {collection.attempts} | Completed: {collection.completedAttempts}
        </p>
        <button
          onClick={() => {
            if (confirm('Reset all bests, splits times and attempt counts?')) {
              resetBests()
            }
          }}
          className="px-3 py-1.5 rounded text-sm font-medium text-left"
          style={{
            background: `${theme.behindColor}15`,
            color: theme.behindColor,
            border: `1px solid ${theme.behindColor}30`,
          }}
        >
          Reset all bests & attempts
        </button>
      </div>
    </div>
  )
}
