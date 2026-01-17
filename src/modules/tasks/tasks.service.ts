import { prisma } from '../../core/db';
import { getCurrentGardenDay } from '../../core/time';
import { RewardsService } from '../rewards/rewards.service';
import { RewardSource, RewardType } from '../../core/enums';

export class TaskService {
    /**
     * Ensure default tasks exist.
     */
    static async seedDefaults() {
        const defaults = [
            { key: 'water_grass', max_per_day: 1, reward_amount: 5, reward_type: RewardType.ZIG },
            { key: 'swap', max_per_day: 5, reward_amount: 10, reward_type: RewardType.ZIG }, // External action?
            { key: 'share', max_per_day: 1, reward_amount: 2, reward_type: RewardType.ZIG },
        ];

        for (const t of defaults) {
            await prisma.task.upsert({
                where: { key: t.key },
                update: {},
                create: t,
            });
        }
    }

    /**
     * Get all tasks with user's progress for today.
     */
    static async getTasksForUser(userId: string) {
        const today = getCurrentGardenDay();
        const tasks = await prisma.task.findMany();

        // Get logs for today
        const logs = await prisma.userTaskLog.findMany({
            where: {
                user_id: userId,
                garden_day: today,
            },
        });

        // Merge info
        return tasks.map((t: any) => {
            const log = logs.find((l: any) => l.task_id === t.id);
            return {
                ...t,
                current_count: log ? log.count : 0,
                is_completed: log ? log.count >= t.max_per_day : false,
            };
        });
    }

    /**
     * Complete a task for a user.
     */
    static async completeTask(userId: string, taskKey: string) {
        const today = getCurrentGardenDay();

        // 1. Get Task
        const task = await prisma.task.findUnique({ where: { key: taskKey } });
        if (!task) throw new Error('Task not found');

        // 2. Check Limits (use transaction)
        return await prisma.$transaction(async (tx: any) => {
            // Find or Create Log
            let log = await tx.userTaskLog.findUnique({
                where: {
                    user_id_task_id_garden_day: {
                        user_id: userId,
                        task_id: task.id,
                        garden_day: today
                    }
                }
            });

            if (!log) {
                log = await tx.userTaskLog.create({
                    data: {
                        user_id: userId,
                        task_id: task.id,
                        garden_day: today,
                        count: 0
                    }
                });
            }

            if (log.count >= task.max_per_day) {
                throw new Error('Task limit reached for today');
            }

            // 3. Increment Count
            const updatedLog = await tx.userTaskLog.update({
                where: { id: log.id },
                data: { count: { increment: 1 } }
            });

            // 4. Issue Reward
            await RewardsService.issueReward(
                userId,
                RewardSource.TASK,
                task.reward_type as RewardType,
                task.reward_amount,
                today,
                tx // Pass transaction
            );

            return {
                task: task.key,
                new_count: updatedLog.count,
                reward: { amount: task.reward_amount, type: task.reward_type }
            };
        });
    }
}
