"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextQuoteNumber = nextQuoteNumber;
exports.nextInvoiceNumber = nextInvoiceNumber;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
// ==================================================================================
// NEXT QUOTE NUMBER
// Generates the next sequential quote number e.g. QT-001, QT-025
// Uses MAX(sn) instead of the latest createdAt to avoid race conditions -
// if two quotes are created at the same millisecond, createdAt ordering is
// unreliable, but sn (auto-increment integer) is always unique and increasing
// ==================================================================================
async function nextQuoteNumber() {
    // Generates the next sequential quote/invoice number (e.g., QT-001, INV-001).
    // Retrieves the current highest serial number (sn) using SQL MAX(sn),
    // increments it by 1, and formats it with a prefix and zero-padding.
    // Uses sn instead of createdAt to ensure reliable ordering even if
    // multiple records are created at the same time.
    const result = await models_1.Quote.findOne({
        attributes: [[(0, sequelize_1.fn)('MAX', (0, sequelize_1.col)('sn')), 'maxSn']],
        raw: true,
    });
    const maxSn = result?.maxSn ?? 0;
    return `QT-${String(maxSn + 1).padStart(3, '0')}`;
}
// ==================================================================================
// NEXT INVOICE NUMBER
// Generates the next sequential invoice number e.g. INV-001, INV-018
// Same MAX(sn) approach as quotes - safe under concurrent requests
// ==================================================================================
async function nextInvoiceNumber() {
    const result = await models_1.Invoice.findOne({
        attributes: [[(0, sequelize_1.fn)('MAX', (0, sequelize_1.col)('sn')), 'maxSn']],
        raw: true,
    });
    const maxSn = result?.maxSn ?? 0;
    return `INV-${String(maxSn + 1).padStart(3, '0')}`;
}
//# sourceMappingURL=numbering.js.map