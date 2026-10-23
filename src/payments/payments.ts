import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { notificationQueue } from "../queue/queue.js";
import { RazorpayError, createPayout, getFundAccountId } from "./razorpay.js";

type Where = { id: string } | { payoutId: string };
type PayableApp = Prisma.BeneficiarySchemeGetPayload<{ include: { user: true; scheme: true } }>;

// PROCESSING -> PAID. Safe to call 2 times: the second call changes 0 rows.
export async function markPaid(where: Where) {
    const { count } = await prisma.beneficiaryScheme.updateMany({
        where: { ...where, status: "PROCESSING" },
        data: { status: "PAID", paymentDate: new Date() },
    });
    if (count === 0) return;

    const app = await prisma.beneficiaryScheme.findFirstOrThrow({ where, include: { user: true, scheme: true } });
    // Stable jobId, so one payment gives one SMS
    await notificationQueue.add("send-sms", {
        phone: app.user.phone,
        message: `Payment Received: Rs.${app.scheme.amount} has been credited for ${app.scheme.title}. Ref: ${app.transactionId}`,
    }, { jobId: `sms-${app.transactionId}` });
}

// PROCESSING or PAID -> PAYMENT_FAILED. PAID is included because a bank can reverse a payout later.
export async function markFailed(where: Where) {
    await prisma.beneficiaryScheme.updateMany({
        where: { ...where, status: { in: ["PROCESSING", "PAID"] } },
        data: { status: "PAYMENT_FAILED" },
    });
}

// Send (or send again) the payout. The same transactionId is the idempotency key, so this never pays 2 times.
export async function sendPayout(app: PayableApp) {
    try {
        const fundAccountId = await getFundAccountId(app.user);
        const payout = await createPayout(fundAccountId, app.scheme.amount, app.transactionId!);
        await prisma.beneficiaryScheme.update({ where: { id: app.id }, data: { payoutId: payout.id } });

        // A repeat of an old key can return a final state at once
        if (payout.status === "processed") await markPaid({ id: app.id });
        if (["failed", "reversed", "rejected", "cancelled"].includes(payout.status)) await markFailed({ id: app.id });
    } catch (err) {
        // 4xx: Razorpay refused the request, so no money moved
        if (err instanceof RazorpayError && err.status < 500) return markFailed({ id: app.id });
        // Timeout or 5xx: the result is unknown. Keep PROCESSING. reconcilePayouts checks it later.
        console.error(`Payout result unknown for ${app.id}, will check later:`, err);
    }
}

// Payouts with no final result after 1 minute (timeout, missed webhook).
// Sending again with the same key returns the real state of the first payout.
export async function reconcilePayouts() {
    const stuck = await prisma.beneficiaryScheme.findMany({
        where: { status: "PROCESSING", updatedAt: { lt: new Date(Date.now() - 60_000) } },
        include: { user: true, scheme: true },
    });
    for (const app of stuck) await sendPayout(app);
}
