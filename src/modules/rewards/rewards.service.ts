import { Logger } from '../../core/logger';
import { rewardIssuanceCounter } from '../../core/metrics';
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

        // Log & Metric
        Logger.info(`[Rewards] User ${userId} received ${amount} ${type} from ${source}`);
        rewardIssuanceCounter.labels(type, source).inc();

        // 2. Trigger Faucet if applicable
        if (type === RewardType.FAUCET) {
            FaucetService.triggerFaucet(userId, reward.id, amount).catch(err => {
                Logger.error(`[Rewards] Faucet trigger error (background): ${err}`);
            });
        }

        return reward;
    }

    /**
     * Get reward history for a user with cursor-based pagination.
     */
    static async getHistory(userId: string, cursor?: string, limit: number = 20) {
        const query: any = {
            where: { user_id: userId },
            orderBy: [
                { created_at: 'desc' },
                { id: 'desc' }
            ],
            take: limit + 1, // Fetch one extra to determine next cursor
            include: {
                faucet_request: true
            }
        };

        if (cursor) {
            query.cursor = { id: cursor };
            query.skip = 1; // Skip the cursor itself
        }

        const events = await prisma.rewardEvent.findMany(query);

        let nextCursor: string | undefined = undefined;
        if (events.length > limit) {
            const nextItem = events.pop(); // Remove the extra item
            nextCursor = nextItem?.id;
        }

        return {
            items: events,
            nextCursor
        };
    }
}
