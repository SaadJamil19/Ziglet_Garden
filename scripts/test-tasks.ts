
import { ethers } from 'ethers';
import axios from 'axios';
import { ENV } from '../src/config/env';

const API_URL = `http://localhost:${ENV.PORT}`;

async function main() {
    console.log('📝 Testing Ziglet Tasks & Rewards...');

    // 1. Create Wallet & Login
    const wallet = ethers.Wallet.createRandom();
    const nonceRes = await axios.post(`${API_URL}/auth/nonce`, { zig_address: wallet.address });
    const { nonce } = nonceRes.data;
    const signature = await wallet.signMessage(nonce);
    const verifyRes = await axios.post(`${API_URL}/auth/verify`, {
        zig_address: wallet.address,
        signature
    });
    const { token, user } = verifyRes.data;
    console.log('✅ Logged in:', user.id);

    // 2. Visit Garden (Triggers Login Reward)
    console.log('\n🌱 Visiting Garden...');
    await axios.post(`${API_URL}/garden/visit`, {}, { headers: { Authorization: `Bearer ${token}` } });

    // 3. Get Tasks
    console.log('\n📋 Getting Tasks...');
    let tasksRes = await axios.get(`${API_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('   Tasks:', tasksRes.data.tasks.map((t: any) => `${t.key} (${t.current_count}/${t.max_per_day})`).join(', '));

    // 4. Complete Task 'water_grass'
    console.log('\n💧 Completing Task: water_grass...');
    try {
        const completeRes = await axios.post(`${API_URL}/tasks/complete`,
            { key: 'water_grass' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('   Result:', completeRes.data);
    } catch (e: any) {
        console.error('   ❌ Failed:', e.response?.data);
    }

    // 5. Retry Task (Should Fail)
    console.log('\n🛑 Retrying Task (Limit Check)...');
    try {
        await axios.post(`${API_URL}/tasks/complete`,
            { key: 'water_grass' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.error('   ❌ Should have failed!');
    } catch (e: any) {
        console.log('   ✅ Correctly failed:', e.response?.data?.error);
    }

    // 6. Get Reward History
    console.log('\n🎁 Reward History...');
    const historyRes = await axios.get(`${API_URL}/rewards/history`, { headers: { Authorization: `Bearer ${token}` } });
    const history = historyRes.data.history;
    console.log(`   Found ${history.length} events:`);
    history.forEach((h: any) => console.log(`   - ${h.amount} ${h.reward_type} from ${h.source}`));

    // Expect: 1 Login reward, 1 Task reward.
}

main().catch(console.error);
