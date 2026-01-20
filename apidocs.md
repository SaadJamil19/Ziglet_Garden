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

# 🌿 Ziglet Garden API Documentation

Welcome to the Ziglet Backend API. This documentation is designed for frontend developers to integrate the Ziglet Garden gamified Web3 experience.

**Base URL**: `http://localhost:3000/api` (Development)

---

## 🔐 Authentication (Cosmos Native)

Ziglet uses a signature-based authentication flow. We do NOT use passwords.

### 1. Get Nonce
Request a unique message to sign.
- **Endpoint**: `POST /auth/nonce`
- **Body**: `{ "walletAddress": "zig1..." }`
- **Logic**: Only `zig1` addresses are accepted.

### 2. Verify & Login
Send the signed message and public key to get a JWT token.
- **Endpoint**: `POST /auth/verify`
- **Body**: 
  ```json
  {
    "walletAddress": "zig1...",
    "signature": "base64_encoded_signature",
    "pubKey": "base64_encoded_compressed_pubkey"
  }
  ```
- **Response**: `{ "token": "eyJ..." }`
- **Frontend Note**: Store this token in `localStorage` or a Secure Cookie. Include it in the header for all protected requests: `Authorization: Bearer <token>`.
- **Side Effect**: This call automatically records the user's "Daily Login" for the reward system.

---

## 🎯 Task System

### 1. Fetch Tasks
Get the list of active tasks and their completion status for the current user.
- **Endpoint**: `GET /tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "tasks": [
      {
        "id": "uuid",
        "slug": "twitter-follow",
        "reward_type": "faucet",
        "reward_amount": "1.0",
        "isCompleted": false,
        "metadata": { "target_handle": "ZigletApp" }
      }
    ]
  }
  ```

### 2. Complete/Claim Task (One-Click)
Verify task completion and claim reward in one step.
- **Endpoint**: `POST /tasks/complete`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "taskId": "uuid", "proof": { "tweetId": "optional" } }`
- **Logic**: Backend will verify the social action (e.g., Follow) and issue the reward event atomically.

### 3. Claim Daily Login Reward
Special endpoint for the daily check-in reward.
- **Endpoint**: `POST /tasks/daily-login-claim`
- **Headers**: `Authorization: Bearer <token>`
- **Logic**: Verifies that the user has authenticated today and issues a reward if not already claimed.

---

## 🐦 Social Integration (Twitter)

### 1. Initiate Connect
Get the Twitter Authorization URL.
- **Endpoint**: `GET /social/twitter/connect`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "url": "https://twitter.com/..." }`

### 2. Callback/Link
After Twitter redirects back to your app with a `code`:
- **Endpoint**: `POST /social/twitter/callback`
- **Body**: `{ "code": "twitter_code", "state": "stored_state" }`
- **Mock Mode**: For development, you can send `{ "mock": true, "twitterId": "123", "username": "test" }` to bypass actual OAuth.

---

## 🎨 Meme Submissions

### 1. Submit Meme
- **Endpoint**: `POST /submissions/meme`
- **Body**: `{ "taskId": "uuid", "image_url": "https://..." }`
- **Status**: Reward will remain "Pending" until an admin approves.

---

## 🛠️ Implementation Tips for Frontend

### 1. Signing with Keplr/Cosmos Wallet
When signing the nonce, the signature should be a standard `secp256k1` signature. 
- **PubKey**: Ensure you provide the **Compressed** (33-byte) public key in Base64 format.
- **Signature**: The backend expects a 64-byte or 65-byte fixed-length signature in Base64.

### 2. Idempotency
Don't worry about users clicking "Claim" twice. The backend uses unique constraints. If a user tries to claim a completed task again, the API will return a `400 Bad Request` with an error message: `"Task already completed or limit reached"`.

### 3. Error Handling
The API returns standard error objects:
```json
{
  "error": "Short descriptive error message"
}
```

---

## 🚀 Suggested User Journey
1. **Connect Wallet** -> `POST /auth/nonce` -> Sign -> `POST /auth/verify`.
2. **Dashboard** -> `GET /tasks` -> Show incomplete tasks.
3. **Daily Reward** -> User clicks "Check-in" -> `POST /tasks/daily-login-claim`.
4. **Social Task** -> User follows Twitter -> Clicks "Verify" on UI -> `POST /tasks/complete`.
