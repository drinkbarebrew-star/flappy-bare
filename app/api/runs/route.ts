import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeCoinsEarned } from '@/lib/economy/coins'
import { ANTICHEAT, ECONOMY } from '@/lib/game/constants'
import { trackKlaviyoEvent } from '@/lib/klaviyo'
import type { GameSession, RunEconomy } from '@/lib/game/types'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      session: GameSession & { valid?: boolean }
      economy: RunEconomy
      userId: string
    }

    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== body.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session, economy } = body
    const durationMs = Date.now() - session.startTime

    // ─── Anti-cheat validation ──────────────────────────────
    let isValid = true
    let invalidReason: string | undefined

    // 1. Time-based: too many pillars for the duration
    const maxScore = ANTICHEAT.maxScoreForDuration(durationMs)
    if (economy.pillarsCleared > maxScore) {
      isValid = false
      invalidReason = `score ${economy.pillarsCleared} exceeds max ${maxScore} for ${durationMs}ms`
    }

    // 2. Pipe timestamp intervals
    if (session.pipeTimestamps.length >= 2) {
      const intervals = session.pipeTimestamps.slice(1).map(
        (t, i) => t - session.pipeTimestamps[i]
      )
      const tooFast = intervals.some(ms => ms < ANTICHEAT.minMsPerPillar)
      if (tooFast) {
        isValid = false
        invalidReason = 'pipe interval too fast'
      }
    }

    // 3. Coin amount must match score
    const expectedCoins = computeCoinsEarned(economy.pillarsCleared)
    if (Math.abs(economy.coinsEarned - expectedCoins) > 5) {
      isValid = false
      invalidReason = `coin mismatch: got ${economy.coinsEarned}, expected ${expectedCoins}`
    }

    // ─── Anti-cheat hash ────────────────────────────────────
    const hashInput = `${session.sessionId}:${session.clientSeed}:${economy.pillarsCleared}:${economy.coinsEarned}`
    const antiCheatHash = crypto
      .createHmac('sha256', process.env.ANTI_CHEAT_SECRET || 'dev-secret')
      .update(hashInput)
      .digest('hex')

    // ─── Save session ───────────────────────────────────────
    const { data: gameSession, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        score: economy.pillarsCleared,
        coins_earned: isValid ? economy.coinsEarned : 0,
        duration_ms: durationMs,
        run_type: 'daily',
        anti_cheat_hash: antiCheatHash,
        client_seed: session.clientSeed,
        pipe_timestamps: session.pipeTimestamps,
        is_valid: isValid,
        invalidation_reason: invalidReason,
      })
      .select('id')
      .single()

    if (sessionError || !gameSession) {
      console.error('[runs] session insert error:', sessionError)
      return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
    }

    // ─── Increment run quota ──────────────────────────────────
    // Must happen regardless of validity — otherwise quota is bypassable
    // by submitting runs that fail anti-cheat
    await supabase.rpc('increment_runs_today', { p_user_id: user.id })

    if (!isValid) {
      return NextResponse.json({ ok: true, valid: false, reason: invalidReason })
    }

    // ─── Award coins ─────────────────────────────────────────
    const coinsEarned = economy.coinsEarned
    if (coinsEarned > 0) {
      const expiresAt = new Date(Date.now() + ECONOMY.coinExpireDays * 24 * 60 * 60 * 1000)

      await supabase.from('coin_ledger').insert({
        user_id: user.id,
        amount: coinsEarned,
        type: 'earn',
        description: `Run: ${economy.pillarsCleared} pillars`,
        expires_at: expiresAt.toISOString(),
        session_id: gameSession.id,
      })
    }

    // ─── Update leaderboard ───────────────────────────────────
    const { data: lb } = await supabase
      .from('leaderboard')
      .select('all_time_best, weekly_best, total_coins')
      .eq('user_id', user.id)
      .single()

    const newAllTime = Math.max(lb?.all_time_best ?? 0, economy.pillarsCleared)
    const newWeekly = Math.max(lb?.weekly_best ?? 0, economy.pillarsCleared)

    await supabase.from('leaderboard').upsert({
      user_id: user.id,
      username: user.email?.split('@')[0] ?? 'Bear',
      all_time_best: newAllTime,
      weekly_best: newWeekly,
      total_coins: (lb?.total_coins ?? 0) + coinsEarned,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    // ─── Klaviyo event ────────────────────────────────────────
    if (user.email) {
      trackKlaviyoEvent(user.email, 'Flappy Bare Run Completed', {
        score: economy.pillarsCleared,
        coins_earned: coinsEarned,
        duration_ms: durationMs,
        is_personal_best: economy.pillarsCleared >= (lb?.all_time_best ?? 0),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, valid: true, coinsEarned, sessionId: gameSession.id })
  } catch (err) {
    console.error('[runs] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
