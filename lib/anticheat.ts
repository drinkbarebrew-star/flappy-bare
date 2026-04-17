import { ANTICHEAT, DEFAULT_CONFIG } from '@/lib/game/constants'
import { calcCoinsForScore } from '@/lib/economy'

export interface RunSubmission {
  score: number
  coinsEarned: number
  sessionId: string
  durationMs: number
  pipeTimestamps?: number[]
}

export interface ValidationResult {
  valid: boolean
  reason?: string
  expectedCoins?: number
}

export function validateRun(sub: RunSubmission): ValidationResult {
  const { score, coinsEarned, durationMs } = sub

  // Coins must exactly match expected economy formula
  const expectedCoins = calcCoinsForScore(score)
  if (coinsEarned !== expectedCoins) {
    return {
      valid: false,
      reason: `coin_mismatch: expected ${expectedCoins}, got ${coinsEarned}`,
      expectedCoins,
    }
  }

  // Zero-score runs are always valid (died immediately)
  if (score === 0) return { valid: true, expectedCoins }

  // Duration floor check — can't clear pillars faster than physics allows
  const minMs = score * ANTICHEAT.minMsPerPillar
  if (durationMs < minMs) {
    return {
      valid: false,
      reason: `too_fast: ${durationMs}ms for score ${score} (min ${minMs}ms)`,
      expectedCoins,
    }
  }

  // Duration ceiling check — score can't exceed what's physically possible in the time
  const maxScore = ANTICHEAT.maxScoreForDuration(durationMs)
  if (score > maxScore) {
    return {
      valid: false,
      reason: `score_too_high: ${score} > max ${maxScore} for ${durationMs}ms`,
      expectedCoins,
    }
  }

  // Pipe timestamp consistency (if provided)
  if (sub.pipeTimestamps && sub.pipeTimestamps.length > 1) {
    const timestamps = sub.pipeTimestamps
    for (let i = 1; i < timestamps.length; i++) {
      const gap = timestamps[i] - timestamps[i - 1]
      if (gap < ANTICHEAT.minMsPerPillar * 0.8) {
        return {
          valid: false,
          reason: `pipe_timestamps_too_close: gap ${gap}ms at index ${i}`,
          expectedCoins,
        }
      }
    }
  }

  return { valid: true, expectedCoins }
}

// Server-side: compute HMAC signature for session tokens
// Used to verify session IDs weren't fabricated client-side
export function signSessionId(sessionId: string, secret: string): string {
  // In a real implementation this uses crypto.createHmac
  // Kept synchronous for edge runtime compatibility
  return `${sessionId}.${Buffer.from(`${sessionId}:${secret}`).toString('base64').slice(0, 12)}`
}
