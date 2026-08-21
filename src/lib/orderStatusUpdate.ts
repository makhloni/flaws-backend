import { COLORS, emailWrapper, sectionHeader, crimsonDivider } from './emailDesign'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
function getFrom() {
  return `FLAWS <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`
}

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

    <div style="background:${COLORS.surface};border:1px solid ${COLORS.border};border-left:2px solid ${COLORS.crimson};padding:24px 26px;margin-bottom:32px;">
      <p style="margin:0;font-size:13px;color:${COLORS.light};line-height:1.9;">
        Hi ${firstName}, ${info.message}
      </p>
      ${trackingNumber ? `
        <div style="margin-top:22px;padding-top:18px;border-top:1px solid ${COLORS.border};">
          <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${COLORS.crimsonLight};">Tracking Number</p>
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