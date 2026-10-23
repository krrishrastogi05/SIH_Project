import express, { Router } from "express";
import { verifyWebhook } from "../../payments/razorpay.js";
import { markFailed, markPaid } from "../../payments/payments.js";

const router = Router();

// Razorpay calls this URL when a payout changes state.
// express.raw keeps the body as bytes, because the signature is made from the exact raw body.
router.post("/razorpay", express.raw({ type: "application/json" }), async (req, res) => {
    if (!verifyWebhook(req.body, req.header("X-Razorpay-Signature"))) {
        return res.status(400).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString());
    const payoutId = event.payload?.payout?.entity?.id;
    // Not a payout event. Also stops payoutId = undefined, which Prisma reads as "no filter".
    if (!payoutId) return res.json({ received: true });

    try {
        // Razorpay can send the same event 2 times. markPaid and markFailed are safe to repeat.
        if (event.event === "payout.processed") await markPaid({ payoutId });
        if (["payout.failed", "payout.reversed", "payout.rejected"].includes(event.event)) await markFailed({ payoutId });
        return res.json({ received: true });
    } catch (err) {
        console.error(err);
        // Not 200, so Razorpay sends the webhook again later
        return res.status(500).json({ message: "Webhook processing error" });
    }
});

export default router;
