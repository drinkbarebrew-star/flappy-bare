import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ECONOMY } from '@/lib/game/constants'

// GET /api/coins — returns user's coin balance, bucks balance, and recent history
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Expire old coins first
    const { error: expireError } = await supabase.rpc('expire_coins')
    if (expireError) console.warn('[coins] expire_coins rpc error:', expireError)

    // Coin balance
    const { data: coinBalance } = await supabase
      .from('coin_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    // Bucks balance
    const { data: bucksBalance } = await supabase
      .from('bucks_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    // Monthly redemption total
    const { data: monthlyData } = await supabase
      .from('monthly_redemptions')
      .select('bucks_redeemed_30d')
      .eq('user_id', user.id)
      .single()

    // Recent coin history (last 10)
    const { data: history } = await supabase
      .from('coin_ledger')
      .select('id, amount, type, description, expires_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const coins = Math.max(0, coinBalance?.balance ?? 0)
    const bucks = Math.max(0, bucksBalance?.balance ?? 0)
    const bucksThatCanConvert = Math.floor(coins / ECONOMY.coinsPerBuck)
    const bucks30d = monthlyData?.bucks_redeemed_30d ?? 0

    return NextResponse.json({
      coins,
      bucks,
      bucksThatCanConvert,
      monthlyRedeemedBucks: bucks30d,
      monthlyCapBucks: ECONOMY.maxMonthlyBucks,
      remainingCapBucks: Math.max(0, ECONOMY.maxMonthlyBucks - bucks30d),
      coinExpireDays: ECONOMY.coinExpireDays,
      history: history ?? [],
    })
  } catch (err) {
    console.error('[coins] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/coins — convert coins to Bucks
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get balance
    const { data: coinBalance } = await supabase
      .from('coin_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    const coins = Math.max(0, coinBalance?.balance ?? 0)
    const bucksToAdd = Math.floor(coins / ECONOMY.coinsPerBuck)

    if (bucksToAdd === 0) {
      return NextResponse.json({
        error: `Need ${ECONOMY.coinsPerBuck} coins per Buck. You have ${coins}.`
      }, { status: 400 })
    }

    const coinsToSpend = bucksToAdd * ECONOMY.coinsPerBuck
    const expiresAt = new Date(Date.now() + ECONOMY.coinExpireDays * 24 * 60 * 60 * 1000)

    // Debit coins
    await supabase.from('coin_ledger').insert({
      user_id: user.id,
      amount: -coinsToSpend,
      type: 'spend',
      description: `Converted to ${bucksToAdd} Bare Brew Buck${bucksToAdd !== 1 ? 's' : ''}`,
    })

    // Credit bucks
    await supabase.from('bucks_ledger').insert({
      user_id: user.id,
      amount: bucksToAdd,
      type: 'convert',
      description: `${coinsToSpend} coins → ${bucksToAdd} Bucks`,
      expires_at: expiresAt.toISOString(),
    })

    return NextResponse.json({ ok: true, bucksAdded: bucksToAdd, coinsSpent: coinsToSpend })
  } catch (err) {
    console.error('[coins] convert error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
