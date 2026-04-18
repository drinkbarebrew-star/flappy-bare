import type { GameConfig } from './types'

// ─── Brand Colors ─────────────────────────────────────────────
export const COLORS = {
  gold: '#E9B026',
  brown: '#3D2914',
  lightGold: '#FFC72C',
  deepBrown: '#2A1B0D',
  cream: '#F5E6C8',
  // Sky gradient
  sky0: '#0d0805',
  sky1: '#150c06',
  sky2: '#1f1209',
  sky3: '#2c1a0a',
  sky4: '#3d2410',
  // Ground
  ground: '#0d0805',
  groundLine: '#4F2C1D',
  // Bear
  bearBody1: '#c8923a',
  bearBody2: '#8B6914',
  bearBody3: '#5a4410',
  bearHead: '#a07828',
  bearSnout: '#d4a850',
  // Can/Pillar
  canGold1: '#9a7520',
  canGold2: '#E9B026',
  canHighlight: '#ffe566',
  canDark: '#8B6914',
  // Effects
  coral: '#ff6b5b',
  white: '#FFF8E7',
} as const

// ─── Game Physics ─────────────────────────────────────────────
export const DEFAULT_CONFIG: GameConfig = {
  gravity: 0.45,
  flapForce: -7.5,
  pipeWidth: 80,
  pipeGap: 260,
  pipeSpeed: 2.8,
  pipeSpeedMax: 5.5,
  pipeSpeedIncrement: 0.04,
  pipeSpawnInterval: 2100,
  bearSize: 38,
  groundHeight: 52,
  coinsPerPillar: 5,
  bonusCoinsEvery: 10,
  bonusCoinAmount: 25,
}

// ─── Economy ──────────────────────────────────────────────────
export const ECONOMY = {
  coinsPerBuck: 500,
  buckValueCents: 50,        // 1 Buck = $0.50
  minRedemptionBucks: 10,    // $5 min
  maxMonthlyBucks: 50,       // $25/mo soft cap
  coinExpireDays: 90,
  baseRunsPerDay: 5,
  bonusRunStory: 1,          // +1 per IG story (max 1/day)
  bonusRunFollow: 1,         // +1 IG follow (one-time)
  bonusRunReferral: 3,       // +3 per qualified referral
} as const

// ─── Reward Catalog ───────────────────────────────────────────
export const REWARDS = [
  { bucks: 10,  label: 'Store Credit',      value: '$5',   emoji: '💳' },
  { bucks: 20,  label: 'Sticker Pack',      value: '$10',  emoji: '🎨' },
  { bucks: 30,  label: 'Free Can',          value: '$15',  emoji: '🥤' },
  { bucks: 50,  label: 'T-Shirt',           value: '$25',  emoji: '👕' },
  { bucks: 80,  label: '4-Pack',            value: '$40',  emoji: '📦' },
  { bucks: 150, label: 'Hat + 4-Pack',      value: '$75',  emoji: '🧢' },
  { bucks: 300, label: 'Case + Full Merch', value: '$150', emoji: '🎁' },
] as const

export type RewardTier = typeof REWARDS[number]['bucks']

// ─── Anti-cheat Limits ────────────────────────────────────────
export const ANTICHEAT = {
  // At 2.8px/frame @ 60fps, pillars spawn every 1600ms
  // Max pillars per second = ~0.625 — anything over 2/s is impossible
  maxPillarsPerSecond: 1.5,
  // Max coins is strictly derived from pillars
  minMsPerPillar: 1400,  // faster than this = cheating
  maxScoreForDuration: (durationMs: number) =>
    Math.ceil((durationMs / 1600) * 1.1),  // 10% grace
} as const
