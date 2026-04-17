import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const isConfigured  =
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('placeholder') &&
  SUPABASE_ANON.length > 20

export async function middleware(request: NextRequest) {
  // Pass straight through if Supabase isn't configured (avoids 500 on
  // placeholder creds or missing env vars in any environment)
  if (!isConfigured) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Wrap in try/catch — an unhandled throw here causes MIDDLEWARE_INVOCATION_FAILED
  try {
    const { data: { user } } = await supabase.auth.getUser()

    // Protect profile routes
    if (request.nextUrl.pathname.startsWith('/profile') && !user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  } catch {
    // Auth check failed — let request through rather than 500
    // This handles network errors, misconfigured env, or cold-start edge cases
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
