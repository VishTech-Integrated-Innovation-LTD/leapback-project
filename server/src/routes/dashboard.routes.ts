import { Router }             from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import authenticate          from '../middleware/auth.middleware';

const router = Router();

// GET /dashboard?period=week|month|year
router.get('/', authenticate, getDashboardStats);

export default router;