import { prisma } from "../db/prisma.js";
import { eligibilityQueue } from "./queue.js";

// ponytail: the Scheme row is the outbox. The "queued" flag is saved in the same insert as the scheme.
let running = false;

// Send every scheme with queued = false to BullMQ. Safe to run again and again.
export async function publishSchemes() {
    if (running) return;
    running = true;
    try {
        const pending = await prisma.scheme.findMany({ where: { queued: false } });
        for (const scheme of pending) {
            // Stable jobId, so BullMQ ignores a second add for the same scheme
            await eligibilityQueue.add("check-eligibility-for-scheme", { schemeId: scheme.id }, { jobId: `elig-${scheme.id}` });
            await prisma.scheme.update({ where: { id: scheme.id }, data: { queued: true } });
        }
    } catch (err) {
        console.error("Outbox publish failed, will retry:", err);
    } finally {
        running = false;
    }
}
