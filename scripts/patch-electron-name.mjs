/**
 * Patches the Electron binary's Info.plist so macOS shows "Rift" everywhere:
 * menu bar, dock tooltip, Spotlight, Activity Monitor.
 *
 * Runs automatically via `predev` and `postinstall`.
 */
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appPath = path.join(__dirname, '../node_modules/electron/dist/Electron.app')
const plistPath = path.join(appPath, 'Contents/Info.plist')

if (!fs.existsSync(plistPath)) {
  console.log('Skipping name patch — Electron.app not found (non-macOS or not installed yet)')
  process.exit(0)
}

const pb = '/usr/libexec/PlistBuddy'

// Dock tooltip and Spotlight use LSDisplayName > CFBundleDisplayName > CFBundleName
// Menu bar bold name uses CFBundleName
// Do NOT change CFBundleExecutable — it must match the actual binary filename
const keys = ['CFBundleName', 'CFBundleDisplayName', 'LSDisplayName']

let changed = false
for (const key of keys) {
  try {
    const current = execSync(`${pb} -c "Print :${key}" "${plistPath}" 2>/dev/null`).toString().trim()
    if (current !== 'Rift') {
      execSync(`${pb} -c "Set :${key} Rift" "${plistPath}"`)
      console.log(`✓ ${key}: "${current}" → "Rift"`)
      changed = true
    }
  } catch {
    // Key doesn't exist — add it
    try {
      execSync(`${pb} -c "Add :${key} string Rift" "${plistPath}"`)
      console.log(`✓ Added ${key}: "Rift"`)
      changed = true
    } catch { /* ignore */ }
  }
}

// Patch helper bundles (needed for some macOS versions)
const helperPlists = [
  'Contents/Frameworks/Electron Helper.app/Contents/Info.plist',
  'Contents/Frameworks/Electron Helper (GPU).app/Contents/Info.plist',
  'Contents/Frameworks/Electron Helper (Plugin).app/Contents/Info.plist',
  'Contents/Frameworks/Electron Helper (Renderer).app/Contents/Info.plist',
].map(p => path.join(appPath, p))

for (const hp of helperPlists) {
  if (!fs.existsSync(hp)) continue
  try {
    execSync(`${pb} -c "Set :CFBundleName Rift" "${hp}" 2>/dev/null`)
    execSync(`${pb} -c "Set :CFBundleDisplayName Rift" "${hp}" 2>/dev/null`)
  } catch { /* ignore */ }
}

// Flush LaunchServices cache so the dock picks up the new name immediately
const lsregister =
  '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister'
if (fs.existsSync(lsregister) && changed) {
  try {
    execSync(`${lsregister} -f "${appPath}"`)
    // Restart Dock to apply the change without needing a logout
    execSync('killall Dock 2>/dev/null || true')
    console.log('✓ LaunchServices cache flushed — Dock restarted')
  } catch { /* ignore */ }
}

if (!changed) {
  console.log('ℹ Electron already patched with name "Rift"')
}
