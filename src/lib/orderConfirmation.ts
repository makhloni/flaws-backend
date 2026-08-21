import { Resend } from 'resend'
import { COLORS, emailWrapper, sectionHeader, crimsonDivider } from './emailDesign'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
function getFrom() {
  return `FLAWS <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`
}

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

export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  const { to, customerName, orderId, items, subtotal, shipping, total, address } = params
  const orderRef = orderId.slice(0, 8).toUpperCase()
  const firstName = customerName.split(' ')[0]

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid ${COLORS.border};">
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:${COLORS.white};letter-spacing:0.03em;">
          ${item.productName}
        </p>
        <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${COLORS.muted};">
          ${item.color} &nbsp;/&nbsp; ${item.size} &nbsp;×&nbsp; ${item.quantity}
        </p>
      </td>
      <td style="padding:16px 0;border-bottom:1px solid ${COLORS.border};text-align:right;font-size:13px;color:${COLORS.light};letter-spacing:0.05em;">
        R${(item.unitPrice * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  const content = `
    ${sectionHeader('Order Confirmed', `Thank you, ${firstName}`, `Order #${orderRef}`)}

    <p style="font-size:13px;color:${COLORS.muted};line-height:1.9;margin:0 0 32px;letter-spacing:0.03em;">
      We've received your order and it's being prepared with care. You'll receive a shipping update as soon as it's on its way.
    </p>

    <div style="margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${COLORS.crimsonLight};">Your Order</p>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <div style="background:${COLORS.surface};border:1px solid ${COLORS.border};padding:20px 24px;margin-bottom:32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;font-size:12px;color:${COLORS.muted};letter-spacing:0.08em;">Subtotal</td>
          <td style="padding:6px 0;font-size:12px;color:${COLORS.muted};text-align:right;">R${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:${COLORS.muted};letter-spacing:0.08em;">Shipping</td>
          <td style="padding:6px 0;font-size:12px;color:${COLORS.muted};text-align:right;">${shipping === 0 ? 'Free' : `R${shipping.toFixed(2)}`}</td>
        </tr>
        <tr>
          <td style="padding:14px 0 0;font-size:14px;font-weight:600;color:${COLORS.white};letter-spacing:0.08em;border-top:1px solid ${COLORS.border};">Total</td>
          <td style="padding:14px 0 0;font-size:14px;font-weight:600;color:${COLORS.white};text-align:right;border-top:1px solid ${COLORS.border};">R${total.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom:36px;">
      <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${COLORS.crimsonLight};">Delivery Address</p>
      <div style="border-left:2px solid ${COLORS.crimson};padding-left:18px;">
        <p style="margin:0;font-size:13px;color:${COLORS.light};line-height:2;">
          ${address.fullName}<br/>
          ${address.street}<br/>
          ${address.city}, ${address.province} ${address.postalCode}<br/>
          ${address.country}
        </p>
      </div>
    </div>

    ${crimsonDivider}

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
    console.log('Order confirmation sent:', result)
  } catch (err) {
    console.error('sendOrderConfirmation failed:', err)
    throw err
  }
}