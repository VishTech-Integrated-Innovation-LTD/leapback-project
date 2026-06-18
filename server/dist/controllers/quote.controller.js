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
exports.downloadQuotePdf = exports.updateQuoteStatus = exports.submitQuote = exports.updateQuote = exports.createQuote = exports.getQuoteById = exports.getAllQuotes = void 0;
// Impoerting all models
const models_1 = require("../models");
// Importing Op from sequelize for query operators like iLike (case-insensitive search)
const sequelize_1 = require("sequelize");
// Importing sequelize instance for transactions - ensures quote + items are saved atomically
const db_1 = __importDefault(require("../db"));
// Importing the utility that generates sequential quote numbers e.g. QT-024, QT-025
const numbering_1 = require("../utils/numbering");
// Importing PDF generation services
const pdf_service_1 = require("../services/pdf.service");
const email_service_1 = require("../services/email.service");
const invoice_controller_1 = require("./invoice.controller");
// ==================================================================================
// @desc   GET ALL QUOTES
// @route  GET /quotes?status=pending&search=nexus
// @access Private(only logged in users)
// Returns all quotes with optional status filter and search
//  Populates the quotes table (shows Quote ID, Client, Items, Amount, Status, Date)
// ===================================================================================
const getAllQuotes = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        // Build the where clause dynamically based on query params
        const whereClause = {};
        // Filter by status if provided: matches the All/Pending/Approved/Rejected tabs
        if (status) {
            whereClause.status = status;
        }
        // ------------------------------------------------------------------------------------
        // Fetch quotes based on the provided filters (whereClause).
        // Includes related client, quote items, and creator information.
        // - Client: returns basic client details and optionally filters by client name if a search query is provided.
        // - Items: loads quote items (id only) so the frontend can determine the number of items in each quote.
        // - Creator: returns the user who created the quote.
        // Results are sorted by newest quotes first (createdAt DESC).
        // ------------------------------------------------------------------------------------
        const quotes = await models_1.Quote.findAll({
            where: whereClause,
            include: [
                {
                    model: models_1.Client,
                    as: 'client',
                    attributes: ['id', 'clientName', 'email'],
                    // Filter by client name if search query is provided
                    ...(search && {
                        where: { clientName: { [sequelize_1.Op.iLike]: `%${search}%` } },
                    }),
                },
                {
                    // Include items just to get the count - shown as "4 items" in the prototype quotes table
                    model: models_1.QuoteItem,
                    as: 'items',
                    attributes: ['id'],
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
            message: 'Quotes retrieved successfully',
            count: quotes.length,
            quotes,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllQuotes = getAllQuotes;
// ==================================================================================
// @desc   GET QUOTE BY ID
// @route  GET /quotes/:id
// @access Private(only logged in users)
//  Returns a single quote with all its line items and client details
// Populates the quote detail/view page
// ===================================================================================
const getQuoteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing ID' });
            return;
        }
        const quote = await models_1.Quote.findByPk(id, {
            include: [
                {
                    model: models_1.Client,
                    as: 'client',
                    // All client fields needed for the billed-to section on the quote/invoice PDF
                    attributes: ['id', 'clientName', 'contactPerson', 'email', 'phone', 'address'],
                },
                {
                    model: models_1.QuoteItem,
                    as: 'items',
                    attributes: ['id', 'itemName', 'itemType', 'quantity', 'unitPrice', 'lineTotal', 'inventoryId'],
                },
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'name'],
                },
            ],
        });
        if (!quote) {
            res.status(404).json({ message: 'Quote not found' });
            return;
        }
        res.status(200).json({
            message: 'Quote retrieved successfully',
            quote,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuoteById = getQuoteById;
// 3. The helper function
const processLineItems = async (items) => {
    let subtotal = 0;
    const processedItems = await Promise.all(items.map(async (item) => {
        let unitPrice;
        let itemName;
        let itemType;
        if (item.inventoryId) {
            // Dropdown flow: enforce catalogue data
            const inventoryItem = await models_1.Inventory.findByPk(item.inventoryId);
            if (!inventoryItem) {
                throw new Error(`Inventory item not found: ${item.inventoryId}`);
            }
            if (!inventoryItem.isActive) {
                throw new Error(`Inventory item "${inventoryItem.name}" is no longer active`);
            }
            itemName = inventoryItem.name;
            itemType = inventoryItem.type;
            unitPrice = Number(inventoryItem.unitPrice); // trust DB number
        }
        else {
            // Manual entry → require & convert
            if (!item.itemName || !item.itemType || !item.unitPrice) {
                throw new Error('Manual items must provide itemName, itemType, and unitPrice');
            }
            itemName = item.itemName;
            itemType = item.itemType;
            unitPrice = Number(item.unitPrice);
        }
        // Common validation & conversion
        const quantity = Number(item.quantity);
        if (Number.isNaN(quantity) || quantity <= 0) {
            throw new Error('Quantity must be a positive number');
        }
        if (Number.isNaN(unitPrice) || unitPrice < 0) {
            throw new Error('Unit price must be a non-negative number');
        }
        const lineTotal = quantity * unitPrice;
        subtotal += lineTotal;
        return {
            ...item, // preserve extra fields (discount, notes, etc.)
            itemName,
            itemType,
            unitPrice,
            quantity,
            lineTotal,
        };
    }));
    return { processedItems, subtotal };
};
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// HELPER - CALCULATE VAT TOTALS
// VAT is optional - if vatRate is null or 0, no VAT is applied
// grandTotal = subtotal + vatAmount (or just subtotal if no VAT)
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
const calculateTotals = (subtotal, vatRate) => {
    if (!vatRate) {
        return { vatRate: null, vatAmount: null, grandTotal: subtotal };
    }
    const vatAmount = parseFloat((subtotal * vatRate / 100).toFixed(2));
    const grandTotal = parseFloat((subtotal + vatAmount).toFixed(2));
    return { vatRate, vatAmount, grandTotal };
};
// ==================================================================================
// @desc   CREATE QUOTE
// @route  GET /quotes
// @access Private(only logged in users)
// Creates a new quote with line items - can be saved as draft or submitted immediately
// Triggered by the New Quote page
// ===================================================================================
const createQuote = async (req, res, next) => {
    // Use a transaction so the quote and all its items are saved together
    // If anything fails, everything is rolled back - no orphaned quotes or missing items
    const transaction = await db_1.default.transaction();
    try {
        const { clientId, items, notes, vatRate, submit, // if true, status becomes 'pending' and PDF + email are triggered
         } = req.body;
        // Validate required fields
        if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
            await transaction.rollback();
            res.status(400).json({ message: 'Client and at least one line item are required' });
            return;
        }
        // Confirm the client exists before creating the quote
        const client = await models_1.Client.findByPk(clientId);
        if (!client) {
            await transaction.rollback();
            res.status(404).json({ message: 'Client not found' });
            return;
        }
        // Process line items - resolves inventory lookups and validates manual entries
        const { processedItems, subtotal } = await processLineItems(items);
        // Calculate VAT totals - vatRate is optional, null means no VAT applied
        const totals = calculateTotals(subtotal, vatRate ? parseFloat(vatRate) : null);
        // Generate the next sequential quote number e.g. QT-025
        const quoteNumber = await (0, numbering_1.nextQuoteNumber)();
        // Determine status - 'draft' if saving, 'pending' if submitting immediately
        const status = submit ? 'pending' : 'draft';
        // ------------------------------------------------------------------------------------
        // CREATE QUOTE RECORD
        // Saves the main quote information in the quotes table.
        // This includes the quote number, client, totals, status,
        // and metadata like who created it.
        // The transaction ensures the quote and its items are saved together.
        // ------------------------------------------------------------------------------------
        const quote = await models_1.Quote.create({
            quoteNumber, // Generated quote number (e.g. QT-001)
            clientId, // The client this quote belongs to
            createdBy: req.user?.id, // ID of logged-in user (set by auth middleware)
            // NEW - Hardcode a user ID for testing
            // createdBy: "4844f879-d915-4bf4-aaac-d3edd2a81b45",
            status, // Current quote status (draft, pending, etc.)
            subtotal, // Sum of all line item totals before tax/discount
            notes: notes ?? null, // Optional notes attached to the quote
            // If undefined, store null in the database
            pdfPath: null, // Will store the generated PDF file path later
            sentAt: null, // Timestamp when quote is sent to client
            approvedAt: null, // Timestamp when client approves the quote
            ...totals, // Spread additional totals (tax, discount, grandTotal etc.)
        }, { transaction } // Attach to the transaction so it can be rolled back if needed
        );
        // ------------------------------------------------------------------------------------
        // CREATE QUOTE LINE ITEMS
        // Inserts all items that belong to this quote.
        // Each item represents a product/service line in the quote.
        // Using bulkCreate is more efficient than inserting one by one.
        // ------------------------------------------------------------------------------------
        await models_1.QuoteItem.bulkCreate(processedItems.map((item) => ({
            quoteId: quote.id, // Foreign key linking item to the quote
            inventoryId: item.inventoryId ?? null,
            // If item came from inventory dropdown, store its ID
            // Otherwise null for manually entered items
            itemName: item.itemName, // Name of the product/service
            itemType: item.itemType, // Category/type of item
            quantity: item.quantity, // Quantity requested
            unitPrice: item.unitPrice, // Price per unit
            lineTotal: item.lineTotal, // quantity × unitPrice
        })), { transaction } // Ensures items are saved within the same transaction
        );
        // ------------------------------------------------------------------------------------
        // COMMIT TRANSACTION
        // Finalizes the database transaction.
        // If everything succeeds, the quote and all its items are permanently saved.
        // If any step fails before this, the transaction can be rolled back.
        // ------------------------------------------------------------------------------------
        await transaction.commit();
        if (submit) {
            try {
                const savedItems = await models_1.QuoteItem.findAll({
                    where: { quoteId: quote.id }
                });
                console.log("=== Starting PDF Generation ===");
                console.log("Quote Number:", quote.quoteNumber);
                console.log("Client Email:", client.email);
                console.log("Items Count:", savedItems.length);
                const pdfPath = await (0, pdf_service_1.generatePDF)({
                    type: 'quote',
                    refNumber: quote.quoteNumber,
                    client: {
                        clientName: client.clientName,
                        contactPerson: client.contactPerson,
                        email: client.email,
                        phone: client.phone ?? null,
                    },
                    items: savedItems.map((i) => ({
                        itemName: i.itemName,
                        itemType: i.itemType,
                        quantity: Number(i.quantity),
                        unitPrice: Number(i.unitPrice),
                        lineTotal: Number(i.lineTotal),
                    })),
                    subtotal: Number(quote.subtotal),
                    vatRate: quote.vatRate ? Number(quote.vatRate) : null,
                    vatAmount: quote.vatAmount ? Number(quote.vatAmount) : null,
                    grandTotal: Number(quote.grandTotal),
                    issueDate: new Date().toLocaleDateString('en-NG'),
                    status: 'pending',
                });
                // Save the PDF path and mark sentAt on the quote record
                await quote.update({ pdfPath, sentAt: new Date() });
                console.log("PDF Generated Successfully at:", pdfPath);
                // Send the quote PDF to the client via email - fire and forget
                // The quote is already saved so an email failure won't affect the response        
                (0, email_service_1.sendQuoteEmail)({
                    to: client.email,
                    clientName: client.clientName,
                    quoteNumber: quote.quoteNumber,
                    pdfPath,
                    grandTotal: Number(quote.grandTotal),
                }).catch((err) => console.error('Quote email failed:', err.message));
                return res.status(201).json({
                    message: 'Quote submitted, PDF generated, and email queued successfully',
                    quote: { ...quote.toJSON(), pdfPath }
                });
            }
            catch (pdfOrEmailError) {
                console.error("=== PDF GENERATION / EMAIL PROCESS FAILED ===");
                console.error("Error Name:", pdfOrEmailError.name);
                console.error("Error Message:", pdfOrEmailError.message);
                console.error("Full Error:", pdfOrEmailError);
                console.error("Stack Trace:", pdfOrEmailError.stack);
                return res.status(201).json({
                    message: 'Quote saved successfully but PDF/email generation failed',
                    quote: {
                        id: quote.id,
                        quoteNumber: quote.quoteNumber,
                        status: quote.status,
                        pdfPath: null
                    },
                    pdfOrEmailError: pdfOrEmailError.message // This will now show in Postman
                });
            }
        }
    }
    catch (error) {
        // Roll back the transaction if anything went wrong
        await transaction.rollback();
        next(error);
    }
};
exports.createQuote = createQuote;
// ==================================================================================
// @desc   UPDATE QUOTE
// @route  UPDATE /quotes/:id
// @access Private(only logged in users)
// Allows editing a quote that is still in 'draft' status
// Once submitted (pending/approved/rejected) a quote can no longer be edited
// ===================================================================================
const updateQuote = async (req, res, next) => {
    const transaction = await db_1.default.transaction();
    try {
        const { id } = req.params;
        const { items, notes, vatRate } = req.body;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing ID' });
            return;
        }
        const quote = await models_1.Quote.findByPk(id);
        if (!quote) {
            await transaction.rollback();
            res.status(404).json({ message: 'Quote not found' });
            return;
        }
        // Only draft quotes can be edited - submitted quotes are locked
        if (quote.status !== 'draft') {
            await transaction.rollback();
            res.status(400).json({
                message: `Quote cannot be edited because it is already ${quote.status}`,
            });
            return;
        }
        if (items && Array.isArray(items) && items.length > 0) {
            // Process line items using the shared helper
            const { processedItems, subtotal } = await processLineItems(items);
            // Use the newly provided vatRate, or fall back to whatever the quote had before
            const effectiveVatRate = vatRate !== undefined
                ? (vatRate ? parseFloat(vatRate) : null)
                : (quote.vatRate ? Number(quote.vatRate) : null);
            const totals = calculateTotals(subtotal, effectiveVatRate);
            // Delete existing items and replace with the updated set
            await models_1.QuoteItem.destroy({ where: { quoteId: id }, transaction });
            await models_1.QuoteItem.bulkCreate(processedItems.map((item) => ({
                quoteId: id,
                inventoryId: item.inventoryId ?? null,
                itemName: item.itemName,
                itemType: item.itemType,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
            })), { transaction });
            await quote.update({ subtotal, notes: notes ?? quote.notes, ...totals }, { transaction });
        }
        else if (notes !== undefined) {
            // Notes: only update - no items provided
            await quote.update({ notes }, { transaction });
        }
        await transaction.commit();
        res.status(200).json({
            message: 'Quote updated successfully',
            quote,
        });
    }
    catch (error) {
        await transaction.rollback();
        next(error);
    }
};
exports.updateQuote = updateQuote;
// ==================================================================================
// @desc   SUBMIT QUOTE
// @route  PATCH /quotes/:id/submit
// @access Private(only logged in users)
// Transitions a draft quote to pending, generates PDF and emails the client
// Triggered by the "Submit Quote →" button on the New Quote page in the prototype
//  "Quote will be emailed to the client automatically on submission"
// ===================================================================================
const submitQuote = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing ID' });
            return;
        }
        // Load the quote with its client and items for PDF generation
        const quote = await models_1.Quote.findByPk(id, {
            include: [
                { model: models_1.Client, as: 'client' },
                { model: models_1.QuoteItem, as: 'items' },
            ],
        });
        if (!quote) {
            res.status(404).json({ message: 'Quote not found' });
            return;
        }
        // Only draft quotes can be submitted
        if (quote.status !== 'draft') {
            res.status(400).json({
                message: `Quote is already ${quote.status} and cannot be submitted again`,
            });
            return;
        }
        const client = quote.client;
        const items = quote.items;
        // Generate the quote PDF
        const pdfPath = await (0, pdf_service_1.generatePDF)({
            type: 'quote',
            refNumber: quote.quoteNumber,
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
            subtotal: Number(quote.subtotal),
            vatRate: quote.vatRate ? Number(quote.vatRate) : null,
            vatAmount: quote.vatAmount ? Number(quote.vatAmount) : null,
            grandTotal: Number(quote.grandTotal),
            issueDate: new Date().toLocaleDateString('en-NG'),
            status: 'pending',
        });
        // Update the quote status to pending and save the PDF path
        await quote.update({ status: 'pending', pdfPath, sentAt: new Date() });
        // Email the PDF to the client - fire and forget
        (0, email_service_1.sendQuoteEmail)({
            to: client.email,
            clientName: client.clientName,
            quoteNumber: quote.quoteNumber,
            pdfPath,
            grandTotal: Number(quote.grandTotal),
        }).catch((err) => console.error('Quote email failed:', err.message));
        res.status(200).json({
            message: 'Quote submitted and emailed to client successfully',
            quote: {
                id: quote.id,
                quoteNumber: quote.quoteNumber,
                status: quote.status,
                grandTotal: quote.grandTotal,
                sentAt: quote.sentAt,
                pdfPath: quote.pdfPath,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitQuote = submitQuote;
// ==================================================================================
// @desc   UPDATE QUOTE STATUS
// @route  PATCH /quotes/:id/status
// @access Private(only logged in users)
// Approves or rejects a pending quote
// Triggered by the "Approve" button and confirmation modal in the prototype
// The modal says: "This will generate a PDF invoice and deduct inventory automatically"
// - actual invoice generation and inventory deduction happen in the invoice controller
// Body: { status: 'approved' | 'rejected' | 'cancelled' }
// ===================================================================================
// export const updateQuoteStatus = async (req: Request, res: Response, next: NextFunction) => {
//     console.log("🔥🔥🔥 THIS IS THE NEW FUNCTION - v6 - IF YOU SEE THIS, IT WORKED 🔥🔥🔥");
//     try {
//         const { id } = req.params;
//         const { status } = req.body;
//         if (!id || typeof id !== 'string') {
//             res.status(400).json({ message: 'Invalid or missing ID' });
//             return;
//         }
//         // Only these three transitions are allowed from pending
//         const allowedStatuses = ['approved', 'rejected', 'cancelled'];
//         if (!status || !allowedStatuses.includes(status)) {
//             res.status(400).json({
//                 message: `Status must be one of: ${allowedStatuses.join(', ')}`,
//             });
//             return;
//         }
//         const quote = await Quote.findByPk(id);
//         if (!quote) {
//             res.status(404).json({ message: 'Quote not found' });
//             return;
//         }
//         // Only pending quotes can have their status changed
//         if (quote.status !== 'pending') {
//             res.status(400).json({
//                 message: `Only pending quotes can be approved or rejected. This quote is ${quote.status}`,
//             });
//             return;
//         }
//         // Set approvedAt timestamp if the quote is being approved
//         await quote.update({
//             status,
//             ...(status === 'approved' && { approvedAt: new Date() }),
//         });
// // If approved, automatically generate the invoice
//     // This is the core Quote-to-Invoice Engine — no manual step needed
//     if (status === 'approved') {
//         const actorId = (req as any).user?.id ?? quote.createdBy;
//       try {
//         await generateInvoiceForQuote(quote.id, actorId);
//       } catch (invoiceError: any) {
//         // Log but don't fail the approval — quote is already approved
//         console.error('Auto invoice generation failed:', invoiceError);
//     return res.status(400).json({
//       message: invoiceError?.message || 'Invoice generation failed'
//     });  
//     }
//     }
//        res.status(200).json({
//       message: status === 'approved'
//         ? 'Quote approved and invoice generated automatically'
//         : `Quote ${status} successfully`,
//       quote: {
//         id:          quote.id,
//         quoteNumber: quote.quoteNumber,
//         status:      quote.status,
//         approvedAt:  quote.approvedAt,
//       },
//     });
//     } catch (error) {
//         next(error);
//     }
// }
const updateQuoteStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Invalid or missing ID' });
        }
        const allowedStatuses = ['approved', 'rejected', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: `Status must be one of: ${allowedStatuses.join(', ')}`,
            });
        }
        const quote = await models_1.Quote.findByPk(id);
        if (!quote) {
            return res.status(404).json({ message: 'Quote not found' });
        }
        if (quote.status !== 'pending') {
            return res.status(400).json({
                message: `Only pending quotes can be changed. Current: ${quote.status}`,
            });
        }
        // update quote first (safe at this point)
        await quote.update({
            status,
            ...(status === 'approved' && { approvedAt: new Date() }),
        });
        // -------------------------
        // INVOICE GENERATION
        // -------------------------
        if (status === 'approved') {
            const actorId = req.user?.id ?? quote.createdBy;
            try {
                await (0, invoice_controller_1.generateInvoiceForQuote)(quote.id, actorId);
            }
            catch (invoiceError) {
                console.error('Auto invoice generation failed:', invoiceError);
                // ❌ IMPORTANT: revert status OR fail request
                await quote.update({ status: 'pending', approvedAt: null });
                return res.status(400).json({
                    message: invoiceError?.message || 'Invoice generation failed',
                });
            }
        }
        // ONLY ONE SUCCESS RESPONSE
        return res.status(200).json({
            message: status === 'approved'
                ? 'Quote approved and invoice generated successfully'
                : `Quote ${status} successfully`,
            quote: {
                id: quote.id,
                quoteNumber: quote.quoteNumber,
                status: quote.status,
                approvedAt: quote.approvedAt,
            },
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.updateQuoteStatus = updateQuoteStatus;
// ==================================================================================
// @desc   DOWNLOAD QUOTE PDF
// @route  GET /quotes/:id/download
// @access Private
// Returns the stored PDF for a submitted/pending/approved quote
// ==================================================================================
const downloadQuotePdf = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing ID' });
            return;
        }
        const quote = await models_1.Quote.findByPk(id, {
            attributes: ['id', 'quoteNumber', 'pdfPath'],
        });
        if (!quote) {
            res.status(404).json({ message: 'Quote not found' });
            return;
        }
        if (!quote.pdfPath) {
            res.status(404).json({
                message: 'No PDF available for this quote. Submit the quote first to generate a PDF.',
            });
            return;
        }
        // Check the file actually exists on disk
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        if (!fs.existsSync(quote.pdfPath)) {
            res.status(404).json({ message: 'PDF file not found on server' });
            return;
        }
        // Send the file as a downloadable attachment
        res.download(quote.pdfPath, `${quote.quoteNumber}.pdf`);
    }
    catch (error) {
        next(error);
    }
};
exports.downloadQuotePdf = downloadQuotePdf;
//# sourceMappingURL=quote.controller.js.map