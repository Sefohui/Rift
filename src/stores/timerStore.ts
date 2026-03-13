import { create } from 'zustand'
import { TimerState } from '@/types'

interface TimerStore {
  state: TimerState
  startTime: number | null      // Date.now() when timer started (adjusted for pauses)
  pausedAt: number | null       // Date.now() when paused
  elapsedMs: number             // current elapsed ms (live)
  currentSplitIndex: number
  splitTimes: (number | null)[] // cumulative ms at each completed split
  intervalRef: ReturnType<typeof setInterval> | null

  // Actions
  start: (numSplits: number) => void
  split: () => number | null    // returns elapsed ms at split moment
  skip: () => void
  undoSplit: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  tick: () => void
  setElapsed: (ms: number) => void
}

export const useTimerStore = create<TimerStore>()((set, get) => ({
  state: 'idle',
  startTime: null,
  pausedAt: null,
  elapsedMs: 0,
  currentSplitIndex: 0,
  splitTimes: [],
  intervalRef: null,

  start: (numSplits) => {
    const { state } = get()
    if (state === 'running') return
    if (state === 'paused') {
      get().resume()
      return
    }

    const now = Date.now()
    const interval = setInterval(() => get().tick(), 10)

    set({
      state: 'running',
      startTime: now,
      pausedAt: null,
      elapsedMs: 0,
      currentSplitIndex: 0,
      splitTimes: new Array(numSplits).fill(null),
      intervalRef: interval,
    })
  },

  split: () => {
    const { state, startTime, elapsedMs, currentSplitIndex, splitTimes } = get()
    if (state !== 'running' || startTime === null) return null

    const elapsed = elapsedMs
    const newSplitTimes = [...splitTimes]
    newSplitTimes[currentSplitIndex] = elapsed

    const isLast = currentSplitIndex >= splitTimes.length - 1

    if (isLast) {
      // Finish the run
      const interval = get().intervalRef
      if (interval) clearInterval(interval)
      set({
        splitTimes: newSplitTimes,
        state: 'finished',
        currentSplitIndex: currentSplitIndex + 1,
        intervalRef: null,
        elapsedMs: elapsed,
      })
    } else {
      set({
        splitTimes: newSplitTimes,
        currentSplitIndex: currentSplitIndex + 1,
      })
    }

    return elapsed
  },

  skip: () => {
    const { state, currentSplitIndex, splitTimes } = get()
    if (state !== 'running') return
    if (currentSplitIndex >= splitTimes.length - 1) return

    const newSplitTimes = [...splitTimes]
    newSplitTimes[currentSplitIndex] = null // null = skipped

    set({
      splitTimes: newSplitTimes,
      currentSplitIndex: currentSplitIndex + 1,
    })
  },

  undoSplit: () => {
    const { state, currentSplitIndex, splitTimes } = get()
    if (state !== 'running' && state !== 'finished') return
    if (currentSplitIndex <= 0) return

    const prevIndex = currentSplitIndex - 1
    const newSplitTimes = [...splitTimes]
    newSplitTimes[prevIndex] = null

    // If we were finished, restart the interval
    let intervalRef = get().intervalRef
    if (state === 'finished') {
      intervalRef = setInterval(() => get().tick(), 10)
    }

    set({
      state: 'running',
      splitTimes: newSplitTimes,
      currentSplitIndex: prevIndex,
      intervalRef,
    })
  },

  pause: () => {
    const { state, intervalRef } = get()
    if (state !== 'running') return
    if (intervalRef) clearInterval(intervalRef)
    set({ state: 'paused', pausedAt: Date.now(), intervalRef: null })
  },

  resume: () => {
    const { state, startTime, pausedAt } = get()
    if (state !== 'paused' || !startTime || !pausedAt) return

    const pausedDuration = Date.now() - pausedAt
    const interval = setInterval(() => get().tick(), 10)

    set({
      state: 'running',
      startTime: startTime + pausedDuration,
      pausedAt: null,
      intervalRef: interval,
    })
  },

  reset: () => {
    const { intervalRef } = get()
    if (intervalRef) clearInterval(intervalRef)
    set({
      state: 'idle',
      startTime: null,
      pausedAt: null,
      elapsedMs: 0,
      currentSplitIndex: 0,
      splitTimes: [],
      intervalRef: null,
    })
  },

  tick: () => {
    const { startTime, state } = get()
    if (state !== 'running' || !startTime) return
    set({ elapsedMs: Date.now() - startTime })
  },

  setElapsed: (ms) => set({ elapsedMs: ms }),
}))
