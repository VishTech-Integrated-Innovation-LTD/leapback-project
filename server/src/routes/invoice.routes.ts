import { Router } from "express";

// Importing APIs handlers/controllers
import {
    getAllInvoice,
    getInvoiceById,
    generateInvoice,
    updateInvoiceStatus,
    downloadInvoicePdf,
    resendInvoiceEmail
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
router.post('/generate/:quoteId', generateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.get('/:id/download', downloadInvoicePdf);
router.post('/:id/resend', resendInvoiceEmail);






export default router;