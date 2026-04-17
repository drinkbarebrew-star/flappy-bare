// ─── Klaviyo Server-side API ──────────────────────────────────
// Docs: https://developers.klaviyo.com/en/reference/api-overview

const KLAVIYO_API = 'https://a.klaviyo.com/api'
const VERSION = '2024-10-15'

function headers() {
  return {
    'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
    'Content-Type': 'application/json',
    'revision': VERSION,
  }
}

export interface KlaviyoProfile {
  email: string
  firstName?: string
  properties?: Record<string, unknown>
}

// Create or update a profile in Klaviyo
export async function upsertKlaviyoProfile(profile: KlaviyoProfile): Promise<string | null> {
  if (!process.env.KLAVIYO_API_KEY) {
    console.warn('[Klaviyo] No API key configured — skipping sync')
    return null
  }

  try {
    const res = await fetch(`${KLAVIYO_API}/profiles/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email: profile.email,
            first_name: profile.firstName,
            properties: {
              source: 'flappy_bare_game',
              ...profile.properties,
            },
          },
        },
      }),
    })

    if (res.status === 409) {
      // Profile exists — get ID from response
      const body = await res.json()
      return body.errors?.[0]?.meta?.duplicate_profile_id ?? null
    }

    if (!res.ok) {
      console.error('[Klaviyo] upsert failed:', res.status, await res.text())
      return null
    }

    const body = await res.json()
    return body.data?.id ?? null
  } catch (err) {
    console.error('[Klaviyo] upsert error:', err)
    return null
  }
}

// Track a game event
export async function trackKlaviyoEvent(
  email: string,
  eventName: string,
  properties: Record<string, unknown>
) {
  if (!process.env.KLAVIYO_API_KEY) return

  try {
    await fetch(`${KLAVIYO_API}/events/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            metric: { data: { type: 'metric', attributes: { name: eventName } } },
            profile: { data: { type: 'profile', attributes: { email } } },
            properties,
            time: new Date().toISOString(),
          },
        },
      }),
    })
  } catch (err) {
    console.error('[Klaviyo] track error:', err)
  }
}

// Add profile to a list (e.g. "Flappy Bare Players")
export async function addToKlaviyoList(listId: string, profileId: string) {
  if (!process.env.KLAVIYO_API_KEY || !listId) return

  try {
    await fetch(`${KLAVIYO_API}/lists/${listId}/relationships/profiles/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        data: [{ type: 'profile', id: profileId }],
      }),
    })
  } catch (err) {
    console.error('[Klaviyo] list add error:', err)
  }
}
