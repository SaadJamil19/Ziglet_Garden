-- Create indexes for scalable reward history pagination
CREATE INDEX IF NOT EXISTS idx_reward_events_user_id ON "public"."reward_events" ("user_id");
CREATE INDEX IF NOT EXISTS idx_reward_events_created_at ON "public"."reward_events" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS idx_reward_events_user_created ON "public"."reward_events" ("user_id", "created_at" DESC);
