"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const shipping_controller_1 = require("../controllers/shipping.controller");
const router = (0, express_1.Router)();
router.post('/rates', auth_middleware_1.requireAuth, shipping_controller_1.getRates);
exports.default = router;
