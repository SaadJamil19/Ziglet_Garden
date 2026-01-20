-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "zig_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_nonces" (
    "zig_address" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "user_daily_state" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "garden_day" TEXT NOT NULL,
    "visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "login_reward_claimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_daily_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_day" TEXT NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "garden_state" (
    "user_id" TEXT NOT NULL,
    "growth_points" INTEGER NOT NULL DEFAULT 0,
    "last_growth_day" TEXT NOT NULL,

    CONSTRAINT "garden_state_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "reward_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reward_type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "garden_day" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faucet_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reward_event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tx_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faucet_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "max_per_day" INTEGER NOT NULL DEFAULT 1,
    "reward_amount" DOUBLE PRECISION NOT NULL,
    "reward_type" TEXT NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_task_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "garden_day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_task_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "garden_day" TEXT NOT NULL,

    CONSTRAINT "external_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_zig_address_key" ON "users"("zig_address");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_nonces_zig_address_key" ON "wallet_nonces"("zig_address");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_state_user_id_garden_day_key" ON "user_daily_state"("user_id", "garden_day");

-- CreateIndex
CREATE INDEX "reward_events_user_id_idx" ON "reward_events"("user_id");

-- CreateIndex
CREATE INDEX "reward_events_created_at_idx" ON "reward_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "faucet_requests_reward_event_id_key" ON "faucet_requests"("reward_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_key_key" ON "tasks"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_task_logs_user_id_task_id_garden_day_key" ON "user_task_logs"("user_id", "task_id", "garden_day");

-- CreateIndex
CREATE UNIQUE INDEX "external_actions_tx_hash_key" ON "external_actions"("tx_hash");

-- AddForeignKey
ALTER TABLE "user_daily_state" ADD CONSTRAINT "user_daily_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_state" ADD CONSTRAINT "garden_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_events" ADD CONSTRAINT "reward_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faucet_requests" ADD CONSTRAINT "faucet_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faucet_requests" ADD CONSTRAINT "faucet_requests_reward_event_id_fkey" FOREIGN KEY ("reward_event_id") REFERENCES "reward_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_task_logs" ADD CONSTRAINT "user_task_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_task_logs" ADD CONSTRAINT "user_task_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_actions" ADD CONSTRAINT "external_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
