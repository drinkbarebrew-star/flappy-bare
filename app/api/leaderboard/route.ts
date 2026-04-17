import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'all_time'  // all_time | weekly
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  try {
    const supabase = await createClient()

    const column = type === 'weekly' ? 'weekly_best' : 'all_time_best'

    const { data, error } = await supabase
      .from('leaderboard')
      .select(`user_id, username, all_time_best, weekly_best, total_coins, updated_at`)
      .order(column, { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[leaderboard]', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Add rank
    const ranked = (data || []).map((entry, i) => ({ ...entry, rank: i + 1 }))

    // Get current user's rank if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    let myRank: number | null = null

    if (user) {
      const { count } = await supabase
        .from('leaderboard')
        .select('user_id', { count: 'exact', head: true })
        .gt(column, supabase.from('leaderboard').select(column).eq('user_id', user.id).single())

      // Simpler approach
      const { data: myEntry } = await supabase
        .from('leaderboard')
        .select(column)
        .eq('user_id', user.id)
        .single()

      if (myEntry) {
        const myScore = myEntry[column as keyof typeof myEntry] as number
        const { count: rank } = await supabase
          .from('leaderboard')
          .select('user_id', { count: 'exact', head: true })
          .gt(column, myScore)

        myRank = (rank ?? 0) + 1
      }
    }

    return NextResponse.json({ entries: ranked, myRank, type })
  } catch (err) {
    console.error('[leaderboard] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
