import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCoins(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function formatBucks(n: number): string {
  return `${n} Buck${n !== 1 ? 's' : ''}`
}

export function formatUSD(bucks: number): string {
  return `$${(bucks * 0.5).toFixed(2)}`
}
