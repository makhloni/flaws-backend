import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)


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

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;">
        <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#ffffff;">
          ${item.productName}
        </p>
        <p style="margin:4px 0 0;font-size:12px;color:#888888;">
          ${item.color} / ${item.size} × ${item.quantity}
        </p>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;text-align:right;font-size:13px;color:#888888;">
        R${(item.unitPrice * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.4em;text-transform:uppercase;color:#ffffff;">
            FLAWS
          </h1>
        </div>

        <div style="border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;padding:24px 0;margin-bottom:32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#888888;">
            Order Confirmed
          </p>
          <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">
            Thank you, ${customerName.split(' ')[0]}
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#888888;letter-spacing:0.1em;">
            Order #${orderRef}
          </p>
        </div>

        <div style="margin-bottom:32px;">
          <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888888;">
            Your Order
          </p>
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${itemRows}</tbody>
          </table>
        </div>

        <div style="border-top:1px solid #1a1a1a;padding-top:16px;margin-bottom:32px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#888888;">Subtotal</td>
              <td style="padding:6px 0;font-size:13px;color:#888888;text-align:right;">R${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#888888;">Shipping</td>
              <td style="padding:6px 0;font-size:13px;color:#888888;text-align:right;">
                ${shipping === 0 ? 'Free' : `R${shipping.toFixed(2)}`}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#ffffff;">Total</td>
              <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#ffffff;text-align:right;">R${total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="background:#111111;border:1px solid #1a1a1a;padding:20px;margin-bottom:32px;">
          <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888888;">
            Delivery Address
          </p>
          <p style="margin:0;font-size:13px;color:#cccccc;line-height:1.8;">
            ${address.fullName}<br/>
            ${address.street}<br/>
            ${address.city}, ${address.province}<br/>
            ${address.postalCode}<br/>
            ${address.country}
          </p>
        </div>

        <div style="text-align:center;margin-bottom:40px;">
          <a href="${process.env.FRONTEND_URL}/orders/${orderId}"
             style="display:inline-block;padding:14px 40px;background:#ffffff;color:#0a0a0a;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">
            Track Your Order
          </a>
        </div>

        <div style="border-top:1px solid #1a1a1a;padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#555555;letter-spacing:0.1em;">
            © 2026 FLAWS. South Africa.
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:#555555;">
            Questions? Reply to this email or contact us.
          </p>
        </div>

      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'FLAWS <orders@yourdomain.com>',
    to,
    subject: `Order Confirmed — #${orderRef}`,
    html,
  })
}

export async function sendOrderStatusUpdate(params: {
  to: string
  customerName: string
  orderId: string
  status: string
  trackingNumber?: string
}) {
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('Sending to:', params.to)
  console.log('From:', process.env.RESEND_FROM_EMAIL)

  try {
    const result = await resend.emails.send({
      from: 'FLAWS <${process.env.RESEND_FROM_EMAIL}>',
      to: params.to,
      subject: `Order Update — #${params.orderId.slice(0, 8).toUpperCase()}`,
      html: '<p>Test</p>',
    })
    console.log('Resend result:', JSON.stringify(result))
  } catch (err) {
    console.error('Resend error:', err)
  }
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

  const itemRows = items.slice(0, 3).map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${item.image ? `<img src="${item.image}" style="width:50px;height:65px;object-fit:cover;background:#111;" />` : '<div style="width:50px;height:65px;background:#111;"></div>'}
          <div>
            <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#ffffff;">${item.productName}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#888888;">${item.color} / ${item.size}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#888888;">R${item.price.toFixed(2)}</p>
          </div>
        </div>
      </td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
    <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.4em;text-transform:uppercase;color:#ffffff;">FLAWS</h1>
        </div>

        <div style="border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;padding:24px 0;margin-bottom:32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#888888;">You left something behind</p>
          <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">
            Your Cart Misses You
          </p>
        </div>

        <p style="font-size:14px;color:#888888;line-height:1.8;margin-bottom:24px;">
          Hi ${customerName.split(' ')[0]}, you left some items in your cart. They're still waiting for you — but stock is limited.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tbody>${itemRows}</tbody>
        </table>

        ${items.length > 3 ? `<p style="font-size:12px;color:#555;margin-bottom:24px;">+ ${items.length - 3} more item${items.length - 3 > 1 ? 's' : ''} in your cart</p>` : ''}

        <div style="border-top:1px solid #1a1a1a;padding-top:16px;margin-bottom:32px;display:flex;justify-content:space-between;">
          <span style="font-size:14px;color:#888888;">Cart Total</span>
          <span style="font-size:14px;font-weight:700;color:#ffffff;">R${cartTotal.toFixed(2)}</span>
        </div>

        <div style="text-align:center;margin-bottom:40px;">
          <a href="${process.env.FRONTEND_URL}/cart"
             style="display:inline-block;padding:14px 40px;background:#ffffff;color:#0a0a0a;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">
            Complete Your Order
          </a>
        </div>

        <div style="border-top:1px solid #1a1a1a;padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#555555;">© 2026 FLAWS. South Africa.</p>
          <p style="margin:8px 0 0;font-size:11px;color:#555555;">
            <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color:#444;">Unsubscribe</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'FLAWS <onboarding@resend.dev>',
    to,
    subject: `You left something behind — Complete your FLAWS order`,
    html,
  })
}