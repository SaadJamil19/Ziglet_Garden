import { Request, Response } from 'express';
import { TaskService } from './tasks.service';

/**
 * GET /tasks
 */
export const getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const tasks = await TaskService.getTasksForUser(userId);
        res.status(200).json({ tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * POST /tasks/complete
 * Body: { key: "water_grass" }
 */
export const completeTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { key } = req.body;

        if (!key) {
            res.status(400).json({ error: 'Task key is required' });
            return;
        }

        const result = await TaskService.completeTask(userId, key);
        res.status(200).json({ success: true, result });

    } catch (error: any) {
        if (error.message === 'Task limit reached for today' || error.message === 'Task not found') {
            res.status(400).json({ error: error.message });
            return;
        }
        console.error('Error completing task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
