import { Router } from 'express';
import { verifyAction } from './external.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// POST /external/verify
router.post('/verify', verifyAction);

export default router;
