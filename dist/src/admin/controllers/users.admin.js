"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const layout_1 = require("../views/layout");
async function getUsers(req, res) {
    const users = await prisma_1.default.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { orders: true } } },
    });
    const rows = users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td style="color:#888;">${u.email}</td>
      <td style="color:#888;">${u.phone || '—'}</td>
      <td>${u._count.orders}</td>
      <td style="color:#888;font-size:0.7rem;">${new Date(u.createdAt).toLocaleDateString('en-ZA')}</td>
    </tr>
  `).join('');
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
  `;
    res.send((0, layout_1.layout)('Customers', body, 'users'));
}
