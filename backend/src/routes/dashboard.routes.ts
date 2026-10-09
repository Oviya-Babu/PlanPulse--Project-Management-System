import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// GET /api/dashboard - statistics for the authenticated user
router.get('/', authenticate, dashboardController.getDashboard);

export default router;
