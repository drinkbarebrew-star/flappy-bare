'use client'

import { useEffect, useState } from 'react'

interface GameHUDProps {
  score: number
  coins: number
  coinDelta: number
}

export default function GameHUD({ score, coins, coinDelta }: GameHUDProps) {
  const [showDelta, setShowDelta] = useState(false)
  const [prevDelta, setPrevDelta] = useState(0)

  useEffect(() => {
    if (coinDelta > 0) {
      setPrevDelta(coinDelta)
      setShowDelta(true)
      const t = setTimeout(() => setShowDelta(false), 900)
      return () => clearTimeout(t)
    }
  }, [coinDelta, coins])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Score — top center */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 font-bebas text-[72px] leading-none text-glow-gold select-none"
        style={{ color: '#E9B026', letterSpacing: '4px' }}
      >
        {score}
      </div>

      {/* Coins — top right */}
      <div
        className="absolute top-6 right-5 flex items-center gap-1.5 rounded-full px-3 py-1.5"
        style={{
          background: 'rgba(42, 27, 13, 0.75)',
          border: '1px solid rgba(233, 176, 38, 0.35)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span className="text-base leading-none">🪙</span>
        <span className="font-bebas text-xl text-[#E9B026] tracking-wider leading-none">
          {coins}
        </span>

        {/* Coin delta pop */}
        {showDelta && (
          <span
            className="absolute -top-6 right-0 font-bebas text-sm text-[#FFC72C] animate-bounce"
            key={`${coins}-${prevDelta}`}
          >
            +{prevDelta}
          </span>
        )}
      </div>
    </div>
  )
}
