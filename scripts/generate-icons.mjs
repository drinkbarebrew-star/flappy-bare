// Generates SVG-based PWA icons and saves them to public/icons/
// Run: node scripts/generate-icons.mjs
// Note: For production, replace with actual Bare Brew bear assets.
// These are brand-accurate placeholder SVGs.

import fs from 'fs'
import path from 'path'

const ICONS_DIR = path.resolve('public/icons')
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true })

// Brand SVG icon — bear face with gold background
function makeSVG(size, maskable = false) {
  const pad = maskable ? size * 0.12 : 0
  const inner = size - pad * 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${maskable ? size * 0.22 : size * 0.18}" fill="#2A1B0D"/>

  <!-- Gold circle bg -->
  <circle cx="${size/2}" cy="${size/2}" r="${inner*0.42}" fill="#E9B026" opacity="0.15"/>

  <!-- Bear ears -->
  <circle cx="${size*0.33}" cy="${size*0.28}" r="${inner*0.1}" fill="#8B6914"/>
  <circle cx="${size*0.67}" cy="${size*0.28}" r="${inner*0.1}" fill="#8B6914"/>
  <circle cx="${size*0.33}" cy="${size*0.28}" r="${inner*0.055}" fill="#c8923a"/>
  <circle cx="${size*0.67}" cy="${size*0.28}" r="${inner*0.055}" fill="#c8923a"/>

  <!-- Bear head -->
  <circle cx="${size/2}" cy="${size*0.48}" r="${inner*0.28}" fill="#a07828"/>

  <!-- Bear snout -->
  <ellipse cx="${size/2}" cy="${size*0.545}" rx="${inner*0.14}" ry="${inner*0.1}" fill="#d4a850"/>

  <!-- Bear nose -->
  <ellipse cx="${size/2}" cy="${size*0.505}" rx="${inner*0.055}" ry="${inner*0.038}" fill="#2A1B0D"/>

  <!-- Eyes -->
  <circle cx="${size*0.435}" cy="${size*0.44}" r="${inner*0.042}" fill="#2A1B0D"/>
  <circle cx="${size*0.565}" cy="${size*0.44}" r="${inner*0.042}" fill="#2A1B0D"/>
  <!-- Eye shine -->
  <circle cx="${size*0.448}" cy="${size*0.427}" r="${inner*0.014}" fill="#F5E6C8"/>
  <circle cx="${size*0.578}" cy="${size*0.427}" r="${inner*0.014}" fill="#F5E6C8"/>

  <!-- Gold ring / brand accent -->
  <circle cx="${size/2}" cy="${size*0.48}" r="${inner*0.3}" fill="none" stroke="#E9B026" stroke-width="${inner*0.025}" opacity="0.5"/>

  <!-- "BB" text at bottom -->
  <text x="${size/2}" y="${size*0.82}"
    font-family="'Arial Black', sans-serif" font-weight="900" font-size="${size*0.16}"
    fill="#E9B026" text-anchor="middle" letter-spacing="${size*0.01}">BB</text>
</svg>`
}

// Write SVG files
const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
]

for (const { name, size, maskable } of sizes) {
  // Write as SVG with .png extension — Vercel/Next will serve it.
  // In production: replace with real PNG assets.
  const svgName = name.replace('.png', '.svg')
  fs.writeFileSync(path.join(ICONS_DIR, svgName), makeSVG(size, maskable))
  console.log(`Generated: public/icons/${svgName}`)
}

// Also write a simple favicon.svg
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#2A1B0D"/>
  <circle cx="16" cy="15" r="8" fill="#a07828"/>
  <circle cx="11" cy="9" r="3" fill="#8B6914"/>
  <circle cx="21" cy="9" r="3" fill="#8B6914"/>
  <ellipse cx="16" cy="17" rx="4" ry="3" fill="#d4a850"/>
  <circle cx="16" cy="15.5" rx="1.5" ry="1" fill="#2A1B0D"/>
</svg>`

fs.writeFileSync(path.join('public', 'favicon.svg'), faviconSvg)
console.log('Generated: public/favicon.svg')
console.log('\nDone. Replace SVGs with real PNG assets for production.')
