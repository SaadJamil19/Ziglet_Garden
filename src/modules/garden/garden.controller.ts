import { Request, Response } from 'express';
import { prisma } from '../../core/db';
import { getCurrentGardenDay } from '../../core/time';
import { RewardsService } from '../rewards/rewards.service';
import { StreakService } from '../streak/streak.service';
import { RewardSource, RewardType } from '../../core/enums';

/**
 * Record a user's daily visit.
 * Idempotent: If already visited today, returns existing state without error.
 */
export const visitGarden = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId; // Guaranteed by auth middleware
        const today = getCurrentGardenDay();

        // 1. Ensure Daily State Exists
        let dailyState = await prisma.userDailyState.findUnique({
            where: {
                user_id_garden_day: {
                    user_id: userId,
                    garden_day: today
                }
            }
        });

        if (!dailyState) {
            // First visit of the day!
            dailyState = await prisma.userDailyState.create({
                data: {
                    user_id: userId,
                    garden_day: today,
                    visited_at: new Date(),
                    login_reward_claimed: false
                }
            });
            console.log(`[Garden] User ${userId} visited for day ${today}`);
        }

        // 1.5 Update Streak
        const streak = await StreakService.updateStreak(userId, today);

        // 1.6 Update Growth (Garden grows on every visit)
        if (!dailyState || (dailyState && dailyState.visited_at.toISOString().split('T')[0] !== today)) {
            // Logic check: dailyState was just created/fetched. If created (visited_at is now), we grow.
            // Actually, `dailyState` logic above handles "if !dailyState -> create".
            // We should just check if this specific request triggered the visit creation? 
            // Or rely on idempotency: we only credit growth if valid visit.
            // Simplest: Just increment growth if we returned 'visited: true' which implies we accepted the visit.
            // But let's be safe. We'll upsert the garden state.
        }

        // We know we just visited. Let's add growth points strictly if it was a create action?
        // In lines 24-35 we created dailyState.
        // Let's add growth logic inside that block or separately.
        // Actually, let's just do it:

        await prisma.gardenState.upsert({
            where: { user_id: userId },
            update: {
                growth_points: { increment: 10 }, // 10 points per day
                last_growth_day: today
            },
            create: {
                user_id: userId,
                growth_points: 10,
                last_growth_day: today
            }
        });

        // 2. Check and Issue Login Reward
        if (!dailyState.login_reward_claimed) {
            try {
                // Use a transaction to ensure we don't double claim
                await prisma.$transaction(async (tx: any) => {
                    // Re-fetch to be safe in high concurrency (though unique constraint helps)
                    const current = await tx.userDailyState.findUnique({
                        where: { id: dailyState!.id }
                    });

                    if (current && !current.login_reward_claimed) {
                        // Issue Reward (e.g. 10 ZIG)
                        await RewardsService.issueReward(
                            userId,
                            RewardSource.LOGIN,
                            RewardType.ZIG,
                            10, // Amount
                            today,
                            tx
                        );

                        // Mark as claimed
                        await tx.userDailyState.update({
                            where: { id: dailyState!.id },
                            data: { login_reward_claimed: true }
                        });

                        // Update local object for response
                        dailyState!.login_reward_claimed = true;
                    }
                });
            } catch (err) {
                console.error('Failed to issue login reward:', err);
                // We don't fail the visit request, just the reward part
            }
        }

        res.status(200).json({
            visited: true,
            day: today,
            state: dailyState
        });

    } catch (error) {
        console.error('Error in visitGarden:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Get the user's garden state for today and overall growth.
 */
export const getGardenState = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const today = getCurrentGardenDay();

        // 1. Get today's visit state
        const dailyState = await prisma.userDailyState.findUnique({
            where: {
                user_id_garden_day: {
                    user_id: userId,
                    garden_day: today
                }
            }
        });

        // 2. Get overall garden growth stats (Abstract for now)
        let gardenState = await prisma.gardenState.findUnique({
            where: { user_id: userId }
        });

        if (!gardenState) {
            // Initialize if new user
            gardenState = await prisma.gardenState.create({
                data: {
                    user_id: userId,
                    last_growth_day: "1970-01-01" // Never
                }
            });
        }

        // 3. Get Streak
        const streak = await prisma.userStreak.findUnique({ where: { user_id: userId } });

        res.status(200).json({
            day: today,
            daily_visit: dailyState || null,
            growth: gardenState,
            streak: streak
        });

    } catch (error) {
        console.error('Error in getGardenState:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
