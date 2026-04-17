// Next.js 15 dev overlay calls localStorage.getItem during SSR.
// This polyfills it on the server before any rendering happens.
if (typeof window === 'undefined') {
  const g = globalThis as Record<string, unknown>
  const hasGetItem = typeof (g.localStorage as Record<string, unknown> | undefined)?.getItem === 'function'
  if (!hasGetItem) {
    const store: Record<string, string> = {}
    g.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = String(v) },
      removeItem: (k: string) => { delete store[k] },
      clear: () => { for (const k of Object.keys(store)) delete store[k] },
      get length() { return Object.keys(store).length },
      key: (i: number) => Object.keys(store)[i] ?? null,
    }
  }
}
