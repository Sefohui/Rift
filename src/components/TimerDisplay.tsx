import { useTimerStore } from '@/stores/timerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { formatTime, formatDelta, calcBestPossibleSimple } from '@/utils/time'

export function TimerDisplay() {
  const { elapsedMs, state, currentSplitIndex } = useTimerStore()
  const { settings } = useSettingsStore()
  const { collection } = useCollectionStore()
  const { theme, decimalPlaces, showBestPossible } = settings

  const splits = collection.splits
  const bestSegments = splits.map((s) => s.bestSegmentTime)

  // Determine timer color based on comparison to best run
  let timerColor = theme.timerColor
  if (state === 'running' || state === 'paused') {
    const prevSplitBest =
      currentSplitIndex > 0 ? splits[currentSplitIndex - 1]?.bestTime : null
    const prevSplitLast =
      currentSplitIndex > 0 ? splits[currentSplitIndex - 1]?.lastTime : null

    const reference = prevSplitBest ?? prevSplitLast
    if (reference !== null) {
      if (elapsedMs < reference) timerColor = theme.timerAheadColor
      else timerColor = theme.timerBehindColor
    }
  } else if (state === 'finished') {
    if (collection.bestRunTime !== null && elapsedMs <= collection.bestRunTime) {
      timerColor = theme.timerAheadColor
    } else if (collection.lastRunTime !== null) {
      timerColor =
        elapsedMs <= collection.lastRunTime
          ? theme.timerAheadColor
          : theme.timerBehindColor
    }
  }

  const bestPossible =
    showBestPossible &&
    (state === 'running' || state === 'paused') &&
    splits.length > 0
      ? calcBestPossibleSimple(elapsedMs, currentSplitIndex, bestSegments)
      : null

  const fontSize =
    settings.fontSize === 'sm' ? '2.2rem' : settings.fontSize === 'lg' ? '3.2rem' : '2.7rem'

  const hasPBRow =
    (state === 'running' || state === 'paused' || state === 'finished') &&
    collection.bestRunTime !== null

  return (
    <div
      className="px-4 pt-3 pb-2 flex flex-col items-end"
      style={{ borderBottom: `1px solid ${theme.accent}22` }}
    >
      {/* Main timer — no color transition to avoid flicker at 10ms tick rate */}
      <div
        className="font-mono font-bold tabular-nums"
        style={{
          fontSize,
          color: timerColor,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {formatTime(elapsedMs, decimalPlaces)}
      </div>

      {/* Secondary info row — fixed height to prevent layout shift */}
      <div className="flex items-center gap-4 mt-1.5" style={{ height: '1.25rem' }}>
        {/* Best possible time */}
        {bestPossible !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: theme.subtext }}>
              Best Possible
            </span>
            <span
              className="font-mono text-xs tabular-nums"
              style={{ color: theme.goldColor }}
            >
              {formatTime(bestPossible, decimalPlaces)}
            </span>
          </div>
        )}

        {/* Run delta vs PB */}
        {hasPBRow && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: theme.subtext }}>
              vs PB
            </span>
            <span
              className="font-mono text-xs tabular-nums font-semibold"
              style={{
                color:
                  elapsedMs <= collection.bestRunTime!
                    ? theme.aheadColor
                    : theme.behindColor,
              }}
            >
              {formatDelta(elapsedMs - collection.bestRunTime!, decimalPlaces)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
