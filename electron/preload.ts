import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveCollection: (data: string) => ipcRenderer.invoke('save-collection', data),
  loadCollection: () => ipcRenderer.invoke('load-collection'),

  // Window controls
  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('set-always-on-top', value),
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  // Global hotkeys
  registerHotkeys: (hotkeys: Record<string, string>) =>
    ipcRenderer.invoke('register-hotkeys', hotkeys),
  unregisterHotkeys: () => ipcRenderer.invoke('unregister-hotkeys'),
  onHotkeyAction: (callback: (action: string) => void) => {
    ipcRenderer.on('hotkey-action', (_event, action) => callback(action))
    return () => ipcRenderer.removeAllListeners('hotkey-action')
  },
})
