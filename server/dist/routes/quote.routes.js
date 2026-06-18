"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importing APIs handlers/controllers
const quote_controller_1 = require("../controllers/quote.controller");
// Importing middleware
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
// ======================
// PROTECT ALL ROUTES
// ======================
router.use(auth_middleware_1.default);
router.get('', quote_controller_1.getAllQuotes);
router.get('/:id', quote_controller_1.getQuoteById);
router.post('', quote_controller_1.createQuote);
router.put('/:id', quote_controller_1.updateQuote);
router.patch('/:id/submit', quote_controller_1.submitQuote);
router.patch('/:id/status', quote_controller_1.updateQuoteStatus);
router.get('/:id/download', quote_controller_1.downloadQuotePdf);
exports.default = router;
//# sourceMappingURL=quote.routes.js.map