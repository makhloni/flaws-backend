"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRates = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const courierGuy_1 = require("../lib/courierGuy");
const getRates = async (req, res) => {
    const userId = req.user.id;
    const { addressId } = req.body;
    if (!addressId)
        return res.status(400).json({ message: 'addressId is required' });
    const address = await prisma_1.default.address.findFirst({ where: { id: addressId, userId } });
    if (!address)
        return res.status(404).json({ message: 'Address not found' });
    const cartItems = await prisma_1.default.cart.findMany({
        where: { userId },
        include: { variant: true, product: true },
    });
    if (cartItems.length === 0)
        return res.status(400).json({ message: 'Cart is empty' });
    try {
        const quote = await (0, courierGuy_1.getQuote)({
            deliveryAddress: {
                street: address.street,
                city: address.city,
                province: address.province,
                postalCode: address.postalCode,
                country: 'ZA',
            },
            parcels: cartItems.flatMap(item => Array.from({ length: item.quantity }, () => ({
                description: item.product.name,
                weightKg: item.variant.weightKg ? Number(item.variant.weightKg) : 0.5,
                lengthCm: item.variant.lengthCm ?? undefined,
                widthCm: item.variant.widthCm ?? undefined,
                heightCm: item.variant.heightCm ?? undefined,
            }))),
        });
        // Response shape isn't fully confirmed — normalizing defensively.
        // Log `quote` on your first real sandbox call and tighten this if field names differ.
        const rawRates = Array.isArray(quote) ? quote : quote.rates || [];
        const rates = rawRates.map((r) => ({
            serviceLevelCode: r.service_level?.code ?? r.service_level_code,
            serviceLevelName: r.service_level?.name ?? r.service_level_code,
            price: Number(r.rate ?? r.total_price ?? r.price),
        }));
        res.json({ rates });
    }
    catch (err) {
        console.error('Rate lookup failed:', err.response?.data || err.message);
        res.status(502).json({ message: 'Could not fetch shipping rates — please try again' });
    }
};
exports.getRates = getRates;
