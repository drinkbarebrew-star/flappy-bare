'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { DEFAULT_CONFIG, COLORS } from '@/lib/game/constants'
import {
  drawBackground,
  drawBear,
  drawPillar,
  drawCoinPickup,
  drawParticleList,
  drawScoreFloats,
} from '@/lib/game/draw'
import { calculateRunEconomy } from '@/lib/game/economy'
import type { Bear, Pillar, Coin, Particle, ScoreFloat, GameSession } from '@/lib/game/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RunResult {
  score: number
  coinsEarned: number
  session: GameSession
}

interface UseGameOptions {
  initialBestScore?: number
  runsLeft?: number
  onRunComplete?: (result: RunResult) => Promise<void>
}

export interface UseGameReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  gamePhase: 'idle' | 'playing' | 'dead'
  score: number
  coinsThisRun: number
  finalScore: number
  finalCoins: number
  isNewBest: boolean
  bestScore: number
  handleInput: () => void
  restart: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame({
  initialBestScore = 0,
  runsLeft = 5,
  onRunComplete,
}: UseGameOptions = {}): UseGameReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number>(0)
  const runsLeftRef = useRef(runsLeft)

  // Keep runsLeftRef in sync with prop
  useEffect(() => { runsLeftRef.current = runsLeft }, [runsLeft])

  // ── Mutable game state in refs (no re-renders during loop) ─────────
  const phaseRef = useRef<'idle' | 'playing' | 'dead'>('idle')
  const bearRef = useRef<Bear>(makeBear(0, 0))
  const pillarsRef = useRef<Pillar[]>([])
  const coinsRef = useRef<Coin[]>([])
  const particlesRef = useRef<Particle[]>([])
  const floatsRef = useRef<ScoreFloat[]>([])
  const scoreRef = useRef(0)
  const coinsRunRef = useRef(0)
  const groundOffRef = useRef(0)
  const shakeRef = useRef(0)
  const lastPipeRef = useRef(0)
  const lastTimeRef = useRef(0)
  const sessionRef = useRef<GameSession>(makeSession())
  const dimRef = useRef({ W: 390, H: 844 })
  const bestRef = useRef(initialBestScore)

  // Load stored best
  useEffect(() => {
    try {
      const stored = parseInt(localStorage.getItem('flappyBareBest') || '0')
      if (stored > bestRef.current) {
        bestRef.current = stored
        setBestScore(stored)
      }
    } catch {}
  }, [])

  // ── React state (UI overlays only) ────────────────────────────────
  const [gamePhase, setGamePhase] = useState<'idle' | 'playing' | 'dead'>('idle')
  const [score, setScore] = useState(0)
  const [coinsThisRun, setCoinsThisRun] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [finalCoins, setFinalCoins] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const [bestScore, setBestScore] = useState(initialBestScore)

  // ── Canvas resize ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      const parent = canvas!.parentElement
      if (!parent) return
      const { width, height } = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      const ctx = canvas!.getContext('2d')
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
      dimRef.current = { W: width, H: height }
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [])

  // ── Game loop ──────────────────────────────────────────────────────
  const loop = useCallback((timestamp: number) => {
    animRef.current = requestAnimationFrame(loop)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { W, H } = dimRef.current
    const cfg = DEFAULT_CONFIG
    const phase = phaseRef.current

    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const rawDt = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp
    const dt = Math.min(rawDt, 40) / 16.67 // normalize to 60fps ratio

    // Screen shake
    ctx.save()
    if (shakeRef.current > 0) {
      ctx.translate(
        (Math.random() - 0.5) * shakeRef.current,
        (Math.random() - 0.5) * shakeRef.current,
      )
      shakeRef.current *= 0.82
      if (shakeRef.current < 0.4) shakeRef.current = 0
    }

    // Background (always)
    drawBackground(ctx, W, H, groundOffRef.current, cfg.groundHeight)

    if (phase === 'idle') {
      // Floating idle bear
      const t = timestamp / 1000
      const idleY = H * 0.45 + Math.sin(t * 2) * 12
      drawBear(ctx, W * 0.5, idleY, Math.sin(t * 3) * 0.08, t * 4, cfg.bearSize)
      ctx.restore()
      return
    }

    if (phase === 'playing') {
      groundOffRef.current += cfg.pipeSpeed * dt

      // Bear physics
      const bear = bearRef.current
      bear.vy += cfg.gravity * dt
      bear.y += bear.vy * dt
      bear.rotation = Math.max(-0.5, Math.min(bear.vy * 0.065, 1.4))
      bear.flapPhase += bear.flapSpeed * 0.1 * dt
      bear.flapSpeed *= Math.pow(0.92, dt)
      if (bear.flapSpeed < 0.5) bear.flapSpeed = 2

      // Pillar spawn
      if (timestamp - lastPipeRef.current > cfg.pipeSpawnInterval || pillarsRef.current.length === 0) {
        const minTop = 80
        const maxTop = H - cfg.groundHeight - cfg.pipeGap - 80
        const topH = minTop + Math.random() * (maxTop - minTop)
        pillarsRef.current.push({
          id: crypto.randomUUID(),
          x: W + 24,
          topHeight: topH,
          scored: false,
          coinSpawned: false,
        })
        // Visual coin in the gap center
        coinsRef.current.push({
          id: crypto.randomUUID(),
          x: W + 24 + cfg.pipeWidth / 2,
          y: topH + cfg.pipeGap / 2,
          radius: 10,
          collected: false,
          animPhase: Math.random() * Math.PI * 2,
        })
        lastPipeRef.current = timestamp
      }

      // Move pillars + score detection
      for (let i = pillarsRef.current.length - 1; i >= 0; i--) {
        const p = pillarsRef.current[i]
        p.x -= cfg.pipeSpeed * dt

        if (!p.scored && p.x + cfg.pipeWidth / 2 < bear.x) {
          p.scored = true
          scoreRef.current++
          const newScore = scoreRef.current
          setScore(newScore)
          sessionRef.current.pipeTimestamps.push(Date.now())

          const { coinsEarned } = calculateRunEconomy(newScore)
          coinsRunRef.current = coinsEarned
          setCoinsThisRun(coinsEarned)

          const isMilestone = newScore % cfg.bonusCoinsEvery === 0

          // Score float
          floatsRef.current.push({
            text: isMilestone ? `+${cfg.bonusCoinAmount} BONUS!` : `+${cfg.coinsPerPillar}`,
            x: bear.x,
            y: bear.y - 52,
            vy: -1.4,
            life: 1,
            color: isMilestone ? COLORS.lightGold : COLORS.gold,
          })

          // Coin burst
          spawnParticles(bear.x, bear.y - 28, isMilestone ? 18 : 8, COLORS.gold, 'coin')
        }

        if (p.x + cfg.pipeWidth < -20) pillarsRef.current.splice(i, 1)
      }

      // Move + collect coins
      const nowMs = Date.now()
      for (let i = coinsRef.current.length - 1; i >= 0; i--) {
        const c = coinsRef.current[i]
        c.x -= cfg.pipeSpeed * dt
        c.animPhase += 0.06 * dt

        if (!c.collected) {
          const dx = bear.x - c.x
          const dy = bear.y - c.y
          if (dx * dx + dy * dy < (bear.radius + c.radius + 6) ** 2) {
            c.collected = true
            c.collectedAt = nowMs
            spawnParticles(c.x, c.y, 6, COLORS.lightGold, 'coin')
          }
        }
        if (c.collected && nowMs - (c.collectedAt ?? nowMs) > 420) {
          coinsRef.current.splice(i, 1); continue
        }
        if (c.x + c.radius < -20) coinsRef.current.splice(i, 1)
      }

      // Collision check
      if (checkCollision(bear, pillarsRef.current, H, cfg)) {
        die()
      }
    }

    // Dead bear — keep falling
    if (phase === 'dead') {
      const bear = bearRef.current
      if (bear) {
        bear.vy += cfg.gravity * dt
        bear.y += bear.vy * dt
        bear.rotation += 0.08 * dt
      }
    }

    // ── Draw world ──────────────────────────────────────────────────

    // Pillars
    for (const p of pillarsRef.current) {
      drawPillar(ctx, p.x, p.topHeight, cfg.pipeWidth, cfg.pipeGap, H, cfg.groundHeight)
    }

    // Coins
    const nowDraw = Date.now()
    for (const c of coinsRef.current) {
      drawCoinPickup(ctx, c, nowDraw)
    }

    // Bear
    const bear = bearRef.current
    if (bear) {
      drawBear(ctx, bear.x, bear.y, bear.rotation, bear.flapPhase, cfg.bearSize)
    }

    // Particles
    updateParticles(particlesRef.current, dt)
    drawParticleList(ctx, particlesRef.current)

    // Score floats
    updateFloats(floatsRef.current, dt)
    drawScoreFloats(ctx, floatsRef.current)

    ctx.restore()
  }, []) // stable — reads only refs

  // ── Start loop on mount ─────────────────────────────────────────────
  useEffect(() => {
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [loop])

  // ── Input handler ────────────────────────────────────────────────────
  const handleInput = useCallback(() => {
    const phase = phaseRef.current

    if (phase === 'idle') {
      if (runsLeftRef.current <= 0) return
      // Transition idle → playing
      const { W, H } = dimRef.current
      bearRef.current = makeBear(W * 0.25, H * 0.45)
      pillarsRef.current = []
      coinsRef.current = []
      particlesRef.current = []
      floatsRef.current = []
      scoreRef.current = 0
      coinsRunRef.current = 0
      groundOffRef.current = 0
      shakeRef.current = 0
      lastPipeRef.current = 0
      lastTimeRef.current = 0
      sessionRef.current = makeSession()
      phaseRef.current = 'playing'
      setGamePhase('playing')
      setScore(0)
      setCoinsThisRun(0)
      // First flap
      bearRef.current.vy = DEFAULT_CONFIG.flapForce
      bearRef.current.flapSpeed = 12
      spawnParticles(bearRef.current.x - 10, bearRef.current.y + 16, 4, COLORS.lightGold, 'spark')
      return
    }

    if (phase === 'playing') {
      const bear = bearRef.current
      bear.vy = DEFAULT_CONFIG.flapForce
      bear.flapSpeed = 12
      spawnParticles(bear.x - 10, bear.y + 16, 3, COLORS.lightGold, 'spark')
    }
  }, [])

  // ── Restart ───────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    phaseRef.current = 'idle'
    setGamePhase('idle')
    setFinalScore(0)
    setFinalCoins(0)
    setIsNewBest(false)
    const { W, H } = dimRef.current
    bearRef.current = makeBear(W * 0.5, H * 0.45)
    pillarsRef.current = []
    coinsRef.current = []
    particlesRef.current = []
    floatsRef.current = []
    shakeRef.current = 0
  }, [])

  // ── Die ────────────────────────────────────────────────────────────────
  function die() {
    if (phaseRef.current !== 'playing') return
    phaseRef.current = 'dead'
    shakeRef.current = 15

    const bear = bearRef.current
    spawnParticles(bear.x, bear.y, 24, COLORS.coral, 'spark')
    spawnParticles(bear.x, bear.y, 12, COLORS.gold, 'coin')

    const finalSc = scoreRef.current
    const finalCo = coinsRunRef.current
    const newBest = finalSc > bestRef.current
    if (newBest) {
      bestRef.current = finalSc
      setBestScore(finalSc)
      try { localStorage.setItem('flappyBareBest', String(finalSc)) } catch {}
    }

    // Short delay for death animation before overlay appears
    setTimeout(() => {
      setGamePhase('dead')
      setFinalScore(finalSc)
      setFinalCoins(finalCo)
      setIsNewBest(newBest)
      onRunComplete?.({
        score: finalSc,
        coinsEarned: finalCo,
        session: { ...sessionRef.current },
      })
    }, 750)
  }

  // ── Particle helpers ──────────────────────────────────────────────────
  function spawnParticles(
    x: number, y: number, count: number,
    color: string, type: 'spark' | 'coin' | 'score',
  ) {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7 - 1.5,
        life: 1,
        decay: 0.018 + Math.random() * 0.028,
        size: 2.5 + Math.random() * 5,
        color,
        type,
      })
    }
  }

  return {
    canvasRef,
    gamePhase,
    score,
    coinsThisRun,
    finalScore,
    finalCoins,
    isNewBest,
    bestScore,
    handleInput,
    restart,
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function makeBear(x: number, y: number): Bear {
  return { x, y, vy: 0, rotation: 0, flapPhase: 0, flapSpeed: 0, radius: DEFAULT_CONFIG.bearSize / 2 }
}

function makeSession(): GameSession {
  return {
    sessionId: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36),
    startTime: Date.now(),
    clientSeed: Math.random().toString(36).slice(2),
    pipeTimestamps: [],
  }
}

function checkCollision(
  bear: Bear,
  pillars: Pillar[],
  H: number,
  cfg: typeof DEFAULT_CONFIG,
): boolean {
  const { x, y, radius: r } = bear
  if (y + r > H - cfg.groundHeight || y - r < 0) return true
  for (const p of pillars) {
    if (x + r > p.x && x - r < p.x + cfg.pipeWidth) {
      if (y - r < p.topHeight) return true
      if (y + r > p.topHeight + cfg.pipeGap) return true
    }
  }
  return false
}

function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 0.12 * dt
    p.life -= p.decay * dt
    if (p.life <= 0) particles.splice(i, 1)
  }
}

function updateFloats(floats: ScoreFloat[], dt: number): void {
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]
    f.y += f.vy * dt
    f.life -= 0.022 * dt
    if (f.life <= 0) floats.splice(i, 1)
  }
}
