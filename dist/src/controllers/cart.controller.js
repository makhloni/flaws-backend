"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCart = exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// GET /api/cart
const getCart = async (req, res) => {
    const userId = req.user.id;
    const cart = await prisma_1.default.cart.findMany({
        where: { userId },
        include: {
            product: {
                include: { images: true },
            },
            variant: true,
        },
    });
    const total = cart.reduce((sum, item) => {
        const price = Number(item.variant.salePrice ?? item.variant.price);
        return sum + price * item.quantity;
    }, 0);
    res.json({ items: cart, total });
};
exports.getCart = getCart;
// POST /api/cart
const addToCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, variantId, quantity } = req.body;
    if (!productId || !variantId || !quantity) {
        return res.status(400).json({ message: 'productId, variantId and quantity are required' });
    }
    // Check stock
    const variant = await prisma_1.default.productVariant.findUnique({
        where: { id: variantId },
    });
    if (!variant)
        return res.status(404).json({ message: 'Variant not found' });
    if (variant.stock < quantity) {
        return res.status(400).json({ message: `Only ${variant.stock} items in stock` });
    }
    // Upsert — update quantity if already in cart, add if not
    const cartItem = await prisma_1.default.cart.upsert({
        where: { userId_variantId: { userId, variantId } },
        update: { quantity },
        create: { userId, productId, variantId, quantity },
        include: {
            product: { include: { images: true } },
            variant: true,
        },
    });
    res.status(201).json(cartItem);
};
exports.addToCart = addToCart;
// PATCH /api/cart/:variantId
const updateCartItem = async (req, res) => {
    const userId = req.user.id;
    const variantId = req.params.variantId;
    const { quantity } = req.body;
    if (quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    const cartItem = await prisma_1.default.cart.update({
        where: { userId_variantId: { userId, variantId } },
        data: { quantity },
        include: {
            product: { include: { images: true } },
            variant: true,
        },
    });
    res.json(cartItem);
};
exports.updateCartItem = updateCartItem;
// DELETE /api/cart/:variantId
const removeFromCart = async (req, res) => {
    const userId = req.user.id;
    const variantId = req.params.variantId;
    await prisma_1.default.cart.delete({
        where: { userId_variantId: { userId, variantId } },
    });
    res.json({ message: 'Item removed from cart' });
};
exports.removeFromCart = removeFromCart;
// DELETE /api/cart
const clearCart = async (req, res) => {
    const userId = req.user.id;
    await prisma_1.default.cart.deleteMany({ where: { userId } });
    res.json({ message: 'Cart cleared' });
};
exports.clearCart = clearCart;
const mergeCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { items } = req.body;
        if (!items || !Array.isArray(items))
            return res.json({ success: true });
        for (const item of items) {
            const existing = await prisma_1.default.cart.findUnique({
                where: { userId_variantId: { userId, variantId: item.variantId } },
            });
            if (existing) {
                await prisma_1.default.cart.update({
                    where: { userId_variantId: { userId, variantId: item.variantId } },
                    data: { quantity: { increment: item.quantity } },
                });
            }
            else {
                await prisma_1.default.cart.create({
                    data: {
                        userId,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                    },
                });
            }
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.mergeCart = mergeCart;
