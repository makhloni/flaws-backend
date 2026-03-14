"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderConfirmation = sendOrderConfirmation;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
async function sendOrderConfirmation(params) {
    const { to, customerName, orderId, items, subtotal, shipping, total, address, } = params;
    const orderRef = orderId.slice(0, 8).toUpperCase();
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
  `).join('');
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

        <!-- Logo -->
        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.4em;text-transform:uppercase;color:#ffffff;">
            FLAWS
          </h1>
        </div>

        <!-- Header -->
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

        <!-- Items -->
        <div style="margin-bottom:32px;">
          <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888888;">
            Your Order
          </p>
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${itemRows}</tbody>
          </table>
        </div>

        <!-- Totals -->
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

        <!-- Delivery Address -->
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

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:40px;">
          <a href="${process.env.FRONTEND_URL}/orders/${orderId}"
             style="display:inline-block;padding:14px 40px;background:#ffffff;color:#0a0a0a;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">
            Track Your Order
          </a>
        </div>

        <!-- Footer -->
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
  `;
    await resend.emails.send({
        from: `${process.env.RESEND_FROM_NAME || 'FLAWS'} <${process.env.RESEND_FROM_EMAIL || 'orders@resend.dev'}>`,
        to,
        subject: `Order Confirmed — #${orderRef}`,
        html,
    });
}
