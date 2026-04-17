import { DEFAULT_CONFIG, ECONOMY, REWARDS } from './constants'

// ─── Run Economy ──────────────────────────────────────────────────────────────

export function calculateRunEconomy(pillarsCleared: number) {
  const baseCoins = pillarsCleared * DEFAULT_CONFIG.coinsPerPillar
  const bonusEvents = Math.floor(pillarsCleared / DEFAULT_CONFIG.bonusCoinsEvery)
  const bonusCoins = bonusEvents * DEFAULT_CONFIG.bonusCoinAmount
  return {
    coinsEarned: baseCoins + bonusCoins,
    bonusEvents,
    pillarsCleared,
  }
}

// ─── Buck Conversion ──────────────────────────────────────────────────────────

/** Whole bucks available given a coin balance */
export function coinsToBucks(coins: number): number {
  return Math.floor(coins / ECONOMY.coinsPerBuck)
}

/** Remaining coins after full buck conversion */
export function coinsRemainder(coins: number): number {
  return coins % ECONOMY.coinsPerBuck
}

/** Progress toward next buck (0–1) */
export function bucksProgress(coins: number): number {
  return (coins % ECONOMY.coinsPerBuck) / ECONOMY.coinsPerBuck
}

// ─── Reward Tier ─────────────────────────────────────────────────────────────

export function getRewardTier(totalBucks: number) {
  return [...REWARDS].reverse().find((r) => totalBucks >= r.bucks) ?? null
}

export function getNextRewardTier(totalBucks: number) {
  return REWARDS.find((r) => r.bucks > totalBucks) ?? null
}

// ─── Daily Runs ───────────────────────────────────────────────────────────────

export function getRunsLabel(runsLeft: number): string {
  if (runsLeft <= 0) return 'No runs left today'
  return `${runsLeft} run${runsLeft !== 1 ? 's' : ''} left today`
}
