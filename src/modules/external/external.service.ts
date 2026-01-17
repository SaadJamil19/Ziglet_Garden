import { prisma } from '../../core/db';
import { getCurrentGardenDay } from '../../core/time';
import { RewardsService } from '../rewards/rewards.service';
import { RewardSource, RewardType } from '../../core/enums';

export class ExternalService {
    /**
     * Verify an external transaction (e.g. Swap).
     */
    static async verifySwap(userId: string, txHash: string) {
        const today = getCurrentGardenDay();

        // 1. Check if already processed
        const existing = await prisma.externalAction.findUnique({
            where: { tx_hash: txHash },
        });

        if (existing) {
            throw new Error('Transaction already verified/processed');
        }

        // 2. Verify On-Chain (MOCK)
        // In real prod, use ethers provider.getTransactionReceipt(txHash)
        // Check 'to' address, 'data', 'value', 'status' === 1
        const isValid = await this.mockRpcCheck(txHash);

        if (!isValid) {
            throw new Error('Invalid or failed transaction');
        }

        // 3. Record Action
        await prisma.externalAction.create({
            data: {
                user_id: userId,
                action_type: 'SWAP', // Use string literal or Enum if available
                tx_hash: txHash,
                verified: true,
                garden_day: today,
            },
        });

        // 4. Issue Reward
        return await RewardsService.issueReward(
            userId,
            RewardSource.TASK, // Or generic EXTERNAL
            RewardType.ZIG,
            50, // Big reward for swap
            today
        );
    }

    private static async mockRpcCheck(txHash: string): Promise<boolean> {
        // Simulate RPC call delay
        await new Promise((r) => setTimeout(r, 500));
        // Valid if starts with 0x and length > 10
        return txHash.startsWith('0x') && txHash.length > 10;
    }
}
