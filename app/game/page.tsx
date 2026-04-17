import { Suspense } from 'react'
import GameShell from '@/components/game/GameShell'

export default function GamePage() {
  return (
    <Suspense fallback={<GameLoading />}>
      <GameShell />
    </Suspense>
  )
}

function GameLoading() {
  return (
    <div className="fixed inset-0 bg-[#0d0805] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🐻</div>
        <p className="font-bebas text-3xl text-[#E9B026] tracking-widest">LOADING...</p>
      </div>
    </div>
  )
}
