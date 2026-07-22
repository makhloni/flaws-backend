import { Request, Response } from 'express'
import crypto from 'crypto'
import prisma from '../lib/prisma'
import { sendOrderConfirmation } from '../lib/email'
import { createShipment, getQuote } from '../lib/courierGuy'

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
  serviceLevelCode = 'ECO',
  sendEmail = false,
}: {
  userId: string
  addressId: string
  reference: string
  amountInRands: number
  serviceLevelCode?: string
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
  const shipping = amountInRands - subtotal
  const total = amountInRands

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
      courierServiceLevelCode: serviceLevelCode,
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

  // ─── Book Courier Guy shipment ──────────────────────────
  if (newOrder.address) {
    try {
      const shipment = await createShipment({
        orderId: newOrder.id,
        deliveryAddress: {
          street: newOrder.address.street,
          city: newOrder.address.city,
          province: newOrder.address.province,
          postalCode: newOrder.address.postalCode,
          country: 'ZA',
        },
        deliveryContact: {
          name: newOrder.address.fullName,
          email: newOrder.user.email,
          mobileNumber: newOrder.user.phone ?? undefined,
        },
        parcels: newOrder.items.flatMap(item =>
          Array.from({ length: item.quantity }, () => ({
            description: item.product.name,
            weightKg: item.variant.weightKg ? Number(item.variant.weightKg) : 0.5,
            lengthCm: item.variant.lengthCm ?? undefined,
            widthCm: item.variant.widthCm ?? undefined,
            heightCm: item.variant.heightCm ?? undefined,
          }))
        ),
        serviceLevelCode,
      })

      await prisma.order.update({
        where: { id: newOrder.id },
        data: {
          courierWaybillId: shipment.waybillId,
          trackingNumber: shipment.trackingNumber,
          courierBookedAt: new Date(),
          courierStatus: 'BOOKED',
        },
      })
    } catch (courierErr) {
      console.error('Courier Guy booking failed:', courierErr)
    }
  }

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

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const { addressId, serviceLevelCode } = req.body
    const userId = req.user?.id

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!addressId) return res.status(400).json({ message: 'Address required' })
    if (!serviceLevelCode) return res.status(400).json({ message: 'Delivery option required' })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const address = await prisma.address.findFirst({ where: { id: addressId, userId } })
    if (!address) return res.status(404).json({ message: 'Address not found' })

    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: { variant: true, product: true },
    })
    if (cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' })

    const subtotal = cartItems.reduce((sum, item) => {
      const price = Number(item.variant.salePrice ?? item.variant.price)
      return sum + price * item.quantity
    }, 0)

    // Re-quote server-side — never trust a client-supplied shipping price.
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
    const selected = rawRates.find(
      (r: any) => (r.service_level?.code ?? r.service_level_code) === serviceLevelCode
    )
    if (!selected) {
      return res.status(400).json({ message: 'Selected delivery option is no longer available — please choose again' })
    }
    const shipping = Number(selected.rate ?? selected.total_price ?? selected.price)
    const total = subtotal + shipping

    const reference = `FLAWS-${Date.now()}-${Math.random().toString(36).slice(2).toUpperCase()}`

    const merchantId = process.env.PAYFAST_MERCHANT_ID!
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY!
    const passphrase = process.env.PAYFAST_PASSPHRASE || null

    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${process.env.FRONTEND_URL}/payment/success?reference=${reference}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout?cancelled=true`,
      notify_url: `${process.env.API_BASE_URL}/payment/notify`,
      name_first: user.name.split(' ')[0] ?? user.name,
      name_last: user.name.split(' ').slice(1).join(' ') || '-',
      email_address: user.email,
      m_payment_id: reference,
      amount: total.toFixed(2),
      item_name: 'FLAWS Order',
      custom_str1: userId,
      custom_str2: addressId,
      custom_str3: serviceLevelCode,
    }

    const signature = generatePayFastSignature(paymentData, passphrase)

    res.json({
      paymentData: { ...paymentData, signature },
      payFastUrl: process.env.PAYFAST_SANDBOX === 'true'
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process',
      amount: total,
      shipping,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

export const payfastITN = async (req: Request, res: Response) => {
  try {
    const body: Record<string, string> = req.body
    const passphrase = process.env.PAYFAST_PASSPHRASE || null

    if (!validateITNSignature(body, passphrase)) {
      console.error('PayFast ITN: Invalid signature')
      return res.status(400).send('Invalid signature')
    }

    if (body.payment_status !== 'COMPLETE') {
      return res.sendStatus(200)
    }

    const reference = body.m_payment_id
    const amountPaid = parseFloat(body.amount_gross)
    const userId = body.custom_str1
    const addressId = body.custom_str2
    const serviceLevelCode = body.custom_str3

    if (!reference || !userId || !addressId) {
      console.error('PayFast ITN: Missing required fields')
      return res.status(400).send('Missing fields')
    }

    await fulfillOrder({
      userId,
      addressId,
      reference,
      amountInRands: amountPaid,
      serviceLevelCode: serviceLevelCode || 'ECO',
      sendEmail: true,
    })

    res.sendStatus(200)
  } catch (err) {
    console.error('PayFast ITN error:', err)
    res.sendStatus(200)
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

    // Retry up to 10 seconds in 1s intervals
    let order = null
    for (let i = 0; i < 10; i++) {
      order = await prisma.order.findFirst({
        where: { paymentReference: reference },
      })
      if (order) break
      await new Promise(r => setTimeout(r, 1000))
    }

    if (!order) return res.status(404).json({ message: 'Order not found yet' })
    res.json({ orderId: order.id })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}