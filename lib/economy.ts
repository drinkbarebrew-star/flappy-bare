import { ECONOMY, DEFAULT_CONFIG, REWARDS } from '@/lib/game/constants'
import type { RewardTier } from '@/lib/game/constants'

const cfg = DEFAULT_CONFIG

// ─── Coin Calculations ────────────────────────────────────────

export function calcCoinsForScore(score: number): number {
  const base = score * cfg.coinsPerPillar
  const bonus = Math.floor(score / cfg.bonusCoinsEvery) * cfg.bonusCoinAmount
  return base + bonus
}

export function coinsToBucks(coins: number): number {
  return coins / ECONOMY.coinsPerBuck
}

export function bucksToUsd(bucks: number): string {
  const cents = bucks * ECONOMY.buckValueCents
  return `$${(cents / 100).toFixed(2)}`
}

// ─── Redemption Eligibility ───────────────────────────────────

export interface RedeemCheck {
  ok: boolean
  reason?: 'insufficient_bucks' | 'below_minimum' | 'monthly_cap_exceeded' | 'invalid_tier'
}

export function canRedeem(
  buckBalance: number,
  tier: number,
  bucksRedeemed30d: number
): RedeemCheck {
  const reward = REWARDS.find((r) => r.bucks === tier)
  if (!reward) return { ok: false, reason: 'invalid_tier' }
  if (buckBalance < tier) return { ok: false, reason: 'insufficient_bucks' }
  if (tier < ECONOMY.minRedemptionBucks) return { ok: false, reason: 'below_minimum' }
  if (bucksRedeemed30d + tier > ECONOMY.maxMonthlyBucks)
    return { ok: false, reason: 'monthly_cap_exceeded' }
  return { ok: true }
}

// ─── Run Quota ────────────────────────────────────────────────

export function getEffectiveRunsLeft(
  runsToday: number,
  bonusRuns: number,
  runsResetAt: Date
): number {
  const now = new Date()
  const resetDate = new Date(runsResetAt)
  const dayReset =
    now.getUTCFullYear() > resetDate.getUTCFullYear() ||
    now.getUTCMonth() > resetDate.getUTCMonth() ||
    now.getUTCDate() > resetDate.getUTCDate()

  const todayRuns = dayReset ? 0 : runsToday
  return Math.max(0, ECONOMY.baseRunsPerDay + bonusRuns - todayRuns)
}

// ─── Reward Catalog helpers ────────────────────────────────────

export function getReward(tier: RewardTier) {
  return REWARDS.find((r) => r.bucks === tier)!
}

export function getAffordableRewards(buckBalance: number) {
  return REWARDS.filter((r) => buckBalance >= r.bucks)
}

export function progressToNextReward(buckBalance: number) {
  const next = REWARDS.find((r) => r.bucks > buckBalance)
  if (!next) return null
  return {
    reward: next,
    progress: buckBalance / next.bucks,
    bucksNeeded: next.bucks - buckBalance,
  }
}
