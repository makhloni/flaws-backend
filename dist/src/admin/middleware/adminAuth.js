"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAuth = requireAdminAuth;
function requireAdminAuth(req, res, next) {
    if (req.session.isAdmin)
        return next();
    res.redirect('/admin/login');
}
