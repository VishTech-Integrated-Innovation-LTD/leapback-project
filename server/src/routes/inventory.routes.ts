import { Router } from "express";

// Importing APIs handlers/controllers
import {
    createInventoryItem,
    getAllInventory,
    getInventoryById,
    updateInventoryItem,
    deleteInventoryItem,
    restockInventoryItem
} from '../controllers/inventory.controller'

const router = Router();

router.get('', getAllInventory);
router.post('', createInventoryItem);
router.get('/:id', getInventoryById);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);
router.patch('/:id/restock', restockInventoryItem);





export default router;