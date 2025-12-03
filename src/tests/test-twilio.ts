import "dotenv/config";
import twilio from "twilio";

// 1. Load Credentials directly from .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// 👇 REPLACE THIS WITH YOUR REAL NUMBER (e.g., "+919876543210")
const TO_PHONE_NUMBER = "+917706847769"; 

async function testDirectSMS() {
  console.log("📡 Starting Direct Twilio Test...");
  console.log(`   Account SID: ${accountSid ? "✅ Loaded" : "❌ Missing"}`);
  console.log(`   Auth Token:  ${authToken ? "✅ Loaded" : "❌ Missing"}`);
  console.log(`   From Phone:  ${fromPhone || "❌ Missing"}`);

  if (!accountSid || !authToken || !fromPhone) {
    console.error("❌ ERROR: Missing Twilio Credentials in .env file.");
    return;
  }

  const client = twilio(accountSid, authToken);

  try {
    console.log(`📨 Attempting to send SMS to ${TO_PHONE_NUMBER}...`);
    
    const response = await client.messages.create({
        body: "Dear Daksh, You are eligible for PM AVAS Yojna, Kindly visit your nearest center to register for same",
      from: fromPhone,
      to: TO_PHONE_NUMBER,
    });

    console.log("\n✅ SMS Sent Successfully!");
    console.log(`   Message SID: ${response.sid}`);
    console.log(`   Status: ${response.status}`);
    
  } catch (error: any) {
    console.error("\n❌ Twilio Failed:");
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.code === 21608) {
        console.log("\n💡 HINT: This is a Trial Account. You must verify your phone number in the Twilio Console first.");
        console.log("👉 Verify here: https://console.twilio.com/us1/develop/phone-numbers/manage/verified");
    }
  }
}

testDirectSMS();