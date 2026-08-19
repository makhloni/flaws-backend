import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { getQuote } from '../lib/courierGuy'
import { getCachedRates, setCachedRates } from '../lib/shippingCache'

export const getRates = async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { addressId } = req.body
  if (!addressId) return res.status(400).json({ message: 'addressId is required' })

  const address = await prisma.address.findFirst({ where: { id: addressId, userId } })
  if (!address) return res.status(404).json({ message: 'Address not found' })

  const cartItems = await prisma.cart.findMany({
    where: { userId },
    include: { variant: true, product: true },
  })
  if (cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' })

  const cacheKeyItems = cartItems.map(i => ({ variantId: i.variantId, quantity: i.quantity }))

  const cached = getCachedRates(addressId, cacheKeyItems)
  if (cached) {
    return res.json({ rates: cached })
  }

  try {
    const quote = await getQuote({
      deliveryAddress: {
        street: address.street,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        country: 'ZA',
      },
      parcels: cartItems.flatMap(item =>
        Array.from({ length: item.quantity }, () => ({
          description: item.product.name,
          weightKg: item.variant.weightKg ? Number(item.variant.weightKg) : 0.5,
          lengthCm: item.variant.lengthCm ?? undefined,
          widthCm: item.variant.widthCm ?? undefined,
          heightCm: item.variant.heightCm ?? undefined,
        }))
      ),
    })

    const rawRates = Array.isArray(quote) ? quote : quote.rates || []
    const rates = rawRates.map((r: any) => ({
      serviceLevelCode: r.service_level?.code ?? r.service_level_code,
      serviceLevelName: r.service_level?.name ?? r.service_level_code,
      price: Number(r.rate ?? r.total_price ?? r.price),
    }))

    setCachedRates(addressId, cacheKeyItems, rates)
    res.json({ rates })
  } catch (err: any) {
    console.error('Rate lookup failed:', err.response?.data || err.message)
    res.status(502).json({ message: 'Could not fetch shipping rates — please try again' })
  }
}
