// ─── Game State Machine ───────────────────────────────────────
export type GameState = 'idle' | 'playing' | 'dead'

// ─── Bear ─────────────────────────────────────────────────────
export interface Bear {
  x: number
  y: number
  vy: number
  rotation: number
  flapPhase: number
  flapSpeed: number
  radius: number
}

// ─── Pillar (can pair) ────────────────────────────────────────
export interface Pillar {
  id: string
  x: number
  topHeight: number
  scored: boolean
  coinSpawned: boolean
}

// ─── Collectible Coin ─────────────────────────────────────────
export interface Coin {
  id: string
  x: number
  y: number
  radius: number
  collected: boolean
  animPhase: number
  collectedAt?: number
}

// ─── Particle ─────────────────────────────────────────────────
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  decay: number
  size: number
  color: string
  type: 'spark' | 'coin' | 'score'
}

// ─── Score Float ──────────────────────────────────────────────
export interface ScoreFloat {
  text: string
  x: number
  y: number
  vy: number
  life: number
  color: string
}

// ─── Game Session (for anti-cheat) ───────────────────────────
export interface GameSession {
  sessionId: string
  startTime: number
  clientSeed: string
  pipeTimestamps: number[]  // timestamp when each pillar was passed
}

// ─── Economy Snapshot ─────────────────────────────────────────
export interface RunEconomy {
  coinsEarned: number
  pillarsCleared: number
  bonusCoinEvents: number  // every 10 pillars
}

// ─── Game Config ─────────────────────────────────────────────
export interface GameConfig {
  gravity: number
  flapForce: number
  pipeWidth: number
  pipeGap: number
  pipeSpeed: number          // starting speed
  pipeSpeedMax: number       // hard cap
  pipeSpeedIncrement: number // added per pillar cleared
  pipeSpawnInterval: number  // ms
  bearSize: number
  groundHeight: number
  coinsPerPillar: number
  bonusCoinsEvery: number
  bonusCoinAmount: number
}
