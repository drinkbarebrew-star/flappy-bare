import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertKlaviyoProfile } from '@/lib/klaviyo'

// POST /api/klaviyo — sync user to Klaviyo on signup/profile update
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    const klaviyoId = await upsertKlaviyoProfile({
      email: user.email,
      firstName: body.firstName || user.email.split('@')[0],
      properties: {
        source: 'flappy_bare',
        signup_date: user.created_at,
        ...body.properties,
      },
    })

    if (klaviyoId) {
      await supabase
        .from('profiles')
        .update({ klaviyo_id: klaviyoId })
        .eq('id', user.id)
    }

    return NextResponse.json({ ok: true, klaviyoId })
  } catch (err) {
    console.error('[klaviyo]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
