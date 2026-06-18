"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importing APIs handlers/controllers
const user_controller_1 = require("../controllers/user.controller");
// Importing middleware
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
// ======================
// PROTECT ALL USER ROUTES
// ======================
router.use(auth_middleware_1.default);
router.get('', user_controller_1.getAllUsers);
router.get('/:id', user_controller_1.getUserById);
router.put('/:id', user_controller_1.updateUser);
router.delete('/:id', user_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map