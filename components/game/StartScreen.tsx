'use client'

import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { ECONOMY } from '@/lib/game/constants'

interface StartScreenProps {
  bestScore: number
  user: User | null
  runsLeft: number
  onTap: () => void
}

export default function StartScreen({ bestScore, user, runsLeft, onTap }: StartScreenProps) {
  const noRuns = user && runsLeft <= 0

  return (
    <div
      className="absolute inset-0 flex flex-col items-center pointer-events-auto fade-in"
      style={{ justifyContent: 'flex-start', paddingTop: '6vh' }}
      onClick={noRuns ? undefined : onTap}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-5">
        <h1
          className="font-bebas text-[68px] leading-none text-glow-gold select-none"
          style={{ color: '#E9B026', letterSpacing: '6px' }}
        >
          FLAPPY BARE
        </h1>
        <p
          className="text-xs font-montserrat tracking-[0.25em] uppercase"
          style={{ color: '#F5E6C8', opacity: 0.65 }}
        >
          320mg Caffeine · Zero Sugar · Zero BS
        </p>
      </div>

      {/* Logo — actual Bare Brew brand mark (bear + coffee mug) */}
      <div
        className="mb-6"
        style={{
          width: 110,
          height: 110,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid rgba(233, 176, 38, 0.6)',
          boxShadow: '0 0 36px rgba(233, 176, 38, 0.45)',
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bear.png"
          alt="Bare Brew Bear"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Best score */}
      {bestScore > 0 && (
        <div
          className="mb-4 px-5 py-2 rounded-2xl flex items-center gap-3"
          style={{
            background: 'rgba(42, 27, 13, 0.7)',
            border: '1px solid rgba(233, 176, 38, 0.25)',
          }}
        >
          <span className="text-sm" style={{ color: '#F5E6C8', opacity: 0.6 }}>BEST</span>
          <span
            className="font-bebas text-3xl"
            style={{ color: '#E9B026' }}
          >
            {bestScore}
          </span>
        </div>
      )}

      {/* Run quota */}
      {user && (
        <div className="mb-4 text-center">
          <p className="text-xs font-montserrat" style={{ color: '#F5E6C8', opacity: 0.55 }}>
            {noRuns
              ? '⚠️ No runs left today'
              : `${runsLeft} run${runsLeft !== 1 ? 's' : ''} left today`
            }
          </p>
        </div>
      )}

      {/* CTA */}
      {noRuns ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-montserrat text-center" style={{ color: '#F5E6C8', opacity: 0.7, maxWidth: 240 }}>
            Share to IG Story to unlock +1 bonus run
          </p>
          <ShareButton />
          <Link
            href="/profile"
            className="text-xs underline"
            style={{ color: '#FFC72C' }}
          >
            View your rewards →
          </Link>
        </div>
      ) : (
        <button
          className="pulse-gold rounded-2xl font-bebas text-2xl tracking-widest px-10 py-4 cursor-pointer transition-transform active:scale-95"
          style={{
            background: '#E9B026',
            color: '#2A1B0D',
            boxShadow: '0 6px 32px rgba(233, 176, 38, 0.45)',
            border: 'none',
          }}
          onClick={(e) => { e.stopPropagation(); onTap() }}
        >
          TAP TO FLY
        </button>
      )}

      {/* Auth CTAs — safe area aware */}
      <div
        className="absolute flex flex-col items-center gap-2"
        style={{ bottom: 'max(28px, calc(env(safe-area-inset-bottom) + 16px))' }}
      >
        {!user ? (
          <>
            <Link
              href="/auth/signup"
              className="text-sm font-montserrat font-semibold px-6 py-3 rounded-xl transition-colors"
              style={{
                background: 'rgba(233, 176, 38, 0.15)',
                color: '#E9B026',
                border: '1px solid rgba(233, 176, 38, 0.35)',
              }}
            >
              Sign up to earn rewards →
            </Link>
            <Link
              href="/auth/login"
              className="text-xs"
              style={{ color: '#F5E6C8', opacity: 0.4 }}
            >
              Already have an account? Log in
            </Link>
          </>
        ) : (
          <Link
            href="/profile"
            className="text-xs font-montserrat"
            style={{ color: '#F5E6C8', opacity: 0.4 }}
          >
            View wallet & leaderboard →
          </Link>
        )}
        <p className="text-xs" style={{ color: '#F5E6C8', opacity: 0.25 }}>
          <a href="https://drinkbarebrew.com" target="_blank" rel="noopener" style={{ color: '#E9B026' }}>
            drinkbarebrew.com
          </a>
        </p>
      </div>

      {/* Version badge — top-right corner for deployment verification */}
      <div
        className="absolute top-3 right-3 text-[10px] font-montserrat"
        style={{ color: '#F5E6C8', opacity: 0.25 }}
      >
        v6
      </div>
    </div>
  )
}

function ShareButton() {
  const handleShare = async () => {
    const text = '🐻 Playing Flappy Bare! The Bare Brew game where you earn real coffee rewards. Come fly with me → flappybare.com'
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Flappy Bare', text, url: 'https://flappybare.com' })
      } else {
        await navigator.clipboard.writeText(text)
        alert('Copied! Paste in your IG Story caption.')
      }
    } catch {
      // user cancelled
    }
  }

  return (
    <button
      className="px-6 py-3 rounded-xl font-montserrat font-semibold text-sm transition-colors"
      style={{
        background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
      }}
      onClick={(e) => { e.stopPropagation(); handleShare() }}
    >
      📸 Share to IG Story (+1 Run)
    </button>
  )
}
