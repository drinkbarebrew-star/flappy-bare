'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import type { RunEconomy } from '@/lib/game/types'
import { computeCoinsEarned } from '@/lib/economy/coins'

interface GameOverScreenProps {
  score: number
  bestScore: number
  economy: RunEconomy
  user: User | null
  runsLeft: number
  onRetry: () => void
  onRetryAfterRefresh: () => void
}

export default function GameOverScreen({
  score,
  bestScore,
  economy,
  user,
  runsLeft,
  onRetry,
  onRetryAfterRefresh,
}: GameOverScreenProps) {
  const isNewBest = score >= bestScore && score > 0
  const coinsDisplay = economy.coinsEarned

  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  const handleShare = async () => {
    setSharing(true)
    const text = `🐻 I scored ${score} in Flappy Bare!\n☕ ${coinsDisplay} coins earned.\n320mg of pure game fuel → flappybare.com`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Flappy Bare', text, url: 'https://flappybare.com' })
        setShared(true)
        // Claim IG story bonus
        if (user) {
          fetch('/api/runs/story-bonus', { method: 'POST' }).catch(() => {})
        }
      } else {
        await navigator.clipboard.writeText(text)
        setShared(true)
      }
    } catch {
      // cancelled
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto fade-in">
      <div
        className="w-[90%] max-w-sm rounded-3xl p-8 flex flex-col items-center gap-4"
        style={{
          background: 'rgba(26, 14, 6, 0.94)',
          backdropFilter: 'blur(14px)',
          border: '2px solid rgba(233, 176, 38, 0.3)',
          boxShadow: '0 0 80px rgba(233, 176, 38, 0.15)',
        }}
      >
        {/* Title */}
        <h2
          className="font-bebas text-5xl tracking-widest"
          style={{ color: '#ff6b5b' }}
        >
          GAME OVER
        </h2>

        {isNewBest && (
          <p
            className="font-montserrat text-xs font-bold tracking-[0.2em] uppercase"
            style={{ color: '#FFC72C' }}
          >
            ★ NEW BEST ★
          </p>
        )}

        {/* Score rows */}
        <div className="w-full flex flex-col gap-0.5">
          <ScoreRow label="Score" value={score} />
          <ScoreRow label="Best" value={bestScore} />
          {coinsDisplay > 0 && (
            <ScoreRow
              label="Coins Earned"
              value={`+${coinsDisplay}¢`}
              valueColor="#FFC72C"
            />
          )}
          {economy.bonusCoinEvents > 0 && (
            <ScoreRow
              label="Bonus Events"
              value={economy.bonusCoinEvents}
              valueColor="#FFC72C"
            />
          )}
        </div>

        {/* Auth upsell for guests */}
        {!user && coinsDisplay > 0 && (
          <div
            className="w-full rounded-2xl p-4 text-center"
            style={{
              background: 'rgba(233, 176, 38, 0.1)',
              border: '1px solid rgba(233, 176, 38, 0.25)',
            }}
          >
            <p className="text-sm font-montserrat" style={{ color: '#F5E6C8', opacity: 0.85 }}>
              Sign up to save your {coinsDisplay} coins
            </p>
            <Link
              href="/auth/signup"
              className="inline-block mt-2 text-sm font-montserrat font-bold"
              style={{ color: '#E9B026' }}
              onClick={(e) => e.stopPropagation()}
            >
              Create account →
            </Link>
          </div>
        )}

        {/* Runs left indicator */}
        {user && (
          <p className="text-xs font-montserrat" style={{ color: '#F5E6C8', opacity: 0.45 }}>
            {runsLeft > 0
              ? `${runsLeft} run${runsLeft !== 1 ? 's' : ''} left today`
              : 'No runs left — share to unlock more'
            }
          </p>
        )}

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-2 mt-1">
          {(runsLeft > 0 || !user) && (
            <button
              className="w-full rounded-2xl font-bebas text-3xl tracking-widest py-4 transition-transform active:scale-95 pulse-gold"
              style={{
                background: '#E9B026',
                color: '#2A1B0D',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 28px rgba(233, 176, 38, 0.55)',
              }}
              onClick={(e) => { e.stopPropagation(); onRetry() }}
            >
              PLAY AGAIN
            </button>
          )}
          {(runsLeft > 0 || !user) && (
            <p className="text-center text-[10px] font-montserrat" style={{ color: '#F5E6C8', opacity: 0.3, marginTop: -4 }}>
              or tap anywhere to restart
            </p>
          )}

          <button
            className="w-full rounded-xl py-2.5 font-montserrat font-semibold text-sm transition-colors"
            style={{
              background: sharing ? 'rgba(233,176,38,0.1)' : 'transparent',
              color: shared ? '#4ade80' : '#FFC72C',
              border: `1.5px solid ${shared ? '#4ade80' : '#FFC72C'}`,
              cursor: 'pointer',
            }}
            onClick={(e) => { e.stopPropagation(); handleShare() }}
            disabled={sharing}
          >
            {shared ? '✓ SHARED!' : sharing ? 'SHARING...' : '📤 SHARE SCORE (+1 Run)'}
          </button>

          {user && (
            <Link
              href="/profile"
              className="text-center text-xs font-montserrat py-1"
              style={{ color: '#F5E6C8', opacity: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              View rewards wallet →
            </Link>
          )}
        </div>

        <p className="text-xs" style={{ color: '#F5E6C8', opacity: 0.2 }}>
          Fueled by{' '}
          <a href="https://drinkbarebrew.com" target="_blank" rel="noopener" style={{ color: '#E9B026' }}>
            Bare Brew
          </a>
        </p>
      </div>
    </div>
  )
}

function ScoreRow({
  label,
  value,
  valueColor = '#E9B026',
}: {
  label: string
  value: string | number
  valueColor?: string
}) {
  return (
    <div
      className="flex justify-between items-center py-2.5"
      style={{ borderBottom: '1px solid rgba(233, 176, 38, 0.12)' }}
    >
      <span
        className="text-xs font-montserrat tracking-widest uppercase"
        style={{ color: '#F5E6C8', opacity: 0.55 }}
      >
        {label}
      </span>
      <span
        className="font-bebas text-3xl leading-none"
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  )
}
