'use client'

import { useEffect, useState, useCallback } from 'react'
import { ECONOMY } from '@/lib/game/constants'

interface RunQuota {
  runsLeft: number
  baseRuns: number
  bonusRuns: number
  loading: boolean
  decrementRun: () => void
  refreshQuota: () => void
}

export function useRunQuota(userId: string | undefined): RunQuota {
  const [runsLeft, setRunsLeft] = useState<number>(ECONOMY.baseRunsPerDay)
  const [bonusRuns, setBonusRuns] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchQuota = useCallback(async () => {
    if (!userId) {
      // Guests get unlimited plays
      setRunsLeft(999)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/runs/quota')
      if (res.ok) {
        const data = await res.json()
        setRunsLeft(data.runsLeft)
        setBonusRuns(data.bonusRuns ?? 0)
      }
    } catch {
      // Fallback to default
      setRunsLeft(ECONOMY.baseRunsPerDay)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchQuota()
  }, [fetchQuota])

  const decrementRun = useCallback(() => {
    if (!userId) return  // guests unlimited
    setRunsLeft(prev => Math.max(0, prev - 1))
  }, [userId])

  const refreshQuota = useCallback(() => {
    fetchQuota()
  }, [fetchQuota])

  return {
    runsLeft,
    baseRuns: ECONOMY.baseRunsPerDay,
    bonusRuns,
    loading,
    decrementRun,
    refreshQuota,
  }
}
