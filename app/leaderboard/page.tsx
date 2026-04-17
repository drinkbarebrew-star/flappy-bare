'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface LeaderboardEntry {
  user_id: string
  username: string
  all_time_best: number
  weekly_best: number
  total_coins: number
  rank: number
}

interface LeaderboardData {
  entries: LeaderboardEntry[]
  myRank: number | null
  type: string
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'all_time' | 'weekly'>('all_time')
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?type=${tab}&limit=20`)
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  return (
    <div
      className="min-h-screen overflow-y-auto pb-20"
      style={{ background: '#0d0805', fontFamily: 'Montserrat, sans-serif' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
        style={{
          background: 'rgba(13, 8, 5, 0.96)',
          borderBottom: '1px solid rgba(233, 176, 38, 0.15)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link href="/game" className="text-sm font-semibold" style={{ color: '#E9B026' }}>
          ← Back
        </Link>
        <h1
          className="text-xl tracking-widest"
          style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
        >
          LEADERBOARD
        </h1>
        <div className="w-12" />
      </div>

      <div className="max-w-md mx-auto px-4 pt-5">

        {/* Tabs */}
        <div
          className="flex rounded-2xl overflow-hidden mb-5"
          style={{ border: '1px solid rgba(233, 176, 38, 0.2)' }}
        >
          {(['all_time', 'weekly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-sm font-semibold transition-all"
              style={{
                background: tab === t ? '#E9B026' : 'rgba(26, 14, 6, 0.8)',
                color: tab === t ? '#2A1B0D' : '#F5E6C8',
                opacity: tab === t ? 1 : 0.5,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Bebas Neue, cursive',
                letterSpacing: '2px',
                fontSize: '15px',
              }}
            >
              {t === 'all_time' ? 'ALL TIME' : 'THIS WEEK'}
            </button>
          ))}
        </div>

        {/* My rank */}
        {user && data?.myRank && (
          <div
            className="rounded-2xl px-5 py-3 mb-4 flex items-center justify-between"
            style={{
              background: 'rgba(233, 176, 38, 0.12)',
              border: '1.5px solid rgba(233, 176, 38, 0.35)',
            }}
          >
            <span className="text-sm" style={{ color: '#F5E6C8', opacity: 0.7 }}>Your rank</span>
            <span
              className="text-2xl"
              style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
            >
              #{data.myRank}
            </span>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-bounce">🐻</div>
              <p className="text-sm" style={{ color: '#F5E6C8', opacity: 0.4 }}>Loading...</p>
            </div>
          </div>
        ) : !data || data.entries.length === 0 ? (
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: 'rgba(26, 14, 6, 0.8)',
              border: '1px solid rgba(233, 176, 38, 0.15)',
            }}
          >
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-sm" style={{ color: '#F5E6C8', opacity: 0.5 }}>
              No scores yet. Be the first to fly!
            </p>
            <Link
              href="/game"
              className="inline-block mt-4 text-sm font-semibold"
              style={{ color: '#E9B026' }}
            >
              Play now →
            </Link>
          </div>
        ) : (
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(26, 14, 6, 0.9)',
              border: '1px solid rgba(233, 176, 38, 0.15)',
            }}
          >
            {/* Column headers */}
            <div
              className="flex items-center px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(233, 176, 38, 0.12)' }}
            >
              <span className="w-10 text-[10px] tracking-widest uppercase" style={{ color: '#F5E6C8', opacity: 0.35 }}>
                Rank
              </span>
              <span className="flex-1 text-[10px] tracking-widest uppercase" style={{ color: '#F5E6C8', opacity: 0.35 }}>
                Player
              </span>
              <span className="w-16 text-right text-[10px] tracking-widest uppercase" style={{ color: '#F5E6C8', opacity: 0.35 }}>
                Score
              </span>
            </div>

            {data.entries.map((entry, i) => {
              const isMe = user?.id === entry.user_id
              const score = tab === 'all_time' ? entry.all_time_best : entry.weekly_best
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

              return (
                <div
                  key={entry.user_id}
                  className="flex items-center px-4 py-3.5"
                  style={{
                    borderBottom: '1px solid rgba(233, 176, 38, 0.07)',
                    background: isMe ? 'rgba(233, 176, 38, 0.08)' : 'transparent',
                  }}
                >
                  {/* Rank */}
                  <div className="w-10">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span
                        className="text-sm"
                        style={{ color: '#F5E6C8', opacity: 0.35, fontFamily: 'Bebas Neue, cursive' }}
                      >
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: isMe ? '#E9B026' : '#F5E6C8', opacity: isMe ? 1 : 0.8 }}
                    >
                      {isMe ? `${entry.username} (you)` : entry.username}
                    </p>
                    <p className="text-[10px]" style={{ color: '#F5E6C8', opacity: 0.3 }}>
                      {entry.total_coins.toLocaleString()}¢ total
                    </p>
                  </div>

                  {/* Score */}
                  <div className="w-16 text-right">
                    <span
                      className="text-2xl"
                      style={{
                        color: i === 0 ? '#E9B026' : '#F5E6C8',
                        fontFamily: 'Bebas Neue, cursive',
                        opacity: i === 0 ? 1 : 0.8,
                      }}
                    >
                      {score}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Auth nudge for guests */}
        {!user && (
          <div
            className="mt-5 rounded-2xl p-4 text-center"
            style={{
              background: 'rgba(233, 176, 38, 0.08)',
              border: '1px solid rgba(233, 176, 38, 0.2)',
            }}
          >
            <p className="text-sm" style={{ color: '#F5E6C8', opacity: 0.7 }}>
              <Link href="/auth/signup" className="font-semibold" style={{ color: '#E9B026' }}>
                Sign up
              </Link>
              {' '}to appear on the leaderboard
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link href="/game" className="text-xs" style={{ color: '#F5E6C8', opacity: 0.3 }}>
            Play now →
          </Link>
        </div>
      </div>
    </div>
  )
}
