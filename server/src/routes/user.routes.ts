import { Router } from "express";

// Importing APIs handlers/controllers
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} from '../controllers/user.controller'

// Importing middleware
import authenticate from "../middleware/auth.middleware";

const router = Router();

// ======================
// PROTECT ALL USER ROUTES
// ======================
router.use(authenticate);     


router.get('', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);


export default router;