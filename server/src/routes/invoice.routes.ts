import { Router } from "express";

// Importing APIs handlers/controllers
import {
    getAllInvoice
} from '../controllers/invoice.controller'

const router = Router();

router.get('', getAllInvoice);






export default router;