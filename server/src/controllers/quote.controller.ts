// Importing Request, Response from express for typing the controller functions
import { Request, Response } from 'express';
// Impoerting all models
import { Client, Inventory, Quote, QuoteItem, User } from '../models';
// Importing Op from sequelize for query operators like iLike (case-insensitive search)
import { Op } from 'sequelize';
// Importing sequelize instance for transactions - ensures quote + items are saved atomically
import sequelize from '../db';
// Importing the utility that generates sequential quote numbers e.g. QT-024, QT-025
import { nextQuoteNumber } from '../utils/numbering';
// Importing PDF generation services
import { generatePDF } from '../services/pdf.service';
import { sendQuoteEmail } from '../services/email.service';





// ==================================================================================
// @desc   GET ALL QUOTES
// @route  GET /quotes?status=pending&search=nexus
// @access Private(only logged in users)
// Returns all quotes with optional status filter and search
//  Populates the quotes table (shows Quote ID, Client, Items, Amount, Status, Date)
// ===================================================================================
export const getAllQuotes = async (req: Request, res: Response) => {
    try {
        const { status, search } = req.query as { status?: string, search?: string };

        // Build the where clause dynamically based on query params
        const whereClause: any = {}

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
        
        const quotes = await Quote.findAll({
            where: whereClause,
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'clientName', 'email'],
                    // Filter by client name if search query is provided
                    ...(search && {
                        where: { clientName: { [Op.iLike]: `%${search}%` } },
                    }),
                },
                {
                    // Include items just to get the count — shown as "4 items" in the prototype quotes table
                    model: QuoteItem,
                    as: 'items',
                    attributes: ['id'],
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name'],
                },
            ],
            order: [['createdAt', 'DESC']],
        })

        res.status(200).json({
            message: 'Quotes retrieved successfully',
            count: quotes.length,
            quotes,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving quotes" });
    }
}




