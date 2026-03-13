import { useSettingsStore } from '@/stores/settingsStore'

declare global {
  interface Window {
    electronAPI?: {
      windowMinimize: () => void
      windowMaximize: () => void
      windowClose: () => void
      saveCollection: (data: string) => Promise<{ success: boolean; filePath?: string }>
      loadCollection: () => Promise<{ success: boolean; data?: string }>
      setAlwaysOnTop: (value: boolean) => Promise<void>
      registerHotkeys: (hotkeys: Record<string, string>) => Promise<void>
      unregisterHotkeys: () => Promise<void>
      onHotkeyAction: (callback: (action: string) => void) => () => void
    }
  }
}

export function TitleBar({ title }: { title: string }) {
  const { settings } = useSettingsStore()
  const { theme } = settings

  return (
    <div
      className="flex items-center select-none"
      style={{
        background: theme.background,
        borderBottom: `1px solid ${theme.accent}22`,
        WebkitAppRegion: 'drag',
        height: '36px',
        // Leave space on the left for macOS traffic lights (hiddenInset gives ~72px)
        paddingLeft: '80px',
        paddingRight: '12px',
      } as React.CSSProperties}
    >
      <div className="flex items-center justify-center gap-1.5 w-full">
        <img src="/logo.svg" alt="" width={16} height={16} style={{ borderRadius: '3px', flexShrink: 0 }} />
        <span
          className="text-xs font-semibold tracking-wider truncate"
          style={{ color: theme.subtext }}
        >
          {title}
        </span>
      </div>
    </div>
  )
}
