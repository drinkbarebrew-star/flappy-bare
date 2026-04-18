import { COLORS, DEFAULT_CONFIG } from './constants'
import type { Bear, Pillar, Coin, Particle, ScoreFloat } from './types'

const cfg = DEFAULT_CONFIG
const BS = cfg.bearSize

// ─── Day/night sky presets (5 gradient stops each) ──────────
// Stops correspond to: top, upper-mid, mid, lower-mid, horizon
const SKY: Record<string, [string, string, string, string, string]> = {
  night:  ['#0d0805', '#150c06', '#1f1209', '#2c1a0a', '#3d2410'],
  dawn:   ['#180a18', '#3a1428', '#7a2e24', '#c05028', '#e8803c'],
  day:    ['#0a1828', '#123268', '#1e56a0', '#2e78c8', '#4a9ae0'],
  sunset: ['#160808', '#38100e', '#841e10', '#c83c18', '#e85a20'],
}

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bv = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bv})`
}
function blendSky(
  a: [string, string, string, string, string],
  b: [string, string, string, string, string],
  t: number
): [string, string, string, string, string] {
  return a.map((c, i) => lerpColor(c, b[i], t)) as [string, string, string, string, string]
}

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private W: number = 0
  private H: number = 0
  private groundOffset: number = 0
  private bearImage: HTMLImageElement | null = null
  private score: number = 0

  setScore(score: number) { this.score = score }

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  setBearImage(img: HTMLImageElement) {
    this.bearImage = img
  }

  setSize(w: number, h: number) {
    this.W = w
    this.H = h
  }

  tick(speed: number) {
    this.groundOffset = (this.groundOffset + speed) % 24
  }

  // ─── Background ────────────────────────────────────────────
  drawBackground() {
    const { ctx, W, H } = this

    // ── Day/night cycle ──────────────────────────────────────
    // Full cycle every 40 pipes. Phases: night→dawn→day→sunset→night
    const cycle = (this.score % 40) / 40
    // Map cycle position to sky blend
    let skyStops: [string, string, string, string, string]
    let starAlpha: number
    let showSun: boolean
    let sunX: number, sunY: number, sunR: number
    let sunColor: string
    let sunGlowColor: string

    if (cycle < 0.15) {
      // Night
      skyStops = SKY.night
      starAlpha = 0.18
      showSun = false; sunX = sunY = sunR = 0; sunColor = sunGlowColor = ''
    } else if (cycle < 0.3) {
      // Night → Dawn
      const t = (cycle - 0.15) / 0.15
      skyStops = blendSky(SKY.night, SKY.dawn, t)
      starAlpha = 0.18 * (1 - t)
      // Sun rising at right horizon
      const st = t
      sunX = W * (0.85 - st * 0.2); sunY = H * (0.78 - st * 0.28)
      sunR = 18; sunColor = '#ffb060'; sunGlowColor = 'rgba(255,160,60,0.35)'
      showSun = t > 0.3
    } else if (cycle < 0.45) {
      // Dawn → Day
      const t = (cycle - 0.3) / 0.15
      skyStops = blendSky(SKY.dawn, SKY.day, t)
      starAlpha = 0
      sunX = W * (0.65 - t * 0.15); sunY = H * (0.5 - t * 0.35)
      sunR = 18 + t * 6; sunColor = '#ffe090'; sunGlowColor = 'rgba(255,220,100,0.3)'
      showSun = true
    } else if (cycle < 0.6) {
      // Day (full)
      skyStops = SKY.day
      starAlpha = 0
      const t = (cycle - 0.45) / 0.15
      sunX = W * (0.5 - t * 0.15); sunY = H * (0.15 - t * 0.05)
      sunR = 24; sunColor = '#fff0a0'; sunGlowColor = 'rgba(255,240,140,0.28)'
      showSun = true
    } else if (cycle < 0.75) {
      // Day → Sunset
      const t = (cycle - 0.6) / 0.15
      skyStops = blendSky(SKY.day, SKY.sunset, t)
      starAlpha = 0
      sunX = W * (0.35 - t * 0.2); sunY = H * (0.2 + t * 0.55)
      sunR = 24 - t * 6; sunColor = '#ff9040'; sunGlowColor = 'rgba(255,120,40,0.35)'
      showSun = true
    } else if (cycle < 0.88) {
      // Sunset → Night
      const t = (cycle - 0.75) / 0.13
      skyStops = blendSky(SKY.sunset, SKY.night, t)
      starAlpha = 0.18 * t
      sunX = W * 0.15; sunY = H * (0.75 + t * 0.1)
      sunR = 18 - t * 8; sunColor = '#ff7030'; sunGlowColor = 'rgba(255,80,20,0.3)'
      showSun = (1 - t) > 0.2
    } else {
      // Night
      skyStops = SKY.night
      starAlpha = 0.18
      showSun = false; sunX = sunY = sunR = 0; sunColor = sunGlowColor = ''
    }

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
    skyGrad.addColorStop(0,   skyStops[0])
    skyGrad.addColorStop(0.3, skyStops[1])
    skyGrad.addColorStop(0.6, skyStops[2])
    skyGrad.addColorStop(0.8, skyStops[3])
    skyGrad.addColorStop(1,   skyStops[4])
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, W, H)

    // Sun or moon
    if (showSun && sunR > 2) {
      // Glow halo
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3.5)
      glow.addColorStop(0, sunGlowColor)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunR * 3.5, 0, Math.PI * 2)
      ctx.fill()
      // Sun disc
      ctx.fillStyle = sunColor
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2)
      ctx.fill()
    } else if (!showSun) {
      // Moon (top-right area during night)
      const mx = W * 0.78, my = H * 0.12, mr = 12
      ctx.fillStyle = 'rgba(245, 230, 200, 0.6)'
      ctx.beginPath()
      ctx.arc(mx, my, mr, 0, Math.PI * 2)
      ctx.fill()
      // Crescent shadow
      ctx.fillStyle = skyStops[0]
      ctx.beginPath()
      ctx.arc(mx + mr * 0.35, my - mr * 0.1, mr * 0.82, 0, Math.PI * 2)
      ctx.fill()
    }

    // Stars (visible at night/dawn)
    if (starAlpha > 0.01) {
      ctx.fillStyle = `rgba(245, 230, 200, ${starAlpha})`
      for (let i = 0; i < 45; i++) {
        const sx = ((7 * (i + 1) * 137) % 1000) / 1000 * W
        const sy = ((13 * (i + 1) * 97) % 1000) / 1000 * (H * 0.55)
        const ss = ((3 * (i + 1) * 53) % 100) / 100 * 1.8 + 0.4
        ctx.beginPath()
        ctx.arc(sx, sy, ss, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // City silhouette — tint shifts with time of day
    const buildingColor = cycle > 0.3 && cycle < 0.75
      ? `rgba(8, 18, 36, 0.9)`   // day: dark blue silhouette
      : '#100904'                 // night: near-black
    ctx.fillStyle = buildingColor
    const buildings: [number, number, number][] = [
      [0, 0.72, 0.06], [0.06, 0.65, 0.04], [0.1, 0.70, 0.05],
      [0.15, 0.58, 0.035], [0.185, 0.68, 0.06], [0.245, 0.62, 0.04],
      [0.285, 0.74, 0.05], [0.335, 0.55, 0.03], [0.365, 0.66, 0.06],
      [0.425, 0.72, 0.04], [0.465, 0.60, 0.05], [0.515, 0.68, 0.035],
      [0.55, 0.75, 0.06], [0.61, 0.64, 0.04], [0.65, 0.70, 0.05],
      [0.7, 0.56, 0.03], [0.73, 0.67, 0.06], [0.79, 0.73, 0.04],
      [0.83, 0.62, 0.05], [0.88, 0.69, 0.04], [0.92, 0.74, 0.05],
      [0.97, 0.66, 0.04],
    ]
    buildings.forEach(([xp, yp, wp]) => {
      ctx.fillRect(xp * W, yp * H, wp * W + 2, H)
    })

    // Ground
    ctx.fillStyle = COLORS.ground
    ctx.fillRect(0, H - cfg.groundHeight, W, cfg.groundHeight)

    // Ground line
    ctx.strokeStyle = COLORS.groundLine
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, H - cfg.groundHeight)
    ctx.lineTo(W, H - cfg.groundHeight)
    ctx.stroke()

    // Ground tick marks (scrolling)
    ctx.strokeStyle = 'rgba(79, 44, 29, 0.35)'
    ctx.lineWidth = 1
    for (let gx = -(this.groundOffset % 24); gx < W; gx += 24) {
      ctx.beginPath()
      ctx.moveTo(gx, H - cfg.groundHeight)
      ctx.lineTo(gx - 8, H - cfg.groundHeight + 12)
      ctx.stroke()
    }
  }

  // ─── Bear ────────────────────────────────────────────────────
  drawBear(bear: Bear) {
    const { ctx } = this
    ctx.save()
    ctx.translate(bear.x, bear.y)
    ctx.rotate(bear.rotation)

    const s = BS

    if (this.bearImage) {
      // ── PNG sprite path ───────────────────────────────────────
      // Flapping wings drawn first (behind sprite)
      const wingAngle = Math.sin(bear.flapPhase) * 0.6
      for (const [dx, sign] of [[-s * 0.54, -1], [s * 0.54, 1]] as [number, number][]) {
        ctx.save()
        ctx.translate(dx, s * 0.05)
        ctx.rotate(sign * 0.4 - sign * wingAngle)
        ctx.fillStyle = '#c8923a'
        ctx.beginPath()
        ctx.ellipse(0, 0, s * 0.3, s * 0.13, sign * 0.25, 0, Math.PI * 2)
        ctx.fill()
        // Wing sheen
        ctx.fillStyle = 'rgba(255,199,44,0.18)'
        ctx.beginPath()
        ctx.ellipse(0, 0, s * 0.18, s * 0.07, sign * 0.25, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Bear PNG clipped to a circle
      const r = s * 0.82
      const d = s * 2.1
      ctx.save()
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(this.bearImage, -d / 2, -d / 2, d, d)
      ctx.restore()

      // Gold glow ring (drawn after restore so it's outside the clip)
      ctx.strokeStyle = 'rgba(233, 176, 38, 0.35)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      // ── Fallback: canvas-drawn bear (shown while PNG loads) ───
      const bodyGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, s * 0.48)
      bodyGrad.addColorStop(0,   '#d4a850')
      bodyGrad.addColorStop(0.5, '#a07828')
      bodyGrad.addColorStop(1,   '#5a4410')
      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.ellipse(0, 0, s * 0.44, s * 0.48, 0, 0, Math.PI * 2)
      ctx.fill()

      const headY = -s * 0.38
      const headGrad = ctx.createRadialGradient(-s * 0.05, headY - s * 0.05, 2, 0, headY, s * 0.3)
      headGrad.addColorStop(0, '#c8923a')
      headGrad.addColorStop(1, '#8B6914')
      ctx.fillStyle = headGrad
      ctx.beginPath()
      ctx.arc(0, headY, s * 0.3, 0, Math.PI * 2)
      ctx.fill()

      for (const ex of [-s * 0.22, s * 0.22]) {
        ctx.fillStyle = '#7a5a10'
        ctx.beginPath()
        ctx.arc(ex, headY - s * 0.26, s * 0.13, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#c8923a'
        ctx.beginPath()
        ctx.arc(ex, headY - s * 0.26, s * 0.07, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = '#d4a850'
      ctx.beginPath()
      ctx.ellipse(0, headY + s * 0.09, s * 0.16, s * 0.12, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = COLORS.deepBrown
      ctx.beginPath()
      ctx.ellipse(0, headY + s * 0.02, s * 0.06, s * 0.04, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = COLORS.deepBrown
      for (const ex of [-s * 0.1, s * 0.1]) {
        ctx.beginPath()
        ctx.arc(ex, headY - s * 0.07, s * 0.048, 0, Math.PI * 2)
        ctx.fill()
      }

      const wingAngle = Math.sin(bear.flapPhase) * 0.55
      for (const [dx, sign] of [[-s * 0.38, -1], [s * 0.38, 1]] as [number, number][]) {
        ctx.save()
        ctx.translate(dx, -s * 0.05)
        ctx.rotate(sign * 0.35 - sign * wingAngle)
        ctx.fillStyle = '#9a7020'
        ctx.beginPath()
        ctx.ellipse(0, 0, s * 0.24, s * 0.1, sign * 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      ctx.fillStyle = COLORS.gold
      ctx.globalAlpha = 0.28
      ctx.beginPath()
      ctx.ellipse(0, s * 0.12, s * 0.2, s * 0.22, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }

  // ─── Can Pillar ────────────────────────────────────────────
  drawPillar(pillar: Pillar) {
    const { ctx, H } = this
    const { x, topHeight } = pillar
    const w = cfg.pipeWidth
    const botY = topHeight + cfg.pipeGap
    const botH = H - cfg.groundHeight - botY

    this.drawCan(x, 0, w, topHeight, true)
    if (botH > 0) this.drawCan(x, botY, w, botH, false)
  }

  private drawCan(x: number, y: number, w: number, h: number, flip: boolean) {
    const { ctx } = this
    ctx.save()
    if (flip) {
      ctx.translate(x, y + h)
      ctx.scale(1, -1)
    } else {
      ctx.translate(x, y)
    }

    const r = 9  // corner radius

    // ── Can body path (reused for clipping + fill) ──────────
    const canPath = () => {
      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.lineTo(w - r, 0)
      ctx.quadraticCurveTo(w, 0, w, r)
      ctx.lineTo(w, h - r)
      ctx.quadraticCurveTo(w, h, w - r, h)
      ctx.lineTo(r, h)
      ctx.quadraticCurveTo(0, h, 0, h - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
    }

    // Metallic body gradient — left-to-right with sharp centre highlight
    const canGrad = ctx.createLinearGradient(0, 0, w, 0)
    canGrad.addColorStop(0,    '#6a4e10')
    canGrad.addColorStop(0.15, '#b88420')
    canGrad.addColorStop(0.35, '#daa830')
    canGrad.addColorStop(0.46, '#f8dc68')   // bright highlight
    canGrad.addColorStop(0.54, '#f8dc68')
    canGrad.addColorStop(0.65, '#daa830')
    canGrad.addColorStop(0.85, '#b88420')
    canGrad.addColorStop(1,    '#6a4e10')
    ctx.fillStyle = canGrad
    canPath()
    ctx.fill()

    // Clip all decorations inside the can shape
    canPath()
    ctx.clip()

    // ── Horizontal ribbing ──────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.07)'
    const ribCount = Math.max(3, Math.floor(h / 22))
    for (let i = 1; i < ribCount; i++) {
      const ry = (h / ribCount) * i
      ctx.fillRect(0, ry - 0.75, w, 1.5)
    }

    // ── Dark label band ─────────────────────────────────────
    const labelTop = h * 0.20
    const labelH   = h * 0.42
    ctx.fillStyle = 'rgba(30, 16, 4, 0.52)'
    ctx.fillRect(0, labelTop, w, labelH)

    // ── Bear logo ───────────────────────────────────────────
    if (this.bearImage && h > 38) {
      const logoSize = Math.min(w * 0.68, labelH * 0.68, 42)
      ctx.globalAlpha = 0.9
      ctx.drawImage(
        this.bearImage,
        (w - logoSize) / 2,
        labelTop + (labelH - logoSize) / 2,
        logoSize, logoSize
      )
      ctx.globalAlpha = 1
    }

    // ── Brand text below label ──────────────────────────────
    if (h > 60) {
      ctx.fillStyle = 'rgba(245, 220, 140, 0.75)'
      const fontSize = Math.min(w * 0.26, 10)
      ctx.font = `bold ${fontSize}px 'Montserrat', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('BARE BREW', w / 2, labelTop + labelH + 3)
    }

    // ── "ZERO SUGAR" micro-label ────────────────────────────
    if (h > 90) {
      ctx.fillStyle = 'rgba(245, 220, 140, 0.45)'
      const fs2 = Math.min(w * 0.20, 7.5)
      ctx.font = `${fs2}px 'Montserrat', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('ZERO SUGAR · 320mg', w / 2, labelTop + labelH + 16)
    }

    // ── Vertical shine stripes ──────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.13)'
    ctx.fillRect(w * 0.11, 0, w * 0.07, h)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(w * 0.22, 0, w * 0.04, h)

    ctx.restore()

    // ── Rim / lip at open end (absolute coords, outside clip) ─
    // flip=true (top can): open end is at bottom → rimY = y + h - 13
    // flip=false (bottom can): open end is at top → rimY = y
    const rimY = flip ? y + h - 13 : y
    ctx.fillStyle = '#c8a030'
    ctx.fillRect(x - 3, rimY, w + 6, 14)
    ctx.fillStyle = COLORS.canHighlight
    ctx.fillRect(x - 3, rimY, w + 6, 3)

    // ── Can edge stroke ──────────────────────────────────────
    ctx.save()
    if (flip) { ctx.translate(x, y + h); ctx.scale(1, -1) } else { ctx.translate(x, y) }
    ctx.strokeStyle = 'rgba(200,160,40,0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r)
    ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h)
    ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r)
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }

  // ─── Coin (floating in gap) ──────────────────────────────
  drawCoin(coin: Coin, now: number) {
    if (coin.collected) {
      if (!coin.collectedAt) return
      const elapsed = now - coin.collectedAt
      if (elapsed > 400) return
      // Float up and fade
      const alpha = 1 - elapsed / 400
      const offY = -elapsed * 0.06
      this.ctx.save()
      this.ctx.globalAlpha = alpha
      this.ctx.translate(coin.x, coin.y + offY)
      this.drawCoinShape(coin.radius * (1 + elapsed / 800))
      this.ctx.restore()
      return
    }

    const bob = Math.sin(coin.animPhase) * 3
    this.ctx.save()
    this.ctx.translate(coin.x, coin.y + bob)
    this.drawCoinShape(coin.radius)
    this.ctx.restore()
  }

  private drawCoinShape(r: number) {
    const { ctx } = this

    // Glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2)
    glow.addColorStop(0, 'rgba(233, 176, 38, 0.35)')
    glow.addColorStop(1, 'rgba(233, 176, 38, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2)
    ctx.fill()

    // Coin body
    const coinGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r)
    coinGrad.addColorStop(0, COLORS.canHighlight)
    coinGrad.addColorStop(0.6, COLORS.gold)
    coinGrad.addColorStop(1, '#8B6914')
    ctx.fillStyle = coinGrad
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    // "¢" or "C" symbol
    ctx.fillStyle = COLORS.deepBrown
    ctx.font = `bold ${r * 1.1}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('¢', 0, 0)

    // Rim
    ctx.strokeStyle = '#c8a030'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ─── Particles ───────────────────────────────────────────
  drawParticles(particles: Particle[]) {
    for (const p of particles) {
      this.ctx.globalAlpha = p.life
      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, Math.max(0.1, p.size * p.life), 0, Math.PI * 2)
      this.ctx.fill()
    }
    this.ctx.globalAlpha = 1
  }

  // ─── Score Floats ────────────────────────────────────────
  drawScoreFloats(floats: ScoreFloat[]) {
    const { ctx } = this
    for (const f of floats) {
      ctx.globalAlpha = f.life
      ctx.fillStyle = f.color
      ctx.font = `bold 18px 'Bebas Neue', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(f.text, f.x, f.y)
    }
    ctx.globalAlpha = 1
  }

  // ─── Screen Shake ────────────────────────────────────────
  applyShake(amount: number) {
    if (amount <= 0) return
    const sx = (Math.random() - 0.5) * amount
    const sy = (Math.random() - 0.5) * amount
    this.ctx.translate(sx, sy)
  }
}
