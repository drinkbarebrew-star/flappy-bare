import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch profile data server-side
  const [
    { data: profile },
    { data: leaderboardEntry },
    { data: recentSessions },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, avatar_url, runs_today, bonus_runs, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('leaderboard')
      .select('all_time_best, weekly_best, total_coins')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('game_sessions')
      .select('score, coins_earned, created_at, duration_ms, is_valid')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <ProfileClient
      user={user}
      profile={profile ?? { username: user.email?.split('@')[0], avatar_url: null, runs_today: 0, bonus_runs: 0, created_at: user.created_at }}
      leaderboardEntry={leaderboardEntry}
      recentSessions={recentSessions ?? []}
    />
  )
}
