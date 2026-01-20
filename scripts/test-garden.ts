
import { ethers } from 'ethers';
import axios from 'axios';
import { ENV } from '../src/config/env';

const API_URL = `http://localhost:${ENV.PORT}`;

async function main() {
    console.log('🌱 Testing Ziglet Garden Backend...');

    // 1. Create Wallet
    const wallet = ethers.Wallet.createRandom();
    console.log(`🔑 Wallet: ${wallet.address}`);

    // 2. Get Nonce
    console.log('1️⃣ Requesting Nonce...');
    const nonceRes = await axios.post(`${API_URL}/auth/nonce`, { zig_address: wallet.address });
    const { nonce } = nonceRes.data;
    console.log('   Nonce:', nonce);

    // 3. Sign Nonce
    console.log('2️⃣ Signing Nonce...');
    const signature = await wallet.signMessage(nonce);

    // 4. Verify & Login
    console.log('3️⃣ Verifying & Login...');
    const verifyRes = await axios.post(`${API_URL}/auth/verify`, {
        zig_address: wallet.address,
        signature
    });
    const { token, user } = verifyRes.data;
    console.log('   ✅ Logged in!');
    console.log('   Token:', token.substring(0, 20) + '...');

    // 5. Visit Garden
    console.log('4️⃣ Visiting Garden...');
    try {
        const visitRes = await axios.post(`${API_URL}/garden/visit`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Res:', visitRes.data);
    } catch (e: any) {
        console.error('   ❌ Visit failed:', e.response?.data || e.message);
    }

    // 6. Get State
    console.log('5️⃣ Getting Garden State...');
    try {
        const stateRes = await axios.get(`${API_URL}/garden/state`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   State:', stateRes.data);
    } catch (e: any) {
        console.error('   ❌ Get State failed:', e.response?.data || e.message);
    }
}

main().catch(console.error);
