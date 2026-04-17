'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { REWARDS } from '@/lib/game/constants'
import { bucksToDisplayDollars, coinsToBucks } from '@/lib/economy/coins'

interface WalletData {
  coins: number
  bucks: number
  bucksThatCanConvert: number
  monthlyRedeemedBucks: number
  monthlyCapBucks: number
  remainingCapBucks: number
}

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  all_time_best: number
  weekly_best: number
}

interface ProfileClientProps {
  user: User
  profile: {
    username: string | null
    avatar_url: string | null
    runs_today: number
    bonus_runs: number
    created_at: string
  }
  leaderboardEntry: {
    all_time_best: number
    weekly_best: number
    total_coins: number
  } | null
  recentSessions: Array<{
    score: number
    coins_earned: number
    created_at: string
    duration_ms: number
    is_valid: boolean
  }>
}

export default function ProfileClient({ user, profile, leaderboardEntry, recentSessions }: ProfileClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<'wallet' | 'leaderboard' | 'history'>('wallet')
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lbType, setLbType] = useState<'all_time' | 'weekly'>('all_time')
  const [redeeming, setRedeeming] = useState<number | null>(null)
  const [redeemResult, setRedeemResult] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    fetchWallet()
  }, [])

  useEffect(() => {
    if (tab === 'leaderboard') fetchLeaderboard()
  }, [tab, lbType])

  const fetchWallet = async () => {
    const res = await fetch('/api/coins')
    if (res.ok) setWallet(await res.json())
  }

  const fetchLeaderboard = async () => {
    const res = await fetch(`/api/leaderboard?type=${lbType}&limit=20`)
    if (res.ok) {
      const data = await res.json()
      setLeaderboard(data.entries)
    }
  }

  const handleConvert = async () => {
    if (!wallet?.bucksThatCanConvert) return
    setConverting(true)
    const res = await fetch('/api/coins', { method: 'POST' })
    if (res.ok) {
      await fetchWallet()
    }
    setConverting(false)
  }

  const handleRedeem = async (rewardBucks: number) => {
    setRedeeming(rewardBucks)
    setRedeemResult(null)
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardBucks }),
    })
    const data = await res.json()

    if (data.ok) {
      if (data.overflow) {
        setRedeemResult('📋 Monthly cap reached! Your request has been queued for review.')
      } else {
        setRedeemResult(`✅ Code: ${data.discountCode} (${data.valueAmount} at drinkbarebrew.com)`)
      }
      await fetchWallet()
    } else {
      setRedeemResult(`❌ ${data.error}`)
    }
    setRedeeming(null)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/game')
  }

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ background: '#0d0805' }}
    >
      <div className="max-w-sm mx-auto px-4 pt-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/game"
            className="text-sm font-montserrat flex items-center gap-1"
            style={{ color: '#E9B026' }}
          >
            ← Play
          </Link>
          <button
            onClick={handleSignOut}
            className="text-xs font-montserrat"
            style={{ color: '#F5E6C8', opacity: 0.35, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>

        {/* Profile card */}
        <div
          className="rounded-3xl p-6 mb-5 text-center"
          style={{
            background: 'rgba(26, 14, 6, 0.95)',
            border: '2px solid rgba(233, 176, 38, 0.25)',
          }}
        >
          <div className="text-5xl mb-3">🐻</div>
          <h2 className="font-bebas text-3xl tracking-wider" style={{ color: '#E9B026' }}>
            {profile.username || user.email?.split('@')[0]}
          </h2>
          <p className="text-xs font-montserrat mt-1" style={{ color: '#F5E6C8', opacity: 0.4 }}>
            {user.email}
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-8 mt-5">
            <div className="text-center">
              <p className="font-bebas text-3xl" style={{ color: '#E9B026' }}>
                {leaderboardEntry?.all_time_best ?? 0}
              </p>
              <p className="text-xs font-montserrat" style={{ color: '#F5E6C8', opacity: 0.45 }}>
                BEST SCORE
              </p>
            </div>
            <div className="text-center">
              <p className="font-bebas text-3xl" style={{ color: '#FFC72C' }}>
                {wallet?.coins ?? '...'}
              </p>
              <p className="text-xs font-montserrat" style={{ color: '#F5E6C8', opacity: 0.45 }}>
                COINS
              </p>
            </div>
            <div className="text-center">
              <p className="font-bebas text-3xl" style={{ color: '#FFC72C' }}>
                {wallet?.bucks ?? '...'}
              </p>
              <p className="text-xs font-montserrat" style={{ color: '#F5E6C8', opacity: 0.45 }}>
                BUCKS
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex rounded-2xl p-1 mb-5"
          style={{ background: 'rgba(26, 14, 6, 0.95)', border: '1.5px solid rgba(233, 176, 38, 0.2)' }}
        >
          {(['wallet', 'leaderboard', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl font-montserrat font-semibold text-xs tracking-wider uppercase transition-all"
              style={{
                background: tab === t ? '#E9B026' : 'transparent',
                color: tab === t ? '#2A1B0D' : 'rgba(245, 230, 200, 0.4)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t === 'wallet' ? '💰 Wallet' : t === 'leaderboard' ? '🏆 Board' : '📊 History'}
            </button>
          ))}
        </div>

        {/* ─── WALLET TAB ─── */}
        {tab === 'wallet' && wallet && (
          <div className="flex flex-col gap-4">
            {/* Coin → Buck conversion */}
            {wallet.bucksThatCanConvert > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(233, 176, 38, 0.1)',
                  border: '1.5px solid rgba(233, 176, 38, 0.35)',
                }}
              >
                <p className="text-sm font-montserrat font-semibold mb-2" style={{ color: '#FFC72C' }}>
                  Convert coins to Bucks
                </p>
                <p className="text-xs font-montserrat mb-3" style={{ color: '#F5E6C8', opacity: 0.65 }}>
                  {wallet.coins} coins → {wallet.bucksThatCanConvert} Buck{wallet.bucksThatCanConvert !== 1 ? 's' : ''} = {bucksToDisplayDollars(wallet.bucksThatCanConvert + wallet.bucks)} total value
                </p>
                <button
                  onClick={handleConvert}
                  disabled={converting}
                  className="w-full py-3 rounded-xl font-bebas text-xl tracking-wider transition-transform active:scale-95"
                  style={{
                    background: converting ? 'rgba(233,176,38,0.5)' : '#E9B026',
                    color: '#2A1B0D',
                    border: 'none',
                    cursor: converting ? 'default' : 'pointer',
                  }}
                >
                  {converting ? 'CONVERTING...' : `CONVERT → ${wallet.bucksThatCanConvert} BUCK${wallet.bucksThatCanConvert !== 1 ? 'S' : ''}`}
                </button>
              </div>
            )}

            {/* Monthly cap indicator */}
            <div
              className="rounded-2xl p-3 flex justify-between items-center"
              style={{
                background: 'rgba(26,14,6,0.9)',
                border: '1px solid rgba(233,176,38,0.15)',
              }}
            >
              <div>
                <p className="text-xs font-montserrat" style={{ color: '#F5E6C8', opacity: 0.55 }}>
                  30-day cap
                </p>
                <div
                  className="mt-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.1)', width: 120 }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (wallet.monthlyRedeemedBucks / wallet.monthlyCapBucks) * 100)}%`,
                      background: wallet.monthlyRedeemedBucks >= wallet.monthlyCapBucks ? '#ff6b5b' : '#E9B026',
                    }}
                  />
                </div>
              </div>
              <p className="font-bebas text-lg" style={{ color: '#E9B026' }}>
                {wallet.monthlyRedeemedBucks}/{wallet.monthlyCapBucks} Bucks
              </p>
            </div>

            {/* Reward catalog */}
            <h3 className="font-bebas text-2xl tracking-wider mt-2" style={{ color: '#E9B026' }}>
              REWARD CATALOG
            </h3>

            {redeemResult && (
              <div
                className="rounded-2xl p-3 text-sm font-montserrat text-center"
                style={{
                  background: redeemResult.startsWith('✅') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 107, 91, 0.1)',
                  border: `1px solid ${redeemResult.startsWith('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(255,107,91,0.3)'}`,
                  color: '#F5E6C8',
                }}
              >
                {redeemResult}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {REWARDS.map(reward => {
                const canAfford = wallet.bucks >= reward.bucks
                const isRedeeming = redeeming === reward.bucks

                return (
                  <div
                    key={reward.bucks}
                    className="rounded-2xl p-4 flex items-center justify-between"
                    style={{
                      background: canAfford ? 'rgba(233, 176, 38, 0.08)' : 'rgba(26,14,6,0.7)',
                      border: `1.5px solid ${canAfford ? 'rgba(233, 176, 38, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                      opacity: canAfford ? 1 : 0.6,
                    }}
                  >
                    <div>
                      <p className="text-base" style={{ lineHeight: 1 }}>{reward.emoji}</p>
                      <p className="font-montserrat font-semibold text-sm mt-1" style={{ color: '#F5E6C8' }}>
                        {reward.label}
                      </p>
                      <p className="text-xs font-montserrat" style={{ color: '#F5E6C8', opacity: 0.45 }}>
                        {reward.value} value
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-bebas text-xl" style={{ color: '#E9B026' }}>
                        {reward.bucks} B
                      </span>
                      <button
                        onClick={() => handleRedeem(reward.bucks)}
                        disabled={!canAfford || !!redeeming}
                        className="px-3 py-1.5 rounded-xl font-montserrat font-semibold text-xs transition-transform active:scale-95"
                        style={{
                          background: canAfford ? '#E9B026' : 'rgba(255,255,255,0.08)',
                          color: canAfford ? '#2A1B0D' : 'rgba(245,230,200,0.3)',
                          border: 'none',
                          cursor: canAfford && !redeeming ? 'pointer' : 'default',
                        }}
                      >
                        {isRedeeming ? '...' : canAfford ? 'REDEEM' : `Need ${reward.bucks - wallet.bucks} more`}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── LEADERBOARD TAB ─── */}
        {tab === 'leaderboard' && (
          <div className="flex flex-col gap-4">
            {/* Sub-tabs */}
            <div className="flex gap-2">
              {(['all_time', 'weekly'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setLbType(t)}
                  className="flex-1 py-2 rounded-xl font-montserrat text-xs font-semibold tracking-wider uppercase"
                  style={{
                    background: lbType === t ? 'rgba(233,176,38,0.2)' : 'transparent',
                    border: `1px solid ${lbType === t ? 'rgba(233,176,38,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: lbType === t ? '#E9B026' : 'rgba(245,230,200,0.4)',
                    cursor: 'pointer',
                  }}
                >
                  {t === 'all_time' ? '🏆 All Time' : '📅 This Week'}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {leaderboard.length === 0 ? (
                <p className="text-center text-sm font-montserrat py-8" style={{ color: '#F5E6C8', opacity: 0.35 }}>
                  No scores yet. Be the first!
                </p>
              ) : leaderboard.map(entry => {
                const isMe = entry.user_id === user.id
                const score = lbType === 'all_time' ? entry.all_time_best : entry.weekly_best

                return (
                  <div
                    key={entry.user_id}
                    className="rounded-2xl px-4 py-3 flex items-center gap-3"
                    style={{
                      background: isMe ? 'rgba(233,176,38,0.12)' : 'rgba(26,14,6,0.8)',
                      border: `1.5px solid ${isMe ? 'rgba(233,176,38,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <span
                      className="font-bebas text-2xl w-8 text-center"
                      style={{ color: entry.rank <= 3 ? '#E9B026' : 'rgba(245,230,200,0.35)' }}
                    >
                      {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                    <span
                      className="flex-1 font-montserrat font-semibold text-sm truncate"
                      style={{ color: isMe ? '#FFC72C' : '#F5E6C8' }}
                    >
                      {entry.username}{isMe ? ' (you)' : ''}
                    </span>
                    <span className="font-bebas text-2xl" style={{ color: '#E9B026' }}>
                      {score}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── HISTORY TAB ─── */}
        {tab === 'history' && (
          <div className="flex flex-col gap-2">
            {recentSessions.length === 0 ? (
              <p className="text-center text-sm font-montserrat py-8" style={{ color: '#F5E6C8', opacity: 0.35 }}>
                No runs yet. Go play!
              </p>
            ) : recentSessions.map((session, i) => (
              <div
                key={i}
                className="rounded-2xl px-4 py-3 flex items-center justify-between"
                style={{
                  background: 'rgba(26,14,6,0.8)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  opacity: session.is_valid ? 1 : 0.45,
                }}
              >
                <div>
                  <p className="font-montserrat font-semibold text-sm" style={{ color: '#F5E6C8' }}>
                    Score: {session.score}
                  </p>
                  <p className="text-xs font-montserrat" style={{ color: '#F5E6C8', opacity: 0.4 }}>
                    {new Date(session.created_at).toLocaleDateString()}
                    {' · '}
                    {Math.round(session.duration_ms / 1000)}s
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bebas text-xl" style={{ color: '#FFC72C' }}>
                    +{session.coins_earned}¢
                  </p>
                  {!session.is_valid && (
                    <p className="text-xs" style={{ color: '#ff6b5b' }}>flagged</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Play again button */}
        <div className="mt-8">
          <Link
            href="/game"
            className="block w-full text-center py-4 rounded-2xl font-bebas text-2xl tracking-widest"
            style={{
              background: '#E9B026',
              color: '#2A1B0D',
              boxShadow: '0 4px 20px rgba(233,176,38,0.35)',
            }}
          >
            PLAY AGAIN 🐻
          </Link>
        </div>
      </div>
    </div>
  )
}
