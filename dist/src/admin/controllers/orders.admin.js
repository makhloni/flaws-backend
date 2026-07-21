"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = getOrders;
exports.getOrder = getOrder;
exports.updateOrderStatus = updateOrderStatus;
exports.bookCourierManually = bookCourierManually;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const layout_1 = require("../views/layout");
const logger_1 = require("../lib/logger");
const email_1 = require("../../lib/email");
const courierGuy_1 = require("../../lib/courierGuy");
async function getOrders(req, res) {
    const status = req.query.status;
    const orders = await prisma_1.default.order.findMany({
        where: status ? { status: status } : undefined,
        include: { user: true, items: true },
        orderBy: { createdAt: 'desc' },
    });
    const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const filterTabs = ['ALL', ...statuses].map(s => `
    <a href="/admin/orders${s === 'ALL' ? '' : '?status=' + s}"
       class="tab ${(!status && s === 'ALL') || status === s ? 'active' : ''}">
      ${s}
    </a>
  `).join('');
    const rows = orders.map(o => `
    <tr>
      <td style="color:#888;font-size:0.7rem;">#${o.id.slice(0, 8).toUpperCase()}</td>
      <td>${o.user.name}<br/><span style="color:#888;font-size:0.7rem;">${o.user.email}</span></td>
      <td>R${Number(o.total).toFixed(2)}</td>
      <td>${o.items.length} item${o.items.length !== 1 ? 's' : ''}</td>
      <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
      <td style="color:#888;font-size:0.7rem;">${new Date(o.createdAt).toLocaleDateString('en-ZA')}</td>
      <td><a href="/admin/orders/${o.id}" class="btn btn-sm btn-secondary">Manage</a></td>
    </tr>
  `).join('');
    const body = `
    <div class="page-header">
      <span class="page-title">Orders</span>
    </div>
    <div class="tabs">${filterTabs}</div>
    <div class="card">
      ${orders.length === 0 ? '<div class="empty-state">No orders found</div>' : `
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Items</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `}
    </div>
  `;
    res.send((0, layout_1.layout)('Orders', body, 'orders'));
}
async function getOrder(req, res) {
    const id = req.params.id;
    const order = await prisma_1.default.order.findUnique({
        where: { id },
        include: {
            user: true,
            address: true,
            items: {
                include: {
                    variant: {
                        include: {
                            product: { include: { images: true } },
                        },
                    },
                },
            },
        },
    });
    if (!order)
        return res.redirect('/admin/orders');
    const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const statusOptions = statuses.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('');
    const itemRows = order.items.map((item) => {
        const image = item.variant.product.images.find((i) => i.isPrimary)?.url || item.variant.product.images[0]?.url;
        return `
      <tr>
        <td>${image ? `<img src="${image}" class="img-thumb" />` : '<div class="img-thumb"></div>'}</td>
        <td>
          <strong>${item.variant.product.name}</strong><br/>
          <span style="color:#888;font-size:0.7rem;">${item.variant.color} / ${item.variant.size}</span>
        </td>
        <td>${item.quantity}</td>
        <td>R${Number(item.unitPrice).toFixed(2)}</td>
        <td>R${(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
      </tr>
    `;
    }).join('');
    const address = order.address;
    const addressHtml = address ? `
    ${address.fullName}<br/>
    ${address.street}<br/>
    ${address.city}, ${address.province}<br/>
    ${address.postalCode}, ${address.country}
  ` : 'No address';
    const body = `
    <div class="page-header">
      <span class="page-title">Order #${order.id.slice(0, 8).toUpperCase()}</span>
      <a href="/admin/orders" class="btn btn-secondary">← Back</a>
    </div>

    <div style="display:grid;grid-template-columns:1fr 320px;gap:1.5rem;align-items:start;">
      <div>
        <div class="card" style="margin-bottom:1.5rem;">
          <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1rem;">Items</div>
          <table>
            <thead><tr><th></th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>
        <div class="card">
          <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1rem;">Delivery Address</div>
          <p style="font-size:0.85rem;line-height:1.8;color:#ccc;">${addressHtml}</p>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:1rem;">
        <div class="card">
          <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1rem;">Customer</div>
          <p style="font-size:0.85rem;margin-bottom:0.25rem;">${order.user.name}</p>
          <p style="font-size:0.75rem;color:#888;">${order.user.email}</p>
        </div>

        <div class="card">
          <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1rem;">Order Total</div>
          <p style="font-size:1.5rem;font-weight:700;">R${Number(order.total).toFixed(2)}</p>
          <p style="font-size:0.7rem;color:#888;margin-top:0.25rem;">${new Date(order.createdAt).toLocaleDateString('en-ZA')}</p>
        </div>

        <div class="card">
          <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1rem;">Update Status</div>
          <form method="POST" action="/admin/orders/${order.id}/status">
            <div style="margin-bottom:1rem;">
              <label style="font-size:0.6rem;letter-spacing:0.15em;text-transform:uppercase;color:#888;display:block;margin-bottom:0.5rem;">Status</label>
              <select class="form-select" name="status" id="status-select">${statusOptions}</select>
            </div>
            <div id="tracking-field" style="margin-bottom:1rem;display:none;">
              <label style="font-size:0.6rem;letter-spacing:0.15em;text-transform:uppercase;color:#888;display:block;margin-bottom:0.5rem;">Tracking Number (optional)</label>
              <input class="form-input" type="text" name="trackingNumber" placeholder="e.g. SP123456789ZA" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;">Update Status</button>
            <p style="font-size:0.6rem;color:#555;text-align:center;margin-top:0.75rem;">Customer will be notified by email</p>
          </form>
          <script>
            const sel = document.getElementById('status-select')
            const tf = document.getElementById('tracking-field')
            function toggle() { tf.style.display = sel.value === 'SHIPPED' ? 'block' : 'none' }
            sel.addEventListener('change', toggle)
            toggle()
          </script>
        </div>
      </div>
    </div>
  `;
    res.send((0, layout_1.layout)(`Order #${order.id.slice(0, 8).toUpperCase()}`, body, 'orders'));
}
async function updateOrderStatus(req, res) {
    const id = req.params.id;
    const { status, trackingNumber } = req.body;
    const order = await prisma_1.default.order.update({
        where: { id },
        data: { status },
        include: { user: true },
    });
    try {
        await (0, email_1.sendOrderStatusUpdate)({
            to: order.user.email,
            customerName: order.user.name,
            orderId: order.id,
            status,
            trackingNumber: trackingNumber || undefined,
        });
    }
    catch (emailErr) {
        console.error('Status email failed:', emailErr);
    }
    await (0, logger_1.logActivity)('ORDER_STATUS_UPDATED', 'Order', `Order #${id.slice(0, 8).toUpperCase()} status updated to ${status}`, id);
    res.redirect(`/admin/orders/${id}`);
}
async function bookCourierManually(req, res) {
    const id = req.params.id;
    const order = await prisma_1.default.order.findUnique({
        where: { id },
        include: { address: true, user: true, items: { include: { product: true } } },
    });
    if (!order || !order.address)
        return res.redirect(`/admin/orders/${id}`);
    const shipment = await (0, courierGuy_1.createShipment)({
        orderId: order.id,
        deliveryAddress: {
            street: order.address.street,
            city: order.address.city,
            province: order.address.province,
            postalCode: order.address.postalCode,
            country: 'ZA',
        },
        deliveryContact: {
            name: order.address.fullName,
            email: order.user.email,
            mobileNumber: order.user.phone ?? undefined,
        },
        parcels: order.items.flatMap(item => Array.from({ length: item.quantity }, () => ({
            description: item.product.name,
            weightKg: 0.5,
        }))),
    });
    await prisma_1.default.order.update({
        where: { id: order.id },
        data: {
            courierWaybillId: shipment.waybillId,
            trackingNumber: shipment.trackingNumber,
            courierBookedAt: new Date(),
            courierStatus: 'BOOKED',
        },
    });
    await (0, logger_1.logActivity)('COURIER_BOOKED', 'Order', `Order #${id.slice(0, 8).toUpperCase()} booked with Courier Guy`, id);
    res.redirect(`/admin/orders/${id}`);
}
