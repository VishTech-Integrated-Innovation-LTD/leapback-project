import { Router } from "express";

// Importing APIs handlers/controllers
import {
    getAllQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
    submitQuote,
    updateQuoteStatus,
    downloadQuotePdf
} from '../controllers/quote.controller';

// Importing middleware
import authenticate from "../middleware/auth.middleware";


const router = Router();


// ======================
// PROTECT ALL ROUTES
// ======================
router.use(authenticate);

router.get('', getAllQuotes);
router.get('/:id', getQuoteById);
router.post('', createQuote);
router.put('/:id', updateQuote);
router.patch('/:id/submit', submitQuote);
router.patch('/:id/status', updateQuoteStatus);
router.get('/:id/download', downloadQuotePdf);




export default router;