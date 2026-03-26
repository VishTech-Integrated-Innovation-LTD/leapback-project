import { Router } from "express";

// Importing APIs handlers/controllers
import {
    getAllInvoice,
    getInvoiceById
} from '../controllers/invoice.controller'

const router = Router();

router.get('', getAllInvoice);
router.get('/:id', getInvoiceById);






export default router;