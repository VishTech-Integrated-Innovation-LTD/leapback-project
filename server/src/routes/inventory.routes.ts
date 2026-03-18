import { Router } from "express";

// Importing APIs handlers/controllers
import {
    createInventoryItem,
    getAllInventory,
} from '../controllers/inventory.controller'

const router = Router();

router.get('', getAllInventory);
router.post('', createInventoryItem);




export default router;