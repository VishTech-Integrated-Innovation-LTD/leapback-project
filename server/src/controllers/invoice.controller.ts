// Importing Request, Response, NextFunction from express for typing the controller functions
import { Request, Response, NextFunction } from 'express';
import { Client, Inventory, Invoice, InvoiceItem, Quote, QuoteItem, User } from '../models';
import { Op } from 'sequelize';
import { sendInvoiceEmail } from '../services/email.service';
import sequelize from '../db';
import { nextInvoiceNumber } from '../utils/numbering';
import { generatePDF } from '../services/pdf.service';


// ==================================================================================
// @desc   GET ALL INVOICES
// @route  GET /invoices?status=paid&search=techbridge
// @access Private(only logged in users)
// Returns all invoices - populates the Invoice list in the prototype
// ===================================================================================
export const getAllInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query as { status?: string, search?: string };

    // Build the where clause dynamically based on query params
    const whereClause: any = {}

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'clientName', 'email'],
          ...(search && {
            where: { clientName: { [Op.iLike]: `%${search}%` } },
          }),
        },
        {
          model: Quote,
          as: 'quote',
          attributes: ['id', 'quoteNumber'],
        },
        {
          model: User,
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

  } catch (error) {
  next(error);
  }
}




// ==================================================================================
// @desc   GET INVOICE BY ID
// @route  GET /invoices/:id
// @access Private(only logged in users)
// Returns a single invoice with all line items and client details
// Populates the Invoice View page in the prototype
// ===================================================================================
export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'clientName', 'contactPerson', 'email', 'phone', 'address'],
        },
        {
          model: InvoiceItem,
          as: 'items',
          attributes: ['id', 'itemName', 'itemType', 'quantity', 'unitPrice', 'lineTotal'],
        },
        {
          model: Quote,
          as: 'quote',
          attributes: ['id', 'quoteNumber'],
        },
        {
          model: User,
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
  } catch (error) {
  next(error);
  }
}




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
export const generateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  // Use a transaction - invoice creation, inventory deduction, and PDF generation
  // must all succeed together or all roll back
  const transaction = await sequelize.transaction();

  try {
    const { quoteId } = req.params;

    if (!quoteId || typeof quoteId !== 'string') {
      res.status(400).json({ message: 'Invalid or missing quote ID' });
      return;
    }


    // Load the approved quote with its client and line items
    const quote = await Quote.findByPk(quoteId, {
      include: [
        { model: Client, as: 'client' },
        { model: QuoteItem, as: 'items' },
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
    const existingInvoice = await Invoice.findOne({ where: { quoteId } });
    if (existingInvoice) {
      await transaction.rollback();
      res.status(409).json({
        message: `An invoice already exists for this quote: ${existingInvoice.invoiceNumber}`,
      });
      return;
    }

    const client = (quote as any).client;
    const items = (quote as any).items;

    // --------- INVENTORY DEDUCTION  --------------------------------------------
    // Deduct stock for all product line items atomically
    // Services are skipped since they don't have physical stock
    // Uses row-level locking to prevent race conditions on concurrent approvals
    for (const item of items) {
      if (item.itemType === 'product' && item.inventoryId) {
        const inventoryItem = await Inventory.findOne({
          where: { id: item.inventoryId },
          lock: transaction.LOCK.UPDATE,   // row-level lock. It prevents other transactions from modifying, deleting, or locking those rows until the current transaction commits or rolls back, ensuring data consistency.
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
    const invoiceNumber = await nextInvoiceNumber();

    // Due date - 14 days from today, shown as "Due Date: Mar 15, 2026" on the prototype
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateString = dueDate.toISOString().split('T')[0];  // YYYY-MM-DD

    const invoice = await Invoice.create(
      {
        invoiceNumber,
        quoteId: quote.id!, // ! (non-null assertion)
        clientId: quote.clientId!,
        createdBy: (req as any).user?.id,
        status: 'sent',
        vatRate: quote.vatRate,
        subtotal: quote.subtotal,
        vatAmount: quote.vatAmount,
        grandTotal: quote.grandTotal,
        pdfPath: null,
        dueDate: dueDateString,
        paidAt: null,
        sentAt: null,
      },
      { transaction }
    );

    // ---- CREATE INVOICE LINE ITEMS -------------------------------------------------
    // Copy line items from the quote as immutable snapshots(creating a read-only, permanent record of the product details)
    // Prices are locked at the time of invoice generation
    await InvoiceItem.bulkCreate(
      items.map((item: any) => ({
        invoiceId: invoice.id,
        itemName: item.itemName,
        itemType: item.itemType,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
      { transaction }
    );

    // Commit the transaction - invoice, items, and inventory deductions are all saved
    await transaction.commit();

    // --- GENERATE INVOICE PDF ------------------------------------------------------------
    // Runs after commit so the invoice is fully saved before PDF generation starts
    const pdfPath = await generatePDF({
      type: 'invoice',
      refNumber: invoice.invoiceNumber,
      linkedRef: quote.quoteNumber,        // "Quote Ref: QT-023" on the invoice PDF
      client: {
        clientName: client.clientName,
        contactPerson: client.contactPerson ?? null,
        email: client.email,
        phone: client.phone ?? null,
      },
      items: items.map((i: any) => ({
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
    sendInvoiceEmail({
      to: client.email,
      clientName: client.clientName,
      invoiceNumber: invoice.invoiceNumber,
      pdfPath,
      grandTotal: Number(invoice.grandTotal),
      dueDate: dueDate.toLocaleDateString('en-NG'),
    }).catch((err: Error) => console.error('Invoice email failed:', err.message));

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

  } catch (error) {
    // Roll back the transaction if anything went wrong
    await transaction.rollback();
   next(error);
  }
}




// ==================================================================================
// @desc   UPDATE INVOICE STATUS
// @route  PATCH /invoices/:id/status
// @access Private(only logged in users)
// Marks an invoice as paid or cancelled
// Triggered manually by staff - "Mark as Paid" action on the invoice view
// Body: { status: 'paid' | 'cancelled' }
// ==================================================================================
export const updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction) => {
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

    const invoice = await Invoice.findByPk(id);
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
  } catch (error) {
    next(error);
  }
}




// ==================================================================================
// @desc   DOWNLOAD INVOICE PDF
// @route  GET /invoices/:id/download
// @access Private(only logged in users)
// Returns the PDF file for download or inline viewing
// Triggered by the "Download PDF" button on the Invoice View page in the prototype
// ==================================================================================
export const downloadInvoicePdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }

    const invoice = await Invoice.findByPk(id, {
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
    const fs = await import('fs');
    if (!fs.existsSync(invoice.pdfPath)) {
      res.status(404).json({ message: 'PDF file not found on server' });
      return;
    }

    // Send the file as a downloadable attachment
    res.download(invoice.pdfPath, `${invoice.invoiceNumber}.pdf`);

  } catch (error) {
    next(error);
  }
}




// ==================================================================================
// @desc   RESEND INVOICE EMAIL
// @route  POST /invoices/:id/resend
// @access Private(only logged in users)
// Resends the invoice PDF to the client - useful if the first email was missed
// Triggered by the "Send Email" button on the Invoice View page in the prototype
// ==================================================================================
export const resendInvoiceEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }

    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: Client, as: 'client' },
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

    const client = (invoice as any).client;

    await sendInvoiceEmail({
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
  } catch (error) {
   next(error);
  }
}