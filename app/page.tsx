import { redirect } from 'next/navigation'

// Root redirects to the game
export default function Home() {
  redirect('/game')
}
