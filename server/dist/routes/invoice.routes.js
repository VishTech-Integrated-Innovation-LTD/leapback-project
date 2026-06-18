"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importing APIs handlers/controllers
const invoice_controller_1 = require("../controllers/invoice.controller");
// Importing middleware
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
// ======================
// PROTECT ALL ROUTES
// ======================
router.use(auth_middleware_1.default);
router.get('', invoice_controller_1.getAllInvoice);
router.get('/:id', invoice_controller_1.getInvoiceById);
router.post('/generate/:quoteId', invoice_controller_1.generateInvoice);
router.patch('/:id/status', invoice_controller_1.updateInvoiceStatus);
router.get('/:id/download', invoice_controller_1.downloadInvoicePdf);
router.post('/:id/resend', invoice_controller_1.resendInvoiceEmail);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map