import { app, BrowserWindow, ipcMain, dialog, globalShortcut, nativeImage, Menu } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Set app name early so macOS menu bar and dock show "Rift" instead of "Electron"
app.name = 'Rift'

// Set dock icon as early as possible (before window creation)
const iconPath = app.isPackaged
  ? path.join(process.resourcesPath, 'icon.png')
  : path.join(__dirname, '../build/icon.png')  // __dirname = dist-electron/, so ../build = project root/build

if (process.platform === 'darwin' && fs.existsSync(iconPath)) {
  app.dock.setIcon(nativeImage.createFromPath(iconPath))
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 700,
    minWidth: 280,
    minHeight: 400,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 10 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    resizable: true,
    alwaysOnTop: false,
  })

  // Set window icon (Windows/Linux — macOS uses dock icon set above)
  if (fs.existsSync(iconPath)) {
    mainWindow.setIcon(nativeImage.createFromPath(iconPath))
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC: Save collection to file
ipcMain.handle('save-collection', async (_event, data: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save Split Collection',
    defaultPath: 'splits.rift',
    filters: [{ name: 'Rift Files', extensions: ['rift'] }],
  })
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, data, 'utf-8')
    return { success: true, filePath: result.filePath }
  }
  return { success: false }
})

// IPC: Load collection from file
ipcMain.handle('load-collection', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open Split Collection',
    filters: [{ name: 'Rift Files', extensions: ['rift', 'splitapp'] }],
    properties: ['openFile'],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const data = fs.readFileSync(result.filePaths[0], 'utf-8')
    return { success: true, data }
  }
  return { success: false }
})

// IPC: Always on top toggle
ipcMain.handle('set-always-on-top', (_event, value: boolean) => {
  mainWindow?.setAlwaysOnTop(value)
})

// IPC: Register global hotkeys
ipcMain.handle('register-hotkeys', (_event, hotkeys: Record<string, string>) => {
  globalShortcut.unregisterAll()
  for (const [action, accelerator] of Object.entries(hotkeys)) {
    if (!accelerator) continue
    try {
      globalShortcut.register(accelerator, () => {
        mainWindow?.webContents.send('hotkey-action', action)
      })
    } catch {
      // ignore invalid accelerators
    }
  }
})

// IPC: Unregister hotkeys
ipcMain.handle('unregister-hotkeys', () => {
  globalShortcut.unregisterAll()
})

// IPC: Window drag (custom titlebar)
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())

app.whenReady().then(() => {
  // Rebuild the application menu so the first entry reads "Rift" instead of "Electron"
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Rift',
        submenu: [
          { role: 'about', label: 'About Rift' },
          { type: 'separator' },
          { role: 'hide', label: 'Hide Rift' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit', label: 'Quit Rift' },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          { role: 'front' },
        ],
      },
    ])
  )
  createWindow()
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
