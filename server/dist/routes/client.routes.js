"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importing APIs handlers/controllers
const client_controller_1 = require("../controllers/client.controller");
// Importing middleware
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
// ======================
// PROTECT ALL ROUTES
// ======================
router.use(auth_middleware_1.default);
router.get('', client_controller_1.getAllClients);
router.post('', client_controller_1.createClient);
router.get('/:id', client_controller_1.getClientById);
router.put('/:id', client_controller_1.updateClient);
router.delete('/:id', client_controller_1.deleteClient);
exports.default = router;
//# sourceMappingURL=client.routes.js.map