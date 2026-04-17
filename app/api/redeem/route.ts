import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDiscountCode } from '@/lib/shopify'
import { REWARDS, ECONOMY } from '@/lib/game/constants'
import type { RewardTier } from '@/lib/game/constants'
import { trackKlaviyoEvent } from '@/lib/klaviyo'
import { bucksToCents } from '@/lib/economy/coins'

// POST /api/redeem
// Body: { rewardBucks: number }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rewardBucks } = await req.json() as { rewardBucks: number }

    // Validate tier
    const reward = REWARDS.find(r => r.bucks === rewardBucks)
    if (!reward) {
      return NextResponse.json({ error: 'Invalid reward tier' }, { status: 400 })
    }

    // Check bucks balance
    const { data: bucksBalance } = await supabase
      .from('bucks_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    const bucks = Math.max(0, bucksBalance?.balance ?? 0)

    if (bucks < rewardBucks) {
      return NextResponse.json({
        error: `Insufficient Bucks. You have ${bucks}, need ${rewardBucks}.`
      }, { status: 400 })
    }

    // Check 30-day rolling cap
    const { data: monthlyData } = await supabase
      .from('monthly_redemptions')
      .select('bucks_redeemed_30d')
      .eq('user_id', user.id)
      .single()

    const bucks30d = monthlyData?.bucks_redeemed_30d ?? 0

    if (bucks30d >= ECONOMY.maxMonthlyBucks) {
      // Soft cap — create overflow redemption request
      await supabase.from('redemptions').insert({
        user_id: user.id,
        reward_tier: rewardBucks as RewardTier,
        bucks_spent: rewardBucks,
        status: 'overflow_requested',
        notes: `Monthly cap (${ECONOMY.maxMonthlyBucks} Bucks) reached. Overflow request at ${bucks30d} Bucks used.`,
      })
      return NextResponse.json({
        ok: true,
        overflow: true,
        message: 'Monthly cap reached. Your request has been flagged for manual review. We\'ll be in touch!'
      })
    }

    // Generate Shopify discount code
    const valueCents = bucksToCents(rewardBucks)
    const discountCode = await createDiscountCode(valueCents)

    // Debit bucks
    await supabase.from('bucks_ledger').insert({
      user_id: user.id,
      amount: -rewardBucks,
      type: 'redeem',
      description: `Redeemed: ${reward.label} (${reward.value})`,
    })

    // Record redemption
    const { data: redemption } = await supabase
      .from('redemptions')
      .insert({
        user_id: user.id,
        reward_tier: rewardBucks as RewardTier,
        bucks_spent: rewardBucks,
        status: 'fulfilled',
        shopify_discount_code: discountCode.code,
        fulfilled_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    // Klaviyo event
    if (user.email) {
      trackKlaviyoEvent(user.email, 'Flappy Bare Reward Redeemed', {
        reward_label: reward.label,
        reward_value: reward.value,
        bucks_spent: rewardBucks,
        discount_code: discountCode.code,
      }).catch(() => {})
    }

    return NextResponse.json({
      ok: true,
      discountCode: discountCode.code,
      expiresAt: discountCode.expiresAt,
      reward: reward.label,
      valueAmount: discountCode.valueAmount,
      redemptionId: redemption?.id,
    })
  } catch (err) {
    console.error('[redeem] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/redeem — list user's redemptions
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data } = await supabase
      .from('redemptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ redemptions: data ?? [] })
  } catch (err) {
    console.error('[redeem] get error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
