import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Learn | Flappy Bare',
  description: '2 ingredients. 320mg caffeine. Zero sugar. The story behind Bare Brew.',
}

export default function LearnPage() {
  return (
    <div
      className="min-h-screen overflow-y-auto pb-24"
      style={{ background: '#0d0805', fontFamily: 'Montserrat, sans-serif' }}
    >
      {/* Header */}
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
          THE BREW
        </h1>
        <div className="w-12" />
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 flex flex-col gap-5">

        {/* Hero */}
        <div
          className="rounded-3xl p-7 text-center"
          style={{
            background: 'linear-gradient(160deg, rgba(233,176,38,0.18) 0%, rgba(13,8,5,0.0) 100%)',
            border: '1.5px solid rgba(233, 176, 38, 0.35)',
          }}
        >
          <Image
            src="/bear.png"
            alt="Bare Brew Bear"
            width={88}
            height={88}
            className="mx-auto mb-4"
            style={{ borderRadius: '50%', background: 'rgba(233,176,38,0.12)' }}
          />
          <h2
            className="text-4xl mb-2 leading-none"
            style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive', letterSpacing: '3px' }}
          >
            BARE BREW
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#F5E6C8', opacity: 0.65 }}>
            The world's cleanest energy coffee.<br />
            No fillers. No fluff. Just fuel.
          </p>
        </div>

        {/* 2 Ingredients callout */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(26, 14, 6, 0.9)',
            border: '1.5px solid rgba(233, 176, 38, 0.25)',
          }}
        >
          <p
            className="text-[11px] tracking-widest uppercase mb-4"
            style={{ color: '#E9B026', opacity: 0.7 }}
          >
            The Whole Ingredient List
          </p>

          <div className="flex gap-3">
            <IngredientCard
              number="01"
              name="Cold Brew Coffee"
              detail="Slow-steeped 20+ hours"
              icon="☕"
            />
            <IngredientCard
              number="02"
              name="Natural Caffeine"
              detail="From green tea extract"
              icon="🍃"
            />
          </div>

          <p
            className="text-xs mt-4 text-center"
            style={{ color: '#F5E6C8', opacity: 0.35 }}
          >
            That's it. Read the label — it's two lines.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value="320mg" label="Caffeine" sublabel="per can" />
          <StatCard value="0g" label="Sugar" sublabel="zero, none, nada" />
          <StatCard value="2" label="Ingredients" sublabel="just two" />
        </div>

        {/* How cold brew works */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(26, 14, 6, 0.9)',
            border: '1px solid rgba(233, 176, 38, 0.15)',
          }}
        >
          <p
            className="text-[11px] tracking-widest uppercase mb-4"
            style={{ color: '#E9B026', opacity: 0.7 }}
          >
            How Cold Brew Works
          </p>

          <div className="flex flex-col gap-4">
            <Step
              num="1"
              title="Coarse Grind"
              body="Coffee is ground coarse — more surface area, less bitterness."
            />
            <Step
              num="2"
              title="Cold Steep"
              body="Grounds steep in cold water for 20+ hours. No heat means no acid, no burnt flavor."
            />
            <Step
              num="3"
              title="Slow Filter"
              body="Grounds filtered out slowly for a clean, smooth concentrate."
            />
            <Step
              num="4"
              title="Canned Clean"
              body="Natural caffeine added, canned fresh. No preservatives needed — cold brew is naturally stable."
            />
          </div>
        </div>

        {/* Why it hits different */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(26, 14, 6, 0.9)',
            border: '1px solid rgba(233, 176, 38, 0.15)',
          }}
        >
          <p
            className="text-[11px] tracking-widest uppercase mb-4"
            style={{ color: '#E9B026', opacity: 0.7 }}
          >
            Why 320mg Hits Different
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#F5E6C8', opacity: 0.7 }}>
            Most energy drinks front-load your caffeine with sugar and synthetic stimulants. You spike, then you crash.
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#F5E6C8', opacity: 0.7 }}>
            Cold brew caffeine absorbs differently. The natural oils in coffee slow the uptake — you get a cleaner, longer-lasting energy curve. No jitters, no 2pm cliff.
          </p>
          <div
            className="rounded-2xl p-4 mt-2"
            style={{
              background: 'rgba(233, 176, 38, 0.08)',
              border: '1px solid rgba(233, 176, 38, 0.2)',
            }}
          >
            <p className="text-xs text-center" style={{ color: '#E9B026' }}>
              320mg natural caffeine = ~3 espresso shots worth of clean, sustained energy
            </p>
          </div>
        </div>

        {/* The story */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(26, 14, 6, 0.9)',
            border: '1px solid rgba(233, 176, 38, 0.15)',
          }}
        >
          <p
            className="text-[11px] tracking-widest uppercase mb-4"
            style={{ color: '#E9B026', opacity: 0.7 }}
          >
            The Story
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#F5E6C8', opacity: 0.7 }}>
            Bare Brew started with a simple question: why does every energy drink read like a chemistry exam?
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#F5E6C8', opacity: 0.7 }}>
            We stripped everything back. No taurine. No B12 megadoses. No artificial flavors or colors. Just cold brew coffee the way it's supposed to taste — smooth, bold, clean.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#F5E6C8', opacity: 0.7 }}>
            The bear isn't a mascot. He's the standard. Bare means bare — what you see is what you get.
          </p>
        </div>

        {/* Compare */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(26, 14, 6, 0.9)',
            border: '1px solid rgba(233, 176, 38, 0.15)',
          }}
        >
          <p
            className="text-[11px] tracking-widest uppercase mb-4"
            style={{ color: '#E9B026', opacity: 0.7 }}
          >
            vs. The Other Guys
          </p>
          <div className="flex flex-col gap-2">
            <CompareRow label="Ingredients" them="15–30+" us="2" />
            <CompareRow label="Sugar" them="27–54g" us="0g" />
            <CompareRow label="Artificial flavors" them="Yes" us="None" />
            <CompareRow label="Crash" them="Guaranteed" us="Nope" />
            <CompareRow label="Caffeine source" them="Synthetic" us="Green tea + coffee" />
          </div>
        </div>

        {/* CTAs */}
        <a
          href="https://drinkbarebrew.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-3xl p-5 text-center"
          style={{
            background: '#E9B026',
          }}
        >
          <p
            className="text-xl"
            style={{ color: '#1A0E06', fontFamily: 'Bebas Neue, cursive', letterSpacing: '3px' }}
          >
            SHOP BARE BREW →
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#1A0E06', opacity: 0.6 }}>
            drinkbarebrew.com
          </p>
        </a>

        <Link
          href="/game"
          className="block rounded-3xl p-5 text-center"
          style={{
            background: 'rgba(233, 176, 38, 0.08)',
            border: '1px solid rgba(233, 176, 38, 0.2)',
          }}
        >
          <p
            className="text-xl"
            style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive', letterSpacing: '2px' }}
          >
            BACK TO THE GAME →
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#F5E6C8', opacity: 0.4 }}>
            Play more · earn rewards
          </p>
        </Link>

      </div>
    </div>
  )
}

