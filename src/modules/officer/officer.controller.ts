import { Request, Response } from "express";
import {prisma} from "../../db/prisma.js"
import { publishSchemes } from "../../queue/outbox.js";
import { razorpayEnabled } from "../../payments/razorpay.js";
import { markFailed, markPaid, sendPayout } from "../../payments/payments.js";


export class OfficerController{
    static async createScheme(req: Request, res: Response) {
        try {
            const { 
        title, description, schemeType, amount, 
        state, district, 
        baseCriteria // Expected JSON: { incomeLimit: 50000, minAge: 18 }
            } = req.body;
            

            //Create the Scheme in DB with the requirements

            // || ensures that if initial requirement is not fulfilled we are set to a default
            const scheme = await prisma.scheme.create({
                data: {
                    title,
                    description,
                    schemeType,
                    amount: Number(amount),
                    state: state || "All",
                    district: district || "All",
                    baseCriteria: baseCriteria || {}
                }
            });

            // B. Trigger the eligibility worker to find eligible users
            // No await: if Redis is down, the outbox timer sends it later
            publishSchemes();


           return res.status(201).json({ 
        message: "Scheme created. Eligibility scan started in background.", 
        schemeId: scheme.id 
           });
            
            
        }
        catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: "Failed to create scheme" });
    }
    }


    static async getSchemeApplications(req: Request, res: Response) {
        try {
            const { schemeId } = req.params;

            const applications = await prisma.beneficiaryScheme.findMany({
                where: { schemeId },
                include: {
                    user: {
                        select: {
                            name: true, phone: true, bankAccount: true, ifsc: true
                        }
                    }
                }
            });

            return res.json(applications)
        }

        catch (err: any) {
            return res.status(500).json({
                message: "Error fetching applications"
            });
        }
    }


    static async processPayment(req: Request, res: Response) {
        try {
            const { applicationId } = req.body;
            if (!applicationId) return res.status(400).json({ message: "applicationId is required" });

            // 1. Claim: check and change status in one query, so only one request can start the payment
            const claimed = await prisma.beneficiaryScheme.update({
                where: { id: applicationId, status: { in: ["APPROVED", "PAYMENT_FAILED"] } },
                data: { status: "PROCESSING", paymentTry: { increment: 1 } }
            }).catch((err) => {
                if (err.code === "P2025") return null; // no row matched
                throw err;
            });

            if (!claimed) {
                return res.status(409).json({ message: "Application is not approved, or a payment is already in progress or done" });
            }

            // 2. Idempotency key. Same key = same payout at the bank. A new try after a failure gets a new key.
            // Saved before the bank call, so we can check the payout after a crash or timeout.
            const transactionId = `TXN_${applicationId}_${claimed.paymentTry}`;
            const app = await prisma.beneficiaryScheme.update({
                where: { id: applicationId },
                data: { transactionId },
                include: { user: true, scheme: true }
            });

            // 3a. Real bank: Razorpay. The final status comes later from the webhook.
            if (razorpayEnabled) {
                await sendPayout(app);
                const { status } = await prisma.beneficiaryScheme.findUniqueOrThrow({ where: { id: applicationId } });
                return res.status(202).json({ message: "Payout sent to bank", transactionId, status });
            }

            // 3b. No Razorpay keys: simulate the bank
            const isSuccess = Math.random() > 0.1;

            if (!isSuccess) {
                await markFailed({ id: applicationId });
                return res.status(400).json({
                    message: "Bank Transaction Failed. Please try again"
                });
            }

            await markPaid({ id: applicationId });

            return res.json({
                message: "Payment Successful",
                transactionId,
                status: "PAID"
            });
        }

        catch (err: any) {
            console.error(err);
            return res.status(500).json({ message: "Payment processing error" });
        }
    }
}
