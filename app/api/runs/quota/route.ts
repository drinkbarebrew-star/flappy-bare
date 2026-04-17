import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ECONOMY } from '@/lib/game/constants'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ runsLeft: 999, bonusRuns: 0 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('runs_today, bonus_runs, runs_reset_at, ig_story_bonus_used_today, ig_story_reset_at')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ runsLeft: ECONOMY.baseRunsPerDay, bonusRuns: 0 })
    }

    // Reset daily counter if new day
    const now = new Date()
    const resetAt = new Date(profile.runs_reset_at)
    const isNewDay = now.getUTCDate() !== resetAt.getUTCDate()
      || now.getUTCFullYear() !== resetAt.getUTCFullYear()
      || now.getUTCMonth() !== resetAt.getUTCMonth()

    let runsToday = profile.runs_today
    let bonusRuns = profile.bonus_runs

    if (isNewDay) {
      await supabase
        .from('profiles')
        .update({
          runs_today: 0,
          ig_story_bonus_used_today: false,
          runs_reset_at: now.toISOString(),
        })
        .eq('id', user.id)
      runsToday = 0
    }

    const total = ECONOMY.baseRunsPerDay + bonusRuns
    const runsLeft = Math.max(0, total - runsToday)

    return NextResponse.json({ runsLeft, bonusRuns, runsToday, total })
  } catch (err) {
    console.error('[quota]', err)
    return NextResponse.json({ runsLeft: ECONOMY.baseRunsPerDay, bonusRuns: 0 })
  }
}
