import { COLORS } from './constants'
import type { Coin, Particle, ScoreFloat } from './types'

// ─── Background ───────────────────────────────────────────────────────────────

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  groundOffset: number,
  groundHeight: number,
): void {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, COLORS.sky0)
  sky.addColorStop(0.3, COLORS.sky1)
  sky.addColorStop(0.6, COLORS.sky2)
  sky.addColorStop(0.85, COLORS.sky3)
  sky.addColorStop(1, COLORS.sky4)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // Seeded stars
  for (let i = 0; i < 48; i++) {
    const sx = ((42 * (i + 1) * 7) % 1000) / 1000 * W
    const sy = ((42 * (i + 1) * 13) % 1000) / 1000 * H * 0.65
    const ss = ((42 * (i + 1) * 3) % 100) / 100 * 1.8 + 0.4
    const alpha = 0.08 + ((42 * (i + 1) * 17) % 100) / 100 * 0.12
    ctx.fillStyle = `rgba(255, 230, 168, ${alpha})`
    ctx.beginPath()
    ctx.arc(sx, sy, ss, 0, Math.PI * 2)
    ctx.fill()
  }

  // City silhouette
  ctx.fillStyle = COLORS.sky1
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
  for (const [xp, yp, wp] of buildings) {
    ctx.fillRect(xp * W, yp * H, wp * W + 2, H)
  }

  // Ground fill
  ctx.fillStyle = COLORS.ground
  ctx.fillRect(0, H - groundHeight, W, groundHeight)

  // Ground top line
  ctx.strokeStyle = COLORS.groundLine
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, H - groundHeight)
  ctx.lineTo(W, H - groundHeight)
  ctx.stroke()

  // Scrolling hash marks
  ctx.strokeStyle = 'rgba(79, 44, 29, 0.28)'
  ctx.lineWidth = 1
  const startX = -(groundOffset % 26)
  for (let gx = startX; gx < W; gx += 26) {
    ctx.beginPath()
    ctx.moveTo(gx, H - groundHeight)
    ctx.lineTo(gx - 9, H - groundHeight + 13)
    ctx.stroke()
  }
}

// ─── Bear ─────────────────────────────────────────────────────────────────────

