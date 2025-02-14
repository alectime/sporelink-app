import { Router } from 'express';
import { EnvironmentController } from '../controllers/environment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const environmentController = new EnvironmentController();

// All environment routes require authentication
router.use(authenticate);

// Environment routes
router.get('/', environmentController.getEnvironment);
router.post('/', environmentController.updateEnvironment);
router.get('/history', environmentController.getEnvironmentHistory);

export const environmentRoutes = router; 