import "dotenv/config";
import crypto from "node:crypto";
import type { User } from "@prisma/client";
import { prisma } from "../db/prisma.js";

// RazorpayX Payouts: money goes from our account to the beneficiary's bank.
// Flow: Contact (who) -> Fund Account (where) -> Payout (how much).

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const ACCOUNT_NUMBER = process.env.RAZORPAYX_ACCOUNT_NUMBER; // our RazorpayX business account
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// No API keys: the payment controller uses the simulated bank
export const razorpayEnabled = Boolean(KEY_ID && KEY_SECRET && ACCOUNT_NUMBER);

export class RazorpayError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

async function call(path: string, body: object, headers: Record<string, string> = {}) {
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64"),
            ...headers,
        },
        body: JSON.stringify(body),
        // No reply after 10s: the caller treats the result as unknown
        signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    if (!res.ok) throw new RazorpayError(res.status, data?.error?.description || "Razorpay error");
    return data;
}

// Contact + Fund Account are made one time per user, then saved
export async function getFundAccountId(user: User): Promise<string> {
    if (user.razorpayFundAccountId) return user.razorpayFundAccountId;
    if (!user.bankAccount || !user.ifsc) throw new RazorpayError(400, "User has no bank details");

    const contact = await call("/contacts", {
        name: user.name,
        contact: user.phone,
        type: "customer",
        reference_id: user.id,
    });
    const fundAccount = await call("/fund_accounts", {
        contact_id: contact.id,
        account_type: "bank_account",
        bank_account: { name: user.name, ifsc: user.ifsc, account_number: user.bankAccount },
    });

    await prisma.user.update({ where: { id: user.id }, data: { razorpayFundAccountId: fundAccount.id } });
    return fundAccount.id;
}

// Same idempotency key = Razorpay returns the first payout, it does not pay again
export function createPayout(fundAccountId: string, amountRupees: number, idempotencyKey: string) {
    return call(
        "/payouts",
        {
            account_number: ACCOUNT_NUMBER,
            fund_account_id: fundAccountId,
            amount: amountRupees * 100, // Razorpay uses paise
            currency: "INR",
            mode: "IMPS",
            purpose: "payout",
            queue_if_low_balance: true,
        },
        { "X-Payout-Idempotency": idempotencyKey }
    );
}

// Webhook check: HMAC-SHA256 of the raw body with our webhook secret must match the header
export function verifyWebhook(rawBody: Buffer, signature?: string) {
    if (!WEBHOOK_SECRET || !signature) return false;
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
    return expected.length === signature.length
        && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
