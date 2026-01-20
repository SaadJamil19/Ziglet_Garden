import { prisma } from '../src/core/db';

async function main() {
    console.log('\n📊 VERIFYING POSTGRESQL DATABASE CONNECTION\n');

    try {
        // 1. Check Users
        const userCount = await prisma.user.count();
        console.log(`👤 Users Table: ${userCount} users found.`);

        // 2. Check Tasks (Should be at least 3 from seeding)
        const taskCount = await prisma.task.count();
        console.log(`📋 Tasks Table: ${taskCount} tasks configured.`);

        // 3. Check Rewards
        const rewardCount = await prisma.rewardEvent.count();
        console.log(`🎁 Rewards Table: ${rewardCount} reward events logged.`);

        console.log('\n----------------------------------------');
        if (taskCount >= 3) {
            console.log('✅ DATABASE STATUS: HEALTHY & SEEDED');
            console.log('   (Successfully connected to "ziglet_garden" on PostgreSQL)');
        } else {
            console.log('⚠️ DATABASE STATUS: CONNECTED BUT EMPTY');
            console.log('   (Run the server to seed default tasks!)');
        }
        console.log('----------------------------------------\n');

    } catch (error) {
        console.error('❌ DATABASE CONNECTION FAILED:', error);
    }
}

main().catch(e => console.error(e));
