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
            //Simulating Transaction
            const isSuccess = Math.random() > 0.1;

            if (!isSuccess) {
                
                await prisma.beneficiaryScheme.update({
                    where: { id: applicationId },
                    data: { status: "PAYMENT_FAILED" }
                });

                return res.status(400).json({
                    message: "Bank Transaction Failed. Please try again"
                });
            }


            const transactionId = "TXN_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      
      const updatedApp = await prisma.beneficiaryScheme.update({
        where: { id: applicationId },
        data: { 
          status: "PAID",
          transactionId,
          paymentDate: new Date()
        },
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