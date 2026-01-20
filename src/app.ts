<<<<<<< HEAD
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { AppDataSource } from './data-source';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // set `RateLimit` and `RateLimit-Policy` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Routes
import authRoutes from './routes/auth.routes';
import socialRoutes from './routes/social.routes';
import taskRoutes from './routes/task.routes';
import adminRoutes from './routes/admin.routes';
import memeRoutes from './routes/meme.routes';

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions/meme', memeRoutes);
app.use('/api/admin', adminRoutes);

// Database & Server Start
// Database & Server Start
if (process.env.NODE_ENV !== 'test') {
    AppDataSource.initialize()
        .then(() => {
            console.log('✅ Data Source has been initialized!');
            app.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT}`);
            });
        })
        .catch((err) => {
            console.error('❌ Error during Data Source initialization:', err);
        });
}
=======
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env';
import { register, httpRequestDurationMicroseconds } from './core/metrics';
import { Logger } from './core/logger';

// Import Routes
import authRoutes from './modules/auth/auth.routes';
import gardenRoutes from './modules/garden/garden.routes';
import rewardsRoutes from './modules/rewards/rewards.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import externalRoutes from './modules/external/external.routes';

import { limiter } from './middleware/rateLimit.middleware';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request Logging & Metrics Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const route = req.route ? req.route.path : req.path;

        // Log to Winston
        Logger.http(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);

        // Record Metric
        httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode.toString()).observe(duration);
    });
    next();
});

// Global limit
app.use(limiter);

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

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
    Logger.error(err.stack || err.message);
    res.status(500).json({ error: 'Internal Server Error', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
});
>>>>>>> 35139651790e54b37ce588db8f10a1a12b5e97a8

export default app;
