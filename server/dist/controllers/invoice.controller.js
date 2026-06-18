"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoiceForQuote = exports.resendInvoiceEmail = exports.downloadInvoicePdf = exports.updateInvoiceStatus = exports.generateInvoice = exports.getInvoiceById = exports.getAllInvoice = void 0;
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const email_service_1 = require("../services/email.service");
const db_1 = __importDefault(require("../db"));
const numbering_1 = require("../utils/numbering");
const pdf_service_1 = require("../services/pdf.service");
// ==================================================================================
// @desc   GET ALL INVOICES
// @route  GET /invoices?status=paid&search=techbridge
// @access Private(only logged in users)
// Returns all invoices - populates the Invoice list in the prototype
// ===================================================================================
const getAllInvoice = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        // Build the where clause dynamically based on query params
        const whereClause = {};
        // Filter by status if provided
        if (status) {
            whereClause.status = status;
        }
        const invoices = await models_1.Invoice.findAll({
            where: whereClause,
            include: [
                {
                    model: models_1.Client,
                    as: 'client',
                    attributes: ['id', 'clientName', 'email'],
                    ...(search && {
                        where: { clientName: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    }),
                },
                {
                    model: models_1.Quote,
                    as: 'quote',
                    attributes: ['id', 'quoteNumber'],
                },
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'name'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({
            message: 'Invoices retrieved successfully',
            count: invoices.length,
            invoices,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllInvoice = getAllInvoice;
// ==================================================================================
// @desc   GET INVOICE BY ID
// @route  GET /invoices/:id
// @access Private(only logged in users)
// Returns a single invoice with all line items and client details
// Populates the Invoice View page in the prototype
// ===================================================================================
const getInvoiceById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing ID' });
            return;
        }
        const invoice = await models_1.Invoice.findByPk(id, {
            include: [
                {
                    model: models_1.Client,
                    as: 'client',
                    attributes: ['id', 'clientName', 'contactPerson', 'email', 'phone', 'address'],
                },
                {
                    model: models_1.InvoiceItem,
                    as: 'items',
                    attributes: ['id', 'itemName', 'itemType', 'quantity', 'unitPrice', 'lineTotal'],
                },
                {
                    model: models_1.Quote,
                    as: 'quote',
                    attributes: ['id', 'quoteNumber'],
                },
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'name'],
                },
            ],
        });
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        res.status(200).json({
            message: 'Invoice retrieved successfully',
            invoice,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getInvoiceById = getInvoiceById;
// ==================================================================================
// @desc   GENERATE INVOICE
// @route  POST /invoices/generate/:quoteId
// @access Private(only logged in users)
// Triggered when a quote is approved - automatically creates an invoice,
// deducts inventory stock, generates the PDF and emails it to the client
// This is the core of the Quote-to-Invoice Engine described in the project doc
// The prototype approval modal says:
// "This will generate a PDF invoice and deduct inventory automatically"
// ===================================================================================
const generateInvoice = async (req, res, next) => {
    // Use a transaction - invoice creation, inventory deduction, and PDF generation
    // must all succeed together or all roll back
    const transaction = await db_1.default.transaction();
    try {
        const { quoteId } = req.params;
        if (!quoteId || typeof quoteId !== 'string') {
            res.status(400).json({ message: 'Invalid or missing quote ID' });
            return;
        }
        // Load the approved quote with its client and line items
        const quote = await models_1.Quote.findByPk(quoteId, {
            include: [
                { model: models_1.Client, as: 'client' },
                { model: models_1.QuoteItem, as: 'items' },
            ],
        });
        if (!quote) {
            await transaction.rollback();
            res.status(404).json({ message: 'Quote not found' });
            return;
        }
        // Only approved quotes can generate an invoice
        if (quote.status !== 'approved') {
            await transaction.rollback();
            res.status(400).json({
                message: `Invoice can only be generated for approved quotes. This quote is ${quote.status}`,
            });
            return;
        }
        // Check if an invoice already exists for this quote - prevent duplicates
        const existingInvoice = await models_1.Invoice.findOne({ where: { quoteId } });
        if (existingInvoice) {
            await transaction.rollback();
            res.status(409).json({
                message: `An invoice already exists for this quote: ${existingInvoice.invoiceNumber}`,
            });
            return;
        }
        const client = quote.client;
        const items = quote.items;
        // --------- INVENTORY DEDUCTION  --------------------------------------------
        // Deduct stock for all product line items atomically
        // Services are skipped since they don't have physical stock
        // Uses row-level locking to prevent race conditions on concurrent approvals
        for (const item of items) {
            if (item.itemType === 'product' && item.inventoryId) {
                const inventoryItem = await models_1.Inventory.findOne({
                    where: { id: item.inventoryId },
                    lock: transaction.LOCK.UPDATE, // row-level lock. It prevents other transactions from modifying, deleting, or locking those rows until the current transaction commits or rolls back, ensuring data consistency.
                    transaction,
                });
                if (inventoryItem && inventoryItem.stockQty !== null) {
                    const newQty = Number(inventoryItem.stockQty) - Number(item.quantity);
                    // Allow deduction even if it goes to 0 - low stock alert handles the warning
                    // But never allow negative stock
                    if (newQty < 0) {
                        await transaction.rollback();
                        res.status(400).json({
                            message: `Insufficient stock for "${inventoryItem.name}". Available: ${inventoryItem.stockQty}, Required: ${item.quantity}`,
                        });
                        return;
                    }
                    await inventoryItem.update({ stockQty: newQty }, { transaction });
                }
            }
        }
        // ---- CREATE INVOICE RECORD -----------------------------------------------------------
        const invoiceNumber = await (0, numbering_1.nextInvoiceNumber)();
        // Due date - 14 days from today, shown as "Due Date: Mar 15, 2026" on the prototype
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        const dueDateString = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const invoice = await models_1.Invoice.create({
            invoiceNumber,
            quoteId: quote.id, // ! (non-null assertion)
            clientId: quote.clientId,
            createdBy: req.user?.id,
            status: 'sent',
            vatRate: quote.vatRate,
            subtotal: quote.subtotal,
            vatAmount: quote.vatAmount,
            grandTotal: quote.grandTotal,
            pdfPath: null,
            dueDate: dueDateString,
            paidAt: null,
            sentAt: null,
        }, { transaction });
        // ---- CREATE INVOICE LINE ITEMS -------------------------------------------------
        // Copy line items from the quote as immutable snapshots(creating a read-only, permanent record of the product details)
        // Prices are locked at the time of invoice generation
        await models_1.InvoiceItem.bulkCreate(items.map((item) => ({
            invoiceId: invoice.id,
            itemName: item.itemName,
            itemType: item.itemType,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal),
        })), { transaction });
        // Commit the transaction - invoice, items, and inventory deductions are all saved
        await transaction.commit();
        // --- GENERATE INVOICE PDF ------------------------------------------------------------
        // Runs after commit so the invoice is fully saved before PDF generation starts
        const pdfPath = await (0, pdf_service_1.generatePDF)({
            type: 'invoice',
            refNumber: invoice.invoiceNumber,
            linkedRef: quote.quoteNumber, // "Quote Ref: QT-023" on the invoice PDF
            client: {
                clientName: client.clientName,
                contactPerson: client.contactPerson ?? null,
                email: client.email,
                phone: client.phone ?? null,
            },
            items: items.map((i) => ({
                itemName: i.itemName,
                itemType: i.itemType,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                lineTotal: Number(i.lineTotal),
            })),
            subtotal: Number(invoice.subtotal),
            vatRate: invoice.vatRate ? Number(invoice.vatRate) : null,
            vatAmount: invoice.vatAmount ? Number(invoice.vatAmount) : null,
            grandTotal: Number(invoice.grandTotal),
            issueDate: new Date().toLocaleDateString('en-NG'),
            dueDate: dueDate.toLocaleDateString('en-NG'),
            status: 'sent',
        });
        // Save the PDF path and sentAt timestamp on the invoice record
        await invoice.update({ pdfPath, sentAt: new Date() });
        // ----- SEND INVOICE EMAIL -------------------------------------------------
        // Fire and forget - email failure won't affect the API response
        (0, email_service_1.sendInvoiceEmail)({
            to: client.email,
            clientName: client.clientName,
            invoiceNumber: invoice.invoiceNumber,
            pdfPath,
            grandTotal: Number(invoice.grandTotal),
            dueDate: dueDate.toLocaleDateString('en-NG'),
        }).catch((err) => console.error('Invoice email failed:', err.message));
        res.status(201).json({
            message: 'Invoice generated, PDF created, and email sent to client',
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                quoteNumber: quote.quoteNumber,
                status: invoice.status,
                grandTotal: invoice.grandTotal,
                dueDate: invoice.dueDate,
                pdfPath: invoice.pdfPath,
                sentAt: invoice.sentAt,
            },
        });
    }
    catch (error) {
        // Roll back the transaction if anything went wrong
        await transaction.rollback();
        next(error);
    }
};
exports.generateInvoice = generateInvoice;
// ==================================================================================
// @desc   UPDATE INVOICE STATUS
// @route  PATCH /invoices/:id/status
// @access Private(only logged in users)
// Marks an invoice as paid or cancelled
// Triggered manually by staff - "Mark as Paid" action on the invoice view
// Body: { status: 'paid' | 'cancelled' }
// ==================================================================================
const updateInvoiceStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing ID' });
            return;
        }
        const allowedStatuses = ['paid', 'cancelled'];
        if (!status || !allowedStatuses.includes(status)) {
            res.status(400).json({
                message: `Status must be either "paid" or "cancelled"`,
            });
            return;
        }
        const invoice = await models_1.Invoice.findByPk(id);
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        // Can't change status of an already cancelled invoice
        if (invoice.status === 'cancelled') {
            res.status(400).json({ message: 'Cannot update a cancelled invoice' });
            return;
        }
        // Can't unpay an already paid invoice - immutable audit trail
        if (invoice.status === 'paid') {
            res.status(400).json({ message: 'Invoice is already marked as paid' });
            return;
        }
        await invoice.update({
            status,
            ...(status === 'paid' && { paidAt: new Date() }),
        });
        res.status(200).json({
            message: `Invoice marked as ${status}`,
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                status: invoice.status,
                paidAt: invoice.paidAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateInvoiceStatus = updateInvoiceStatus;
// ==================================================================================
// @desc   DOWNLOAD INVOICE PDF
// @route  GET /invoices/:id/download
// @access Private(only logged in users)
// Returns the PDF file for download or inline viewing
// Triggered by the "Download PDF" button on the Invoice View page in the prototype
// ==================================================================================
const downloadInvoicePdf = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing ID' });
            return;
        }
        const invoice = await models_1.Invoice.findByPk(id, {
            attributes: ['id', 'invoiceNumber', 'pdfPath'],
        });
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        if (!invoice.pdfPath) {
            res.status(404).json({ message: 'PDF not yet generated for this invoice' });
            return;
        }
        // Check the file actually exists on disk
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        if (!fs.existsSync(invoice.pdfPath)) {
            res.status(404).json({ message: 'PDF file not found on server' });
            return;
        }
        // Send the file as a downloadable attachment
        res.download(invoice.pdfPath, `${invoice.invoiceNumber}.pdf`);
    }
    catch (error) {
        next(error);
    }
};
exports.downloadInvoicePdf = downloadInvoicePdf;
// ==================================================================================
// @desc   RESEND INVOICE EMAIL
// @route  POST /invoices/:id/resend
// @access Private(only logged in users)
// Resends the invoice PDF to the client - useful if the first email was missed
// Triggered by the "Send Email" button on the Invoice View page in the prototype
// ==================================================================================
const resendInvoiceEmail = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing ID' });
            return;
        }
        const invoice = await models_1.Invoice.findByPk(id, {
            include: [
                { model: models_1.Client, as: 'client' },
            ],
        });
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        if (!invoice.pdfPath) {
            res.status(400).json({ message: 'No PDF available to send for this invoice' });
            return;
        }
        const client = invoice.client;
        await (0, email_service_1.sendInvoiceEmail)({
            to: client.email,
            clientName: client.clientName,
            invoiceNumber: invoice.invoiceNumber,
            pdfPath: invoice.pdfPath,
            grandTotal: Number(invoice.grandTotal),
            dueDate: invoice.dueDate ?? undefined,
        });
        // Update sentAt to track the most recent send time
        await invoice.update({ sentAt: new Date() });
        res.status(200).json({
            message: `Invoice ${invoice.invoiceNumber} resent to ${client.email}`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resendInvoiceEmail = resendInvoiceEmail;
// ==================================================================================
// GENERATE INVOICE FOR QUOTE (internal helper)
// Called automatically when a quote is approved via updateQuoteStatus
// Can also be called directly from the POST /invoices/generate/:quoteId route
// Extracted so it can be reused without going through the HTTP layer
// ==================================================================================
const generateInvoiceForQuote = async (quoteId, createdBy) => {
    const transaction = await db_1.default.transaction();
    try {
        const quote = await models_1.Quote.findByPk(quoteId, {
            include: [
                { model: models_1.Client, as: 'client' },
                { model: models_1.QuoteItem, as: 'items' },
            ],
        });
        if (!quote)
            throw new Error('Quote not found');
        if (quote.status !== 'approved')
            throw new Error('Quote is not approved');
        // Prevent duplicate invoices
        const existing = await models_1.Invoice.findOne({ where: { quoteId } });
        if (existing)
            return; // already generated, silently skip
        const client = quote.client;
        const items = quote.items;
        // Deduct inventory stock
        for (const item of items) {
            if (item.itemType === 'product' && item.inventoryId) {
                const inv = await models_1.Inventory.findOne({
                    where: { id: item.inventoryId },
                    lock: transaction.LOCK.UPDATE,
                    transaction,
                });
                if (inv && inv.stockQty !== null) {
                    const newQty = Number(inv.stockQty) - Number(item.quantity);
                    if (newQty < 0)
                        throw new Error(`Insufficient stock for "${inv.name}"`);
                    await inv.update({ stockQty: newQty }, { transaction });
                }
            }
        }
        const invoiceNumber = await (0, numbering_1.nextInvoiceNumber)();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        const dueDateString = dueDate.toISOString().split('T')[0];
        const invoice = await models_1.Invoice.create({
            invoiceNumber,
            quoteId: quote.id,
            clientId: quote.clientId,
            createdBy,
            status: 'sent',
            vatRate: quote.vatRate,
            subtotal: quote.subtotal,
            vatAmount: quote.vatAmount,
            grandTotal: quote.grandTotal,
            pdfPath: null,
            dueDate: dueDateString,
            paidAt: null,
            sentAt: null,
        }, { transaction });
        await models_1.InvoiceItem.bulkCreate(items.map((item) => ({
            invoiceId: invoice.id,
            itemName: item.itemName,
            itemType: item.itemType,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal),
        })), { transaction });
        await transaction.commit();
        // Generate PDF after commit
        const pdfPath = await (0, pdf_service_1.generatePDF)({
            type: 'invoice',
            refNumber: invoice.invoiceNumber,
            linkedRef: quote.quoteNumber,
            client: {
                clientName: client.clientName,
                contactPerson: client.contactPerson ?? null,
                email: client.email,
                phone: client.phone ?? null,
            },
            items: items.map((i) => ({
                itemName: i.itemName,
                itemType: i.itemType,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                lineTotal: Number(i.lineTotal),
            })),
            subtotal: Number(invoice.subtotal),
            vatRate: invoice.vatRate ? Number(invoice.vatRate) : null,
            vatAmount: invoice.vatAmount ? Number(invoice.vatAmount) : null,
            grandTotal: Number(invoice.grandTotal),
            issueDate: new Date().toLocaleDateString('en-NG'),
            dueDate: dueDate.toLocaleDateString('en-NG'),
            status: 'sent',
        });
        await invoice.update({ pdfPath, sentAt: new Date() });
        (0, email_service_1.sendInvoiceEmail)({
            to: client.email,
            clientName: client.clientName,
            invoiceNumber: invoice.invoiceNumber,
            pdfPath,
            grandTotal: Number(invoice.grandTotal),
            dueDate: dueDate.toLocaleDateString('en-NG'),
        }).catch((err) => console.error('Auto invoice email failed:', err.message));
    }
    catch (error) {
        await transaction.rollback();
        throw error;
    }
};
exports.generateInvoiceForQuote = generateInvoiceForQuote;
//# sourceMappingURL=invoice.controller.js.map