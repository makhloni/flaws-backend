"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const layout_1 = require("../views/layout");
async function getDashboard(req, res) {
    const [totalOrders, totalUsers, totalProducts, recentOrders, revenue] = await Promise.all([
        prisma_1.default.order.count(),
        prisma_1.default.user.count(),
        prisma_1.default.product.count(),
        prisma_1.default.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: true, items: true },
        }),
        prisma_1.default.order.aggregate({
            _sum: { total: true },
            where: { status: { not: 'CANCELLED' } },
        }),
    ]);
    const totalRevenue = Number(revenue._sum.total || 0).toFixed(2);
    const recentRows = recentOrders.map(o => `
    <tr>
      <td style="color:#888;font-size:0.7rem;">#${o.id.slice(0, 8).toUpperCase()}</td>
      <td>${o.user.name}</td>
      <td>R${Number(o.total).toFixed(2)}</td>
      <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
      <td style="color:#888;font-size:0.7rem;">${new Date(o.createdAt).toLocaleDateString('en-ZA')}</td>
      <td><a href="/admin/orders/${o.id}" class="btn btn-sm btn-secondary">View</a></td>
    </tr>
  `).join('');
    const body = `
    <div class="card-grid">
      <div class="card">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value">R${totalRevenue}</div>
        <div class="stat-sub">Excluding cancelled</div>
      </div>
      <div class="card">
        <div class="stat-label">Total Orders</div>
        <div class="stat-value">${totalOrders}</div>
      </div>
      <div class="card">
        <div class="stat-label">Customers</div>
        <div class="stat-value">${totalUsers}</div>
      </div>
      <div class="card">
        <div class="stat-label">Products</div>
        <div class="stat-value">${totalProducts}</div>
      </div>
    </div>

    <div class="card">
      <div class="page-header" style="margin-bottom:1.5rem;">
        <span style="font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Recent Orders</span>
        <a href="/admin/orders" class="btn btn-sm btn-secondary">View All</a>
      </div>
      ${recentOrders.length === 0 ? '<div class="empty-state">No orders yet</div>' : `
        <table>
          <thead><tr>
            <th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th></th>
          </tr></thead>
          <tbody>${recentRows}</tbody>
        </table>
      `}
    </div>
  `;
    res.send((0, layout_1.layout)('Dashboard', body, 'dashboard'));
}
