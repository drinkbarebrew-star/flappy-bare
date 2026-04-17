import { ECONOMY } from '../game/constants'

// ─── Client-side helpers (no DB access) ──────────────────────

export function coinsToDisplay(coins: number): string {
  if (coins >= 1000) return `${(coins / 1000).toFixed(1)}k`
  return coins.toString()
}

export function coinsForScore(pillarsCleared: number): number {
  const base = pillarsCleared * ECONOMY.coinsPerBuck  // 5 per pillar (note: coinsPerBuck is 500; use constants correctly)
  return base
}

// Compute coins earned for a run (used server-side too)
export function computeCoinsEarned(pillarsCleared: number): number {
  const cfg = { coinsPerPillar: 5, bonusCoinsEvery: 10, bonusCoinAmount: 25 }
  let total = 0
  for (let i = 1; i <= pillarsCleared; i++) {
    total += cfg.coinsPerPillar
    if (i % cfg.bonusCoinsEvery === 0) total += cfg.bonusCoinAmount
  }
  return total
}

// How many Bucks can be converted from coins
export function coinsToBucks(coins: number): number {
  return Math.floor(coins / ECONOMY.coinsPerBuck)
}

// Bucks to dollar value (in cents)
export function bucksToCents(bucks: number): number {
  return bucks * ECONOMY.buckValueCents
}

export function bucksToDisplayDollars(bucks: number): string {
  const cents = bucksToCents(bucks)
  return `$${(cents / 100).toFixed(2)}`
}

// Can the user redeem? Checks minimum and monthly cap
export function canRedeem(
  bucks: number,
  rewardBucks: number,
  monthlyRedeemedBucks: number
): { ok: boolean; reason?: string } {
  if (bucks < rewardBucks) {
    return { ok: false, reason: `Need ${rewardBucks - bucks} more Bucks` }
  }
  if (monthlyRedeemedBucks >= ECONOMY.maxMonthlyBucks) {
    return {
      ok: false,
      reason: `Monthly cap reached ($${ECONOMY.maxMonthlyBucks * ECONOMY.buckValueCents / 100}/mo). Request overflow?`,
    }
  }
  const remaining = ECONOMY.maxMonthlyBucks - monthlyRedeemedBucks
  if (rewardBucks > remaining) {
    return {
      ok: false,
      reason: `Only ${remaining} Bucks remaining in monthly limit. Request overflow?`,
    }
  }
  return { ok: true }
}

// Days until coins expire (from earn date)
export function daysUntilExpiry(earnedAt: string | Date): number {
  const earned = new Date(earnedAt)
  const expiry = new Date(earned.getTime() + ECONOMY.coinExpireDays * 24 * 60 * 60 * 1000)
  return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
}