function IngredientCard({
  number, name, detail, icon,
}: {
  number: string; name: string; detail: string; icon: string
}) {
  return (
    <div
      className="flex-1 rounded-2xl p-4 text-center"
      style={{
        background: 'rgba(233, 176, 38, 0.08)',
        border: '1px solid rgba(233, 176, 38, 0.25)',
      }}
    >
      <span className="text-3xl mb-2 block">{icon}</span>
      <p
        className="text-2xl leading-none mb-1"
        style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
      >
        {number}
      </p>
      <p className="text-xs font-semibold mb-1" style={{ color: '#F5E6C8' }}>{name}</p>
      <p className="text-[10px]" style={{ color: '#F5E6C8', opacity: 0.45 }}>{detail}</p>
    </div>
  )
}

function StatCard({
  value, label, sublabel,
}: {
  value: string; label: string; sublabel: string
}) {
  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{
        background: 'rgba(26, 14, 6, 0.9)',
        border: '1.5px solid rgba(233, 176, 38, 0.2)',
      }}
    >
      <p
        className="text-3xl leading-none mb-0.5"
        style={{ color: '#E9B026', fontFamily: 'Bebas Neue, cursive' }}
      >
        {value}
      </p>
      <p className="text-[11px] font-semibold" style={{ color: '#F5E6C8' }}>{label}</p>
      <p className="text-[9px] mt-0.5" style={{ color: '#F5E6C8', opacity: 0.35 }}>{sublabel}</p>
    </div>
  )
}

function Step({
  num, title, body,
}: {
  num: string; title: string; body: string
}) {
  return (
    <div className="flex gap-3 items-start">
      <div
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          background: 'rgba(233, 176, 38, 0.15)',
          border: '1px solid rgba(233, 176, 38, 0.35)',
          color: '#E9B026',
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '14px',
        }}
      >
        {num}
      </div>
      <div>
        <p className="text-sm font-semibold mb-0.5" style={{ color: '#F5E6C8' }}>{title}</p>
        <p className="text-xs leading-relaxed" style={{ color: '#F5E6C8', opacity: 0.5 }}>{body}</p>
      </div>
    </div>
  )
}

function CompareRow({
  label, them, us,
}: {
  label: string; them: string; us: string
}) {
  return (
    <div
      className="flex items-center rounded-xl px-4 py-2.5"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <span className="flex-1 text-xs" style={{ color: '#F5E6C8', opacity: 0.55 }}>{label}</span>
      <span className="w-24 text-center text-xs" style={{ color: '#ff6b5b', opacity: 0.75 }}>{them}</span>
      <span
        className="w-24 text-center text-xs font-semibold"
        style={{ color: '#E9B026' }}
      >
        {us}
      </span>
    </div>
  )
}
