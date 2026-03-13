import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const svgPath = path.join(__dirname, '../public/logo.svg')
const buildDir = path.join(__dirname, '../build')

if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true })

const sizes = [16, 32, 64, 128, 256, 512, 1024]

// Generate all PNG sizes
for (const size of sizes) {
  await sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(path.join(buildDir, `icon_${size}x${size}.png`))
  console.log(`✓ icon_${size}x${size}.png`)
}

// 512x512 is the main one used for dock (dev) and electron-builder (prod)
await sharp(svgPath)
  .resize(512, 512)
  .png()
  .toFile(path.join(buildDir, 'icon.png'))

console.log('✓ icon.png (512x512 — main)')
console.log('\nDone. Run electron-builder to package with full .icns support.')
