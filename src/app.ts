import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env';

// Import Routes
import authRoutes from './modules/auth/auth.routes';
import gardenRoutes from './modules/garden/garden.routes';
import rewardsRoutes from './modules/rewards/rewards.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import externalRoutes from './modules/external/external.routes';

import { limiter, authLimiter } from './middleware/rateLimit.middleware';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
// Global limit
app.use(limiter);

// Routes
app.use('/auth', authRoutes);
app.use('/garden', gardenRoutes);
app.use('/rewards', rewardsRoutes);
app.use('/tasks', tasksRoutes);
app.use('/external', externalRoutes);

// Health Check
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'ZigletBackend', time: new Date().toISOString() });
});

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[ERROR]', err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

export default app;
