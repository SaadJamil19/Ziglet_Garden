import { Router } from 'express';
import { getRewardHistory } from './rewards.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /rewards/history
router.get('/history', getRewardHistory);

export default router;
