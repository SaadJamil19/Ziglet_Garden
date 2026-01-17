import { Request, Response } from 'express';
import { ExternalService } from './external.service';

/**
 * POST /external/verify
 * Body: { tx_hash: "0x..." }
 */
export const verifyAction = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { tx_hash } = req.body;

        if (!tx_hash) {
            res.status(400).json({ error: 'tx_hash is required' });
            return;
        }

        const reward = await ExternalService.verifySwap(userId, tx_hash);
        res.status(200).json({ success: true, reward });

    } catch (error: any) {
        console.error('Error verifying action:', error);
        res.status(400).json({ error: error.message || 'Verification failed' });
    }
};
