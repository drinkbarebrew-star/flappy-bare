import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ECONOMY } from '@/lib/game/constants'

// POST /api/referral/claim
// Body: { code: string }
// Called when a new user signs up via a referral link
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await req.json() as { code: string }
    if (!code) {
      return NextResponse.json({ error: 'No referral code' }, { status: 400 })
    }

    // Find the referral
    const { data: referral } = await supabase
      .from('referrals')
      .select('id, referrer_id, qualified, bonus_granted')
      .eq('code', code)
      .single()

    if (!referral) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    // Can't refer yourself
    if (referral.referrer_id === user.id) {
      return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 })
    }

    // Already qualified
    if (referral.qualified) {
      return NextResponse.json({ error: 'Referral already used' }, { status: 409 })
    }

    // Mark as qualified and grant bonus to referrer
    await supabase
      .from('referrals')
      .update({
        referee_id: user.id,
        qualified: true,
        qualified_at: new Date().toISOString(),
        bonus_granted: true,
      })
      .eq('id', referral.id)

    // Add bonus runs to referrer
    await supabase.rpc('increment_bonus_runs', {
      p_user_id: referral.referrer_id,
      p_amount: ECONOMY.bonusRunReferral,
    })

    return NextResponse.json({ ok: true, bonusRunsGranted: ECONOMY.bonusRunReferral })
  } catch (err) {
    console.error('[referral/claim]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
