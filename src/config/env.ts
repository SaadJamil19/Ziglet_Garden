import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
    PORT: z.string().default('3000'),
    DATABASE_URL: z.string().describe('PostgreSQL Connection String'),
    JWT_SECRET: z.string().min(10).describe('Secret key for signing JWTs'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    FAUCET_API_URL: z.string().url().optional().default('https://faucet.ziglet.io/api/drop'),
});

// Validate and export
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Invalid environment variables:', error.format());
        }
        throw new Error('Invalid environment variables');
    }
};

export const ENV = parseEnv();
