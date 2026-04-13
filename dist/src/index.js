"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const collection_routes_1 = __importDefault(require("./routes/collection.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const address_routes_1 = __importDefault(require("./routes/address.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const admin_routes_1 = __importDefault(require("./admin/routes/admin.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
const content_routes_1 = __importDefault(require("./routes/content.routes"));
const abandonedCart_1 = require("./jobs/abandonedCart");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Run every hour
setTimeout(() => {
    (0, abandonedCart_1.runAbandonedCartJob)().catch(console.error);
    setInterval(() => {
        (0, abandonedCart_1.runAbandonedCartJob)().catch(console.error);
    }, 1000 * 60 * 60);
}, 1000 * 60 * 2);
app.use((0, cors_1.default)({
    origin: [
        'https://flaws-frontend.vercel.app',
        'http://localhost:5173',
    ],
    credentials: true,
}));
app.use('/payment/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.set('trust proxy', 1);
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
}));
app.use('/auth', auth_routes_1.default);
app.use('/products', product_routes_1.default);
app.use('/collections', collection_routes_1.default);
app.use('/cart', cart_routes_1.default);
app.use('/orders', order_routes_1.default);
app.use('/addresses', address_routes_1.default);
app.use('/payment', payment_routes_1.default);
app.use('/admin', admin_routes_1.default);
app.use('/content', content_routes_1.default);
app.use('/contact', contact_routes_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
