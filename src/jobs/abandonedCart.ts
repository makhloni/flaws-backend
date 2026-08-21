import prisma from '../lib/prisma'
import { sendAbandonedCart } from '../lib/abandonedCart'

export async function runAbandonedCartJob() {
  console.log('[AbandonedCart] Running job...')

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000)

  // Get distinct userIds with abandoned carts
  const abandonedUserIds = await prisma.cart.findMany({
    where: {
      updatedAt: { gte: oneDayAgo, lte: oneHourAgo },
      abandonedEmailSent: false,
    },
    select: { userId: true },
    distinct: ['userId'],
  })

  for (const { userId } of abandonedUserIds) {
    try {
      // Get full cart for this user
      const cartItems = await prisma.cart.findMany({
        where: { userId },
        include: {
          user: true,
          variant: {
            include: {
              product: { include: { images: true } },
            },
          },
        },
      })

      if (cartItems.length === 0) continue

      const user = cartItems[0].user
      const items = cartItems.map(item => {
        const image = item.variant.product.images.find((i: any) => i.isPrimary)?.url || item.variant.product.images[0]?.url
        const price = Number(item.variant.salePrice ?? item.variant.price)
        return {
          productName: item.variant.product.name,
          color: item.variant.color,
          size: item.variant.size,
          price: price * item.quantity,
          image,
        }
      })

      const cartTotal = items.reduce((sum, i) => sum + i.price, 0)

      await sendAbandonedCart({
        to: user.email,
        customerName: user.name,
        items,
        cartTotal,
      })

      // Mark all items for this user as emailed
      await prisma.cart.updateMany({
        where: { userId },
        data: { abandonedEmailSent: true },
      })

      console.log(`[AbandonedCart] Sent to ${user.email}`)
    } catch (err) {
      console.error(`[AbandonedCart] Failed for user ${userId}:`, err)
    }
  }

  console.log('[AbandonedCart] Done.')
}