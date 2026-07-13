"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importing APIs handlers/controllers
const company_settings_controller_1 = require("../controllers/company-settings.controller");
// Importing middleware
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
// ======================
// PROTECT ALL ROUTES
// ======================
router.use(auth_middleware_1.default);
router.get('', company_settings_controller_1.getCompanySettings);
router.put('', company_settings_controller_1.updateCompanySettings);
router.post('/bank-accounts', company_settings_controller_1.addBankAccount);
router.post('/bank-accounts/:accountId', company_settings_controller_1.updateBankAccount);
router.post('/bank-accounts/:accountId', company_settings_controller_1.deleteBankAccount);
router.post('/bank-accounts/:accountId/default', company_settings_controller_1.setDefaultBankAccount);
exports.default = router;
//# sourceMappingURL=company-settings.routes.js.map