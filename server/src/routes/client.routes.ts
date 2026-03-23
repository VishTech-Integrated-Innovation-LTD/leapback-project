import { Router } from "express";

// Importing APIs handlers/controllers
import {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    deleteClient
} from '../controllers/client.controller'

const router = Router();

router.get('', getAllClients);
router.post('', createClient);
router.get('/:id', getClientById);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);




export default router;