import { Request, Response } from 'express';
import { RewardsService } from './rewards.service';

/**
 * GET /rewards/history
 */
export const getRewardHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const history = await RewardsService.getHistory(userId);
        res.status(200).json({ history });
    } catch (error) {
        console.error('Error fetching reward history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