export function drawBear(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  flapPhase: number,
  size: number,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)

  // Body
  const bodyGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, size * 0.48)
  bodyGrad.addColorStop(0, COLORS.bearBody1)
  bodyGrad.addColorStop(0.6, COLORS.bearBody2)
  bodyGrad.addColorStop(1, COLORS.bearBody3)
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.44, size * 0.48, 0, 0, Math.PI * 2)
  ctx.fill()

  // Head
  const hy = -size * 0.38
  ctx.fillStyle = COLORS.bearHead
  ctx.beginPath()
  ctx.arc(0, hy, size * 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Ears
  for (const ex of [-size * 0.22, size * 0.22]) {
    ctx.fillStyle = COLORS.bearBody2
    ctx.beginPath()
    ctx.arc(ex, hy - size * 0.24, size * 0.12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = COLORS.bearBody1
    ctx.beginPath()
    ctx.arc(ex, hy - size * 0.24, size * 0.07, 0, Math.PI * 2)
    ctx.fill()
  }

  // Snout
  ctx.fillStyle = COLORS.bearSnout
  ctx.beginPath()
  ctx.ellipse(0, hy + size * 0.09, size * 0.16, size * 0.12, 0, 0, Math.PI * 2)
  ctx.fill()

  // Nose
  ctx.fillStyle = COLORS.deepBrown
  ctx.beginPath()
  ctx.ellipse(0, hy + size * 0.02, size * 0.06, size * 0.04, 0, 0, Math.PI * 2)
  ctx.fill()

  // Eyes
  ctx.fillStyle = COLORS.deepBrown
  for (const ex of [-size * 0.1, size * 0.1]) {
    ctx.beginPath()
    ctx.arc(ex, hy - size * 0.06, size * 0.046, 0, Math.PI * 2)
    ctx.fill()
  }

  // Eye shines
  ctx.fillStyle = COLORS.cream
  ctx.beginPath()
  ctx.arc(-size * 0.08, hy - size * 0.09, size * 0.018, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(size * 0.12, hy - size * 0.09, size * 0.018, 0, Math.PI * 2)
  ctx.fill()

  // Wings (flapping)
  const wingAngle = Math.sin(flapPhase) * 0.5
  for (const [wx, wr, wa] of [
    [-size * 0.36, -0.3, wingAngle],
    [size * 0.36, 0.3, -wingAngle],
  ] as [number, number, number][]) {
    ctx.save()
    ctx.translate(wx, -size * 0.05)
    ctx.rotate(wr + wa)
    ctx.fillStyle = COLORS.bearHead
    ctx.beginPath()
    ctx.ellipse(0, 0, size * 0.22, size * 0.1, wr > 0 ? 0.3 : -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Gold belly patch — Bare Brew brand mark
  ctx.fillStyle = COLORS.gold
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.ellipse(0, size * 0.14, size * 0.2, size * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.restore()
}

// ─── Pillars (BB can style) ───────────────────────────────────────────────────

export function drawPillar(
  ctx: CanvasRenderingContext2D,
  x: number,
  topHeight: number,
  pipeWidth: number,
  pipeGap: number,
  canvasH: number,
  groundHeight: number,
): void {
  drawCan(ctx, x, 0, pipeWidth, topHeight, true)
  const botY = topHeight + pipeGap
  const botH = canvasH - groundHeight - botY
  if (botH > 0) drawCan(ctx, x, botY, pipeWidth, botH, false)
}

function drawCan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  flip: boolean,
): void {
  if (h <= 0) return
  ctx.save()
  if (flip) {
    ctx.translate(x, y + h)
    ctx.scale(1, -1)
  } else {
    ctx.translate(x, y)
  }

  // Body gradient
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0, COLORS.canGold1)
  g.addColorStop(0.28, COLORS.canGold2)
  g.addColorStop(0.5, COLORS.canHighlight)
  g.addColorStop(0.72, COLORS.canGold2)
  g.addColorStop(1, COLORS.canGold1)
  ctx.fillStyle = g

  // Rounded rect
  const r = 8
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
  ctx.fill()

  // Open-end lip
  ctx.fillStyle = '#c8a030'
  ctx.fillRect(-4, h - 12, w + 8, 14)
  ctx.fillStyle = COLORS.canHighlight
  ctx.fillRect(-4, h - 12, w + 8, 3)

  // Dark label band
  ctx.fillStyle = COLORS.deepBrown
  ctx.globalAlpha = 0.75
  ctx.fillRect(0, h * 0.55, w, h * 0.15)
  ctx.globalAlpha = 1

  // "BB" brand text
  const fs = Math.min(w * 0.38, 22)
  ctx.fillStyle = COLORS.deepBrown
  ctx.font = `bold ${fs}px 'Bebas Neue', cursive`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('BB', w / 2, h * 0.34)

  // Shine stripe
  ctx.fillStyle = 'rgba(255,255,255,0.09)'
  ctx.fillRect(w * 0.15, 4, w * 0.13, h - 16)

  ctx.restore()
}

// ─── Coin Pickup ──────────────────────────────────────────────────────────────

export function drawCoinPickup(
  ctx: CanvasRenderingContext2D,
  coin: Coin,
  now: number,
): void {
  if (coin.collected) {
    const elapsed = now - (coin.collectedAt ?? now)
    const fade = Math.max(0, 1 - elapsed / 380)
    if (fade <= 0) return
    ctx.save()
    ctx.globalAlpha = fade
    ctx.translate(coin.x, coin.y - elapsed * 0.045)
    _drawCoinShape(ctx, coin.radius * (1 + elapsed * 0.0008))
    ctx.restore()
    return
  }

  const bob = Math.sin(coin.animPhase) * 3.5
  ctx.save()
  ctx.translate(coin.x, coin.y + bob)

  // Glow
  const glow = ctx.createRadialGradient(0, 0, coin.radius * 0.5, 0, 0, coin.radius * 2.2)
  glow.addColorStop(0, 'rgba(233, 176, 38, 0.28)')
  glow.addColorStop(1, 'rgba(233, 176, 38, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(0, 0, coin.radius * 2.2, 0, Math.PI * 2)
  ctx.fill()

  _drawCoinShape(ctx, coin.radius)
  ctx.restore()
}

function _drawCoinShape(ctx: CanvasRenderingContext2D, r: number): void {
  const g = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r)
  g.addColorStop(0, COLORS.canHighlight)
  g.addColorStop(0.5, COLORS.gold)
  g.addColorStop(1, COLORS.canGold1)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()

  // Inner ring
  ctx.strokeStyle = COLORS.canGold1
  ctx.lineWidth = r * 0.15
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2)
  ctx.stroke()

  // BB label
  ctx.fillStyle = COLORS.deepBrown
  ctx.font = `bold ${r * 0.9}px 'Bebas Neue', cursive`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('BB', 0, 0)
}

// ─── Particles ────────────────────────────────────────────────────────────────

export function drawParticleList(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
): void {
  for (const p of particles) {
    ctx.save()
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.color
    if (p.type === 'score') {
      ctx.font = `bold ${p.size}px 'Bebas Neue', cursive`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(p.color === COLORS.lightGold ? '+25' : '+5', p.x, p.y)
    } else {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * Math.max(p.life, 0.1), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

// ─── Score Floats ─────────────────────────────────────────────────────────────

export function drawScoreFloats(
  ctx: CanvasRenderingContext2D,
  floats: ScoreFloat[],
): void {
  for (const f of floats) {
    ctx.save()
    ctx.globalAlpha = f.life
    ctx.fillStyle = f.color
    const isBig = f.text.includes('BONUS')
    ctx.font = `bold ${isBig ? 18 : 14}px 'Bebas Neue', cursive`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (isBig) {
      ctx.shadowColor = f.color
      ctx.shadowBlur = 8
    }
    ctx.fillText(f.text, f.x, f.y)
    ctx.shadowBlur = 0
    ctx.restore()
  }
}
