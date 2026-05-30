import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function getFrom() {
  return `FLAWS <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`
}

// ─────────────────────────────────────────────
// SHARED DESIGN SYSTEM
// ─────────────────────────────────────────────
const COLORS = {
  bg: '#080808',
  surface: '#0f0f0f',
  border: '#1c1c1c',
  borderAccent: '#3a0a0a',
  crimson: '#8b1a1a',
  crimsonLight: '#c0392b',
  crimsonGlow: '#c0392b22',
  white: '#ffffff',
  muted: '#777777',
  subtle: '#444444',
  light: '#cccccc',
}

const flawsWordmark = `
  <div style="text-align:center;padding:40px 0 32px;">
    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;letter-spacing:0.55em;text-transform:uppercase;color:#ffffff;font-style:italic;">FLAWS</h1>
    <div style="width:40px;height:1px;background:#8b1a1a;margin:16px auto 0;"></div>
  </div>
`

const footer = `
  <div style="padding:32px 0 0;text-align:center;border-top:1px solid ${COLORS.border};">
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:${COLORS.subtle};letter-spacing:0.1em;">
       FLAWS. South Africa.
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:${COLORS.subtle};letter-spacing:0.05em;">
      Questions? <a href="mailto:support@flaws.co.za" style="color:${COLORS.crimsonLight};text-decoration:none;">support@flaws.co.za</a>
    </p>
  </div>
`

function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <meta name="color-scheme" content="dark"/>
    </head>
    <body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
      <div style="max-width:560px;margin:0 auto;padding:0 24px 48px;">
        ${flawsWordmark}
        ${content}
        ${footer}
      </div>
    </body>
    </html>
  `
}

// ─────────────────────────────────────────────
// SECTION HEADER  (reusable)
// ─────────────────────────────────────────────
function sectionHeader(eyebrow: string, headline: string, sub?: string): string {
  return `
    <div style="text-align:center;padding:28px 0;margin-bottom:28px;border-top:1px solid ${COLORS.borderAccent};border-bottom:1px solid ${COLORS.borderAccent};position:relative;">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${COLORS.crimsonLight};">${eyebrow}</p>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-style:italic;font-weight:400;letter-spacing:0.06em;color:${COLORS.white};">${headline}</p>
      ${sub ? `<p style="margin:10px 0 0;font-size:12px;color:${COLORS.muted};letter-spacing:0.12em;text-transform:uppercase;">${sub}</p>` : ''}
    </div>
  `
}

// ─────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────
const crimsonDivider = `
  <div style="width:80px;height:1px;background:#8b1a1a;margin:24px auto;"></div>
`
// ─────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────
interface OrderItem {
  productName: string
  color: string
  size: string
  quantity: number
  unitPrice: number
}

interface SendOrderConfirmationParams {
  to: string
  customerName: string
  orderId: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  address: {
    fullName: string
    street: string
    city: string
    province: string
    postalCode: string
    country: string
  }
}

// ─────────────────────────────────────────────
// 1. ORDER CONFIRMATION
// ─────────────────────────────────────────────
export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  const { to, customerName, orderId, items, subtotal, shipping, total, address } = params
  const orderRef = orderId.slice(0, 8).toUpperCase()
  const firstName = customerName.split(' ')[0]

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${COLORS.border};">
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:${COLORS.white};letter-spacing:0.03em;">
          ${item.productName}
        </p>
        <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${COLORS.muted};">
          ${item.color} &nbsp;/&nbsp; ${item.size} &nbsp;×&nbsp; ${item.quantity}
        </p>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid ${COLORS.border};text-align:right;font-size:13px;color:${COLORS.light};letter-spacing:0.05em;">
        R${(item.unitPrice * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  const content = `
    ${sectionHeader('Order Confirmed', `Thank you, ${firstName}`, `Order #${orderRef}`)}

    <p style="font-size:13px;color:${COLORS.muted};line-height:1.9;margin:0 0 28px;letter-spacing:0.03em;">
      We've received your order and it's being prepared with care. You'll receive a shipping update as soon as it's on its way.
    </p>

    <!-- ORDER ITEMS -->
    <div style="margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${COLORS.crimsonLight};">Your Order</p>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- TOTALS -->
    <div style="background:${COLORS.surface};border:1px solid ${COLORS.border};padding:16px 20px;margin-bottom:28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:5px 0;font-size:12px;color:${COLORS.muted};letter-spacing:0.08em;">Subtotal</td>
          <td style="padding:5px 0;font-size:12px;color:${COLORS.muted};text-align:right;">R${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;font-size:12px;color:${COLORS.muted};letter-spacing:0.08em;">Shipping</td>
          <td style="padding:5px 0;font-size:12px;color:${COLORS.muted};text-align:right;">${shipping === 0 ? 'Free' : `R${shipping.toFixed(2)}`}</td>
        </tr>
        <tr>
          <td style="padding:12px 0 0;font-size:14px;font-weight:600;color:${COLORS.white};letter-spacing:0.08em;border-top:1px solid ${COLORS.border};">Total</td>
          <td style="padding:12px 0 0;font-size:14px;font-weight:600;color:${COLORS.white};text-align:right;border-top:1px solid ${COLORS.border};">R${total.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- DELIVERY -->
    <div style="margin-bottom:32px;">
      <p style="margin:0 0 12px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${COLORS.crimsonLight};">Delivery Address</p>
      <div style="border-left:2px solid ${COLORS.crimson};padding-left:16px;">
        <p style="margin:0;font-size:13px;color:${COLORS.light};line-height:2;">
          ${address.fullName}<br/>
          ${address.street}<br/>
          ${address.city}, ${address.province} ${address.postalCode}<br/>
          ${address.country}
        </p>
      </div>
    </div>

    ${crimsonDivider}

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.FRONTEND_URL}/orders/${orderId}"
         style="display:inline-block;padding:14px 48px;background:transparent;color:${COLORS.white};text-decoration:none;font-size:10px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;border:1px solid ${COLORS.crimson};">
        Track Your Order
      </a>
    </div>
  `

  const html = emailWrapper(content)

  try {
    const result = await getResend().emails.send({
      from: getFrom(),
      to,
      subject: `Order Confirmed — #${orderRef}`,
      html,
    })
    console.log('✅ Order confirmation sent:', result)
  } catch (err) {
    console.error('❌ sendOrderConfirmation failed:', err)
    throw err
  }
}

