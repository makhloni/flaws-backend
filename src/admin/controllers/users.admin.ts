import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import { layout } from '../views/layout'

export async function getUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { orders: true } } },
  })

  const rows = users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td style="color:#888;">${u.email}</td>
      <td style="color:#888;">${u.phone || '—'}</td>
      <td>${u._count.orders}</td>
      <td style="color:#888;font-size:0.7rem;">${new Date(u.createdAt).toLocaleDateString('en-ZA')}</td>
    </tr>
  `).join('')

  const body = `
    <div class="page-header">
      <span class="page-title">Customers</span>
      <span style="font-size:0.75rem;color:#888;">${users.length} total</span>
    </div>
    <div class="card">
      ${users.length === 0 ? '<div class="empty-state">No customers yet</div>' : `
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Joined</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `}
    </div>
  `
  res.send(layout('Customers', body, 'users'))
}