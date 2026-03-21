import { Request, Response } from 'express'
import prisma from '../lib/prisma'

// GET /api/cart
export const getCart = async (req: Request, res: Response) => {
  const userId = req.user!.id

  const cart = await prisma.cart.findMany({
    where: { userId },
    include: {
      product: {
        include: { images: true },
      },
      variant: true,
    },
  })

  const total = cart.reduce((sum, item) => {
    const price = Number(item.variant.salePrice ?? item.variant.price)
    return sum + price * item.quantity
  }, 0)

  res.json({ items: cart, total })
}

// POST /api/cart
export const addToCart = async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { productId, variantId, quantity } = req.body

  if (!productId || !variantId || !quantity) {
    return res.status(400).json({ message: 'productId, variantId and quantity are required' })
  }

  // Check stock
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  })

  if (!variant) return res.status(404).json({ message: 'Variant not found' })
  if (variant.stock < quantity) {
    return res.status(400).json({ message: `Only ${variant.stock} items in stock` })
  }

  // Upsert — update quantity if already in cart, add if not
  const cartItem = await prisma.cart.upsert({
    where: { userId_variantId: { userId, variantId } },
    update: { quantity },
    create: { userId, productId, variantId, quantity },
    include: {
      product: { include: { images: true } },
      variant: true,
    },
  })

  res.status(201).json(cartItem)
}

// PATCH /api/cart/:variantId
export const updateCartItem = async (req: Request, res: Response) => {
  const userId = req.user!.id
  const variantId = req.params.variantId as string
  const { quantity } = req.body

  if (quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1' })
  }

  const cartItem = await prisma.cart.update({
    where: { userId_variantId: { userId, variantId } },
    data: { quantity },
    include: {
      product: { include: { images: true } },
      variant: true,
    },
  })

  res.json(cartItem)
}

// DELETE /api/cart/:variantId
export const removeFromCart = async (req: Request, res: Response) => {
  const userId = req.user!.id
  const variantId = req.params.variantId as string

  await prisma.cart.delete({
    where: { userId_variantId: { userId, variantId } },
  })

  res.json({ message: 'Item removed from cart' })
}

// DELETE /api/cart
export const clearCart = async (req: Request, res: Response) => {
  const userId = req.user!.id

  await prisma.cart.deleteMany({ where: { userId } })

  res.json({ message: 'Cart cleared' })
}

export const mergeCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { items } = req.body
    if (!items || !Array.isArray(items)) return res.json({ success: true })

    for (const item of items) {
      const existing = await prisma.cart.findUnique({
        where: { userId_variantId: { userId, variantId: item.variantId } },
      })

      if (existing) {
        await prisma.cart.update({
          where: { userId_variantId: { userId, variantId: item.variantId } },
          data: { quantity: { increment: item.quantity } },
        })
      } else {
        await prisma.cart.create({
          data: {
            userId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        })
      }
    }

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}