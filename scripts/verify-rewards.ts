
import { prisma } from '../src/core/db';
import { RewardsService } from '../src/modules/rewards/rewards.service';
import { RewardSource, RewardType } from '../src/core/enums';
import { getCurrentGardenDay } from '../src/core/time';

async function verifyRewards() {
    console.log('🧪 TESTING REWARD SYSTEM...');

    // 1. Get the first user found in DB
    const user = await prisma.user.findFirst();

    if (!user) {
        console.error('❌ No users found! Please run the demo script first to create a user.');
        return;
    }

    console.log(`👤 Using User ID: ${user.id} (${user.zig_address})`);

    // 2. Count current rewards
    const initialCount = await prisma.rewardEvent.count({ where: { user_id: user.id } });
    console.log(`📊 Initial Reward Events: ${initialCount}`);

    // 3. Issue a MANUAL Reward using the Service (User Logic verification)
    console.log('🔄 Issuing Test Reward (100 ZIG)...');

    try {
        await RewardsService.issueReward(
            user.id,
            RewardSource.MILESTONE, // Using Milestone as a test source
            RewardType.ZIG,
            100.0,
            getCurrentGardenDay()
        );
        console.log('✅ Reward Issued Successfully via Service!');
    } catch (err) {
        console.error('❌ Failed to issue reward:', err);
    }

    // 4. Verification Check
    const finalCount = await prisma.rewardEvent.count({ where: { user_id: user.id } });
    const lastEvent = await prisma.rewardEvent.findFirst({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
    });

    console.log(`📊 Final Reward Events: ${finalCount}`);

    if (finalCount > initialCount && lastEvent?.amount === 100) {
        console.log('\n🎉 SUCCESS! REWARD SYSTEM IS WORKING CORRECTLY.');
        console.log(`   Last Entry: ${lastEvent.amount} ${lastEvent.reward_type} [Source: ${lastEvent.source}]`);
    } else {
        console.error('\n❌ FAILURE! Database was not updated correctly.');
    }
}

verifyRewards().catch(console.error);
