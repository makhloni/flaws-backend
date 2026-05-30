"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWaitlistEntries = exports.joinWaitlist = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const email_1 = require("../lib/email");
// POST /waitlist
const joinWaitlist = async (req, res) => {
    try {
        const { name, email, city, } = req.body;
        if (!name || !email || !city) {
            return res.status(400).json({ message: 'Name, email, city are required' });
        }
        // Check for existing entry
        const existing = await prisma_1.default.waitlistEntry.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: 'You\'re already on the list' });
        }
        const entry = await prisma_1.default.waitlistEntry.create({
            data: {
                name,
                email,
                city,
            },
        });
        // Send confirmation email — non-blocking
        (0, email_1.sendWaitlistConfirmation)({ to: email, customerName: name }).catch(console.error);
        res.status(201).json({ message: 'You\'re on the list', id: entry.id });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.joinWaitlist = joinWaitlist;
// GET /waitlist — admin only
const getWaitlistEntries = async (req, res) => {
    try {
        const entries = await prisma_1.default.waitlistEntry.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(entries);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getWaitlistEntries = getWaitlistEntries;
