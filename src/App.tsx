import { useEffect, useRef, useState, useCallback } from 'react'
import { Settings } from 'lucide-react'
import { useTimerStore } from '@/stores/timerStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { TitleBar } from '@/components/TitleBar'
import { TimerDisplay } from '@/components/TimerDisplay'
import { SplitList } from '@/components/SplitList'
import { Controls } from '@/components/Controls'
import { RunGraph } from '@/components/RunGraph'
import { SettingsPanel } from '@/components/Settings/SettingsPanel'
import { playSplit, playPB, playNoPB } from '@/utils/sounds'

export default function App() {
  const { state, start, split, undoSplit, skip, pause, resume, reset } = useTimerStore()
  const { collection, recordRun } = useCollectionStore()
  const { settings, updateSettings } = useSettingsStore()
  const { theme } = settings
  const [showSettings, setShowSettings] = useState(false)
  const hotkeyCleanupRef = useRef<(() => void) | null>(null)

  // On-the-go mode: timer running with no predefined splits
  // If splits.length === 0, we allow free-form splitting
  const numSplits = collection.splits.length

  // ---- Actions ----
  const handleSplit = useCallback(() => {
    if (state === 'idle' || state === 'finished') {
      if (state === 'finished') {
        reset()
        setTimeout(() => start(numSplits || 1), 0)
      } else {
        if (numSplits === 0) {
          // On-the-go: start a free-form timer with one initial split slot
          start(1)
        } else {
          start(numSplits)
        }
      }
    } else if (state === 'paused') {
      resume()
    } else if (state === 'running') {
      split()
      if (settings.soundEnabled) playSplit(settings.soundVolume)
    }
  }, [state, numSplits, start, split, reset, resume, settings.soundEnabled, settings.soundVolume])

  const handleReset = useCallback(() => {
    if (state === 'finished') {
      // Save the run results
      const store = useTimerStore.getState()
      recordRun(store.splitTimes, store.elapsedMs)
    }
    reset()
  }, [state, reset, recordRun])

  const handlePause = useCallback(() => {
    if (state === 'running') pause()
    else if (state === 'paused') resume()
  }, [state, pause, resume])

  // Watch for run completion to record results + play finish sound
  const prevStateRef = useRef(state)
  useEffect(() => {
    if (prevStateRef.current === 'running' && state === 'finished') {
      const store = useTimerStore.getState()
      recordRun(store.splitTimes, store.elapsedMs)

      if (settings.soundEnabled) {
        const isPB =
          collection.bestRunTime === null ||
          store.elapsedMs < collection.bestRunTime
        if (isPB) playPB(settings.soundVolume)
        else playNoPB(settings.soundVolume)
      }
    }
    prevStateRef.current = state
  }, [state, recordRun, settings.soundEnabled, settings.soundVolume, collection.bestRunTime])

  // ---- Hotkeys (keyboard) ----
  useEffect(() => {
    const { hotkeys } = settings

    const keyMap: Record<string, string> = {}
    for (const [action, key] of Object.entries(hotkeys)) {
      if (key) keyMap[key.toLowerCase()] = action
    }

    const onKey = (e: KeyboardEvent) => {
      if (showSettings) return
      // Build key string
      const parts: string[] = []
      if (e.ctrlKey) parts.push('ctrl')
      if (e.altKey) parts.push('alt')
      if (e.shiftKey) parts.push('shift')
      if (e.metaKey) parts.push('meta')
      const keyName = e.key === ' ' ? 'space' : e.key.toLowerCase()
      parts.push(keyName)
      const combo = parts.join('+')

      const action = keyMap[combo] ?? keyMap[keyName]
      if (!action) return
      e.preventDefault()

      if (action === 'split') handleSplit()
      else if (action === 'reset') handleReset()
      else if (action === 'undo') undoSplit()
      else if (action === 'skip') skip()
      else if (action === 'pause') handlePause()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settings, showSettings, handleSplit, handleReset, undoSplit, skip, handlePause])

  // ---- Global hotkeys via Electron ----
  useEffect(() => {
    if (!window.electronAPI) return

    const { hotkeys } = settings
    window.electronAPI.registerHotkeys(hotkeys)

    const cleanup = window.electronAPI.onHotkeyAction((action) => {
      if (action === 'split') handleSplit()
      else if (action === 'reset') handleReset()
      else if (action === 'undo') undoSplit()
      else if (action === 'skip') skip()
      else if (action === 'pause') handlePause()
    })

    hotkeyCleanupRef.current = cleanup
    return () => {
      cleanup()
      window.electronAPI?.unregisterHotkeys()
    }
  }, [settings.hotkeys, handleSplit, handleReset, undoSplit, skip, handlePause])

  // ---- Always on top ----
  useEffect(() => {
    window.electronAPI?.setAlwaysOnTop(settings.alwaysOnTop)
  }, [settings.alwaysOnTop])

  const appBg = theme.backgroundImage
    ? `url(${theme.backgroundImage})`
    : theme.background

  const title = `${collection.game} — ${collection.category}`

  return (
    <div
      className="flex flex-col h-screen overflow-hidden relative"
      style={{
        background: theme.backgroundImage ? undefined : theme.background,
        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: theme.text,
        fontFamily: settings.font,
      }}
    >
      {/* Backdrop blur for background images */}
      {theme.backgroundImage && (
        <div
          className="absolute inset-0 z-0"
          style={{ background: `${theme.background}cc`, backdropFilter: 'blur(2px)' }}
        />
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Title bar */}
        <TitleBar title={title} />

        {/* Timer */}
        <TimerDisplay />

        {/* Splits */}
        <SplitList />

        {/* Performance graph */}
        {settings.showGraph && <RunGraph />}

        {/* Controls */}
        <Controls
          onSplit={handleSplit}
          onReset={handleReset}
          onUndo={undoSplit}
          onSkip={skip}
        />

        {/* Settings button + always-on-top toggle */}
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ borderTop: `1px solid ${theme.accent}15` }}
        >
          <button
            onClick={() => updateSettings({ alwaysOnTop: !settings.alwaysOnTop })}
            className="text-xs px-2 py-1 rounded transition-all"
            style={{
              color: settings.alwaysOnTop ? theme.accent : theme.subtext,
              background: settings.alwaysOnTop ? `${theme.accent}20` : 'transparent',
            }}
            title="Toggle always on top"
          >
            On Top
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded transition-opacity opacity-50 hover:opacity-100"
            style={{ color: theme.subtext }}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Settings overlay */}
      {showSettings && (
        <div className="absolute inset-0 z-50">
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  )
}
