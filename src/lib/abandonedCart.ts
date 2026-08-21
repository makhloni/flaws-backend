import { COLORS, emailWrapper, sectionHeader, crimsonDivider } from './emailDesign'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
function getFrom() {
  return `FLAWS <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`
}

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
      <td style="padding:18px 0;border-bottom:1px solid ${COLORS.border};">
        <table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:56px;vertical-align:top;padding-right:18px;">
              ${item.image
                ? `<img src="${item.image}" width="56" style="width:56px;height:72px;object-fit:cover;display:block;background:${COLORS.surface};border:1px solid ${COLORS.border};"/>`
                : `<div style="width:56px;height:72px;background:${COLORS.surface};border:1px solid ${COLORS.border};"></div>`
              }
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:${COLORS.white};">${item.productName}</p>
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.muted};">${item.color} / ${item.size}</p>
              <p style="margin:0;font-size:13px;color:${COLORS.light};">R${item.price.toFixed(2)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const content = `
    ${sectionHeader('Left Behind', `Still Waiting, ${firstName}`)}

    <p style="font-size:13px;color:${COLORS.muted};line-height:1.9;margin:0 0 28px;letter-spacing:0.03em;">
      You left some pieces in your cart. They're holding for you — but stock is limited and we can't guarantee availability.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tbody>${itemRows}</tbody>
    </table>

    ${items.length > 3 ? `
      <p style="font-size:11px;color:${COLORS.subtle};margin:0 0 24px;letter-spacing:0.1em;text-transform:uppercase;">
        + ${items.length - 3} more item${items.length - 3 > 1 ? 's' : ''} in your cart
      </p>
    ` : ''}

    <div style="background:${COLORS.surface};border:1px solid ${COLORS.border};padding:20px 24px;margin-bottom:36px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:12px;color:${COLORS.muted};letter-spacing:0.1em;text-transform:uppercase;">Cart Total</td>
          <td style="font-size:15px;font-weight:600;color:${COLORS.white};text-align:right;font-family:Georgia,'Times New Roman',serif;font-style:italic;">R${cartTotal.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    ${crimsonDivider}

    <div style="text-align:center;margin-bottom:24px;">
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