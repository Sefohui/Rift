import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RunCollection, Split, DEFAULT_COLLECTION } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface CollectionStore {
  collection: RunCollection
  // Collection management
  setCollection: (collection: RunCollection) => void
  newCollection: () => void
  updateMeta: (patch: Partial<Pick<RunCollection, 'name' | 'game' | 'category'>>) => void

  // Split editing
  addSplit: (name: string) => void
  removeSplit: (id: string) => void
  renameSplit: (id: string, name: string) => void
  moveSplit: (fromIndex: number, toIndex: number) => void

  // After a completed run
  recordRun: (splitTimes: (number | null)[], finalTime: number) => void
  resetBests: () => void

  // Serialization
  exportJSON: () => string
  importJSON: (json: string) => boolean
}

function newSplit(name: string): Split {
  return {
    id: uuidv4(),
    name,
    bestSegmentTime: null,
    bestTime: null,
    lastTime: null,
  }
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      collection: { ...DEFAULT_COLLECTION, id: uuidv4() },

      setCollection: (collection) => set({ collection }),

      newCollection: () =>
        set({ collection: { ...DEFAULT_COLLECTION, id: uuidv4() } }),

      updateMeta: (patch) =>
        set((state) => ({
          collection: { ...state.collection, ...patch },
        })),

      addSplit: (name) =>
        set((state) => ({
          collection: {
            ...state.collection,
            splits: [...state.collection.splits, newSplit(name)],
          },
        })),

      removeSplit: (id) =>
        set((state) => ({
          collection: {
            ...state.collection,
            splits: state.collection.splits.filter((s) => s.id !== id),
          },
        })),

      renameSplit: (id, name) =>
        set((state) => ({
          collection: {
            ...state.collection,
            splits: state.collection.splits.map((s) =>
              s.id === id ? { ...s, name } : s
            ),
          },
        })),

      moveSplit: (fromIndex, toIndex) =>
        set((state) => {
          const splits = [...state.collection.splits]
          const [removed] = splits.splice(fromIndex, 1)
          splits.splice(toIndex, 0, removed)
          return { collection: { ...state.collection, splits } }
        }),

      recordRun: (splitTimes, finalTime) =>
        set((state) => {
          const { collection } = state
          const splits = collection.splits.map((split, i) => {
            const cumTime = splitTimes[i]
            const prevCumTime = i > 0 ? splitTimes[i - 1] : 0
            const segmentTime = cumTime !== null && prevCumTime !== null
              ? cumTime - (prevCumTime ?? 0)
              : null

            const newLastTime = cumTime
            const newBestTime =
              cumTime !== null &&
              (split.bestTime === null || cumTime < split.bestTime)
                ? cumTime
                : split.bestTime
            const newBestSegment =
              segmentTime !== null &&
              (split.bestSegmentTime === null || segmentTime < split.bestSegmentTime)
                ? segmentTime
                : split.bestSegmentTime

            return {
              ...split,
              lastTime: newLastTime,
              bestTime: newBestTime,
              bestSegmentTime: newBestSegment,
            }
          })

          const allCompleted = splitTimes.every((t) => t !== null)
          const newBestRunTime =
            allCompleted &&
            (collection.bestRunTime === null || finalTime < collection.bestRunTime)
              ? finalTime
              : collection.bestRunTime

          return {
            collection: {
              ...collection,
              splits,
              attempts: collection.attempts + 1,
              completedAttempts: allCompleted
                ? collection.completedAttempts + 1
                : collection.completedAttempts,
              bestRunTime: newBestRunTime,
              lastRunTime: allCompleted ? finalTime : collection.lastRunTime,
            },
          }
        }),

      resetBests: () =>
        set((state) => ({
          collection: {
            ...state.collection,
            splits: state.collection.splits.map((s) => ({
              ...s,
              bestSegmentTime: null,
              bestTime: null,
              lastTime: null,
            })),
            bestRunTime: null,
            lastRunTime: null,
            attempts: 0,
            completedAttempts: 0,
          },
        })),

      exportJSON: () => {
        return JSON.stringify(get().collection, null, 2)
      },

      importJSON: (json) => {
        try {
          const data = JSON.parse(json) as RunCollection
          // Basic validation
          if (!data.id || !data.splits || !Array.isArray(data.splits)) return false
          set({ collection: data })
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'rift-collection',
    }
  )
)
