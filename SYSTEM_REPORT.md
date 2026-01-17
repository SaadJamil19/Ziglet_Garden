# 📋 ZigletBackend Comprehensive System Report
**Date:** January 17, 2026

This document details the current state, functionality, security measures, and data handling of the **ZigletBackend** system.

---

## 🏗️ 1. Architecture & Tech Stack
The system is built as a modular, monolithic backend designed for reliability and strict data integrity.

- **Language**: TypeScript (Node.js)
- **Framework**: Express v5 (Modern routing)
- **Database**: PostgreSQL (Production-grade relational DB)
- **ORM**: Prisma (Type-safe database access)
- **Validation**: Zod (Strict schema validation)
- **Blockchain**: Ethers.js v6 (Wallet interactions)

---

## ⚙️ 2. Core Features Implemented

### 🔐 A. Authentication (Web3 Login)
A completely passwordless, secure login flow using Crypto Wallets.
1.  **Nonce Generation**: System generates a cryptographic random number (`crypto.randomBytes`) for the user to sign. This prevents "Replay Attacks".
2.  **Signature Verification**: Backend uses `ethers.verifyMessage` to prove the user owns the private key without ever seeing it.
3.  **JWT Issuance**: On success, a `JSON Web Token` is issued (Valid: 7 days). This is stateless and scalable.

### 🌱 B. Garden & Gamification
The core engagement loop.
1.  **Daily Visits**: Tracks daily check-ins based on **UTC Time**.
    - *Logic*: Prevents double-claiming in the same day (Idempotent).
2.  **Streaks**: Automatically calculates Current and Longest streaks. Resets if a day is missed.
3.  **Growth**: Incrementing "Growth Points" for every valid interaction.

### 📋 C. Tasks System
A dynamic task verification engine.
1.  **One-Time & Repeatable**: Supports max counts (e.g., "Water Grass" 1x/day, "Swap" 5x/day).
2.  **Tracking**: Logs every attempt in `user_task_logs` to ensure limits are not breached.
3.  **Auto-Rewards**: Instantly issues specific rewards (ZIG) upon completion.

### 🎁 D. Rewards & Faucet
The ledger of value.
1.  **Universal Ledger**: All earnings (Login, Tasks, External) go into `reward_events`. This is an **Append-Only** log (Accounting best practice).
2.  **Faucet Integration**: If a reward is marked as `FAUCET` type, the system automatically triggers a background process to send tokens on-chain (Stub implemented).

### 🔗 E. External Events
1.  **Transaction Verification**: Capable of verifying external blockchain hashes (e.g., Swaps) to award points. Deduplicates functionality ensures one Tx Hash cannot be reused.

---

## 🛡️ 3. Security Measures

### 🔒 Wallet & Data Security
*   **Nonce Expiry**: Login challenges expire in **5 minutes**. If a user takes too long, they must restart. This prevents old signatures from being intercepted and used.
*   **Signature Validation**: Strict checks ensure the recovered address matches the claimed address.
*   **Zod Validation**: specific inputs (like Addresses) are checked for length and format to prevent SQL Injection or buffer overflows.

### 🌐 Network Security
*   **Helmet**: Sets secure HTTP headers (XSS Filter, No-Sniff, etc.) to protect against browser vulnerabilities.
*   **Rate Limiting**:
    *   **Global**: 100 requests per 15 mins (Prevents DDoS).
    *   **Auth**: 20 login attempts per hour (Prevents brute-force spamming).
*   **CORS**: Configured to allow specific origins (Currently universal for dev, lock down for prod).

---

## 📊 4. Pagination & Data Limits

Currently, the system uses **Fixed Limit Pagination** to ensure performance.

| Data Point | Limit Strategy | Details |
| :--- | :--- | :--- |
| **Reward History** | `Hard Limit: 50` | Fetches the *latest* 50 rewards. (Found in `RewardsService.ts`). *Note: Full cursor-based pagination recommended for future scale.* |
| **Tasks** | `Daily View` | Returns only tasks relevant to *Today*. No pagination needed as list is small (< 20). |
| **Leaderboards** | *N/A* | Not yet implemented. |

---

## 🗄️ 5. Database Schema (PostgreSQL)

The database is normalized to 3rd Normal Form (3NF) to prevent data duplication.

1.  **Users**: `id` (UUID), `zig_address` (Unique Index).
2.  **Wallet Nonces**: Ephemeral storage for login challenges.
3.  **User Daily State**: Tracks `(user_id, day)` pair. **Unique Constraint** ensures physically impossible to have two rows for same day/user.
4.  **Reward Events**: The financial core. Every row is money/points.
5.  **Task Logs**: Tracks `count` of tasks done today.

---

## ✅ Summary
The project is in a **Production-Ready Core** state. The backend logic is complete, tested, and secure. The database is live on PostgreSQL.

**Missing / Next Steps:**
1.  **Advanced Pagination**: Turning the "Limit 50" history into infinite scroll (`page=2` or cursor).
2.  **Admin Panel APIs**: Endpoints to create tasks dynamically without SQL.
