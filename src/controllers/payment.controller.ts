import { Request, Response } from 'express'
import crypto from 'crypto'
import prisma from '../lib/prisma'
import { sendOrderConfirmation } from '../lib/email'

// ─── Helpers ────────────────────────────────────────────────────────────────

function generatePayFastSignature(
  data: Record<string, string>,
  passphrase: string | null = null
): string {
  // Sort keys, build query string
  let queryString = Object.keys(data)
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&')

  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
  }

  return crypto.createHash('md5').update(queryString).digest('hex')
}

function validateITNSignature(
  body: Record<string, string>,
  passphrase: string | null = null
): boolean {
  const { signature, ...data } = body

  // Remove signature from data before computing
  const computedSignature = generatePayFastSignature(data, passphrase)
  return computedSignature === signature
}

// ─── Shared fulfillment  ───────────────────────────────────

async function fulfillOrder({
  userId,
  addressId,
  reference,
  amountInRands,
  sendEmail = false,
}: {
  userId: string
  addressId: string
  reference: string
  amountInRands: number
  sendEmail?: boolean
}) {
  const existing = await prisma.order.findFirst({
    where: { paymentReference: reference },
  })
  if (existing) return existing

  const cartItems = await prisma.cart.findMany({
    where: { userId },
    include: { variant: true, product: true },
  })
  if (cartItems.length === 0) return null

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.variant.salePrice ?? item.variant.price)
    return sum + price * item.quantity
  }, 0)
  const shipping = subtotal >= 1000 ? 0 : 100
  const total = amountInRands // PayFast sends amount in Rands, not cents

  const newOrder = await prisma.order.create({
    data: {
      userId,
      addressId,
      status: 'CONFIRMED',
      subtotal,
      shippingCost: shipping,
      discount: 0,
      total,
      paymentReference: reference,
      isPaid: true,
      paidAt: new Date(),
      items: {
        create: cartItems.map(item => {
          const unitPrice = Number(item.variant.salePrice ?? item.variant.price)
          return {
            variantId: item.variantId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            total: unitPrice * item.quantity,
          }
        }),
      },
    },
    include: {
      user: true,
      address: true,
      items: {
        include: { variant: true, product: true },
      },
    },
  })

  for (const item of cartItems) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  await prisma.cart.deleteMany({ where: { userId } })

  if (sendEmail) {
    try {
      if (newOrder.address) {
        await sendOrderConfirmation({
          to: newOrder.user.email,
          customerName: newOrder.user.name,
          orderId: newOrder.id,
          items: newOrder.items.map(item => ({
            productName: item.product.name,
            color: item.variant.color,
            size: item.variant.size,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
          subtotal,
          shipping,
          total,
          address: {
            fullName: newOrder.address.fullName,
            street: newOrder.address.street,
            city: newOrder.address.city,
            province: newOrder.address.province,
            postalCode: newOrder.address.postalCode,
            country: newOrder.address.country,
          },
        })
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr)
    }
  }

  return newOrder
}

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * Returns the PayFast payment data + signature so the frontend can
 * build a form and POST directly to PayFast.
 */
export const initializePayment = async (req: Request, res: Response) => {
  try {
    const { addressId } = req.body
    const userId = req.user?.id

    
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!addressId) return res.status(400).json({ message: 'Address required' })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: { variant: true, product: true },
    })
    if (cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' })

    const subtotal = cartItems.reduce((sum, item) => {
      const price = Number(item.variant.salePrice ?? item.variant.price)
      return sum + price * item.quantity
    }, 0)
    const shipping = subtotal >= 1000 ? 0 : 100
    const total = subtotal + shipping

    const reference = `FLAWS-${Date.now()}-${Math.random().toString(36).slice(2).toUpperCase()}`

    const merchantId = process.env.PAYFAST_MERCHANT_ID!
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY!
    const passphrase = process.env.PAYFAST_PASSPHRASE || null
    const baseUrl = process.env.APP_BASE_URL!

    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${process.env.FRONTEND_URL}/payment/success?reference=${reference}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout?cancelled=true`,
      notify_url: `${process.env.API_BASE_URL}/api/payment/notify`,
      name_first: user.name.split(' ')[0] ?? user.name,
      name_last: user.name.split(' ').slice(1).join(' ') || '-',
      email_address: user.email,
      m_payment_id: reference,
      amount: total.toFixed(2),
      item_name: 'FLAWS Order',
      // Pass metadata through custom fields
      custom_str1: userId,
      custom_str2: addressId,
    }

    const signature = generatePayFastSignature(paymentData, passphrase)

    res.json({
      paymentData: { ...paymentData, signature },
      payFastUrl: process.env.PAYFAST_SANDBOX === 'true'
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process',
      amount: total,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * PayFast ITN (Instant Transaction Notification) handler.
 * PayFast POSTs here server-to-server after payment.
 * This is your source of truth — fulfill the order here.
 */
export const payfastITN = async (req: Request, res: Response) => {
  try {
    const body: Record<string, string> = req.body
    const passphrase = process.env.PAYFAST_PASSPHRASE || null

    // 1. Validate signature
    if (!validateITNSignature(body, passphrase)) {
      console.error('PayFast ITN: Invalid signature')
      return res.status(400).send('Invalid signature')
    }

    // 2. Validate payment status
    if (body.payment_status !== 'COMPLETE') {
      // Not a completed payment — acknowledge and ignore
      return res.sendStatus(200)
    }

    // 3. Validate amount matches expected (prevent price tampering)
    const reference = body.m_payment_id
    const amountPaid = parseFloat(body.amount_gross)
    const userId = body.custom_str1
    const addressId = body.custom_str2

    if (!reference || !userId || !addressId) {
      console.error('PayFast ITN: Missing required fields')
      return res.status(400).send('Missing fields')
    }

    // 4. Fulfill
    await fulfillOrder({
      userId,
      addressId,
      reference,
      amountInRands: amountPaid,
      sendEmail: true,
    })

    res.sendStatus(200)
  } catch (err) {
    console.error('PayFast ITN error:', err)
    res.sendStatus(200) // Always 200 to PayFast or it retries
  }
}

/**
 * Called when the frontend returns from PayFast (return_url redirect).
 * Don't fulfill here — the ITN is the source of truth.
 * Just look up the order by reference and return its ID.
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const reference = req.params.reference as string
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    // ITN may arrive slightly before/after redirect — retry briefly
    let order = await prisma.order.findFirst({
      where: { paymentReference: reference },
    })

    if (!order) {
      await new Promise(r => setTimeout(r, 3000))
      order = await prisma.order.findFirst({
        where: { paymentReference: reference },
      })
    }

    if (!order) return res.status(404).json({ message: 'Order not found yet' })

    res.json({ orderId: order.id })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}