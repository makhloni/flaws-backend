"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layout = layout;
exports.loginLayout = loginLayout;
function layout(title, body, activePage = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — FLAWS Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    a { color: inherit; text-decoration: none; }
    input, select, textarea, button { font-family: inherit; }

    .sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 220px; background: #0f0f0f; border-right: 1px solid #1a1a1a;
      display: flex; flex-direction: column; padding: 2rem 0;
      z-index: 100;
    }
    .sidebar-logo {
      font-size: 1rem; font-weight: 900; letter-spacing: 0.4em;
      text-transform: uppercase; padding: 0 1.5rem 2rem;
      border-bottom: 1px solid #1a1a1a; margin-bottom: 1.5rem;
    }
    .sidebar-logo span { font-size: 0.55rem; display: block; letter-spacing: 0.2em; color: #888; margin-top: 4px; text-transform: uppercase; }
    .nav-link {
      display: block; padding: 0.75rem 1.5rem;
      font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase;
      color: #888; transition: all 0.2s; border-left: 2px solid transparent;
    }
    .nav-link:hover { color: #fff; background: #111; }
    .nav-link.active { color: #fff; border-left-color: #fff; background: #111; }
    .nav-section { font-size: 0.55rem; letter-spacing: 0.2em; text-transform: uppercase; color: #444; padding: 1rem 1.5rem 0.5rem; margin-top: 0.5rem; }
    .sidebar-footer { margin-top: auto; padding: 1.5rem; border-top: 1px solid #1a1a1a; }
    .logout-btn {
      display: block; width: 100%; padding: 0.75rem;
      background: none; border: 1px solid #333; color: #888;
      font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
      cursor: pointer; text-align: center;
    }
    .logout-btn:hover { border-color: #fff; color: #fff; }

    .main { margin-left: 220px; min-height: 100vh; }
    .topbar {
      height: 60px; border-bottom: 1px solid #1a1a1a;
      display: flex; align-items: center; padding: 0 2rem;
      justify-content: space-between; background: #0a0a0a;
      position: sticky; top: 0; z-index: 50;
    }
    .topbar-title { font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; }
    .content { padding: 2rem; }

    .card { background: #111; border: 1px solid #1a1a1a; padding: 1.5rem; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-label { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.75rem; font-weight: 700; }
    .stat-sub { font-size: 0.7rem; color: #888; margin-top: 0.25rem; }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title { font-size: 1.25rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }

    .btn { display: inline-block; padding: 0.75rem 1.5rem; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: #fff; color: #0a0a0a; }
    .btn-primary:hover { background: #ddd; }
    .btn-secondary { background: none; border: 1px solid #333; color: #888; }
    .btn-secondary:hover { border-color: #fff; color: #fff; }
    .btn-danger { background: none; border: 1px solid #ff6b6b; color: #ff6b6b; }
    .btn-danger:hover { background: #ff6b6b; color: #fff; }
    .btn-sm { padding: 0.4rem 0.9rem; font-size: 0.6rem; }

    table { width: 100%; border-collapse: collapse; }
    th { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: #888; padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #1a1a1a; }
    td { font-size: 0.8rem; padding: 1rem; border-bottom: 1px solid #111; vertical-align: middle; }
    tr:hover td { background: #111; }

    .badge { display: inline-block; padding: 3px 10px; font-size: 0.55rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; }
    .badge-pending { background: #2a2a00; color: #ffeb3b; }
    .badge-confirmed { background: #001a2a; color: #4fc3f7; }
    .badge-processing { background: #1a001a; color: #ce93d8; }
    .badge-shipped { background: #001a00; color: #81c784; }
    .badge-delivered { background: #003300; color: #a5d6a7; }
    .badge-cancelled { background: #1a0000; color: #ef9a9a; }

    .form-group { margin-bottom: 1.25rem; }
    .form-label { display: block; font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: #888; margin-bottom: 0.5rem; }
    .form-input { width: 100%; padding: 0.8rem 1rem; background: #0a0a0a; border: 1px solid #1a1a1a; color: #fff; font-size: 0.85rem; outline: none; }
    .form-input:focus { border-color: #444; }
    .form-select { width: 100%; padding: 0.8rem 1rem; background: #0a0a0a; border: 1px solid #1a1a1a; color: #fff; font-size: 0.85rem; outline: none; appearance: none; }
    .form-textarea { width: 100%; padding: 0.8rem 1rem; background: #0a0a0a; border: 1px solid #1a1a1a; color: #fff; font-size: 0.85rem; outline: none; resize: vertical; min-height: 100px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }

    .alert { padding: 0.75rem 1rem; font-size: 0.75rem; margin-bottom: 1.5rem; }
    .alert-error { background: #1a0000; border: 1px solid #ff6b6b; color: #ff6b6b; }
    .alert-success { background: #001a00; border: 1px solid #81c784; color: #81c784; }

    .img-thumb { width: 48px; height: 48px; object-fit: cover; background: #1a1a1a; }
    .img-thumb-lg { width: 80px; height: 100px; object-fit: cover; background: #1a1a1a; }

    .tabs { display: flex; gap: 0; border-bottom: 1px solid #1a1a1a; margin-bottom: 2rem; }
    .tab { padding: 0.75rem 1.5rem; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: #888; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; background: none; border-top: none; border-left: none; border-right: none; }
    .tab.active { color: #fff; border-bottom-color: #fff; }

    .empty-state { text-align: center; padding: 4rem; color: #888; font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="sidebar-logo">FLAWS <span>Admin Panel</span></div>
    <div class="nav-section">Overview</div>
    <a href="/admin" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
    <div class="nav-section">Catalogue</div>
    <a href="/admin/products" class="nav-link ${activePage === 'products' ? 'active' : ''}">Products</a>
    <a href="/admin/collections" class="nav-link ${activePage === 'collections' ? 'active' : ''}">Collections</a>
    <div class="nav-section">Commerce</div>
    <a href="/admin/orders" class="nav-link ${activePage === 'orders' ? 'active' : ''}">Orders</a>
    <a href="/admin/users" class="nav-link ${activePage === 'users' ? 'active' : ''}">Users</a>
    <div class="nav-section">Content</div>
    a href="/admin/homepage" class="nav-link ${activePage === 'homepage' ? 'active' : ''}">Homepage</a>
    <a href="/admin/activity" class="nav-link ${activePage === 'activity' ? 'active' : ''}">Activity Log</a>
    <div class="sidebar-footer">
      <form action="/admin/logout" method="POST">
        <button type="submit" class="logout-btn">Sign Out</button>
      </form>
    </div>
  </div>
  <div class="main">
    <div class="topbar">
      <span class="topbar-title">${title}</span>
    </div>
    <div class="content">${body}</div>
  </div>
</body>
</html>`;
}
function loginLayout(body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Login — FLAWS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #fff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .form-input { width: 100%; padding: 0.9rem 1rem; background: #111; border: 1px solid #1a1a1a; color: #fff; font-size: 0.85rem; outline: none; margin-bottom: 1rem; font-family: inherit; }
    .form-label { display: block; font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: #888; margin-bottom: 0.5rem; }
    .btn-primary { width: 100%; padding: 1rem; background: #fff; color: #0a0a0a; border: none; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; cursor: pointer; font-family: inherit; }
    .alert-error { padding: 0.75rem 1rem; font-size: 0.75rem; margin-bottom: 1.5rem; background: #1a0000; border: 1px solid #ff6b6b; color: #ff6b6b; }
  </style>
</head>
<body>${body}</body>
</html>`;
}
