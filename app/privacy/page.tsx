import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Flappy Bare',
  description: 'How Flappy Bare collects, uses, and protects your data.',
}

const LAST_UPDATED = 'May 31, 2026'

export default function PrivacyPolicyPage() {
  return (
    <div
      className="min-h-screen overflow-y-auto pb-20"
      style={{ background: '#0d0805', fontFamily: 'Montserrat, sans-serif' }}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
        style={{
          background: 'rgba(13, 8, 5, 0.96)',
          borderBottom: '1px solid rgba(233, 176, 38, 0.15)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link href="/game" className="text-sm font-semibold" style={{ color: '#E9B026' }}>
          ← Back
        </Link>
        <h1
          className="text-xl tracking-widest"
          style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
        >
          PRIVACY
        </h1>
        <div className="w-12" />
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-6" style={{ color: '#F5E6C8' }}>
        <p className="text-xs mb-6" style={{ opacity: 0.5 }}>
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="Who we are">
          <p>
            Flappy Bare is a game operated by Bare Brew. We collect the minimum data needed to run
            the game, track scores, and deliver rewards. Questions: <a href="mailto:hello@drinkbarebrew.com" style={{ color: '#E9B026' }}>hello@drinkbarebrew.com</a>.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account info</strong> — email address and the display name derived from it, used to sign you in and show you on the leaderboard.</li>
            <li><strong>Gameplay data</strong> — scores, run duration, coins earned, in-run anti-cheat telemetry (pipe timestamps, session hashes).</li>
            <li><strong>Rewards activity</strong> — Buck balances, redemption history, and the Shopify discount codes generated for you.</li>
            <li><strong>Referral data</strong> — referral codes you generate or claim.</li>
            <li><strong>Marketing data</strong> — if you opt in, we sync your email and gameplay events to Klaviyo to send you product updates and offers.</li>
            <li><strong>Technical data</strong> — IP address and request metadata used for rate limiting and abuse prevention. We do not sell this data.</li>
          </ul>
        </Section>

        <Section title="How we use it">
          <ul className="list-disc pl-5 space-y-2">
            <li>Run the game and keep your scores and balances accurate.</li>
            <li>Show leaderboards (display name and score only — your account ID is never exposed publicly).</li>
            <li>Detect cheating and prevent abuse.</li>
            <li>Issue Bare Brew rewards via Shopify discount codes.</li>
            <li>Send transactional and marketing email through Klaviyo (with your consent — unsubscribe any time).</li>
          </ul>
        </Section>

        <Section title="Who we share with">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Supabase</strong> — hosts our database and authentication.</li>
            <li><strong>Shopify</strong> — generates and fulfills your discount codes.</li>
            <li><strong>Klaviyo</strong> — handles email marketing.</li>
            <li><strong>Vercel</strong> — hosts the application.</li>
          </ul>
          <p className="mt-3">We do not sell your personal data. We share only the minimum required for each service to function.</p>
        </Section>

        <Section title="Cookies and storage">
          <p>
            We use first-party cookies for authentication (Supabase session) and localStorage for
            game preferences. We do not use third-party advertising or tracking cookies.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can request a copy of your data, ask us to correct it, or ask us to delete your
            account at any time by emailing <a href="mailto:hello@drinkbarebrew.com" style={{ color: '#E9B026' }}>hello@drinkbarebrew.com</a>.
            Deleting your account removes your leaderboard entry, coin balance, and unredeemed
            rewards. Some records (e.g. fulfilled redemptions) may be retained for accounting and
            fraud prevention.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            Account data is retained while your account is active. Anti-cheat telemetry is retained
            for 12 months. Marketing events are retained per Klaviyo&apos;s policies until you
            unsubscribe.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Flappy Bare is not directed at children under 13. If you believe a child has created an
            account, contact us and we will remove it.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update this policy. Material changes will be announced in-app or by email.
            Continued use of the game after changes take effect means you accept the updated
            policy.
          </p>
        </Section>

        <div className="mt-10 mb-6 text-center">
          <Link href="/game" className="text-xs" style={{ color: '#F5E6C8', opacity: 0.4 }}>
            Back to the game →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2
        className="text-lg mb-3 tracking-wide"
        style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
      >
        {title}
      </h2>
      <div className="text-sm leading-relaxed" style={{ opacity: 0.85 }}>
        {children}
      </div>
    </section>
  )
}