// ─────────────────────────────────────────────
// 2. ORDER STATUS UPDATE
// ─────────────────────────────────────────────
export async function sendOrderStatusUpdate(params: {
  to: string
  customerName: string
  orderId: string
  status: string
  trackingNumber?: string
}) {
  const { to, customerName, orderId, status, trackingNumber } = params
  const orderRef = orderId.slice(0, 8).toUpperCase()
  const firstName = customerName.split(' ')[0]

  const statusConfig: Record<string, { eyebrow: string; headline: string; message: string }> = {
    CONFIRMED: {
      eyebrow: 'Status Update',
      headline: 'Order Confirmed',
      message: 'Your order has been confirmed and is now being prepared.',
    },
    PROCESSING: {
      eyebrow: 'Status Update',
      headline: 'Being Prepared',
      message: 'Your order is being carefully processed and packed.',
    },
    SHIPPED: {
      eyebrow: 'On Its Way',
      headline: 'Order Shipped',
      message: trackingNumber
        ? `Your order is en route. Use the tracking number below to follow its journey.`
        : 'Your order has left us and is on its way to you.',
    },
    DELIVERED: {
      eyebrow: 'Delivered',
      headline: `It's Arrived`,
      message: 'Your order has been delivered. We hope it exceeds your expectations.',
    },
    CANCELLED: {
      eyebrow: 'Order Update',
      headline: 'Order Cancelled',
      message: 'Your order has been cancelled. If payment was made, a refund will be processed within 5–10 business days.',
    },
  }

  const info = statusConfig[status] || {
    eyebrow: 'Status Update',
    headline: `Order ${status}`,
    message: `Your order status has been updated to ${status}.`,
  }

  const content = `
    ${sectionHeader(info.eyebrow, info.headline, `Order #${orderRef}`)}

    <div style="background:${COLORS.surface};border:1px solid ${COLORS.border};border-left:2px solid ${COLORS.crimson};padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:${COLORS.light};line-height:1.9;">
        Hi ${firstName}, ${info.message}
      </p>
      ${trackingNumber ? `
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid ${COLORS.border};">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${COLORS.crimsonLight};">Tracking Number</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-style:italic;color:${COLORS.white};letter-spacing:0.1em;">${trackingNumber}</p>
        </div>
      ` : ''}
    </div>

    ${crimsonDivider}

    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.FRONTEND_URL}/orders/${orderId}"
         style="display:inline-block;padding:14px 48px;background:transparent;color:${COLORS.white};text-decoration:none;font-size:10px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;border:1px solid ${COLORS.crimson};">
        View Order
      </a>
    </div>
  `

  const html = emailWrapper(content)

  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: `${info.headline} — Order #${orderRef}`,
    html,
  })
}

