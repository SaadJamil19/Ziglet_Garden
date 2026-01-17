# 🔌 Frontend Integration: ZigChain Native

This guide explains how to connect to ZigletBackend using **ZigChain Wallets** (Leap, Keplr).

> **⚠️ STRICT PROTOCOL**: The backend ONLY accepts `zig1...` addresses and Cosmos ADR-36 Signatures. EVM/0x addresses are REJECTED.

---

## 🚀 The Authentication Flow

1.  **Connect Wallet**: Get `zig1...` address and Public Key.
2.  **Get Nonce**: Request random string from backend.
3.  **Sign**: Use `signArbitrary`.
4.  **Login**: Send Address + Signature + PubKey.

---

## 💻 Code Example (CosmJS / Leap / Keplr)

### 1. Install Dependencies
```bash
npm install axios @cosmjs/amino
```

### 2. Login Logic

```typescript
import axios from 'axios';

const CHAIN_ID = "zigchain-1"; // Replace with actual Chain ID
const API_URL = "http://localhost:3001";

async function connectAndLogin() {
  if (!window.leap && !window.keplr) {
    alert("Please install Leap or Keplr Wallet!");
    return;
  }

  const wallet = window.leap || window.keplr;
  
  // A. Connect
  await wallet.enable(CHAIN_ID);
  const key = await wallet.getKey(CHAIN_ID);
  const address = key.bech32Address; // Must start with 'zig1'
  
  console.log("Address:", address);

  // B. Step 1: Request Nonce
  const nonceRes = await axios.post(`${API_URL}/auth/nonce`, {
    zig_address: address
  });
  const { nonce } = nonceRes.data;

  // C. Step 2: Sign Arbitrary Message
  // This produces a standard StdSignature object
  const signResult = await wallet.signArbitrary(
    CHAIN_ID,
    address,
    nonce // The data to sign
  );

  // signResult looks like:
  // {
  //   pub_key: { type: "tendermint/PubKeySecp256k1", value: "..." },
  //   signature: "..."
  // }

  // D. Step 3: Verify
  const verifyRes = await axios.post(`${API_URL}/auth/verify`, {
    zig_address: address,
    pub_key: signResult.pub_key, // Send the object exactly as is
    signature: signResult.signature
  });

  const { token } = verifyRes.data;
  console.log("Logged In! Token:", token);
  
  // Store token for future requests...
}
```
