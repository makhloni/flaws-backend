
const RED = '#C1272D'
const LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://flawswrldwide.com/flaws-logo.png'

export const COLORS = {
  bg: '#080808',
  surface: '#0f0f0f',
  border: '#1c1c1c',
  borderAccent: `${RED}33`,
  crimson: RED,
  crimsonLight: RED,
  crimsonGlow: `${RED}22`,
  white: '#ffffff',
  muted: '#777777',
  subtle: '#444444',
  light: '#cccccc',
}

export const logoHeader = `
  <div style="text-align:center;padding:44px 0 36px;">
    <img src="${LOGO_URL}" alt="FLAWS" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;"/>
    <div style="width:40px;height:1px;background:${RED};margin:20px auto 0;"></div>
  </div>
`

export const footer = `
  <div style="padding:36px 0 0;text-align:center;border-top:1px solid ${COLORS.border};">
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:${COLORS.subtle};letter-spacing:0.1em;">
       FLAWS. South Africa.
    </p>
    <p style="margin:10px 0 0;font-size:11px;color:${COLORS.subtle};letter-spacing:0.05em;">
      Questions? <a href="mailto:support@flaws.co.za" style="color:${COLORS.crimsonLight};text-decoration:none;">support@flaws.co.za</a>
    </p>
  </div>
`

export function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <meta name="color-scheme" content="dark"/>
    </head>
    <body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
      <div style="max-width:560px;margin:0 auto;padding:0 24px 56px;">
        ${logoHeader}
        ${content}
        ${footer}
      </div>
    </body>
    </html>
  `
}

export function sectionHeader(eyebrow: string, headline: string, sub?: string): string {
  return `
    <div style="text-align:center;padding:32px 0;margin-bottom:32px;border-top:1px solid ${COLORS.borderAccent};border-bottom:1px solid ${COLORS.borderAccent};">
      <p style="margin:0 0 12px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${COLORS.crimsonLight};">${eyebrow}</p>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-style:italic;font-weight:400;letter-spacing:0.06em;color:${COLORS.white};">${headline}</p>
      ${sub ? `<p style="margin:12px 0 0;font-size:12px;color:${COLORS.muted};letter-spacing:0.12em;text-transform:uppercase;">${sub}</p>` : ''}
    </div>
  `
}

export const crimsonDivider = `
  <div style="width:80px;height:1px;background:${RED};margin:28px auto;"></div>
`