// Importing Request, Response, NextFunction from express for typing the controller functions
import { Request, Response, NextFunction } from 'express';
import { Inventory } from '../models';
import { Op } from 'sequelize';






// ==================================================================================
// @desc   CREATE INVENTORY ITEM
// @route  POST /inventory
// @access Private(only logged in users)
// Adds a new product or service to the inventory catalogue
// Triggered by the "+ Add Item" button on the Inventory page in the prototype
// Body: { name, type, category?, unitPrice, itemCode?, stockQty?, lowStockThreshold?, availabilityStatus? }
// ===================================================================================
export const createInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
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
      category: category ?? null,
      itemCode: itemCode ?? null,
      stockQty: type === 'product' ? stockQty : null,
      lowStockThreshold: lowStockThreshold ?? 5,
      availabilityStatus: type === 'service' ? (availabilityStatus ?? 'available') : null,
      isActive: true,
    });

    res.status(201).json({
      message: 'Inventory item created successfully',
      item,
    });
  } catch (error) {
  next(error);
  }
}





// ==================================================================================
// @desc   GET ALL INVENTORY
// @route  GET /inventory?search=solar&category=Solar&type=product
// @access Private(only logged in users)
// Returns all active inventory items; populates the Inventory page in the prototype
// Also used to populate the item dropdown on the New Quote page
// ===================================================================================
export const getAllInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, type } = req.query as {
      search?: string;
      category?: string;
      type?: string;
    };

    const whereClause: any = {
      // Only return active items - deactivated items are hidden from the catalogue
      isActive: true,
    };

    // Filter by item type (product or service) if provided
    if (type) {
      whereClause.type = type;
    }

    // Filter by category if provided - matches the category filter in the prototype
    // e.g. "Solar", "IT", "Services"
    if (category) {
      whereClause.category = category;
    }

    // Search by item name if provided - matches the search bar on the Inventory page
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const items = await Inventory.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: 'Inventory retrieved successfully',
      count: items.length,
      items,
    });
  } catch (error) {
   next(error);
  }
}




// ==================================================================================
// @desc   GET INVENTORY ITEM BY ID
// @route  GET /inventory/:id
// @access Private(only logged in users)
// Returns a single inventory item by its UUID
// ===================================================================================
export const getInventoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }

    const item = await Inventory.findByPk(id);
    if (!item) {
      res.status(404).json({ message: 'Inventory item not found' });
      return;
    }

    res.status(200).json({
      message: 'Inventory item retrieved successfully',
      item,
    });
  } catch (error) {
   next(error);
  }
}




// ==================================================================================
// @desc   UPDATE INVENTORY ITEM
// @route  PUT /inventory/:id
// @access Private(only logged in users)
// Updates an item's details - triggered by the "Edit" button in the prototype
// ===================================================================================
export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      name, category, unitPrice, itemCode,
      stockQty, lowStockThreshold, availabilityStatus, isActive,
    } = req.body;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }

    const item = await Inventory.findByPk(id);
    if (!item) {
      res.status(404).json({ message: 'Inventory item not found' });
      return;
    }

    // If a new itemCode is provided, make sure it's not already taken by another item
    if (itemCode && itemCode !== item.itemCode) {
      const codeTaken = await Inventory.findOne({ where: { itemCode } });
      if (codeTaken) {
        res.status(409).json({ message: `Item code "${itemCode}" is already in use` });
        return;
      }
    }

    // Update only the fields that were provided in the request body
    await item.update({
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(unitPrice !== undefined && { unitPrice }),
      ...(itemCode !== undefined && { itemCode }),
      ...(stockQty !== undefined && { stockQty }),
      ...(lowStockThreshold !== undefined && { lowStockThreshold }),
      ...(availabilityStatus !== undefined && { availabilityStatus }),
      ...(isActive !== undefined && { isActive }),
    });

    res.status(200).json({
      message: 'Inventory item updated successfully',
      item,
    });
  } catch (error) {
   next(error);
  }
}




// ==================================================================================
// @desc   DELETE INVENTORY ITEM
// @route  DELETE /inventory/:id
// @access Private(only logged in users)
// Soft deletes an item by setting isActive to false
// Items are never permanently deleted - they may be referenced by existing quotes
// ===================================================================================
export const deleteInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }

    const item = await Inventory.findByPk(id);
    if (!item) {
      res.status(404).json({ message: 'Inventory item not found' });
      return;
    }

    // Soft delete - set isActive to false instead of permanently removing
    // This preserves the item reference on any existing quote line items
    await item.update({ isActive: false });

    res.status(200).json({
      message: `"${item.name}" has been deactivated from the inventory catalogue`,
    });
  } catch (error) {
   next(error);
  }
}




// ==================================================================================
// @desc   RESTOCK INVENTORY ITEM
// @route   PATCH /inventory/:id/restock
// @access Private(only logged in users)
// Adds stock to a product - triggered by the "Restock" button in the prototype
// Only applies to products, not services
// Body: { quantity }
// ===================================================================================
export const restockInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'Invalid or missing ID' });
      return;
    }


    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      res.status(400).json({ message: 'A valid quantity greater than 0 is required' });
      return;
    }

    const item = await Inventory.findByPk(id);
    if (!item) {
      res.status(404).json({ message: 'Inventory item not found' });
      return;
    }

    // Restock only applies to physical products
    if (item.type !== 'product') {
      res.status(400).json({ message: 'Only products can be restocked' });
      return;
    }

    const newQty = (Number(item.stockQty) || 0) + Number(quantity);
    await item.update({ stockQty: newQty });

    res.status(200).json({
      message: `Restocked successfully - new stock: ${newQty} units`,
      item,
    });
  } catch (error) {
  next(error);
  }
}