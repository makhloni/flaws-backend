"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const supabase_1 = require("../lib/supabase");
const prisma_1 = __importDefault(require("../lib/prisma"));
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized - no token provided' });
    }
    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase_1.supabase.auth.getUser(token);
    if (error || !data.user) {
        return res.status(401).json({ message: 'Unauthorized - invalid token' });
    }
    // Supabase confirming the token is valid doesn't mean a matching
    // row exists in our own User table — check separately.
    const user = await prisma_1.default.user.findUnique({ where: { id: data.user.id } });
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized - user record not found' });
    }
    req.user = user;
    next();
};
exports.requireAuth = requireAuth;
