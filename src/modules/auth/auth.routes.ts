import { Router } from 'express';
import { getNonce, verifySignature } from './auth.controller';

const router = Router();

// POST /auth/nonce
router.post('/nonce', getNonce);

// POST /auth/verify
router.post('/verify', verifySignature);

export default router;
