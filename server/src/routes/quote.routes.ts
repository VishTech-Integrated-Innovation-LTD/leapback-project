import { Router } from "express";

// Importing APIs handlers/controllers
import {
    getAllQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
    submitQuote,
    updateQuoteStatus
} from '../controllers/quote.controller'

const router = Router();

router.get('', getAllQuotes);
router.get('/:id', getQuoteById);
router.post('', createQuote);
router.put('/:id', updateQuote);
router.patch('/:id/submit', submitQuote);
router.patch('/:id/status', updateQuoteStatus);





export default router;