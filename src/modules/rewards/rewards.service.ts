import { prisma } from '../../core/db';
import { getCurrentGardenDay } from '../../core/time';
import { RewardSource, RewardType } from '../../core/enums';
import { FaucetService } from '../faucet/faucet.service';

export class RewardsService {
    /**
     * Issues a reward to a user by creating a RewardEvent.
     * Triggers Faucet if type is FAUCET.
     */
    static async issueReward(
        userId: string,
        source: RewardSource,
        type: RewardType,
        amount: number,
        gardenDay?: string,
        tx?: any
    ) {
        const today = gardenDay || getCurrentGardenDay();
        const db = tx || prisma;

        // 1. Create Event
        const reward = await db.rewardEvent.create({
            data: {
                user_id: userId,
                source: source,
                reward_type: type,
                amount: amount,
                garden_day: today,
            },
        });

        console.log(`[Rewards] User ${userId} received ${amount} ${type} from ${source}`);

        // 2. Trigger Faucet if applicable
        if (type === RewardType.FAUCET) {
            // Fire and forget? Or await? 
            // Better to not block the user response for external calls
            FaucetService.triggerFaucet(userId, reward.id, amount).catch(err => {
                console.error('[Rewards] Faucet trigger error (background):', err);
            });
        }

        return reward;
    }

    /**
     * Get reward history for a user.
     */
    static async getHistory(userId: string) {
        return prisma.rewardEvent.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50,
            include: {
                faucet_request: true // Include status of faucet if it exists
            }
        });
    }
}
