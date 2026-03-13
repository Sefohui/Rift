import { useCollectionStore } from '@/stores/collectionStore'
import { useTimerStore } from '@/stores/timerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { SplitRow } from './SplitRow'
import { formatTime } from '@/utils/time'

export function SplitList() {
  const { collection } = useCollectionStore()
  const { currentSplitIndex, splitTimes, state } = useTimerStore()
  const { settings } = useSettingsStore()
  const { theme, decimalPlaces, showAttempts } = settings

  const splits = collection.splits
  const isRunning = state === 'running' || state === 'paused' || state === 'finished'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center px-3 py-1 text-xs"
        style={{ color: theme.subtext, borderBottom: `1px solid ${theme.accent}15` }}
      >
        <span className="flex-1">{collection.game} — {collection.category}</span>
        {showAttempts && (
          <span>{collection.completedAttempts}/{collection.attempts}</span>
        )}
      </div>

      {/* Split rows */}
      <div className="flex-1 overflow-y-auto">
        {splits.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-2 text-sm"
            style={{ color: theme.subtext }}
          >
            <span>No splits defined</span>
            <span className="text-xs opacity-60">Open settings to add splits</span>
          </div>
        ) : (
          splits.map((split, index) => {
            const completed = isRunning && index < currentSplitIndex
            const active = isRunning && index === currentSplitIndex && state !== 'finished'
            const skipped = completed && splitTimes[index] === null

            return (
              <SplitRow
                key={split.id}
                split={split}
                index={index}
                splitTime={splitTimes[index] ?? null}
                isActive={active}
                isCompleted={completed && !skipped}
                isSkipped={skipped}
              />
            )
          })
        )}
      </div>

      {/* Footer: sum of best / PB */}
      <div
        className="px-3 py-2 flex items-center justify-between text-xs"
        style={{ borderTop: `1px solid ${theme.accent}15`, color: theme.subtext }}
      >
        <span>
          {collection.bestRunTime !== null
            ? `PB ${formatTime(collection.bestRunTime, decimalPlaces)}`
            : 'No PB yet'}
        </span>
        {collection.lastRunTime !== null && (
          <span>Last {formatTime(collection.lastRunTime, decimalPlaces)}</span>
        )}
      </div>
    </div>
  )
}
