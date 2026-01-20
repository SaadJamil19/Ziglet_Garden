
import { prisma } from '../src/core/db';

async function main() {
    console.log('🧪 TESTING ZIG ADDRESS PERSISTENCE\n');

    // 1. Define a valid ZigChain Address
    const validZigAddress = 'zig1testuser456789456789456789456789456789';

    console.log(`👤 Attempting to save: ${validZigAddress}`);

    try {
        // 2. Clear previous test if exists
        await prisma.user.deleteMany({
            where: { zig_address: validZigAddress }
        });

        // 3. Create User
        const user = await prisma.user.create({
            data: {
                zig_address: validZigAddress
            }
        });

        console.log(`✅ SUCCESS! User Saved in Database.`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Address: ${user.zig_address}`);
        console.log(`   Created At: ${user.created_at}`);

        // 4. Verify Retrieval
        const fetched = await prisma.user.findUnique({
            where: { zig_address: validZigAddress }
        });

        if (fetched) {
            console.log('🔍 Verified: User found via select query.');
        }

    } catch (e) {
        console.error('❌ Failed to save Zig address:', e);
    }
}

main().catch(console.error);
