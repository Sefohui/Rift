/**
 * Format milliseconds into a human-readable time string.
 * e.g. 3723456 → "1:02:03.45"
 */
export function formatTime(ms: number, decimals: 2 | 3 = 2): string {
  if (ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const dec = Math.floor((ms % 1000) / (decimals === 2 ? 10 : 1))

  const pad = (n: number, len = 2) => String(n).padStart(len, '0')

  const decStr = pad(dec, decimals)

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}.${decStr}`
  }
  if (minutes > 0) {
    return `${minutes}:${pad(seconds)}.${decStr}`
  }
  return `${seconds}.${decStr}`
}

/**
 * Format a delta (signed ms) for comparison display.
 * e.g. -1234 → "−1.23", +5678 → "+5.67"
 */
export function formatDelta(ms: number, decimals: 2 | 3 = 2): string {
  const sign = ms < 0 ? '−' : '+'
  const abs = Math.abs(ms)
  const totalSeconds = Math.floor(abs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const dec = Math.floor((abs % 1000) / (decimals === 2 ? 10 : 1))
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const decStr = pad(dec, decimals)

  if (minutes > 0) {
    return `${sign}${minutes}:${pad(seconds)}.${decStr}`
  }
  return `${sign}${seconds}.${decStr}`
}

/**
 * Calculate the "best possible time" = elapsed time so far + sum of best segments for remaining splits
 */
export function calcBestPossible(
  currentElapsed: number,
  currentSplitIndex: number,
  splitTimes: (number | null)[],
  bestSegmentTimes: (number | null)[],
): number | null {
  // Sum of segments already completed (elapsed - time before current split)
  // We already have the elapsed time, so we need to add the best segments for splits not yet done

  // Time used for completed segments
  const lastCompletedSplit = currentSplitIndex > 0 ? splitTimes[currentSplitIndex - 1] : null
  const timeInCurrentSegment = lastCompletedSplit !== null
    ? currentElapsed - lastCompletedSplit
    : currentElapsed

  // Sum best segments for remaining splits (currentSplitIndex and beyond)
  let remainingBest = 0
  for (let i = currentSplitIndex; i < bestSegmentTimes.length; i++) {
    if (bestSegmentTimes[i] === null) return null // can't calculate
    remainingBest += bestSegmentTimes[i]!
  }

  // Best possible = time up to current segment start + best of current segment + best of remaining
  const timeBeforeCurrentSegment = lastCompletedSplit ?? 0
  // For the current segment: take the lesser of timeInCurrentSegment and bestSegmentTimes[currentSplitIndex]
  const currentBest = bestSegmentTimes[currentSplitIndex]
  const currentSegmentBest = currentBest !== null
    ? Math.min(timeInCurrentSegment, currentBest)
    : timeInCurrentSegment

  return timeBeforeCurrentSegment + currentSegmentBest + remainingBest - (currentBest !== null ? currentBest : 0) +
    (currentBest !== null ? currentSegmentBest : timeInCurrentSegment) +
    (remainingBest - (currentBest ?? 0))
}

/**
 * Simpler best possible: elapsed + sum of best remaining segments
 */
export function calcBestPossibleSimple(
  currentElapsed: number,
  currentSplitIndex: number,
  bestSegmentTimes: (number | null)[],
): number | null {
  // Sum best segments for all splits AFTER currentSplitIndex
  let remainingBest = 0
  for (let i = currentSplitIndex + 1; i < bestSegmentTimes.length; i++) {
    if (bestSegmentTimes[i] === null) return null
    remainingBest += bestSegmentTimes[i]!
  }
  return currentElapsed + remainingBest
}
