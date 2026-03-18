import { Router } from "express";

// Importing APIs handlers/controllers
import {
    getAllQuotes,
    getQuoteById,
    createQuote
} from '../controllers/quote.controller'

const router = Router();

router.get('', getAllQuotes);
router.get('/:id', getQuoteById);
router.post('', createQuote);




export default router;