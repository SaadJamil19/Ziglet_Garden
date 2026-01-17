import { prisma } from '../../core/db';
import axios from 'axios';
import { ENV } from '../../config/env';
import { FaucetStatus } from '@prisma/client';

export class FaucetService {
    /**
     * Trigger a faucet request for a user.
     * This should be called AFTER the reward event is created.
     */
    static async triggerFaucet(userId: string, rewardEventId: string, amount: number) {
        console.log(`[Faucet] Processing request for User ${userId}, Amount: ${amount}`);

        // 1. Create Request Record (Pending)
        const request = await prisma.faucetRequest.create({
            data: {
                user_id: userId,
                reward_event_id: rewardEventId,
                status: 'PENDING', // String literal if Enum issues persist, or FaucetStatus.PENDING
            },
        });

        // 2. Get User Address
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.zig_address) {
            await this.updateStatus(request.id, 'FAILED');
            console.error(`[Faucet] User ${userId} has no address`);
            return;
        }

        // 3. Call External API (Async - don't await blocking the main flow if possible, or do?)
        // For safety, we await here but ideally this goes into a queue (Phase 9/10 optimization)
        try {
            // MOCK implementation for now - replace with actual API call
            // const response = await axios.post(ENV.FAUCET_API_URL, { address: user.zig_address, amount });

            // Simulate external delay
            await new Promise(r => setTimeout(r, 1000));

            const mockTxHash = '0x' + Math.random().toString(16).substr(2, 40); // Mock hash

            // 4. Update Success
            await this.updateStatus(request.id, 'SENT', mockTxHash);
            console.log(`[Faucet] Droplet sent! Tx: ${mockTxHash}`);

        } catch (error) {
            console.error(`[Faucet] API Failed:`, error);
            await this.updateStatus(request.id, 'FAILED');
        }
    }

    private static async updateStatus(requestId: string, status: 'SENT' | 'FAILED', txHash?: string) {
        // Check if we can use Enum or need raw string fallback based on previous issues
        // Using string literals that match the Enum usually works with Prisma
        await prisma.faucetRequest.update({
            where: { id: requestId },
            data: {
                status: status as any, // Cast to any to avoid type noise if Enum import fails
                tx_hash: txHash,
            },
        });
    }
}
