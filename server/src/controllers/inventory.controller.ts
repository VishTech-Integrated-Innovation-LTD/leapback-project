// Importing Request, Response from express for typing the controller functions
import { Request, Response } from 'express';
import { Inventory } from '../models';






// ==================================================================================
// @desc   CREATE INVENTORY ITEM
// @route  POST /inventory
// @access Private(only logged in users)
// Adds a new product or service to the inventory catalogue
// Triggered by the "+ Add Item" button on the Inventory page in the prototype
// Body: { name, type, category?, unitPrice, itemCode?, stockQty?, lowStockThreshold?, availabilityStatus? }
// ===================================================================================
export const createInventoryItem = async (req: Request, res: Response) => {
try {
     const {
      name, type, category, unitPrice,
      itemCode, stockQty, lowStockThreshold, availabilityStatus,
    } = req.body;

    // Validate required fields
    if (!name || !type || !unitPrice) {
      res.status(400).json({ message: 'Name, type, and unit price are required' });
      return;
    }

    // Validate type value
    if (!['product', 'service'].includes(type)) {
      res.status(400).json({ message: 'Type must be either "product" or "service"' });
      return;
    }

    // Products must have a stockQty; services must not
    if (type === 'product' && (stockQty === undefined || stockQty === null)) {
      res.status(400).json({ message: 'Stock quantity is required for products' });
      return;
    }

    // If an itemCode is provided, make sure it's not already taken
    if (itemCode) {
      const codeTaken = await Inventory.findOne({ where: { itemCode } });
      if (codeTaken) {
        res.status(409).json({ message: `Item code "${itemCode}" is already in use` });
        return;
      }
    }

    const item = await Inventory.create({
      name,
      type,
      unitPrice,
      category:           category           ?? null,
      itemCode:           itemCode           ?? null,
      stockQty:           type === 'product' ? stockQty : null,
      lowStockThreshold:  lowStockThreshold  ?? 5,
      availabilityStatus: type === 'service' ? (availabilityStatus ?? 'available') : null,
      isActive:           true,
    });

    res.status(201).json({
      message: 'Inventory item created successfully',
      item,
    });
} catch (error) {
    console.error(error);
        res.status(500).json({ message: "Error creating inventory item.." });
}
}





// ==================================================================================
// @desc   GET ALL INVENTORY
// @route  GET /inventory?search=solar&category=Solar&type=product
// @access Private(only logged in users)
// Returns all active inventory items; populates the Inventory page in the prototype
// Also used to populate the item dropdown on the New Quote page
// ===================================================================================
export const getAllInventory = async (req: Request, res: Response) => {
try {
    
} catch (error) {
            res.status(500).json({ message: "Error fetching inventory items.." });
}
}