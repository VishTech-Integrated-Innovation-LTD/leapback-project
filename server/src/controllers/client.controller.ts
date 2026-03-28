// Importing Request, Response, NextFunction from express for typing the controller functions
import { Request, Response, NextFunction } from 'express';
import { Client, Invoice, Quote } from '../models';
// Importing Op from sequelize for case-insensitive search
import { Op } from 'sequelize';






// ==================================================================================
// @desc   CREATE CLIENT
// @route  POST /clients
// @access Private(only logged in users)
// Adds a new client to the system
// Triggered by the "+ Add Client" button on the Client Records page
// Body: { clientName, email, contactPerson?, phone?, address? }
// ===================================================================================
export const createClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientName, email, contactPerson, phone, address } = req.body;

    // Validate required fields
    if (!clientName || !email) {
      res.status(400).json({ message: 'Client name and email are required' });
      return;
    }

    // Check if a client with this email already exists
    const existing = await Client.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      res.status(409).json({ message: 'A client with that email already exists' });
      return;
    }

    const client = await Client.create({
      clientName,
      email: email.toLowerCase().trim(),
      contactPerson: contactPerson ?? null,
      phone: phone ?? null,
      address: address ?? null,
    });

    res.status(201).json({
      message: 'Client created successfully',
      client,
    });

  } catch (error) {
    next(error);
  }
}





// ==================================================================================
// @desc   GET ALL CLIENTS
// @route  GET /clients?search=nexus
// @access Private(only logged in users)
// Returns all clients - populates the Client Records page in the prototype
// ===================================================================================
export const getAllClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query as { search?: string }

    // Build the where clause dynamically based on query params
    const whereClause: any = {};
    if (search) {
      whereClause[Op.or] = [
        { clientName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const clients = await Client.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      message: 'Clients retrieved successfully',
      count: clients.length,
      clients,
    });
  } catch (error) {
    next(error);
  }
}




// ==================================================================================
// @desc   GET CLIENT BY ID
// @route  GET /clients/:id
// @access Private(only logged in users)
// Returns a single client with their full quote and invoice history
// Populates the client detail panel in the prototype - shows Total Quotes,
// Invoices, Total Spend, and the Quote & Invoice History table
// ===================================================================================
export const getClientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }

    const client = await Client.findByPk(id);
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    // Fetch quotes for this client - shown in the Quote & Invoice History table
    const quotes = await Quote.findAll({
      where: { clientId: id },
      attributes: ['id', 'quoteNumber', 'status', 'grandTotal', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    // Fetch invoices for this client
    const invoices = await Invoice.findAll({
      where: { clientId: id },
      attributes: ['id', 'invoiceNumber', 'status', 'grandTotal', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    // Calculate total spend - sum of all paid invoice grand totals
    // Shown as "₦1.8M Total Spend" in the prototype client detail panel
    const totalSpend = invoices
      .filter((inv: any) => inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + Number(inv.grandTotal), 0);

    res.status(200).json({
      message: 'Client retrieved successfully',
      client,
      stats: {
        totalQuotes: quotes.length,
        totalInvoices: invoices.length,
        totalSpend,
      },
      quotes,
      invoices,
    });
  } catch (error) {
    next(error);
  }
}




// ==================================================================================
// @desc   UPDATE CLIENT
// @route  PUT /clients/:id
// @access Private(only logged in users)
// Updates a client's details
// Triggered by editing a client record on the Client Records page
// Body: { clientName?, email?, contactPerson?, phone?, address? }
// ===================================================================================
export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { clientName, email, contactPerson, phone, address } = req.body;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }

    const client = await Client.findByPk(id);
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    // If a new email is provided, make sure it isn't already taken by another client
    if (email && email.toLowerCase().trim() !== client.email) {
      const emailTaken = await Client.findOne({
        where: { email: email.toLowerCase().trim() },
      });
      if (emailTaken) {
        res.status(409).json({ message: 'A client with that email already exists' });
        return;
      }
    }

    // Update only the fields that were provided in the request body
    await client.update({
      ...(clientName !== undefined && { clientName }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
      ...(contactPerson !== undefined && { contactPerson }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
    });

    res.status(200).json({
      message: 'Client details updated successfully',
      client,
    });
  } catch (error) {
    next(error);
  }
}




// ==================================================================================
// @desc   DELETE CLIENT
// @route  DELETE /clients/:id
// @access Private(only logged in users)
// Permanently removes a client from the system
// Note: Will fail if the client has existing quotes or invoices (RESTRICT constraint)
// ===================================================================================
export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }

    const client = await Client.findByPk(id);
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    // Check if the client has any quotes or invoices before deleting
    // The DB RESTRICT constraint would catch this anyway, but a friendly
    // message is better than a raw constraint error reaching the frontend
    const quoteCount = await Quote.count({ where: { clientId: id } });
    if (quoteCount > 0) {
      res.status(400).json({
        message: `Cannot delete client - they have ${quoteCount} quote(s) on record`,
      });
      return;
    }

    const clientName = client.clientName;
    await client.destroy();

    res.status(200).json({
      message: `Client "${clientName}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}