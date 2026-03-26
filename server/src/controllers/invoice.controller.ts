// Importing Request, Response from express for typing the controller functions
import { Request, Response } from 'express';
import { Client, Invoice, InvoiceItem, Quote, User } from '../models';
import { Op } from 'sequelize';

// ==================================================================================
// @desc   GET ALL INVOICES
// @route  GET /invoices?status=paid&search=techbridge
// @access Private(only logged in users)
// Returns all invoices - populates the Invoice list in the prototype
// ===================================================================================
export const getAllInvoice = async (req: Request, res: Response) => {
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
          model:      Client,
          as:         'client',
          attributes: ['id', 'clientName', 'email'],
          ...(search && {
            where: { clientName: { [Op.iLike]: `%${search}%` } },
          }),
        },
        {
          model:      Quote,
          as:         'quote',
          attributes: ['id', 'quoteNumber'],
        },
        {
          model:      User,
          as:         'creator',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: 'Invoices retrieved successfully',
      count:   invoices.length,
      invoices,
    });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving invoices" });
    }
}




// ==================================================================================
// @desc   GET INVOICE BY ID
// @route  GET /invoices/:id
// @access Private(only logged in users)
// Returns a single invoice with all line items and client details
// Populates the Invoice View page in the prototype
// ===================================================================================
export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing ID' });
            return;
        }

       const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model:      Client,
          as:         'client',
          attributes: ['id', 'clientName', 'contactPerson', 'email', 'phone', 'address'],
        },
        {
          model:      InvoiceItem,
          as:         'items',
          attributes: ['id', 'itemName', 'itemType', 'quantity', 'unitPrice', 'lineTotal'],
        },
        {
          model:      Quote,
          as:         'quote',
          attributes: ['id', 'quoteNumber'],
        },
        {
          model:      User,
          as:         'creator',
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
        console.error(error);
        res.status(500).json({ message: "Error retrieving invoice by id" });
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
export const generateInvoice = async (req: Request, res: Response) => {
try {
    
} catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating invoice." });
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
export const updateInvoiceStatus = async (req: Request, res: Response) => {
try {
    
} catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating invoice status." });
}
}




// ==================================================================================
// @desc   DOWNLOAD INVOICE PDF
// @route  GET /invoices/:id/download
// @access Private(only logged in users)
// Returns the PDF file for download or inline viewing
// Triggered by the "Download PDF" button on the Invoice View page in the prototype
// ==================================================================================
export const downloadInvoicePdf = async (req: Request, res: Response) => {
try {
    
} catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error downloading invoice pdf." });
}
}




// ==================================================================================
// @desc   RESEND INVOICE EMAIL
// @route  POST /invoices/:id/resend
// @access Private(only logged in users)
// Resends the invoice PDF to the client - useful if the first email was missed
// Triggered by the "Send Email" button on the Invoice View page in the prototype
// ==================================================================================
export const resendInvoiceEmail = async (req: Request, res: Response) => {
    try {
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error resending invoice email.." });
    }
}