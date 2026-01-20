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
- **Blockchain**: CosmJS/Bech32 (ZigChain Native)
- **Observability**: Winston (Logs) & Prometheus (Metrics)

---

## ⚙️ 2. Core Features Implemented

### 🔐 A. Authentication (ZigChain Native)
A mostly passwordless, secure login flow using ZigChain wallets (Keplr/Leap compatible).
1.  **Nonce Generation**: System generates a cryptographic random number (`crypto.randomBytes`) for the user to sign.
2.  **Signature Verification**: Backend uses **Cosmos ADR-36** standards via `@cosmjs/crypto` to prove ownership of the Bech32 address (`zig1...`).
3.  **Strict Validation**: Only valid Bech32 addresses starting with `zig1` are accepted. EVM addresses `0x...` are rejected.
4.  **JWT Issuance**: On success, a `JSON Web Token` is issued (Valid: 7 days).

### 🌱 B. Garden & Gamification
The core engagement loop.
1.  **Daily Visits**: Tracks daily check-ins based on **UTC Time**.
2.  **Streaks**: Automatically calculates Current and Longest streaks. Resets if a day is missed.
3.  **Growth**: Incrementing "Growth Points" for every valid interaction. Logic ensures growth is not penalized by streak resets.

### 📋 C. Tasks System
A dynamic task verification engine.
1.  **One-Time & Repeatable**: Supports max counts (e.g., "Water Grass" 1x/day, "Swap" 5x/day).
2.  **Tracking**: Logs every attempt in `user_task_logs` to ensure limits are not breached.
3.  **Auto-Rewards**: Instantly issues specific rewards (ZIG) upon completion.
4.  **Metrics**: Tracks completion rates via Prometheus `task_completions_total`.

### 🎁 D. Rewards & Faucet
The ledger of value.
1.  **Universal Ledger**: All earnings (Login, Tasks, External) go into `reward_events`.
2.  **Faucet Integration**: If a reward is marked as `FAUCET` type, the system triggers a background process to send tokens (Stub).
3.  **Pagination**: Full **Cursor-Based Pagination** implemented for infinite scrolling of history.

---

## 🛡️ 3. Security Measures

### 🔒 Wallet & Data Security
*   **Nonce Expiry**: Login challenges expire in **5 minutes**.
*   **ADR-36 Verification**: Robust signature checking preventing replay or tampering.
*   **Zod Validation**: Input sanitization for all endpoints.

### 🌐 Network Security
*   **Helmet**: Sets secure HTTP headers.
*   **Rate Limiting**: Global (100/15min) and Auth (20/hr) limits.
*   **CORS**: Configured for development.

---

## 📊 4. Observability & Performance

### 📈 Metrics (Prometheus)
Exposed at `/metrics` endpoint:
*   `http_request_duration_ms`: Latency histograms.
*   `task_completions_total`: Counter for user engagement.
*   `reward_issuance_total`: Counter for economic outflow.
*   `faucet_requests_total`: Tracking for on-chain ops.

### 📜 Logging (Winston)
Structured logging for all critical paths (Auth, Rewards, Errors) with timestamp and severity levels.

### 🚀 Pagination
*   **Reward History**: Uses `cursor` (ID-based) and `limit` to allow fetching massive datasets efficiently without offset overhead.

---

## 🗄️ 5. Database Schema (PostgreSQL)

1.  **Users**: `id` (UUID), `zig_address` (Unique Index).
2.  **Wallet Nonces**: Ephemeral storage for login challenges.
3.  **User Daily State**: Tracks `(user_id, day)` pair.
4.  **Reward Events**: The financial core. indexed by `(user_id, created_at)`.
5.  **Task Logs**: Tracks `count` of tasks done today.

---

## ✅ Summary
The project is fully successfully migrated to **ZigChain Native** architecture.
*   **Auth**: Fully compatible with Cosmos/Zig wallets.
*   **Performance**: Optimized with indexes and cursor pagination.
*   **Ops**: Ready for monitoring with Prometheus/Grafana.
