import { Router } from 'express';
import { visitGarden, getGardenState, waterGarden } from './garden.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all garden routes
router.use(authenticate);

// POST /garden/visit
router.post('/visit', visitGarden);

// GET /garden/state
router.get('/state', getGardenState);

// POST /garden/water
router.post('/water', waterGarden);

export default router;
