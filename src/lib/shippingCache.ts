import crypto from 'crypto'

type CacheEntry = { rates: any[]; expiresAt: number }

const store = new Map<string, CacheEntry>()
const TTL_MS = 15 * 60 * 1000

function buildKey(addressId: string, cartItems: { variantId: string; quantity: number }[]) {
  const sorted = [...cartItems].sort((a, b) => a.variantId.localeCompare(b.variantId))
  const raw = addressId + '|' + sorted.map(i => `${i.variantId}:${i.quantity}`).join(',')
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function getCachedRates(addressId: string, cartItems: { variantId: string; quantity: number }[]) {
  const key = buildKey(addressId, cartItems)
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.rates
}

export function setCachedRates(addressId: string, cartItems: { variantId: string; quantity: number }[], rates: any[]) {
  const key = buildKey(addressId, cartItems)
  store.set(key, { rates, expiresAt: Date.now() + TTL_MS })
}
