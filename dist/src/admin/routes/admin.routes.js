"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const adminAuth_1 = require("../middleware/adminAuth");
const auth_admin_1 = require("../controllers/auth.admin");
const dashboard_admin_1 = require("../controllers/dashboard.admin");
const products_admin_1 = require("../controllers/products.admin");
const collections_admin_1 = require("../controllers/collections.admin");
const orders_admin_1 = require("../controllers/orders.admin");
const users_admin_1 = require("../controllers/users.admin");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Auth
router.get('/login', auth_admin_1.getLogin);
router.post('/login', auth_admin_1.postLogin);
router.post('/logout', auth_admin_1.postLogout);
// Protected routes
router.use(adminAuth_1.requireAdminAuth);
// Dashboard
router.get('/', dashboard_admin_1.getDashboard);
// Products
router.get('/products', products_admin_1.getProducts);
router.get('/products/new', products_admin_1.getNewProduct);
router.post('/products', upload.array('images', 5), products_admin_1.postProduct);
router.get('/products/:id/edit', products_admin_1.getEditProduct);
router.post('/products/:id/edit', upload.array('images', 5), products_admin_1.postEditProduct);
router.post('/products/:id/delete', products_admin_1.deleteProduct);
router.post('/products/:id/images/:imageId/delete', products_admin_1.deleteProductImage);
// Collections
router.get('/collections', collections_admin_1.getCollections);
router.get('/collections/new', collections_admin_1.getNewCollection);
router.post('/collections', collections_admin_1.postCollection);
router.get('/collections/:id/edit', collections_admin_1.getEditCollection);
router.post('/collections/:id/edit', collections_admin_1.postEditCollection);
router.post('/collections/:id/delete', collections_admin_1.deleteCollection);
// Orders
router.get('/orders', orders_admin_1.getOrders);
router.get('/orders/:id', orders_admin_1.getOrder);
router.post('/orders/:id/status', orders_admin_1.updateOrderStatus);
// Users
router.get('/users', users_admin_1.getUsers);
exports.default = router;
