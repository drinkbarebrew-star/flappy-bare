import { NextRequest, NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number }

const WINDOW_MS = 60_000
const MAX_REQUESTS = 30

const buckets = new Map<string, Bucket>()

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

function sweep(now: number) {
  if (buckets.size < 1024) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function rateLimit(
  req: NextRequest,
  opts: { max?: number; windowMs?: number; key?: string } = {}
): NextResponse | null {
  const max = opts.max ?? MAX_REQUESTS
  const windowMs = opts.windowMs ?? WINDOW_MS
  const ip = opts.key ?? getClientIp(req)
  const now = Date.now()

  sweep(now)

  let bucket = buckets.get(ip)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(ip, bucket)
  }

  bucket.count += 1

  if (bucket.count > max) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
        },
      }
    )
  }

  return null
}