// ─────────────────────────────────────────────
// 3. ABANDONED CART
// ─────────────────────────────────────────────
export async function sendAbandonedCart(params: {
  to: string
  customerName: string
  items: {
    productName: string
    color: string
    size: string
    price: number
    image?: string
  }[]
  cartTotal: number
}) {
  const { to, customerName, items, cartTotal } = params
  const firstName = customerName.split(' ')[0]

  const itemRows = items.slice(0, 3).map(item => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid ${COLORS.border};">
        <table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:56px;vertical-align:top;padding-right:16px;">
              ${item.image
                ? `<img src="${item.image}" width="56" style="width:56px;height:72px;object-fit:cover;display:block;background:${COLORS.surface};border:1px solid ${COLORS.border};"/>`
                : `<div style="width:56px;height:72px;background:${COLORS.surface};border:1px solid ${COLORS.border};"></div>`
              }
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:${COLORS.white};">${item.productName}</p>
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.muted};">${item.color} / ${item.size}</p>
              <p style="margin:0;font-size:13px;color:${COLORS.light};">R${item.price.toFixed(2)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const content = `
    ${sectionHeader('Left Behind', `Still Waiting, ${firstName}`)}

    <p style="font-size:13px;color:${COLORS.muted};line-height:1.9;margin:0 0 24px;letter-spacing:0.03em;">
      You left some pieces in your cart. They're holding for you — but stock is limited and we can't guarantee availability.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tbody>${itemRows}</tbody>
    </table>

    ${items.length > 3 ? `
      <p style="font-size:11px;color:${COLORS.subtle};margin:0 0 20px;letter-spacing:0.1em;text-transform:uppercase;">
        + ${items.length - 3} more item${items.length - 3 > 1 ? 's' : ''} in your cart
      </p>
    ` : ''}

    <div style="background:${COLORS.surface};border:1px solid ${COLORS.border};padding:16px 20px;margin-bottom:32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:12px;color:${COLORS.muted};letter-spacing:0.1em;text-transform:uppercase;">Cart Total</td>
          <td style="font-size:15px;font-weight:600;color:${COLORS.white};text-align:right;font-family:Georgia,'Times New Roman',serif;font-style:italic;">R${cartTotal.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    ${crimsonDivider}

    <div style="text-align:center;margin-bottom:20px;">
      <a href="${process.env.FRONTEND_URL}/cart"
         style="display:inline-block;padding:14px 48px;background:${COLORS.crimson};color:${COLORS.white};text-decoration:none;font-size:10px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;border:1px solid ${COLORS.crimson};">
        Complete Your Order
      </a>
    </div>

    <p style="text-align:center;margin:0;font-size:11px;color:${COLORS.subtle};">
      <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color:${COLORS.subtle};text-decoration:none;letter-spacing:0.1em;">Unsubscribe</a>
    </p>
  `

  const html = emailWrapper(content)

  await getResend().emails.send({
    from: getFrom(),
    to,
    subject: `You left something behind — FLAWS`,
    html,
  })
}

// ─────────────────────────────────────────────
// 4. WAITLIST CONFIRMATION
// ─────────────────────────────────────────────
export async function sendWaitlistConfirmation(params: {
  to: string
  customerName: string
}) {
  const { to, customerName } = params
  const firstName = customerName.split(' ')[0]

  const content = `
    ${sectionHeader("You're In", `Welcome to the List, ${firstName}`)}

    <p style="font-size:13px;color:${COLORS.muted};line-height:2;margin:0 0 16px;letter-spacing:0.03em;">
      You're now on the FLAWS waitlist. When we launch, you'll be among the first to know — early access, exclusive drops, and member-only pricing before anyone else.
    </p>

    <p style="font-size:13px;color:${COLORS.muted};line-height:2;margin:0 0 32px;letter-spacing:0.03em;">
      We'll be in touch. Until then, stay tuned.
    </p>

    ${crimsonDivider}

    <div style="background:${COLORS.surface};border:1px solid ${COLORS.borderAccent};padding:20px 24px;margin-bottom:8px;text-align:center;">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${COLORS.crimsonLight};">What to Expect</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="padding:8px 12px;text-align:center;border-right:1px solid ${COLORS.border};">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.white};">Early Access</p>
            <p style="margin:0;font-size:11px;color:${COLORS.muted};">Before the world</p>
          </td>
          <td style="padding:8px 12px;text-align:center;border-right:1px solid ${COLORS.border};">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.white};">Exclusive Drops</p>
            <p style="margin:0;font-size:11px;color:${COLORS.muted};">Members only</p>
          </td>
          <td style="padding:8px 12px;text-align:center;">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.white};">Member Pricing</p>
            <p style="margin:0;font-size:11px;color:${COLORS.muted};">Your reward</p>
          </td>
        </tr>
      </table>
    </div>
  `

  const html = emailWrapper(content)

  try {
    const result = await getResend().emails.send({
      from: getFrom(),
      to,
      subject: `You're on the list — FLAWS`,
      html,
    })
    console.log('✅ Waitlist confirmation sent:', result)
  } catch (err) {
    console.error('❌ sendWaitlistConfirmation failed:', err)
    throw err
  }
}