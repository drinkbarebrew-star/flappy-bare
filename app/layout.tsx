import './ssr-polyfill'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flappy Bare | Bare Brew',
  description: 'Tap to fly the Bare Brew bear through cold brew cans. Earn coins, win rewards. 320mg of pure game fuel.',
  applicationName: 'Flappy Bare',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Flappy Bare',
  },
  openGraph: {
    title: 'Flappy Bare | Bare Brew',
    description: 'Tap to fly. Dodge the cans. Earn real Bare Brew rewards.',
    type: 'website',
    url: 'https://flappybare.com',
    siteName: 'Flappy Bare',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flappy Bare',
    description: 'The Bare Brew game — earn real coffee rewards.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0d0805',
}

import ServiceWorkerRegistrar from '@/components/game/ServiceWorkerRegistrar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
