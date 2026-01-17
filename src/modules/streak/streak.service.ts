import { prisma } from '../../core/db';
import { getDaysDifference, getCurrentGardenDay } from '../../core/time';
import { RewardsService } from '../rewards/rewards.service';
import { RewardSource, RewardType } from '../../core/enums';

export class StreakService {
    /**
     * Update User Streak.
     * Logic:
     * - If last_active == yesterday -> Increment
     * - If last_active == today -> No change
     * - If last_active < yesterday -> Reset to 1
     */
    static async updateStreak(userId: string, today: string) {
        // 1. Get or Initialize Streak
        let streak = await prisma.userStreak.findUnique({ where: { user_id: userId } });

        if (!streak) {
            streak = await prisma.userStreak.create({
                data: {
                    user_id: userId,
                    current_streak: 1,
                    longest_streak: 1,
                    last_active_day: today,
                },
            });
            // First day streak reward? Maybe just login reward is enough.
            return streak;
        }

        const lastActive = streak.last_active_day;
        const diff = getDaysDifference(lastActive, today);

        // If same day, do nothing
        if (diff === 0) return streak;

        let newCurrent = 1;

        // If consecutive day (diff usually 1, but check logic strictly)
        if (diff === 1) {
            newCurrent = streak.current_streak + 1;
        } else {
            // Gap > 1 day -> Reset
            newCurrent = 1;
        }

        // Update DB
        const updated = await prisma.userStreak.update({
            where: { user_id: userId },
            data: {
                current_streak: newCurrent,
                longest_streak: Math.max(streak.longest_streak, newCurrent),
                last_active_day: today
            }
        });

        // Check Milestones
        await this.checkMilestones(userId, newCurrent, today);

        return updated;
    }

    private static async checkMilestones(userId: string, streakCount: number, today: string) {
        // Configurable milestones
        const milestones: Record<number, number> = {
            7: 50,
            14: 100,
            30: 500
        };

        if (milestones[streakCount]) {
            await RewardsService.issueReward(
                userId,
                RewardSource.STREAK,
                RewardType.ZIG,
                milestones[streakCount],
                today
            );
        }
    }
}
