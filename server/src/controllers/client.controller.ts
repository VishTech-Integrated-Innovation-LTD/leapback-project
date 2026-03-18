// Importing Request, Response from express for typing the controller functions
import { Request, Response } from 'express';
import { Client } from '../models';






// ==================================================================================
// @desc   CREATE CLIENT
// @route  POST /clients
// @access Private(only logged in users)
// Adds a new client to the system
// Triggered by the "+ Add Client" button on the Client Records page
// Body: { clientName, email, contactPerson?, phone?, address? }
// ===================================================================================
export const createClient = async (req: Request, res: Response) => {
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
      email:         email.toLowerCase().trim(),
      contactPerson: contactPerson ?? null,
      phone:         phone         ?? null,
      address:       address       ?? null,
    });

    res.status(201).json({
      message: 'Client created successfully',
      client,
    });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating client.." });
    }
}





// ==================================================================================
// @desc   GET ALL CLIENTS
// @route  GET /clients?search=nexus
// @access Private(only logged in users)
// Returns all clients - populates the Client Records page in the prototype
// ===================================================================================
export const getAllClients = async (req: Request, res: Response) => {
    try {
        
    } catch (error) {
         console.error(error);
        res.status(500).json({ message: "Error fetching clients records.." });
    }
}