// ==================================================================================
// @desc   GET QUOTE BY ID
// @route  GET /quotes/:id
// @access Private(only logged in users)
//  Returns a single quote with all its line items and client details
// Populates the quote detail/view page
// ===================================================================================
export const getQuoteById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing user ID' });
            return;
        }

        const quote = await Quote.findByPk(id, {
            include: [
                {
                    model: Client,
                    as: 'client',
                    // All client fields needed for the billed-to section on the quote/invoice PDF
                    attributes: ['id', 'clientName', 'contactPerson', 'email', 'phone', 'address'],
                },
                {
                    model: QuoteItem,
                    as: 'items',
                    attributes: ['id', 'itemName', 'itemType', 'quantity', 'unitPrice', 'lineTotal', 'inventoryId'],
                },
                {
                    model: User,
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving quote by id" });
    }
}




// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// HELPER - PROCESS LINE ITEMS
// Shared logic used by both createQuote and updateQuote
// If inventoryId is provided, fetches item details from inventory (dropdown flow)
// If no inventoryId, validates that manual entry fields are all present
// Returns processed items with lineTotals calculated, and the running subtotal
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// 1. Define the expected incoming shape (what the client sends)
interface LineItemInput {
    inventoryId?: number | string;     // or string if UUID
    itemName?: string;
    itemType?: string;
    unitPrice?: number | string;
    quantity: number | string;         // usually comes as string from JSON
    // add other optional fields your frontend might send
}

// 2. Define the shape we return (enriched + guaranteed fields)
interface ProcessedLineItem {
    inventoryId?: number | string;
    itemName: string;
    itemType: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    // add any other fields you want to preserve (description, taxRate, etc.)
}

// 3. The helper function — fully typed
const processLineItems = async (
    items: LineItemInput[]
): Promise<{ processedItems: ProcessedLineItem[]; subtotal: number }> => {
    let subtotal = 0;

    const processedItems = await Promise.all(
        items.map(async (item): Promise<ProcessedLineItem> => {
            let unitPrice: number;
            let itemName: string;
            let itemType: string;

            if (item.inventoryId) {
                // Dropdown flow: enforce catalogue data
                const inventoryItem = await Inventory.findByPk(item.inventoryId);
                if (!inventoryItem) {
                    throw new Error(`Inventory item not found: ${item.inventoryId}`);
                }
                if (!inventoryItem.isActive) {
                    throw new Error(`Inventory item "${inventoryItem.name}" is no longer active`);
                }

                itemName = inventoryItem.name;
                itemType = inventoryItem.type;
                unitPrice = Number(inventoryItem.unitPrice); // trust DB number
            } else {
                // Manual entry → require & convert
                if (!item.itemName || !item.itemType || !item.unitPrice) {
                    throw new Error(
                        'Manual items must provide itemName, itemType, and unitPrice'
                    );
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
                ...item,               // preserve extra fields (discount, notes, etc.)
                itemName,
                itemType,
                unitPrice,
                quantity,
                lineTotal,
            };
        })
    );

    return { processedItems, subtotal };
};



// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// HELPER — CALCULATE VAT TOTALS
// VAT is optional — if vatRate is null or 0, no VAT is applied
// grandTotal = subtotal + vatAmount (or just subtotal if no VAT)
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
const calculateTotals = (subtotal: number, vatRate: number | null) => {
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
// Creates a new quote with line items — can be saved as draft or submitted immediately
// Triggered by the New Quote page
// ===================================================================================
export const createQuote = async (req: Request, res: Response) => {
    // Use a transaction so the quote and all its items are saved together
    // If anything fails, everything is rolled back — no orphaned quotes or missing items
    const transaction = await sequelize.transaction();
    try {
        const {
            clientId,
            items,
            notes,
            vatRate,
            submit,   // if true, status becomes 'pending' and PDF + email are triggered
        } = req.body;

        // Validate required fields
        if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
            await transaction.rollback();
            res.status(400).json({ message: 'Client and at least one line item are required' });
            return;
        }

        // Confirm the client exists before creating the quote
        const client = await Client.findByPk(clientId);
        if (!client) {
            await transaction.rollback();
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Process line items — resolves inventory lookups and validates manual entries
        const { processedItems, subtotal } = await processLineItems(items);

        // Calculate VAT totals — vatRate is optional, null means no VAT applied
        const totals = calculateTotals(subtotal, vatRate ? parseFloat(vatRate) : null);
    
    // Generate the next sequential quote number e.g. QT-025
    const quoteNumber = await nextQuoteNumber();

    // Determine status — 'draft' if saving, 'pending' if submitting immediately
    const status = submit ? 'pending' : 'draft';

// ------------------------------------------------------------------------------------
// CREATE QUOTE RECORD
// Saves the main quote information in the quotes table.
// This includes the quote number, client, totals, status,
// and metadata like who created it.
// The transaction ensures the quote and its items are saved together.
// ------------------------------------------------------------------------------------
const quote = await Quote.create(
  {
    quoteNumber,                  // Generated quote number (e.g. QT-001)
    clientId,                     // The client this quote belongs to
    // createdBy: (req as any).user?.id, // ID of logged-in user (set by auth middleware)
// NEW - Hardcode a user ID for testing
createdBy: "4844f879-d915-4bf4-aaac-d3edd2a81b45",

    status,                       // Current quote status (draft, pending, etc.)
    subtotal,                     // Sum of all line item totals before tax/discount

    notes: notes ?? null,         // Optional notes attached to the quote
                                  // If undefined, store null in the database

    pdfPath: null,                // Will store the generated PDF file path later
    sentAt: null,                 // Timestamp when quote is sent to client
    approvedAt: null,             // Timestamp when client approves the quote

    ...totals,                    // Spread additional totals (tax, discount, grandTotal etc.)
  },
  { transaction }                 // Attach to the transaction so it can be rolled back if needed
);


// ------------------------------------------------------------------------------------
// CREATE QUOTE LINE ITEMS
// Inserts all items that belong to this quote.
// Each item represents a product/service line in the quote.
// Using bulkCreate is more efficient than inserting one by one.
// ------------------------------------------------------------------------------------
await QuoteItem.bulkCreate(
  processedItems.map((item: any) => ({
    quoteId: quote.id!,            // Foreign key linking item to the quote

    inventoryId: item.inventoryId ?? null, 
                                  // If item came from inventory dropdown, store its ID
                                  // Otherwise null for manually entered items

    itemName: item.itemName,      // Name of the product/service
    itemType: item.itemType,      // Category/type of item
    quantity: item.quantity,      // Quantity requested
    unitPrice: item.unitPrice,    // Price per unit
    lineTotal: item.lineTotal,    // quantity × unitPrice
  })),
  { transaction }                 // Ensures items are saved within the same transaction
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
        const savedItems = await QuoteItem.findAll({ 
            where: { quoteId: quote.id } 
        });

        console.log("=== Starting PDF Generation ===");
        console.log("Quote Number:", quote.quoteNumber);
        console.log("Client Email:", client.email);
        console.log("Items Count:", savedItems.length);

       const pdfPath = await generatePDF({
    type: 'quote',
    refNumber: quote.quoteNumber,
    client: {
        clientName:    client.clientName,
        contactPerson: client.contactPerson,
        email:         client.email,
        phone:         client.phone ?? null,
    },
    items: savedItems.map((i: any) => ({
        itemName:  i.itemName,
        itemType:  i.itemType,
        quantity:  Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
    })),
    subtotal:   Number(quote.subtotal),
    vatRate:    quote.vatRate ? Number(quote.vatRate) : null,
    vatAmount:  quote.vatAmount ? Number(quote.vatAmount) : null,
    grandTotal: Number(quote.grandTotal),
    issueDate:  new Date().toLocaleDateString('en-NG'),
    status:     'pending',
});

      // Save the PDF path and mark sentAt on the quote record
        await quote.update({ pdfPath, sentAt: new Date() });

        console.log("PDF Generated Successfully at:", pdfPath);

    // Send the quote PDF to the client via email - fire and forget
      // The quote is already saved so an email failure won't affect the response        
sendQuoteEmail({
        to:          client.email,
        clientName:  client.clientName,
        quoteNumber: quote.quoteNumber,
        pdfPath,
        grandTotal:  Number(quote.grandTotal),
      }).catch((err: Error) => console.error('Quote email failed:', err.message));
        
      
      return res.status(201).json({
            message: 'Quote submitted, PDF generated, and email queued successfully',
            quote: { ...quote.toJSON(), pdfPath }
        });

    } catch (pdfOrEmailError: any) {
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
            pdfOrEmailError: pdfOrEmailError.message   // This will now show in Postman
        });
    }
}




    // If submit is true, generate the PDF and email it to the client
    // This runs after commit so the quote is fully saved before PDF generation starts
//     if (submit) {
//         const savedItems = await QuoteItem.findAll({ where: { quoteId: quote.id } });

//         const pdfPath = await generatePDF({
//         type:      'quote',
//         refNumber: quote.quoteNumber,
//         client: {
//           clientName:    client.clientName,
//           contactPerson: client.contactPerson ?? null,
//           email:         client.email,
//           phone:         client.phone ?? null,
//         },
//         items: savedItems.map((i: any) => ({
//           itemName:  i.itemName,
//           itemType:  i.itemType,
//           quantity:  Number(i.quantity),
//           unitPrice: Number(i.unitPrice),
//           lineTotal: Number(i.lineTotal),
//         })),
//         subtotal:   Number(quote.subtotal),
//         vatRate:    quote.vatRate    ? Number(quote.vatRate)   : null,
//         vatAmount:  quote.vatAmount  ? Number(quote.vatAmount) : null,
//         grandTotal: Number(quote.grandTotal),
//         issueDate:  new Date().toLocaleDateString('en-NG'),
//         status:     'pending',
//       });

//       // Save the PDF path and mark sentAt on the quote record
//       await quote.update({ pdfPath, sentAt: new Date() });

// res.status(201).json({
//       message: submit
//         ? 'Quote submitted and pdf generated successfully'
//         : 'Quote saved as draft successfully',
//       quote: {
//         id:          quote.id,
//         quoteNumber: quote.quoteNumber,
//         status:      quote.status,
//         subtotal:    quote.subtotal,
//         vatRate:     quote.vatRate,
//         vatAmount:   quote.vatAmount,
//         grandTotal:  quote.grandTotal,
//         clientId:    quote.clientId,
//         // createdAt:   quote.createdAt,
//       },
//     });

//     }

    } catch (error) {
        // Roll back the transaction if anything went wrong
    await transaction.rollback();
        console.error(error);
        res.status(500).json({ message: "Error creating quote.." });
    }
}