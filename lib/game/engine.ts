import { Renderer } from './renderer'
import { DEFAULT_CONFIG, ANTICHEAT } from './constants'
import type {
  Bear, Pillar, Coin, Particle, ScoreFloat,
  GameState, GameSession, RunEconomy,
} from './types'

let idCounter = 0
const uid = () => `${++idCounter}`

export interface GameCallbacks {
  onScoreChange: (score: number) => void
  onCoinsChange: (coins: number, delta: number) => void
  onDie: (session: GameSession, economy: RunEconomy) => void
  onStateChange: (state: GameState) => void
}

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private renderer: Renderer
  private cfg = DEFAULT_CONFIG

  // Game objects
  private bear!: Bear
  private pillars: Pillar[] = []
  private coins: Coin[] = []
  private particles: Particle[] = []
  private scoreFloats: ScoreFloat[] = []

  // State
  private state: GameState = 'idle'
  private score = 0
  private coinsEarned = 0
  private currentSpeed = 0
  private screenShake = 0
  private lastPipeSpawn = 0
  private animFrame: number | null = null
  private lastTime = 0

  // Session tracking (anti-cheat)
  private session!: GameSession

  private W = 0
  private H = 0
  private dpr = 1

  private callbacks: GameCallbacks

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.renderer = new Renderer(this.ctx)
    this.callbacks = callbacks
    this.resize()
  }

  // ─── Public API ────────────────────────────────────────────

  resize() {
    const wrapper = this.canvas.parentElement!
    const rect = wrapper.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.W = rect.width
    this.H = rect.height
    this.canvas.width = this.W * this.dpr
    this.canvas.height = this.H * this.dpr
    this.canvas.style.width = `${this.W}px`
    this.canvas.style.height = `${this.H}px`
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.renderer.setSize(this.W, this.H)
  }

  flap() {
    if (this.state === 'idle') {
      this.startGame()
    } else if (this.state === 'playing') {
      this.doFlap()
    }
  }

  reset() {
    this.stopLoop()
    this.state = 'idle'
    this.callbacks.onStateChange('idle')
    this.initObjects()
    this.startIdleLoop()
  }

  destroy() {
    this.stopLoop()
  }

  // ─── Init ──────────────────────────────────────────────────

  private initObjects() {
    const { cfg, W, H } = this
    this.bear = {
      x: W * 0.25,
      y: H * 0.45,
      vy: 0,
      rotation: 0,
      flapPhase: 0,
      flapSpeed: 0,
      radius: cfg.bearSize * 0.36,
    }
    this.pillars = []
    this.coins = []
    this.particles = []
    this.scoreFloats = []
    this.score = 0
    this.coinsEarned = 0
    this.currentSpeed = this.cfg.pipeSpeed
    this.screenShake = 0
    this.lastPipeSpawn = 0
  }

  private startGame() {
    this.stopLoop()
    this.initObjects()
    this.state = 'playing'
    this.callbacks.onStateChange('playing')
    this.callbacks.onScoreChange(0)
    this.callbacks.onCoinsChange(0, 0)

    this.session = {
      sessionId: crypto.randomUUID(),
      startTime: Date.now(),
      clientSeed: Math.random().toString(36).slice(2),
      pipeTimestamps: [],
    }

    this.doFlap()
    this.lastTime = 0
    this.animFrame = requestAnimationFrame(this.loop)
  }

  private doFlap() {
    this.bear.vy = this.cfg.flapForce
    this.bear.flapSpeed = 14
    // Flap particles
    this.spawnParticles(
      this.bear.x - 12, this.bear.y + 16,
      4, 'rgba(255, 199, 44, 0.55)', 'spark'
    )
  }

  // ─── Game Loop ─────────────────────────────────────────────

  private loop = (timestamp: number) => {
    if (!this.lastTime) this.lastTime = timestamp
    const dt = Math.min(timestamp - this.lastTime, 50)
    this.lastTime = timestamp

    this.ctx.save()

    if (this.screenShake > 0) {
      this.renderer.applyShake(this.screenShake)
      this.screenShake *= 0.82
      if (this.screenShake < 0.5) this.screenShake = 0
    }

    this.renderer.drawBackground()
    this.update(timestamp, dt)
    this.draw(timestamp)

    this.ctx.restore()

    if (this.state === 'playing' ||
        this.particles.length > 0 ||
        this.scoreFloats.length > 0) {
      this.animFrame = requestAnimationFrame(this.loop)
    }
  }

  private idleFrame: number | null = null

  private startIdleLoop() {
    const idle = () => {
      if (this.state !== 'idle') return
      this.ctx.save()
      this.renderer.drawBackground()
      // Bear is rendered as a circular HTML element in the StartScreen overlay
      this.ctx.restore()
      this.idleFrame = requestAnimationFrame(idle)
    }
    this.idleFrame = requestAnimationFrame(idle)
  }

  private stopLoop() {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame)
      this.animFrame = null
    }
    if (this.idleFrame !== null) {
      cancelAnimationFrame(this.idleFrame)
      this.idleFrame = null
    }
  }

  // ─── Update ────────────────────────────────────────────────

  private update(timestamp: number, dt: number) {
    if (this.state !== 'playing') return

    const { cfg, bear, W, H } = this
    const speed = this.currentSpeed

    this.renderer.tick(speed)

    // Bear physics
    bear.vy += cfg.gravity
    bear.y += bear.vy
    bear.rotation = Math.max(-0.5, Math.min(bear.vy * 0.06, 1.3))
    bear.flapPhase += bear.flapSpeed * 0.1
    bear.flapSpeed *= 0.92
    if (bear.flapSpeed < 2) bear.flapSpeed = 2

    // Spawn pillars
    if (timestamp - this.lastPipeSpawn > cfg.pipeSpawnInterval || this.pillars.length === 0) {
      const minTop = 90
      const maxTop = H - cfg.groundHeight - cfg.pipeGap - 90
      const topH = minTop + Math.random() * (maxTop - minTop)
      const pillar: Pillar = {
        id: uid(),
        x: W + 30,
        topHeight: topH,
        scored: false,
        coinSpawned: false,
      }
      this.pillars.push(pillar)
      this.lastPipeSpawn = timestamp
    }

    // Move pillars
    for (let i = this.pillars.length - 1; i >= 0; i--) {
      const p = this.pillars[i]
      p.x -= speed

      // Spawn coin in gap center
      if (!p.coinSpawned && p.x < W * 0.6) {
        p.coinSpawned = true
        this.coins.push({
          id: uid(),
          x: p.x + cfg.pipeWidth / 2,
          y: p.topHeight + cfg.pipeGap / 2,
          radius: 11,
          collected: false,
          animPhase: Math.random() * Math.PI * 2,
        })
      }

      // Score when bear passes pipe
      if (!p.scored && p.x + cfg.pipeWidth < bear.x) {
        p.scored = true
        this.score++
        // Increase difficulty
        this.currentSpeed = Math.min(
          cfg.pipeSpeedMax,
          this.currentSpeed + cfg.pipeSpeedIncrement
        )
        const coinsFromPillar = cfg.coinsPerPillar +
          (this.score % cfg.bonusCoinsEvery === 0 ? cfg.bonusCoinAmount : 0)

        this.coinsEarned += coinsFromPillar
        this.session.pipeTimestamps.push(Date.now())

        this.renderer.setScore(this.score)
        // Defer React state updates out of the rAF to avoid stutter
        const _score = this.score, _coins = this.coinsEarned, _delta = coinsFromPillar
        setTimeout(() => {
          this.callbacks.onScoreChange(_score)
          this.callbacks.onCoinsChange(_coins, _delta)
        }, 0)

        // Score float
        this.scoreFloats.push({
          text: this.score % cfg.bonusCoinsEvery === 0
            ? `+${coinsFromPillar} COINS! 🎉` : `+${coinsFromPillar}¢`,
          x: bear.x,
          y: bear.y - 50,
          vy: -1.5,
          life: 1,
          color: this.score % cfg.bonusCoinsEvery === 0
            ? '#FFC72C' : '#E9B026',
        })

        this.spawnScoreParticles(bear.x, bear.y - cfg.bearSize)
      }

      if (p.x + cfg.pipeWidth < -30) {
        this.pillars.splice(i, 1)
      }
    }

    // Move coins
    for (const c of this.coins) {
      c.x -= speed
      c.animPhase += 0.06
    }
    this.coins = this.coins.filter(c => c.x > -30)

    // Check coin collection
    for (const c of this.coins) {
      if (c.collected) continue
      const dx = bear.x - c.x
      const dy = bear.y - c.y
      if (Math.sqrt(dx * dx + dy * dy) < bear.radius + c.radius) {
        c.collected = true
        c.collectedAt = Date.now()
        this.spawnParticles(c.x, c.y, 6, COLORS_INLINE.lightGold, 'coin')
      }
    }

    // Collision detection
    if (this.checkCollision()) {
      this.die()
      return
    }

    // Tick particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.12
      p.life -= p.decay
      if (p.life <= 0) this.particles.splice(i, 1)
    }

    // Tick score floats
    for (let i = this.scoreFloats.length - 1; i >= 0; i--) {
      const f = this.scoreFloats[i]
      f.y += f.vy
      f.life -= 0.018
      if (f.life <= 0) this.scoreFloats.splice(i, 1)
    }
  }

  // ─── Draw ──────────────────────────────────────────────────

  private draw(now: number) {
    for (const p of this.pillars) {
      this.renderer.drawPillar(p)
    }
    for (const c of this.coins) {
      this.renderer.drawCoin(c, now)
    }
    this.renderer.drawBear(this.bear)
    this.renderer.drawParticles(this.particles)
    this.renderer.drawScoreFloats(this.scoreFloats)
  }

  // ─── Collision ────────────────────────────────────────────

  private checkCollision(): boolean {
    const { bear, pillars, cfg, H } = this
    const br = bear.radius

    // Ground / ceiling
    if (bear.y + br > H - cfg.groundHeight || bear.y - br < 0) return true

    // Pillars
    for (const p of pillars) {
      if (bear.x + br > p.x && bear.x - br < p.x + cfg.pipeWidth) {
        if (bear.y - br < p.topHeight) return true
        if (bear.y + br > p.topHeight + cfg.pipeGap) return true
      }
    }

    return false
  }

  // ─── Die ──────────────────────────────────────────────────

  private die() {
    this.state = 'dead'
    this.screenShake = 14
    this.spawnParticles(this.bear.x, this.bear.y, 22, '#ff6b5b', 'spark')
    this.spawnParticles(this.bear.x, this.bear.y, 12, '#E9B026', 'spark')
    this.callbacks.onStateChange('dead')

    const economy: RunEconomy = {
      coinsEarned: this.coinsEarned,
      pillarsCleared: this.score,
      bonusCoinEvents: Math.floor(this.score / this.cfg.bonusCoinsEvery),
    }

    // Validate anti-cheat before sending
    const durationMs = Date.now() - this.session.startTime
    const maxScore = ANTICHEAT.maxScoreForDuration(durationMs)
    const isValid = this.score <= maxScore

    this.callbacks.onDie(
      { ...this.session, valid: isValid } as typeof this.session & { valid: boolean },
      economy
    )

    // Dead bear falls
    this.animFrame = requestAnimationFrame(this.deadBearFall)
  }

  private deadBearFall = () => {
    this.ctx.save()
    this.renderer.drawBackground()
    for (const p of this.pillars) this.renderer.drawPillar(p)
    for (const c of this.coins) this.renderer.drawCoin(c, Date.now())

    this.bear.vy += this.cfg.gravity
    this.bear.y += this.bear.vy
    this.bear.rotation += 0.09

    if (this.bear.y < this.H + 120) {
      this.renderer.drawBear(this.bear)
    }

    // Tick particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= p.decay
      if (p.life <= 0) this.particles.splice(i, 1)
    }
    this.renderer.drawParticles(this.particles)
    this.ctx.restore()

    if (this.bear.y < this.H + 200 || this.particles.length > 0) {
      this.animFrame = requestAnimationFrame(this.deadBearFall)
    }
  }

  // ─── Particles ────────────────────────────────────────────

  private spawnParticles(
    x: number, y: number, count: number,
    color: string, type: Particle['type'] = 'spark'
  ) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7 - 2,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        size: 2.5 + Math.random() * 4,
        color,
        type,
      })
    }
  }

  private spawnScoreParticles(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * 3.5,
        vy: Math.sin(angle) * 3.5,
        life: 1,
        decay: 0.028,
        size: 3,
        color: '#FFC72C',
        type: 'score',
      })
    }
  }

  // Boot idle animation immediately
  boot() {
    this.initObjects()
    // Preload bear sprite — renderer falls back to canvas drawing until ready
    const img = new Image()
    img.src = '/bear.png'
    img.onload = () => this.renderer.setBearImage(img)
    this.startIdleLoop()
  }
}

// Inline to avoid circular import
const COLORS_INLINE = { lightGold: '#FFC72C' }
