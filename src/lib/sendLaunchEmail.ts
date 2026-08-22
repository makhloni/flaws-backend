import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { COLORS, emailWrapper, sectionHeader, crimsonDivider } from './emailDesign'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
function getFrom() {
  return `FLAWS <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`
}

interface WaitlistRow {
  email: string
  name?: string
}

function buildLaunchHtml(firstName?: string): string {
  const content = `
    ${sectionHeader('We Are Live', firstName ? `It's Time, ${firstName}` : "It's Time")}

    <p style="font-size:13px;color:${COLORS.muted};line-height:1.9;margin:0 0 28px;letter-spacing:0.03em;">
      The wait is over. FLAWS is officially open — the full collection is live and ready to shop.
    </p>

    <p style="font-size:13px;color:${COLORS.muted};line-height:1.9;margin:0 0 36px;letter-spacing:0.03em;">
      You were on the list from the start, so this is your first look before anyone else.
    </p>

    ${crimsonDivider}

    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://flawswrldwide.com"
         style="display:inline-block;padding:14px 48px;background:${COLORS.crimson};color:${COLORS.white};text-decoration:none;font-size:10px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;border:1px solid ${COLORS.crimson};">
        Shop The Collection
      </a>
    </div>
  `
  return emailWrapper(content)
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function sendLaunchEmails(testEmail?: string) {
  const csvPath = path.join(__dirname, '../../src/data/flaws-waitlist.csv')
  console.log('Reading CSV from:', csvPath)

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  console.log('CSV content:', csvContent.slice(0, 200))

  const records: WaitlistRow[] = testEmail
    ? [{ email: testEmail, name: 'Andile' }]
    : parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })

  console.log('Records to send:', records)

  const batches = chunk(records, 100)

  for (const batch of batches) {
    const emails = batch.map((r) => ({
  from: getFrom(),
  to: r.email,
  subject: "FLAWS is open — you're first",
  html: buildLaunchHtml(r.name?.split(' ')[0]),
  text: `Hi${r.name ? ` ${r.name.split(' ')[0]}` : ''},\n\nThe wait is over. FLAWS is officially open — the full collection is live.\n\nShop now: https://flawswrldwide.com\n\nFLAWS. South Africa.\nsupport@flaws.co.za`,
}))

    try {
      const { data, error } = await getResend().batch.send(emails)
      if (error) {
        console.error('Batch failed:', error)
      } else {
        console.log(`Sent batch of ${emails.length}`, data)
      }
    } catch (err) {
      console.error('Batch send error:', err)
      throw err
    }

    await new Promise((res) => setTimeout(res, 1000))
  }
}

export { sendLaunchEmails }