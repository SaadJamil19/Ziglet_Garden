import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics (cpu, memory, etc.)
client.collectDefaultMetrics({ register });

// Define Custom Metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code'],
    buckets: [50, 100, 200, 300, 400, 500, 750, 1000, 2000, 5000],
});

export const taskCompletionCounter = new client.Counter({
    name: 'task_completions_total',
    help: 'Total number of completed tasks',
    labelNames: ['task_key', 'status'],
});

export const rewardIssuanceCounter = new client.Counter({
    name: 'reward_issuance_total',
    help: 'Total rewards issued',
    labelNames: ['type', 'source'],
});

export const faucetRequestCounter = new client.Counter({
    name: 'faucet_requests_total',
    help: 'Total faucet requests',
    labelNames: ['status'],
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(taskCompletionCounter);
register.registerMetric(rewardIssuanceCounter);
register.registerMetric(faucetRequestCounter);

export { register };
