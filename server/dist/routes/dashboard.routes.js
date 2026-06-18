"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
// GET /dashboard?period=week|month|year
router.get('/', auth_middleware_1.default, dashboard_controller_1.getDashboardStats);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map