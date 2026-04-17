'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupForm />
    </Suspense>
  )
}

function SignupLoading() {
  return (
    <div className="fixed inset-0 bg-[#0d0805] flex items-center justify-center">
      <div className="text-4xl animate-bounce">🐻</div>
    </div>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username || email.split('@')[0] },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Sync to Klaviyo
    fetch('/api/klaviyo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: username }),
    }).catch(() => {})

    // Handle referral
    if (referralCode && data.user) {
      fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: referralCode }),
      }).catch(() => {})
    }

    // If email confirmation required, show success state
    if (!data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    router.push('/game')
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-[#0d0805] flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-3xl p-8 text-center fade-in"
          style={{
            background: 'rgba(26, 14, 6, 0.95)',
            border: '2px solid rgba(233, 176, 38, 0.25)',
          }}
        >
          <div className="text-5xl mb-4">📬</div>
          <h2 className="font-bebas text-3xl tracking-wider mb-3" style={{ color: '#E9B026' }}>
            CHECK YOUR EMAIL
          </h2>
          <p className="font-montserrat text-sm" style={{ color: '#F5E6C8', opacity: 0.7 }}>
            We sent a confirmation link to <strong style={{ color: '#E9B026' }}>{email}</strong>.
            Click it to activate your account and start earning rewards.
          </p>
          <Link
            href="/game"
            className="block mt-6 text-sm font-montserrat"
            style={{ color: '#F5E6C8', opacity: 0.4 }}
          >
            Play now, confirm later →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0d0805] flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm rounded-3xl p-8 fade-in"
        style={{
          background: 'rgba(26, 14, 6, 0.95)',
          border: '2px solid rgba(233, 176, 38, 0.25)',
          boxShadow: '0 0 60px rgba(233, 176, 38, 0.1)',
        }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🐻</div>
          <h1 className="font-bebas text-4xl tracking-widest text-glow-gold" style={{ color: '#E9B026' }}>
            JOIN THE GAME
          </h1>
          <p className="text-xs font-montserrat mt-1" style={{ color: '#F5E6C8', opacity: 0.5 }}>
            Earn coins → earn real Bare Brew rewards
          </p>
          {referralCode && (
            <div
              className="mt-3 px-3 py-1.5 rounded-xl text-xs font-montserrat"
              style={{
                background: 'rgba(233, 176, 38, 0.15)',
                border: '1px solid rgba(233, 176, 38, 0.3)',
                color: '#FFC72C',
              }}
            >
              🎁 Referral bonus applied!
            </div>
          )}
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-montserrat tracking-widest uppercase mb-2" style={{ color: '#F5E6C8', opacity: 0.55 }}>
              Username (optional)
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full px-4 py-3 rounded-xl font-montserrat text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(233, 176, 38, 0.25)',
                color: '#F5E6C8',
              }}
              placeholder="barebear_420"
              maxLength={24}
            />
          </div>

          <div>
            <label className="block text-xs font-montserrat tracking-widest uppercase mb-2" style={{ color: '#F5E6C8', opacity: 0.55 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl font-montserrat text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(233, 176, 38, 0.25)',
                color: '#F5E6C8',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-montserrat tracking-widest uppercase mb-2" style={{ color: '#F5E6C8', opacity: 0.55 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl font-montserrat text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(233, 176, 38, 0.25)',
                color: '#F5E6C8',
              }}
              placeholder="min 8 characters"
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-xs font-montserrat text-center" style={{ color: '#ff6b5b' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bebas text-2xl tracking-widest transition-transform active:scale-95 mt-2"
            style={{
              background: loading ? 'rgba(233, 176, 38, 0.5)' : '#E9B026',
              color: '#2A1B0D',
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 4px 20px rgba(233, 176, 38, 0.35)',
            }}
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Economy preview */}
        <div
          className="mt-5 rounded-2xl p-4 text-center"
          style={{
            background: 'rgba(233, 176, 38, 0.08)',
            border: '1px solid rgba(233, 176, 38, 0.2)',
          }}
        >
          <p className="text-xs font-montserrat" style={{ color: '#F5E6C8', opacity: 0.7 }}>
            🪙 5 coins per pillar · 500 coins = 1 Buck<br />
            🏆 Redeem for free cans, merch, and more
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/auth/login" className="text-sm font-montserrat" style={{ color: '#F5E6C8', opacity: 0.4 }}>
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
