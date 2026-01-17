import { Router } from 'express';
import { visitGarden, getGardenState } from './garden.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all garden routes
router.use(authenticate);

// POST /garden/visit
router.post('/visit', visitGarden);

// GET /garden/state
router.get('/state', getGardenState);

export default router;
