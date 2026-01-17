import { Request, Response } from 'express';
import { prisma } from '../../core/db';
import { getNonceExpiry } from '../../core/time';
import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env';
import crypto from 'crypto';
import { z, ZodError } from 'zod';
import { serializeSignDoc } from '@cosmjs/amino';
import { Secp256k1, Sha256 } from '@cosmjs/crypto';
import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { bech32 } from 'bech32';

// --- Validation Schemas ---

// Strict ZigChain Bech32 Validation
const ZigAddressSchema = z.string().refine((val) => {
    try {
        const decoded = bech32.decode(val);
        return decoded.prefix === 'zig';
    } catch {
        return false;
    }
}, {
    message: "Invalid ZigChain address. Must be a valid Bech32 address starting with 'zig1'.",
});

const NonceRequestSchema = z.object({
    zig_address: ZigAddressSchema,
});

// Expecting rich signature object as per Cosmos standard
const VerifyRequestSchema = z.object({
    zig_address: ZigAddressSchema,
    pub_key: z.object({
        type: z.string(),
        value: z.string(), // base64
    }),
    signature: z.string(), // base64
});

// --- Controller Methods ---

export const getNonce = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('[Auth] Requesting nonce for:', req.body.zig_address);
        const { zig_address } = NonceRequestSchema.parse(req.body);

        const nonce = `Sign this message to login to Ziglet Garden: ${crypto.randomBytes(16).toString('hex')}`;
        const expiresAt = getNonceExpiry(5);

        await prisma.walletNonce.upsert({
            where: { zig_address },
            update: { nonce, expires_at: expiresAt },
            create: { zig_address, nonce, expires_at: expiresAt },
        });

        console.log('[Auth] Nonce generated:', nonce);
        res.status(200).json({ nonce });
    } catch (error: any) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error('Error generating nonce:', error);
        res.status(400).json({ error: error.message || 'Unknown error' });
    }
};

export const verifySignature = async (req: Request, res: Response): Promise<void> => {
    try {
        const { zig_address, signature, pub_key } = VerifyRequestSchema.parse(req.body);

        // 1. Get Nonce
        const record = await prisma.walletNonce.findUnique({
            where: { zig_address },
        });

        if (!record) {
            res.status(400).json({ error: 'Nonce not found. Please request a new one.' });
            return;
        }

        // 2. Check Expiry
        if (new Date() > record.expires_at) {
            res.status(400).json({ error: 'Nonce expired.' });
            return;
        }

        // 3. Verify Signature (ADR-36 Manual Implementation)
        try {
            const pubKeyBytes = fromBase64(pub_key.value);
            const signatureBytes = fromBase64(signature);

            // ADR-36 Spec: Construct the SignDoc
            // MsgSignData is the standard type for arbitrary signing in Cosmos
            const signDoc = {
                chain_id: "",
                account_number: "0",
                sequence: "0",
                fee: {
                    gas: "0",
                    amount: [],
                },
                msgs: [
                    {
                        type: "sign/MsgSignData",
                        value: {
                            signer: zig_address,
                            data: toBase64(Buffer.from(record.nonce)), // Data must be base64 encoded in the Msg
                        },
                    },
                ],
                memo: "",
            };

            // Serialize (sort keys, remove whitespace)
            const signBytes = serializeSignDoc(signDoc);

            // Hash message
            const messageHash = new Sha256(signBytes).digest();

            // Verify
            const valid = await Secp256k1.verifySignature(
                Secp256k1.trimRecoveryByte(signatureBytes), // Ensure 64-byte sig
                messageHash,
                pubKeyBytes
            );

            if (!valid) {
                res.status(401).json({ error: 'Signature verification failed (Cosmos ADR-36).' });
                return;
            }

        } catch (e) {
            console.error('Core Verification Error:', e);
            res.status(400).json({ error: 'Invalid signature format or Cosmos verification error.' });
            return;
        }

        // 4. Auth Successful - Find or Create User
        const user = await prisma.$transaction(async (tx: any) => {
            await tx.walletNonce.delete({ where: { zig_address } });

            let user = await tx.user.findUnique({ where: { zig_address } });

            if (!user) {
                user = await tx.user.create({
                    data: { zig_address },
                });
            } else {
                user = await tx.user.update({
                    where: { id: user.id },
                    data: { last_login_at: new Date() }
                });
            }
            return user;
        });

        // 5. Issue JWT
        const token = jwt.sign(
            { userId: user.id, zigAddress: user.zig_address },
            ENV.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({ token, user });

    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error('Error verifying signature:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
