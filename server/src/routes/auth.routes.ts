import { Router } from "express";

// Importing APIs handlers/controllers
import {
    registerUser,
    loginUser
} from '../controllers/auth.controller'

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);


export default router;