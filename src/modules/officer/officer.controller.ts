import { Request, Response } from "express";
import {prisma} from "../../db/prisma.js"
import { eligibilityQueue, notificationQueue } from "../../queue/queue.js";


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

            // B. Trigger the "Unified Worker" to find eligible users
            // This runs in the background so the API is fast
            
            await eligibilityQueue.add("check-eligibility-for-scheme", {
                schemeId: scheme.id
            });


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
            // Stable key per application. Pass it as the idempotency key to a real bank.
            // ponytail: no real bank, so no timeout case. With a real bank, a timeout keeps the status and a job checks it later.
            const transactionId = "TXN_" + applicationId;

            //Simulating Transaction
            const isSuccess = Math.random() > 0.1;

            if (!isSuccess) {
                
                await prisma.beneficiaryScheme.updateMany({
                    where: { id: applicationId, status: "APPROVED" },
                    data: { status: "PAYMENT_FAILED" }
                });

                return res.status(400).json({
                    message: "Bank Transaction Failed. Please try again"
                });
            }

            // Status check and update in one query, so two requests cannot both pay
            const { count } = await prisma.beneficiaryScheme.updateMany({
                where: { id: applicationId, status: { in: ["APPROVED", "PAYMENT_FAILED"] } },
                data: { 
                    status: "PAID",
                    transactionId,
                    paymentDate: new Date()
                }
            });

            if (count === 0) {
                return res.status(409).json({ message: "Application is not approved or is already paid" });
            }

            const updatedApp = await prisma.beneficiaryScheme.findUniqueOrThrow({
                where: { id: applicationId },
                include: { user: true, scheme: true }
            });
            
            
            if (updatedApp.user.phone) {
        await notificationQueue.add("send-sms", {
          phone: updatedApp.user.phone,
          message: `Payment Received: Rs.${updatedApp.scheme.amount} has been credited for ${updatedApp.scheme.title}. Ref: ${transactionId}`
        });
            }
            
            return res.json({
                message: "Payment Successful",
                transactionId,
                status:"PAID"
            })
            


        }

        catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: "Payment processing error" });
        }
        
    }
}