// ─── Shopify Admin API (STUB) ─────────────────────────────────
// HARD BLOCK: Admin token not yet provided by Miles.
// All functions log a warning and return stub responses.
// Swap to real implementation when token is available.

const STUB_NOTICE = '[Shopify] STUB — admin token not yet configured. Real implementation pending.'

export interface DiscountCodeResult {
  code: string
  expiresAt: string
  valueAmount: string
}

// Create a percentage/fixed discount code for a redemption
export async function createDiscountCode(
  valueAmountCents: number,
  usageLimit: number = 1,
  expiresInDays: number = 30
): Promise<DiscountCodeResult> {
  if (!process.env.SHOPIFY_ADMIN_API_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN === 'STUB_TOKEN_NOT_YET_PROVIDED') {
    console.warn(STUB_NOTICE)
    // Return a stub code so the redemption flow can be tested end-to-end
    const stubCode = `BARE${Date.now().toString(36).toUpperCase()}`
    const expiry = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    return {
      code: stubCode,
      expiresAt: expiry.toISOString(),
      valueAmount: `$${(valueAmountCents / 100).toFixed(2)}`,
    }
  }

  // ── Real implementation (post token) ──────────────────────
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN
  const endpoint = `https://${domain}/admin/api/2024-10/price_rules.json`

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

  const priceRuleRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_rule: {
        title: `FlappyBare-${Date.now()}`,
        target_type: 'line_item',
        target_selection: 'all',
        allocation_method: 'across',
        value_type: 'fixed_amount',
        value: `-${(valueAmountCents / 100).toFixed(2)}`,
        customer_selection: 'all',
        starts_at: new Date().toISOString(),
        ends_at: expiresAt,
        usage_limit: usageLimit,
        once_per_customer: true,
      },
    }),
  })

  if (!priceRuleRes.ok) {
    throw new Error(`Shopify price rule creation failed: ${priceRuleRes.status}`)
  }

  const { price_rule } = await priceRuleRes.json()

  const codeRes = await fetch(
    `https://${domain}/admin/api/2024-10/price_rules/${price_rule.id}/discount_codes.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discount_code: {
          code: `BARE${Date.now().toString(36).toUpperCase()}`,
        },
      }),
    }
  )

  if (!codeRes.ok) {
    throw new Error(`Shopify discount code creation failed: ${codeRes.status}`)
  }

  const { discount_code } = await codeRes.json()

  return {
    code: discount_code.code,
    expiresAt,
    valueAmount: `$${(valueAmountCents / 100).toFixed(2)}`,
  }
}
