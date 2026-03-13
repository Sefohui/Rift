import { Play, Square, RotateCcw, ChevronRight, CornerUpLeft } from 'lucide-react'
import { useTimerStore } from '@/stores/timerStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useSettingsStore } from '@/stores/settingsStore'

interface ControlsProps {
  onSplit: () => void
  onReset: () => void
  onUndo: () => void
  onSkip: () => void
}

export function Controls({ onSplit, onReset, onUndo, onSkip }: ControlsProps) {
  const { state } = useTimerStore()
  const { collection } = useCollectionStore()
  const { settings } = useSettingsStore()
  const { theme } = settings

  const hasSplits = collection.splits.length > 0
  const isIdle = state === 'idle'
  const isRunning = state === 'running'
  const isPaused = state === 'paused'
  const isFinished = state === 'finished'
  const isActive = isRunning || isPaused

  const btnBase = 'flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-all duration-100 select-none'

  const primaryBtn = {
    background: theme.accent,
    color: '#fff',
  }

  const secondaryBtn = {
    background: `${theme.accent}20`,
    color: theme.text,
    border: `1px solid ${theme.accent}30`,
  }

  const dangerBtn = {
    background: `${theme.behindColor}20`,
    color: theme.behindColor,
    border: `1px solid ${theme.behindColor}40`,
  }

  return (
    <div
      className="px-3 py-2 flex gap-2"
      style={{ borderTop: `1px solid ${theme.accent}22` }}
    >
      {/* Main action: Start / Split / Finish */}
      {(isIdle || isFinished) ? (
        <button
          className={`${btnBase} flex-1`}
          style={primaryBtn}
          onClick={onSplit}
          disabled={!hasSplits && isIdle}
          title={hasSplits ? 'Start' : 'Add splits in settings first'}
        >
          <Play size={14} />
          {isFinished ? 'Restart' : 'Start'}
        </button>
      ) : isPaused ? (
        <button
          className={`${btnBase} flex-1`}
          style={primaryBtn}
          onClick={onSplit}
        >
          <Play size={14} />
          Resume
        </button>
      ) : (
        <button
          className={`${btnBase} flex-1`}
          style={primaryBtn}
          onClick={onSplit}
        >
          <ChevronRight size={14} />
          Split
        </button>
      )}

      {/* Undo */}
      {isActive && (
        <button
          className={btnBase}
          style={secondaryBtn}
          onClick={onUndo}
          title="Undo last split"
        >
          <CornerUpLeft size={14} />
        </button>
      )}

      {/* Skip */}
      {isRunning && (
        <button
          className={btnBase}
          style={secondaryBtn}
          onClick={onSkip}
          title="Skip split"
        >
          <Square size={14} />
        </button>
      )}

      {/* Reset */}
      {(isActive || isFinished) && (
        <button
          className={btnBase}
          style={dangerBtn}
          onClick={onReset}
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  )
}
