"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetWaitlist = adminGetWaitlist;
exports.adminToggleWaitlistMode = adminToggleWaitlistMode;
exports.adminExportWaitlistCSV = adminExportWaitlistCSV;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const layout_1 = require("../views/layout");
async function adminGetWaitlist(req, res) {
    const [entries, waitlistModeSetting] = await Promise.all([
        prisma_1.default.waitlistEntry.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma_1.default.siteContent.findUnique({ where: { key: 'waitlist_mode' } }),
    ]);
    const waitlistMode = waitlistModeSetting?.value !== 'false';
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekCount = entries.filter(e => new Date(e.createdAt) >= oneWeekAgo).length;
    const rows = entries.map(e => `
    <tr>
      <td><strong>${e.name}</strong></td>
      <td style="color:#888;">${e.email}</td>
      <td>${e.city},</td>
      <td style="color:#555;font-size:0.7rem;">${new Date(e.createdAt).toLocaleDateString('en-ZA')}</td>
    </tr>
  `).join('');
    const body = `
    <div class="page-header">
      <span class="page-title">Waitlist</span>
      <a href="/admin/waitlist/export" class="btn btn-secondary">↓ Export CSV</a>
    </div>
 
    <!-- Waitlist Mode Toggle -->
    <div style="
      display:flex;justify-content:space-between;align-items:center;
      padding:1.25rem 1.5rem;
      background:#111;border:1px solid ${waitlistMode ? '#4fc3f733' : '#1a1a1a'};
      margin-bottom:1.5rem;
    ">
      <div>
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:0.35rem;">
          Waitlist Mode
        </div>
        <div style="font-size:0.8rem;color:${waitlistMode ? '#4fc3f7' : '#555'};">
          ${waitlistMode
        ? 'Site is showing the waitlist page to all visitors'
        : 'Site is fully live — showing the store'}
        </div>
      </div>
      <form method="POST" action="/admin/waitlist/toggle">
        <button type="submit" style="
          padding:0.75rem 1.5rem;
          background:${waitlistMode ? '#ffffff' : 'none'};
          color:${waitlistMode ? '#0a0a0a' : '#888'};
          border:1px solid ${waitlistMode ? '#ffffff' : '#333'};
          font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;
          font-weight:600;cursor:pointer;font-family:inherit;
          transition:all 0.2s;
        ">
          ${waitlistMode ? 'Launch Site' : '⏸ Enable Waitlist'}
        </button>
      </form>
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
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `}
    </div>
  `;
    res.send((0, layout_1.layout)('Waitlist', body, 'waitlist'));
}
async function adminToggleWaitlistMode(req, res) {
    const current = await prisma_1.default.siteContent.findUnique({
        where: { key: 'waitlist_mode' },
    });
    const newValue = current?.value === 'false' ? 'true' : 'false';
    await prisma_1.default.siteContent.upsert({
        where: { key: 'waitlist_mode' },
        update: { value: newValue },
        create: { key: 'waitlist_mode', value: newValue },
    });
    res.redirect('/admin/waitlist');
}
async function adminExportWaitlistCSV(req, res) {
    const entries = await prisma_1.default.waitlistEntry.findMany({
        orderBy: { createdAt: 'desc' },
    });
    const header = 'Name,Email,City,Joined\n';
    const rows = entries.map(e => `"${e.name}","${e.email}","${e.city}","${new Date(e.createdAt).toLocaleDateString('en-ZA')}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="flaws-waitlist.csv"');
    res.send(header + rows);
}
