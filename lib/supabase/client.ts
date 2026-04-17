import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** True only when real credentials are present */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('placeholder') &&
  SUPABASE_ANON.length > 20

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON)
}
