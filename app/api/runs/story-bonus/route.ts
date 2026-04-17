import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ECONOMY } from '@/lib/game/constants'

// POST /api/runs/story-bonus
// Claims the +1 IG story run bonus (max 1/day)
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('ig_story_bonus_used_today, ig_story_reset_at, bonus_runs')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if bonus already used today
    const now = new Date()
    const resetAt = new Date(profile.ig_story_reset_at)
    const isNewDay = now.getUTCDate() !== resetAt.getUTCDate()

    if (!isNewDay && profile.ig_story_bonus_used_today) {
      return NextResponse.json({ error: 'Story bonus already claimed today' }, { status: 409 })
    }

    await supabase
      .from('profiles')
      .update({
        bonus_runs: profile.bonus_runs + ECONOMY.bonusRunStory,
        ig_story_bonus_used_today: true,
        ig_story_reset_at: now.toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({ ok: true, bonusRunsAdded: ECONOMY.bonusRunStory })
  } catch (err) {
    console.error('[story-bonus]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
