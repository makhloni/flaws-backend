"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogin = getLogin;
exports.postLogin = postLogin;
exports.postLogout = postLogout;
function getLogin(req, res) {
    const { loginLayout } = require('../views/layout');
    const error = req.query.error || '';
    res.send(loginLayout(`
    <div style="width:100%;max-width:400px;padding:2rem;">
      <p style="font-size:1.2rem;font-weight:900;letter-spacing:0.4em;text-transform:uppercase;text-align:center;margin-bottom:3rem;">
        FLAWS <span style="display:block;font-size:0.55rem;color:#888;letter-spacing:0.2em;margin-top:4px;">Admin Panel</span>
      </p>
      ${error ? `<div class="alert-error">${error}</div>` : ''}
      <form method="POST" action="/admin/login">
        <div style="margin-bottom:1rem;">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" name="email" placeholder="admin@flaws.co.za" required />
        </div>
        <div style="margin-bottom:1.5rem;">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" name="password" placeholder="••••••••" required />
        </div>
        <button class="btn-primary" type="submit">Sign In</button>
      </form>
    </div>
  `));
}
function postLogin(req, res) {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL &&
        password === process.env.ADMIN_PASSWORD) {
        ;
        req.session.isAdmin = true;
        res.redirect('/admin');
    }
    else {
        res.redirect('/admin/login?error=Invalid credentials');
    }
}
function postLogout(req, res) {
    req.session.destroy(() => res.redirect('/admin/login'));
}
