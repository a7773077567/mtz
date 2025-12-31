import type { Market, User } from '../types'

const CACHE_KEYS = {
  MARKETS: 'mtz_markets',
  USERS: 'mtz_users',
} as const

const CACHE_TTL = 5 * 60 * 1000 // 5 分鐘

interface CacheItem<T> {
  data: T
  expiry: number
}

function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    
    const cached: CacheItem<T> = JSON.parse(raw)
    if (Date.now() > cached.expiry) {
      localStorage.removeItem(key)
      return null
    }
    return cached.data
  } catch {
    return null
  }
}

function setItem<T>(key: string, data: T, ttl = CACHE_TTL): void {
  const item: CacheItem<T> = {
    data,
    expiry: Date.now() + ttl,
  }
  try {
    localStorage.setItem(key, JSON.stringify(item))
  } catch {
    // localStorage 滿了或不可用
  }
}

export function useCache() {
  const getCachedMarkets = (): Market[] | null => {
    return getItem<Market[]>(CACHE_KEYS.MARKETS)
  }

  const setCachedMarkets = (markets: Market[]): void => {
    setItem(CACHE_KEYS.MARKETS, markets)
  }

  const getCachedUsers = (): User[] | null => {
    return getItem<User[]>(CACHE_KEYS.USERS)
  }

  const setCachedUsers = (users: User[]): void => {
    setItem(CACHE_KEYS.USERS, users)
  }

  const clearCache = (): void => {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  return {
    getCachedMarkets,
    setCachedMarkets,
    getCachedUsers,
    setCachedUsers,
    clearCache,
  }
}
