'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { REWARDS, ECONOMY } from '@/lib/game/constants'

interface WalletData {
  coins: number
  bucks: number
  bucksThatCanConvert: number
  monthlyRedeemedBucks: number
  remainingCapBucks: number
}

interface RedemptionResult {
  ok: boolean
  discountCode?: string
  expiresAt?: string
  reward?: string
  valueAmount?: string
  overflow?: boolean
  message?: string
  error?: string
}

export default function RewardsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [result, setResult] = useState<RedemptionResult | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [authLoading, user, router])

  const loadWallet = useCallback(async () => {
    if (!user) return
    setLoadingWallet(true)
    try {
      const res = await fetch('/api/coins')
      if (res.ok) setWallet(await res.json())
    } catch {}
    setLoadingWallet(false)
  }, [user])

  useEffect(() => { loadWallet() }, [loadWallet])

  const handleRedeem = async () => {
    if (!selectedTier || !wallet) return
    setRedeeming(true)
    setResult(null)
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardBucks: selectedTier }),
      })
      const data = await res.json()
      setResult(data)
      if (data.ok) {
        await loadWallet()
        setSelectedTier(null)
      }
    } catch {
      setResult({ ok: false, error: 'Something went wrong. Please try again.' })
    } finally {
      setRedeeming(false)
    }
  }

  if (authLoading) return <FullScreenLoader />

  const bucks = wallet?.bucks ?? 0

  return (
    <div
      className="min-h-screen overflow-y-auto pb-24"
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
        <Link href="/profile" className="text-sm font-semibold" style={{ color: '#E9B026' }}>
          ← Back
        </Link>
        <h1
          className="text-xl tracking-widest"
          style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
        >
          REWARDS
        </h1>
        <div className="w-12" />
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 flex flex-col gap-5">

        {/* Bucks balance */}
        <div
          className="rounded-3xl p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(233,176,38,0.15), rgba(255,199,44,0.08))',
            border: '1.5px solid rgba(233, 176, 38, 0.35)',
          }}
        >
          <p className="text-[11px] tracking-widest uppercase mb-2" style={{ color: '#F5E6C8', opacity: 0.5 }}>
            Your Buck Balance
          </p>
          <p
            className="text-6xl leading-none mb-1"
            style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
          >
            {loadingWallet ? '—' : bucks}
          </p>
          <p className="text-sm" style={{ color: '#F5E6C8', opacity: 0.5 }}>
            Bucks · ≈ ${(bucks * 0.5).toFixed(2)} value
          </p>
          {wallet && wallet.bucksThatCanConvert > 0 && (
            <p className="text-xs mt-2" style={{ color: '#FFC72C', opacity: 0.8 }}>
              + {wallet.bucksThatCanConvert} more Buck{wallet.bucksThatCanConvert !== 1 ? 's' : ''} convertible
            </p>
          )}
        </div>

        {/* How it works */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(26, 14, 6, 0.7)',
            border: '1px solid rgba(233, 176, 38, 0.12)',
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: '#F5E6C8', opacity: 0.45 }}>
            💡 <strong style={{ color: '#E9B026' }}>How it works:</strong> Play games to earn coins.
            Convert 500 coins → 1 Buck ($0.50). Redeem Bucks for real Bare Brew products.
            Bucks expire in {ECONOMY.coinExpireDays} days (FIFO). Max ${(ECONOMY.maxMonthlyBucks * 0.5).toFixed(0)}/mo.
          </p>
        </div>

        {/* Redemption result */}
        {result && (
          <div
            className="rounded-2xl p-5"
            style={{
              background: result.ok ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 107, 91, 0.1)',
              border: `1.5px solid ${result.ok ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255, 107, 91, 0.4)'}`,
            }}
          >
            {result.ok && !result.overflow ? (
              <div className="text-center">
                <p className="text-3xl mb-2">🎉</p>
                <p className="font-semibold mb-1" style={{ color: '#4ade80' }}>Reward Redeemed!</p>
                <p className="text-sm mb-3" style={{ color: '#F5E6C8', opacity: 0.7 }}>
                  {result.reward} ({result.valueAmount})
                </p>
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <p className="text-xs mb-1" style={{ color: '#F5E6C8', opacity: 0.5 }}>
                    Shopify Discount Code
                  </p>
                  <p
                    className="text-xl tracking-widest font-semibold"
                    style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
                  >
                    {result.discountCode}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: '#F5E6C8', opacity: 0.35 }}>
                    Expires {result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : '30 days'}
                  </p>
                </div>
                <p className="text-xs mt-3" style={{ color: '#F5E6C8', opacity: 0.45 }}>
                  Use at{' '}
                  <a href="https://drinkbarebrew.com" target="_blank" rel="noopener" style={{ color: '#E9B026' }}>
                    drinkbarebrew.com
                  </a>
                </p>
              </div>
            ) : result.overflow ? (
              <div className="text-center">
                <p className="text-2xl mb-2">📋</p>
                <p className="font-semibold mb-1" style={{ color: '#FFC72C' }}>Overflow Requested</p>
                <p className="text-sm" style={{ color: '#F5E6C8', opacity: 0.7 }}>
                  {result.message}
                </p>
              </div>
            ) : (
              <p className="text-sm text-center" style={{ color: '#ff6b5b' }}>
                {result.error}
              </p>
            )}

            <button
              onClick={() => setResult(null)}
              className="block mx-auto mt-3 text-xs"
              style={{ color: '#F5E6C8', opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Reward tiers */}
        <div>
          <h2
            className="text-lg tracking-widest mb-3"
            style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
          >
            REWARD CATALOG
          </h2>

          <div className="flex flex-col gap-3">
            {REWARDS.map((reward) => {
              const canAfford = bucks >= reward.bucks
              const isSelected = selectedTier === reward.bucks
              const progress = Math.min(1, bucks / reward.bucks)

              return (
                <button
                  key={reward.bucks}
                  onClick={() => canAfford && setSelectedTier(isSelected ? null : reward.bucks)}
                  disabled={!canAfford}
                  className="w-full text-left transition-all active:scale-[0.98]"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: canAfford ? 'pointer' : 'default' }}
                >
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: isSelected
                        ? 'rgba(233, 176, 38, 0.18)'
                        : canAfford
                          ? 'rgba(26, 14, 6, 0.85)'
                          : 'rgba(20, 12, 5, 0.5)',
                      border: `1.5px solid ${isSelected
                        ? 'rgba(233, 176, 38, 0.6)'
                        : canAfford
                          ? 'rgba(233, 176, 38, 0.25)'
                          : 'rgba(233, 176, 38, 0.08)'}`,
                      opacity: canAfford ? 1 : 0.55,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{reward.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p
                            className="font-semibold text-sm"
                            style={{ color: canAfford ? '#F5E6C8' : '#F5E6C8' }}
                          >
                            {reward.label}
                          </p>
                          <div className="text-right">
                            <span
                              className="text-lg"
                              style={{ color: canAfford ? '#E9B026' : '#F5E6C8', fontFamily: 'Bebas Neue, cursive' }}
                            >
                              {reward.bucks} Bucks
                            </span>
                            <span
                              className="block text-[10px]"
                              style={{ color: '#F5E6C8', opacity: 0.4 }}
                            >
                              {reward.value}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {!canAfford && (
                          <div className="mt-2">
                            <div
                              className="rounded-full h-1.5 overflow-hidden"
                              style={{ background: 'rgba(255,255,255,0.08)' }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progress * 100}%`,
                                  background: 'rgba(233, 176, 38, 0.5)',
                                }}
                              />
                            </div>
                            <p className="text-[10px] mt-1" style={{ color: '#F5E6C8', opacity: 0.35 }}>
                              {reward.bucks - bucks} more Bucks needed
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div
                        className="mt-3 pt-3"
                        style={{ borderTop: '1px solid rgba(233, 176, 38, 0.2)' }}
                      >
                        <p className="text-xs text-center mb-2" style={{ color: '#F5E6C8', opacity: 0.6 }}>
                          Redeem {reward.bucks} Bucks for {reward.label} ({reward.value})?
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRedeem() }}
                          disabled={redeeming}
                          className="w-full py-3 rounded-xl transition-all active:scale-95"
                          style={{
                            background: redeeming ? 'rgba(233, 176, 38, 0.4)' : '#E9B026',
                            color: '#2A1B0D',
                            border: 'none',
                            cursor: redeeming ? 'default' : 'pointer',
                            fontFamily: 'Bebas Neue, cursive',
                            fontSize: '18px',
                            letterSpacing: '2px',
                          }}
                        >
                          {redeeming ? 'REDEEMING...' : `CONFIRM REDEEM`}
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Monthly cap info */}
        {wallet && (
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: 'rgba(26, 14, 6, 0.5)',
              border: '1px solid rgba(233, 176, 38, 0.08)',
            }}
          >
            <p className="text-xs" style={{ color: '#F5E6C8', opacity: 0.35 }}>
              Monthly cap: {wallet.monthlyRedeemedBucks} / {ECONOMY.maxMonthlyBucks} Bucks used
              · {wallet.remainingCapBucks} Bucks remaining
            </p>
          </div>
        )}

        {/* Earn more CTA */}
        <Link
          href="/game"
          className="block rounded-3xl p-5 text-center"
          style={{
            background: 'rgba(233, 176, 38, 0.08)',
            border: '1px solid rgba(233, 176, 38, 0.2)',
          }}
        >
          <p className="text-lg mb-0.5" style={{ fontFamily: 'Bebas Neue, cursive', color: '#E9B026', letterSpacing: '2px' }}>
            EARN MORE BUCKS →
          </p>
          <p className="text-xs" style={{ color: '#F5E6C8', opacity: 0.5 }}>
            5 coins/pillar · 500 coins = 1 Buck
          </p>
        </Link>

      </div>
    </div>
  )
}

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-[#0d0805] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-bounce">🐻</div>
        <p style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive', fontSize: '24px', letterSpacing: '4px' }}>
          LOADING...
        </p>
      </div>
    </div>
  )
}
