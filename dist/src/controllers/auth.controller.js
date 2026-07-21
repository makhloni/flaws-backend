"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = exports.register = void 0;
const supabase_1 = require("../lib/supabase");
const prisma_1 = __importDefault(require("../lib/prisma"));
// POST /api/auth/register
const register = async (req, res) => {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password and name are required' });
    }
    const { data, error } = await supabase_1.supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });
    if (error)
        return res.status(400).json({ message: error.message });
    const user = await prisma_1.default.user.create({
        data: {
            id: data.user.id,
            email,
            name,
            phone,
        },
    });
    res.status(201).json({ message: 'Account created', user });
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    const { data, error } = await supabase_1.supabase.auth.signInWithPassword({ email, password });
    if (error)
        return res.status(401).json({ message: error.message });
    res.json({
        token: data.session.access_token,
        user: data.user,
    });
};
exports.login = login;
// POST /api/auth/logout
const logout = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token)
        await supabase_1.supabaseAdmin.auth.admin.signOut(token);
    res.json({ message: 'Logged out' });
};
exports.logout = logout;
// GET /api/auth/me
const getMe = async (req, res) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.user.id },
        include: { addresses: true },
    });
    res.json(user);
};
exports.getMe = getMe;
