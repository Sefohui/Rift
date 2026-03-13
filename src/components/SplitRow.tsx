import { Split } from '@/types'
import { formatTime, formatDelta } from '@/utils/time'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTimerStore } from '@/stores/timerStore'

interface SplitRowProps {
  split: Split
  index: number
  splitTime: number | null   // cumulative time at this split (if completed)
  isActive: boolean
  isCompleted: boolean
  isSkipped: boolean
}

export function SplitRow({ split, index, splitTime, isActive, isCompleted, isSkipped }: SplitRowProps) {
  const { settings } = useSettingsStore()
  const { elapsedMs } = useTimerStore()
  const { theme, decimalPlaces, showBestRun, showLastRun } = settings

  // Calculate delta vs best
  let delta: number | null = null
  let deltaColor = theme.subtext
  let displayTime: string | null = null
  let isGold = false

  if (isCompleted && splitTime !== null) {
    displayTime = formatTime(splitTime, decimalPlaces)

    if (split.bestTime !== null) {
      delta = splitTime - split.bestTime
      if (delta < 0) {
        deltaColor = theme.aheadColor
        // Check if it's a gold split (best segment)
        const prevBest = index > 0 ? null : null // we compare segments
        if (split.bestSegmentTime !== null) {
          // This is already tracked at record time; check if this was a best segment
          // We approximate: if ahead of best time, it might be gold
          isGold = delta < -(split.bestSegmentTime * 0.1) // heuristic
        }
      } else {
        deltaColor = theme.behindColor
      }
    } else if (split.lastTime !== null) {
      delta = splitTime - split.lastTime
      deltaColor = delta < 0 ? theme.aheadColor : theme.behindColor
    }
  } else if (isActive) {
    // Show live delta
    if (split.bestTime !== null) {
      delta = elapsedMs - split.bestTime
      deltaColor = delta < 0 ? theme.aheadColor : theme.behindColor
    } else if (split.lastTime !== null) {
      delta = elapsedMs - split.lastTime
      deltaColor = delta < 0 ? theme.aheadColor : theme.behindColor
    }
  }

  const rowBg = isActive ? `${theme.accent}18` : 'transparent'

  return (
    <div
      className="flex items-center px-3 py-1.5 gap-2 transition-colors"
      style={{
        background: rowBg,
        borderLeft: isActive ? `2px solid ${theme.accent}` : '2px solid transparent',
        opacity: isSkipped ? 0.4 : 1,
      }}
    >
      {/* Split name */}
      <span
        className="flex-1 text-sm truncate"
        style={{
          color: isCompleted || isActive ? theme.text : theme.subtext,
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {split.name}
      </span>

      {/* Delta */}
      {delta !== null && (
        <span
          className="font-mono text-xs tabular-nums"
          style={{ color: isGold ? theme.goldColor : deltaColor, minWidth: '5rem', textAlign: 'right' }}
        >
          {formatDelta(delta, decimalPlaces)}
        </span>
      )}

      {/* Time */}
      <span
        className="font-mono text-sm tabular-nums"
        style={{
          color: isCompleted ? theme.text : theme.subtext,
          minWidth: '5.5rem',
          textAlign: 'right',
          opacity: isCompleted ? 1 : 0.5,
        }}
      >
        {isCompleted && displayTime
          ? displayTime
          : showBestRun && split.bestTime !== null
          ? formatTime(split.bestTime, decimalPlaces)
          : showLastRun && split.lastTime !== null
          ? formatTime(split.lastTime, decimalPlaces)
          : '—'}
      </span>
    </div>
  )
}
