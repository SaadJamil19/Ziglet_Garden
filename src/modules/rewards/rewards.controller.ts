import { Request, Response } from 'express';
import { RewardsService } from './rewards.service';

/**
 * GET /rewards/history
 */
export const getRewardHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const cursor = req.query.cursor as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

        const { items, nextCursor } = await RewardsService.getHistory(userId, cursor, limit);
        res.status(200).json({ history: items, nextCursor });
    } catch (error) {
        console.error('Error fetching reward history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
