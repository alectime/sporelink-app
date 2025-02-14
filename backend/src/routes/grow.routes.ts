import { Router } from 'express';
import { GrowController } from '../controllers/grow.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const growController = new GrowController();

// All grow routes require authentication
router.use(authenticate);

// Grow routes
router.post('/', growController.createGrow);
router.get('/', growController.getGrows);
router.get('/:growId', growController.getGrowById);
router.patch('/:growId', growController.updateGrow);
router.delete('/:growId', growController.deleteGrow);

export const growRoutes = router; 