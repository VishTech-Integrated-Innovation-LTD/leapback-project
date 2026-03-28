import { Router } from "express";

// Importing APIs handlers/controllers
import {
    getAllInvoice,
    getInvoiceById
} from '../controllers/invoice.controller'

// Importing middleware
import authenticate from "../middleware/auth.middleware";


const router = Router();

// ======================
// PROTECT ALL ROUTES
// ======================
router.use(authenticate); 



router.get('', getAllInvoice);
router.get('/:id', getInvoiceById);






export default router;