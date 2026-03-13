import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppSettings, DEFAULT_SETTINGS } from '@/types'

interface SettingsStore {
  settings: AppSettings
  updateTheme: (patch: Partial<AppSettings['theme']>) => void
  updateHotkeys: (patch: Partial<AppSettings['hotkeys']>) => void
  updateSettings: (patch: Partial<Omit<AppSettings, 'theme' | 'hotkeys'>>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateTheme: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme: { ...state.settings.theme, ...patch },
          },
        })),

      updateHotkeys: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            hotkeys: { ...state.settings.hotkeys, ...patch },
          },
        })),

      updateSettings: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'rift-settings',
    }
  )
)
