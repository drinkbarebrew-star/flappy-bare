'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GameEngine } from '@/lib/game/engine'
import type { GameState, GameSession, RunEconomy } from '@/lib/game/types'
import StartScreen from './StartScreen'
import GameHUD from './GameHUD'
import GameOverScreen from './GameOverScreen'
import InstallPrompt from './InstallPrompt'
import { useAuth } from '@/hooks/useAuth'
import { useRunQuota } from '@/hooks/useRunQuota'

export default function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [coinDelta, setCoinDelta] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [flashDead, setFlashDead] = useState(false)
  const [lastSession, setLastSession] = useState<{
    session: GameSession
    economy: RunEconomy
  } | null>(null)

  const { user } = useAuth()
  const { runsLeft, decrementRun, refreshQuota } = useRunQuota(user?.id)

  // Init engine
  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new GameEngine(canvasRef.current, {
      onScoreChange: (s) => {
        setScore(s)
        if (s > bestScore) setBestScore(s)
      },
      onCoinsChange: (total, delta) => {
        setCoins(total)
        setCoinDelta(delta)
      },
      onDie: (session, economy) => {
        setLastSession({ session, economy })
        setFlashDead(true)
        setTimeout(() => setFlashDead(false), 500)
        // Save session to DB if user is logged in
        if (user) {
          saveSession(session, economy, user.id)
        } else {
          // Guest: store in localStorage
          const prev = parseInt(localStorage.getItem('flappyBestGuest') || '0')
          if (session.pipeTimestamps.length > prev) {
            localStorage.setItem('flappyBestGuest', session.pipeTimestamps.length.toString())
          }
        }
      },
      onStateChange: (state) => {
        setGameState(state)
        if (state === 'playing') {
          setScore(0)
          setCoins(0)
          decrementRun()
        }
      },
    })

    engineRef.current = engine
    engine.boot()

    // Load guest best
    const guestBest = parseInt(localStorage.getItem('flappyBestGuest') || '0')
    setBestScore(guestBest)

    return () => engine.destroy()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Resize handler
  useEffect(() => {
    const onResize = () => engineRef.current?.resize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Input handlers
  const handleFlap = useCallback(() => {
    if (gameState === 'idle') {
      // Check run quota for logged-in users
      if (user && runsLeft <= 0) return
      engineRef.current?.flap()
    } else if (gameState === 'playing') {
      engineRef.current?.flap()
    }
  }, [gameState, user, runsLeft])

  const handleRetry = useCallback(() => {
    setLastSession(null)
    if (user && runsLeft <= 0) return
    engineRef.current?.reset()
    setTimeout(() => engineRef.current?.flap(), 100)
  }, [user, runsLeft])

  return (
    <div
      ref={wrapperRef}
      className={`game-canvas-wrapper fixed inset-0 flex items-center justify-center bg-[#0d0805] ${flashDead ? 'flash-red' : ''}`}
    >
      {/* Canvas wrapper — max 480×854 (9:16) */}
      <div
        className="relative w-full h-full"
        style={{ maxWidth: 480, maxHeight: 854 }}
        onPointerDown={(e) => { e.preventDefault(); handleFlap() }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* HUD — score + coins during play */}
        {gameState === 'playing' && (
          <GameHUD score={score} coins={coins} coinDelta={coinDelta} />
        )}

        {/* Start screen */}
        {gameState === 'idle' && (
          <StartScreen
            bestScore={bestScore}
            user={user}
            runsLeft={runsLeft}
            onTap={handleFlap}
          />
        )}

        {/* Game over screen */}
        {gameState === 'dead' && lastSession && (
          <GameOverScreen
            score={score}
            bestScore={bestScore}
            economy={lastSession.economy}
            user={user}
            runsLeft={runsLeft}
            onRetry={handleRetry}
            onRetryAfterRefresh={() => { refreshQuota(); handleRetry() }}
          />
        )}
      </div>

      {/* PWA install prompt */}
      <InstallPrompt />

      {/* Keyboard input */}
      <KeyboardListener onFlap={handleFlap} />
    </div>
  )
}

// ─── Keyboard input (space / arrow up) ───────────────────────
function KeyboardListener({ onFlap }: { onFlap: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        onFlap()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onFlap])
  return null
}

// ─── Save session to DB (fire-and-forget) ────────────────────
async function saveSession(
  session: GameSession,
  economy: RunEconomy,
  userId: string
) {
  try {
    await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, economy, userId }),
    })
  } catch (err) {
    console.error('[GameShell] save session failed:', err)
  }
}
