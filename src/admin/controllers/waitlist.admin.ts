import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import { layout } from '../views/layout'

export async function adminGetWaitlist(req: Request, res: Response) {
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const weekCount = entries.filter(e => new Date(e.createdAt) >= oneWeekAgo).length

  const rows = entries.map(e => `
    <tr>
      <td><strong>${e.name}</strong></td>
      <td style="color:#888;">${e.email}</td>
      <td>${e.city}, ${e.province}</td>
      <td>
        ${(e.interests || []).map(i =>
          `<span style="display:inline-block;padding:0.2rem 0.6rem;border:1px solid #222;font-size:0.55rem;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin:0.1rem;">${i}</span>`
        ).join('')}
      </td>
      <td style="color:#555;font-size:0.7rem;">${new Date(e.createdAt).toLocaleDateString('en-ZA')}</td>
    </tr>
  `).join('')

  const body = `
    <div class="page-header">
      <span class="page-title">Waitlist</span>
      <a href="/admin/waitlist/export" class="btn btn-secondary">↓ Export CSV</a>
    </div>

    <div class="card-grid" style="margin-bottom:1.5rem;">
      <div class="card">
        <div class="stat-label">Total Signups</div>
        <div class="stat-value">${entries.length}</div>
      </div>
      <div class="card">
        <div class="stat-label">This Week</div>
        <div class="stat-value">${weekCount}</div>
      </div>
    </div>

    <div class="card">
      ${entries.length === 0
        ? '<div class="empty-state">No signups yet. Share the link.</div>'
        : `
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Interests</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `
      }
    </div>
  `

  res.send(layout('Waitlist', body, 'waitlist'))
}

export async function adminExportWaitlistCSV(req: Request, res: Response) {
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const header = 'Name,Email,City,Province,Interests,Joined\n'
  const rows = entries.map(e =>
    `"${e.name}","${e.email}","${e.city}","${e.province}","${e.interests.join('|')}","${new Date(e.createdAt).toLocaleDateString('en-ZA')}"`
  ).join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="flaws-waitlist.csv"')
  res.send(header + rows)
}