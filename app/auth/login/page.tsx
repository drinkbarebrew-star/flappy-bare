'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/game')
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🐻</div>
          <h1 className="font-bebas text-4xl tracking-widest text-glow-gold" style={{ color: '#E9B026' }}>
            FLAPPY BARE
          </h1>
          <p className="text-xs font-montserrat mt-1" style={{ color: '#F5E6C8', opacity: 0.5 }}>
            Sign in to earn real rewards
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-montserrat tracking-widest uppercase mb-2" style={{ color: '#F5E6C8', opacity: 0.55 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl font-montserrat text-sm outline-none transition-all"
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
              placeholder="••••••••"
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
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-6 text-center flex flex-col gap-2">
          <Link
            href="/auth/signup"
            className="text-sm font-montserrat font-semibold"
            style={{ color: '#E9B026' }}
          >
            No account? Sign up →
          </Link>
          <Link
            href="/game"
            className="text-xs font-montserrat"
            style={{ color: '#F5E6C8', opacity: 0.35 }}
          >
            Play without account
          </Link>
        </div>

        {/* Google OAuth placeholder */}
        <p className="text-center text-xs mt-4 font-montserrat" style={{ color: '#F5E6C8', opacity: 0.2 }}>
          Google sign-in coming soon
        </p>
      </div>
    </div>
  )
}
