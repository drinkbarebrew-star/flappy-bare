'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInStandalone, setIsInStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsInStandalone(standalone)
    if (standalone) return

    // Check if already dismissed
    if (localStorage.getItem('pwaInstallDismissed')) return

    // iOS detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    // Show iOS prompt after first game (or 10s)
    if (ios) {
      setTimeout(() => setShowPrompt(true), 10000)
      return
    }

    // Android / Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 5000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setShowPrompt(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwaInstallDismissed', '1')
  }

  if (!showPrompt || isInStandalone || dismissed) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in"
      style={{ width: 'min(360px, calc(100vw - 32px))' }}
    >
      <div
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{
          background: 'rgba(26, 14, 6, 0.96)',
          border: '1.5px solid rgba(233, 176, 38, 0.4)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span className="text-3xl flex-shrink-0">🐻</span>
        <div className="flex-1 min-w-0">
          <p className="font-montserrat font-bold text-sm" style={{ color: '#E9B026' }}>
            Add to Home Screen
          </p>
          {isIOS ? (
            <p className="text-xs mt-0.5" style={{ color: '#F5E6C8', opacity: 0.65 }}>
              Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> for the full game experience
            </p>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: '#F5E6C8', opacity: 0.65 }}>
              Install for offline play and faster loads
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {!isIOS && (
            <button
              className="text-xs font-montserrat font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: '#E9B026', color: '#2A1B0D', border: 'none', cursor: 'pointer' }}
              onClick={handleInstall}
            >
              INSTALL
            </button>
          )}
          <button
            className="text-xs font-montserrat px-3 py-1 rounded-lg"
            style={{
              background: 'transparent',
              color: '#F5E6C8',
              opacity: 0.4,
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={handleDismiss}
          >
            {isIOS ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  )
}
