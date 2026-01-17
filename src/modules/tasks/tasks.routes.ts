import { Router } from 'express';
import { getTasks, completeTask } from './tasks.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /tasks
router.get('/', getTasks);

// POST /tasks/complete
router.post('/complete', completeTask);

export default router;
