# Ziglet Garden API Documentation (ZigChain Native)

## 📖 Overview
This backend powers the **Ziglet Garden** on **ZigChain**. It strictly enforces ZigChain native authenticaton.

- **Base URL**: `http://localhost:3001`
- **Chain**: ZigChain (Cosmos SDK based)
- **Address Format**: `zig1...` (Bech32)
- **Timezone**: UTC

---

## 🔐 Authentication Flow (ADR-36)
Authentication uses standard Cosmos `signArbitrary`.

### Step 1: Request Nonce
Call the backend to get a unique random string.

- **Endpoint**: `POST /auth/nonce`
- **Body**:
  ```json
  {
    "zig_address": "zig1k3..." // MUST be a valid 'zig' Bech32 address
  }
  ```
- **Response**:
  ```json
  {
    "nonce": "Sign this message to login to Ziglet Garden: <hex>"
  }
  ```

### Step 2: User Signs (Frontend)
Use a wallet like Keplr or Leap to sign the `nonce`.

### Step 3: Verify & Login
Send the **Address**, **Signature**, and **Public Key**.

- **Endpoint**: `POST /auth/verify`
- **Body**:
  ```json
  {
    "zig_address": "zig1k3...",
    "pub_key": {
      "type": "tendermint/PubKeySecp256k1",
      "value": "An+..." // Base64 encoded public key
    },
    "signature": "H/..." // Base64 encoded signature
  }
  ```
- **Response**:
  ```json
  {
    "token": "eyJhbGci...", // Store this JWT!
    "user": { ... }
  }
  ```

---

## 🌱 Garden & Growth
(Same as before)

### 1. Visit Garden
- **Endpoint**: `POST /garden/visit`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Daily stats & growth.

---

## 📋 Tasks
- **Endpoint**: `GET /tasks`
- **Headers**: `Authorization: Bearer <token>`

---

## 🛑 Error Codes
- **400 Bad Request**: usually means "Invalid Address" (not zig1...) or "Invalid Signature".
