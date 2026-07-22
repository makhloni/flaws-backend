import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { getShipmentStatus } from '../lib/courierGuy'

// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { addressId } = req.body

  if (!addressId) {
    return res.status(400).json({ message: 'addressId is required' })
  }

  // Get cart items
  const cartItems = await prisma.cart.findMany({
    where: { userId },
    include: { variant: true },
  })

  if (cartItems.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' })
  }

  // Check stock for all items before creating order
  for (const item of cartItems) {
    if (item.variant.stock < item.quantity) {
      return res.status(400).json({
        message: `Insufficient stock for variant ${item.variantId}`,
      })
    }
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.variant.salePrice ?? item.variant.price)
    return sum + price * item.quantity
  }, 0)

  const shippingCost = subtotal > 1000 ? 0 : 100 // free shipping over R1000
  const total = subtotal + shippingCost

  // Create order + items + deduct stock in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        addressId,
        subtotal,
        shippingCost,
        total,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.variant.salePrice ?? item.variant.price,
            total: Number(item.variant.salePrice ?? item.variant.price) * item.quantity,
          })),
        },
      },
      include: { items: true },
    })

    // Deduct stock
    for (const item of cartItems) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    // Clear cart
    await tx.cart.deleteMany({ where: { userId } })

    return newOrder
  })

  res.status(201).json(order)
}

// GET /api/orders
export const getUserOrders = async (req: Request, res: Response) => {
  const userId = req.user!.id

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(orders)
}

// GET /api/orders/:id
export const getOrderById = async (req: Request, res: Response) => {
  const userId = req.user!.id
  const id = req.params.id as string

  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
      address: true,
    },
  })

  if (!order) return res.status(404).json({ message: 'Order not found' })

  res.json(order)
}

// GET /api/orders/:id/tracking
export const trackOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id
  const id = req.params.id as string

  const order = await prisma.order.findFirst({
    where: { id, userId },
  })

  if (!order) return res.status(404).json({ message: 'Order not found' })

  if (!order.trackingNumber) {
    return res.json({ booked: false, status: null })
  }

  try {
    const status = await getShipmentStatus(order.trackingNumber)
    res.json({ booked: true, status })
  } catch (err: any) {
    console.error('Tracking lookup failed:', err.response?.data || err.message)
    res.status(502).json({ message: 'Could not fetch tracking status right now' })
  }
}

// PATCH /api/orders/:id/cancel
export const cancelOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id
  const id = req.params.id as string

  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { items: true },
  })

  if (!order) return res.status(404).json({ message: 'Order not found' })

  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    return res.status(400).json({ message: `Cannot cancel an order with status ${order.status}` })
  }

  // Refund stock and cancel in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }
  })

  res.json({ message: 'Order cancelled and stock restored' })
}

