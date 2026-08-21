import { COLORS, emailWrapper, sectionHeader, crimsonDivider } from './emailDesign'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
function getFrom() {
  return `FLAWS <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`
}

export async function sendWaitlistConfirmation(params: {
  to: string
  customerName: string
}) {
  const { to, customerName } = params
  const firstName = customerName.split(' ')[0]

  const content = `
    ${sectionHeader("You're In", `Welcome to the List, ${firstName}`)}

    <p style="font-size:13px;color:${COLORS.muted};line-height:2;margin:0 0 20px;letter-spacing:0.03em;">
      You're now on the FLAWS waitlist. When we launch, you'll be among the first to know — early access, exclusive drops, and member-only pricing before anyone else.
    </p>

    <p style="font-size:13px;color:${COLORS.muted};line-height:2;margin:0 0 36px;letter-spacing:0.03em;">
      We'll be in touch. Until then, stay tuned.
    </p>

    ${crimsonDivider}

    <div style="background:${COLORS.surface};border:1px solid ${COLORS.borderAccent};padding:24px 26px;margin-bottom:8px;text-align:center;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${COLORS.crimsonLight};">What to Expect</p>
      <table style="width:100%;border-collapse:collapse;margin-top:18px;">
        <tr>
          <td style="padding:10px 14px;text-align:center;border-right:1px solid ${COLORS.border};">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.white};">Early Access</p>
            <p style="margin:0;font-size:11px;color:${COLORS.muted};">Before the world</p>
          </td>
          <td style="padding:10px 14px;text-align:center;border-right:1px solid ${COLORS.border};">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.white};">Exclusive Drops</p>
            <p style="margin:0;font-size:11px;color:${COLORS.muted};">Members only</p>
          </td>
          <td style="padding:10px 14px;text-align:center;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.white};">Member Pricing</p>
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
    console.log('Waitlist confirmation sent:', result)
  } catch (err) {
    console.error('sendWaitlistConfirmation failed:', err)
    throw err
  }
}