"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importing APIs handlers/controllers
const inventory_controller_1 = require("../controllers/inventory.controller");
// Importing middleware
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
// ======================
// PROTECT ALL ROUTES
// ======================
router.use(auth_middleware_1.default);
router.get('', inventory_controller_1.getAllInventory);
router.post('', inventory_controller_1.createInventoryItem);
router.get('/:id', inventory_controller_1.getInventoryById);
router.put('/:id', inventory_controller_1.updateInventoryItem);
router.delete('/:id', inventory_controller_1.deleteInventoryItem);
router.patch('/:id/restock', inventory_controller_1.restockInventoryItem);
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map