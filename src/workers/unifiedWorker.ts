import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import twilio from "twilio";
import Redis from "ioredis";

// --- CONFIGURATION ---
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const MY_TEST_PHONE = "+917706847769"; // Override for testing

// --- INITIALIZATION ---
const prisma = new PrismaClient();

// Twilio Setup (Safe init)
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn("⚠️ Twilio credentials missing in .env. SMS will be simulated.");
}

// Redis Connection (Shared)
const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  retryStrategy: (times) => Math.min(times * 50, 2000), // Reconnect strategy
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err.message);
});

redisConnection.on("connect", () => {
  console.log("✅ Connected to Redis successfully.");
});

// --- HELPER: ELIGIBILITY LOGIC ---
// (Moved here to keep it all in one file)
const checkEligibility = (user: any, scheme: any): boolean => {
  try {
    // 1. Location (State)
    if (scheme.state !== "All" && scheme.state && user.state !== scheme.state) return false;
    // 2. Location (District)
    if (scheme.district !== "All" && scheme.district && user.district !== scheme.district) return false;

    const criteria = scheme.baseCriteria as any;
    if (!criteria) return true;

    const userIncome = user.income ?? 0;
    const userAge = user.age ?? 0;

    // 3. Scheme Specific Logic
    if (scheme.schemeType === "education") {
      if (criteria.incomeLevel && userIncome > parseInt(criteria.incomeLevel)) return false;
      // Simple string match for education for now
      if (criteria.minEducation === "HIGHER_SECONDARY" && user.education === "MATRICULATION") return false;
    } 
    else if (scheme.schemeType === "housing") {
      if (criteria.incomeLevel && userIncome > parseInt(criteria.incomeLevel)) return false;
    }
    else if (scheme.schemeType === "employment") {
      if (criteria.ageLimit && userAge > parseInt(criteria.ageLimit)) return false;
    }

    return true;
  } catch (e) {
    return false;
  }
};

// --- THE WORKER ---
const worker = new Worker("eligibility-queue", async (job) => {
    console.log(`\n⚙️  Processing Job: ${job.name} (ID: ${job.id})`);

    // ==========================================
    // JOB TYPE 1: CHECK ELIGIBILITY
    // ==========================================
    if (job.name === "check-eligibility-for-scheme") {
      const { schemeId } = job.data;
      
      // 1. Fetch Scheme
      const scheme = await prisma.scheme.findUnique({ where: { id: schemeId } });
      if (!scheme) {
        console.error(`❌ Scheme ${schemeId} not found.`);
        return;
      }
      console.log(`   Scheme Found: "${scheme.title}"`);

      // 2. Fetch Beneficiaries (Optimization: Filter by State)
      const whereClause: any = { role: "BENEFICIARY" };
      if (scheme.state !== "All") whereClause.state = scheme.state;
      
      const users = await prisma.user.findMany({ where: whereClause });
      console.log(`   Scanning ${users.length} beneficiaries...`);

      // 3. Match Logic
      let matches = 0;
      for (const user of users) {
        if (checkEligibility(user, scheme)) {
          matches++;
          
          // A. Save to DB
          await prisma.beneficiaryScheme.upsert({
            where: { beneficiaryId_schemeId: { beneficiaryId: user.id, schemeId: scheme.id } },
            update: {},
            create: { beneficiaryId: user.id, schemeId: scheme.id, status: "ELIGIBLE" }
          });

          // B. Send SMS (Directly here, no second queue needed for simplicity)
          if (user.phone) {
            await sendSms(user.phone, `Congratulations! You are eligible for: "${scheme.title}". Login to apply.`);
          }
        }
      }
      console.log(`✅ Job Complete. Found ${matches} eligible users.`);
    } 
    
    // ==========================================
    // JOB TYPE 2: SEND SMS (Triggered by 'Apply' button)
    // ==========================================
    else if (job.name === "send-sms") {
        await sendSms(job.data.phone, job.data.message);
    }

}, { connection: redisConnection });

// --- HELPER: SEND SMS ---
async function sendSms(targetPhone: string, message: string) {
    console.log(`   📨 [SMS Trigger] To: ${targetPhone}`);
    
    // Force Override for Testing
    const finalNumber = process.env.NODE_ENV === 'production' ? targetPhone : MY_TEST_PHONE;

    if (!twilioClient) {
        console.log(`      [Simulated] Sent to ${finalNumber}: "${message}"`);
        return;
    }

    try {
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: finalNumber
        });
        console.log(`      ✅ Sent to Twilio (${finalNumber})`);
    } catch (err: any) {
        console.error(`      ❌ Twilio Error: ${err.message}`);
    }
}

console.log("🚀 Unified Worker Service Started...");