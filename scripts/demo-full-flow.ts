
import axios from 'axios';
import { ENV } from '../src/config/env';
import { Secp256k1, Sha256 } from '@cosmjs/crypto';
import { serializeSignDoc } from '@cosmjs/amino';
import { toBase64 } from '@cosmjs/encoding';
import { bech32 } from 'bech32';
import { ethers } from 'ethers';

const API_URL = `http://localhost:${ENV.PORT || 3001}`;

// --- Helper: Simulate a Zig Wallet ---
async function createRandomZigWallet() {
    // 1. Use Ethers for reliable Key Gen
    const wallet = ethers.Wallet.createRandom();
    const privKey = Buffer.from(wallet.privateKey.slice(2), 'hex');

    // Get compressed public key (33 bytes) standard for Cosmos
    const pubKey = Buffer.from(ethers.SigningKey.computePublicKey(wallet.privateKey, true).slice(2), 'hex');

    // 2. Derive Address
    const words = bech32.toWords(Buffer.from(new Sha256(pubKey).digest().slice(0, 20)));
    const address = bech32.encode('zig', words);

    return { privKey, pubKey, address };
}

async function main() {
    console.log('🚀 STARTING ZIGLET BACKEND DEMO (ZIGCHAIN NATIVE) 🚀\n');

    // --- 1. Authenticaton ---
    console.log('--- 1. AUTHENTICATION ---');

    const wallet = await createRandomZigWallet();
    console.log(`👤 Derived Zig Address: ${wallet.address}`);

    // A. Request Nonce
    try {
        const nonceRes = await axios.post(`${API_URL}/auth/nonce`, { zig_address: wallet.address });
        const { nonce } = nonceRes.data;
        console.log(`📝 Nonce to Sign: "${nonce}"`);

        // B. Sign (Simulate signArbitrary)
        const signDoc = {
            chain_id: "",
            account_number: "0",
            sequence: "0",
            fee: { gas: "0", amount: [] },
            msgs: [{
                type: "sign/MsgSignData",
                value: {
                    signer: wallet.address,
                    data: toBase64(Buffer.from(nonce)) // The nonce is the data!
                }
            }],
            memo: ""
        };

        const signBytes = serializeSignDoc(signDoc);
        const msgHash = new Sha256(signBytes).digest();
        const signature = await Secp256k1.createSignature(msgHash, wallet.privKey);

        // Construct Standard Signature Object
        const signatureBase64 = toBase64(
            Buffer.concat([signature.r(32), signature.s(32)])
        );

        const pubKeyObj = {
            type: "tendermint/PubKeySecp256k1",
            value: toBase64(wallet.pubKey)
        };

        // C. Verify
        const verifyRes = await axios.post(`${API_URL}/auth/verify`, {
            zig_address: wallet.address,
            pub_key: pubKeyObj,
            signature: signatureBase64
        });

        const { token, user } = verifyRes.data;
        console.log(`🔑 Login Successful!`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Last Login: ${user.last_login_at}`);

        const headers = { Authorization: `Bearer ${token}` };

        // --- 2. Garden Visit ---
        console.log('\n--- 2. GARDEN VISIT ---');
        const visitRes = await axios.post(`${API_URL}/garden/visit`, {}, { headers });
        console.log(`🌱 Visited! Day: ${visitRes.data.day}`);

        // --- 3. View Tasks ---
        console.log('\n--- 3. TASKS ---');
        const tasksRes = await axios.get(`${API_URL}/tasks`, { headers });
        const tasks = tasksRes.data.tasks;
        tasks.forEach((t: any) => console.log(`   - [${t.is_completed ? 'x' : ' '}] ${t.key}: ${t.reward_amount} ${t.reward_type}`));

        // --- 4. Complete Task ---
        console.log('\n--- 4. COMPLETE TASK (share) ---');
        const taskRes = await axios.post(`${API_URL}/tasks/complete`, { key: 'share' }, { headers });
        console.log(`💧 Task Completed! New Count: ${taskRes.data.result?.new_count || 'Done'}`);

        // --- 5. Reward History ---
        console.log('\n--- 5. REWARD HISTORY ---');
        const historyRes = await axios.get(`${API_URL}/rewards/history`, { headers });
        console.log(`🎁 Last 5 Events:`);
        historyRes.data.history.slice(0, 5).forEach((h: any) => {
            console.log(`   - ${h.amount} ${h.reward_type} (${h.source})`);
        });

    } catch (e: any) {
        // Detailed error logging
        if (e.response) {
            console.error('❌ API Error:', e.response.status, e.response.data);
        } else {
            console.error('❌ Runtime Error:', e.message);
        }
    }

    console.log('\n✅ DEMO COMPLETE');
}

main().catch(console.error);
