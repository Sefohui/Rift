export interface Split {
  id: string
  name: string
  // Best segment time (not cumulative, just this segment's best)
  bestSegmentTime: number | null
  // Best cumulative time at this split point
  bestTime: number | null
  // Last run cumulative time at this split point
  lastTime: number | null
}

export interface RunCollection {
  id: string
  name: string
  game: string
  category: string
  splits: Split[]
  attempts: number
  completedAttempts: number
  bestRunTime: number | null
  lastRunTime: number | null
}

export type TimerState = 'idle' | 'running' | 'paused' | 'finished'

export interface ActiveRun {
  startTime: number // Date.now() at start
  pausedAt: number | null
  pausedDuration: number // total ms spent paused
  currentSplitIndex: number
  splitTimes: (number | null)[] // cumulative elapsed ms at each completed split
  liveTime: number // current elapsed ms (updated by interval)
}

export interface Theme {
  background: string
  backgroundImage: string | null
  text: string
  subtext: string
  accent: string
  aheadColor: string
  behindColor: string
  goldColor: string
  timerColor: string
  timerAheadColor: string
  timerBehindColor: string
  splitEvenColor: string
}

export interface AppSettings {
  theme: Theme
  font: string
  fontSize: 'sm' | 'md' | 'lg'
  alwaysOnTop: boolean
  hotkeys: {
    split: string
    reset: string
    undo: string
    skip: string
    pause: string
  }
  showBestPossible: boolean
  showLastRun: boolean
  showBestRun: boolean
  showAttempts: boolean
  showGraph: boolean
  soundEnabled: boolean
  soundVolume: number
  decimalPlaces: 2 | 3
}

export const DEFAULT_THEME: Theme = {
  background: '#0f0f1a',
  backgroundImage: null,
  text: '#e8e8f0',
  subtext: '#888899',
  accent: '#7c6af7',
  aheadColor: '#4ade80',
  behindColor: '#f87171',
  goldColor: '#fbbf24',
  timerColor: '#e8e8f0',
  timerAheadColor: '#4ade80',
  timerBehindColor: '#f87171',
  splitEvenColor: '#60a5fa',
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: DEFAULT_THEME,
  font: 'JetBrains Mono',
  fontSize: 'md',
  alwaysOnTop: false,
  hotkeys: {
    split: 'Space',
    reset: 'F2',
    undo: 'F8',
    skip: 'F9',
    pause: 'F1',
  },
  showBestPossible: true,
  showLastRun: true,
  showBestRun: true,
  showAttempts: true,
  showGraph: true,
  soundEnabled: true,
  soundVolume: 0.6,
  decimalPlaces: 2,
}

export const DEFAULT_COLLECTION: RunCollection = {
  id: '',
  name: 'New Game',
  game: 'My Game',
  category: 'Any%',
  splits: [],
  attempts: 0,
  completedAttempts: 0,
  bestRunTime: null,
  lastRunTime: null,
}
