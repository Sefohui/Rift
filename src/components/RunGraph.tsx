import { useMemo } from 'react'
import { useTimerStore } from '@/stores/timerStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useSettingsStore } from '@/stores/settingsStore'

const W = 340
const H = 100
const PAD = { top: 8, right: 8, bottom: 18, left: 40 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

function formatDeltaShort(ms: number): string {
  const sign = ms < 0 ? '−' : '+'
  const abs = Math.abs(ms)
  const s = abs / 1000
  if (s >= 60) {
    const m = Math.floor(s / 60)
    const rem = Math.floor(s % 60)
    return `${sign}${m}:${String(rem).padStart(2, '0')}`
  }
  return `${sign}${s.toFixed(1)}s`
}

export function RunGraph() {
  const { state, currentSplitIndex, splitTimes, elapsedMs } = useTimerStore()
  const { collection } = useCollectionStore()
  const { settings } = useSettingsStore()
  const { theme } = settings

  const splits = collection.splits
  const n = splits.length

  // Only show when running, paused, or finished and there's reference data
  const hasReference = splits.some((s) => s.bestTime !== null || s.lastTime !== null)
  const isActive = state === 'running' || state === 'paused' || state === 'finished'

  // Build delta series: delta vs PB (preferred) or last run at each split point
  const referenceLabel = splits.some((s) => s.bestTime !== null) ? 'PB' : 'Last'

  // Points for completed splits in current run
  const currentPoints = useMemo(() => {
    if (!isActive) return []
    return splits.map((split, i) => {
      const ref = split.bestTime ?? split.lastTime
      if (ref === null) return null
      const completed = splitTimes[i] !== null && i < currentSplitIndex
      if (!completed) return null
      return splitTimes[i]! - ref
    })
  }, [splits, splitTimes, currentSplitIndex, isActive])

  // Points for last run
  const lastRunPoints = useMemo(() => {
    return splits.map((split) => {
      const ref = split.bestTime ?? split.lastTime
      const last = split.lastTime
      if (ref === null || last === null) return null
      // If last IS the reference (no bestTime), delta is 0
      if (split.bestTime === null) return 0
      return last - ref
    })
  }, [splits])

  // Live point (current segment, not yet split)
  const livePoint = useMemo(() => {
    if (state !== 'running' && state !== 'paused') return null
    if (currentSplitIndex >= n) return null
    const ref = splits[currentSplitIndex]?.bestTime ?? splits[currentSplitIndex]?.lastTime
    if (ref === null || ref === undefined) return null
    return elapsedMs - ref
  }, [state, currentSplitIndex, splits, elapsedMs, n])

  if (!isActive || !hasReference || n < 2) return null

  // Gather all values to determine Y scale
  const allValues: number[] = []
  currentPoints.forEach((v) => v !== null && allValues.push(v))
  lastRunPoints.forEach((v) => v !== null && allValues.push(v))
  if (livePoint !== null) allValues.push(livePoint)
  allValues.push(0) // always include zero line

  if (allValues.length === 0) return null

  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const range = Math.max(maxVal - minVal, 2000) // at least 2s range
  const mid = (minVal + maxVal) / 2
  const yMin = mid - range / 2
  const yMax = mid + range / 2

  const toX = (i: number) => PAD.left + (i / (n - 1)) * INNER_W
  const toY = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * INNER_H
  const zeroY = toY(0)

  // Build SVG path from a series of nullable points
  function buildPath(points: (number | null)[]): string {
    let d = ''
    let started = false
    points.forEach((v, i) => {
      if (v === null) { started = false; return }
      const x = toX(i)
      const y = toY(v)
      if (!started) { d += `M ${x} ${y}`; started = true }
      else d += ` L ${x} ${y}`
    })
    return d
  }

  // Current run path (completed splits)
  const currentPath = buildPath(currentPoints)

  // Last run path
  const lastPath = buildPath(lastRunPoints)

  // Live extension from last completed to current live position
  let livePath = ''
  if (livePoint !== null) {
    const lastCompletedIdx = currentSplitIndex - 1
    if (lastCompletedIdx >= 0 && currentPoints[lastCompletedIdx] !== null) {
      livePath = `M ${toX(lastCompletedIdx)} ${toY(currentPoints[lastCompletedIdx]!)} L ${toX(currentSplitIndex)} ${toY(livePoint)}`
    } else if (currentSplitIndex === 0) {
      livePath = `M ${toX(0)} ${toY(livePoint)}`
    }
  }

  // Y axis labels (3 ticks: top, zero, bottom)
  const yTicks = [yMax, 0, yMin]

  return (
    <div
      className="px-2 py-1"
      style={{ borderBottom: `1px solid ${theme.accent}22` }}
    >
      <div className="flex items-center justify-between mb-0.5 px-1">
        <span className="text-xs" style={{ color: theme.subtext, fontSize: '0.65rem' }}>
          vs {referenceLabel}
        </span>
        <span className="text-xs" style={{ color: theme.subtext, fontSize: '0.65rem' }}>
          live graph
        </span>
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Grid background */}
        <rect
          x={PAD.left} y={PAD.top}
          width={INNER_W} height={INNER_H}
          fill={`${theme.accent}08`}
          rx={2}
        />

        {/* Zero line (reference / PB level) */}
        <line
          x1={PAD.left} y1={zeroY}
          x2={PAD.left + INNER_W} y2={zeroY}
          stroke={`${theme.accent}50`}
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        {/* Y axis tick labels */}
        {yTicks.map((v, i) => (
          <text
            key={i}
            x={PAD.left - 4}
            y={toY(v) + 3}
            textAnchor="end"
            fontSize={8}
            fill={theme.subtext}
            fontFamily="monospace"
          >
            {v === 0 ? '0' : formatDeltaShort(v)}
          </text>
        ))}

        {/* X axis split markers */}
        {splits.map((split, i) => (
          <g key={split.id}>
            <line
              x1={toX(i)} y1={PAD.top}
              x2={toX(i)} y2={PAD.top + INNER_H}
              stroke={`${theme.accent}18`}
              strokeWidth={1}
            />
            {/* Split name — only first and last, abbreviated */}
            {(i === 0 || i === n - 1) && (
              <text
                x={toX(i)}
                y={PAD.top + INNER_H + 12}
                textAnchor={i === 0 ? 'start' : 'end'}
                fontSize={7}
                fill={theme.subtext}
                fontFamily="monospace"
              >
                {split.name.length > 8 ? split.name.slice(0, 7) + '…' : split.name}
              </text>
            )}
          </g>
        ))}

        {/* Last run line */}
        {lastPath && (
          <path
            d={lastPath}
            fill="none"
            stroke={`${theme.subtext}70`}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        )}

        {/* Last run dots */}
        {lastRunPoints.map((v, i) =>
          v !== null ? (
            <circle
              key={i}
              cx={toX(i)}
              cy={toY(v)}
              r={2}
              fill={theme.subtext}
              opacity={0.5}
            />
          ) : null
        )}

        {/* Current run line */}
        {currentPath && (
          <path
            d={currentPath}
            fill="none"
            stroke={theme.accent}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Current run dots */}
        {currentPoints.map((v, i) =>
          v !== null ? (
            <circle
              key={i}
              cx={toX(i)}
              cy={toY(v)}
              r={3}
              fill={v < 0 ? theme.aheadColor : theme.behindColor}
              stroke={theme.background}
              strokeWidth={1}
            />
          ) : null
        )}

        {/* Live line (dashed extension to current moment) */}
        {livePath && (
          <path
            d={livePath}
            fill="none"
            stroke={livePoint !== null && livePoint < 0 ? theme.aheadColor : theme.behindColor}
            strokeWidth={1.5}
            strokeDasharray="3 2"
            strokeLinecap="round"
          />
        )}

        {/* Live dot */}
        {livePoint !== null && currentSplitIndex < n && (
          <circle
            cx={toX(currentSplitIndex)}
            cy={toY(livePoint)}
            r={4}
            fill={livePoint < 0 ? theme.aheadColor : theme.behindColor}
            stroke={theme.background}
            strokeWidth={1.5}
          />
        )}
      </svg>
    </div>
  )
}
