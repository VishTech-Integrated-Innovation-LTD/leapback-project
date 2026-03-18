import { Router } from "express";

// Importing APIs handlers/controllers
import {
    createClient,
    getAllClients,
} from '../controllers/client.controller'

const router = Router();

router.get('', getAllClients);
router.post('', createClient);




export default router;