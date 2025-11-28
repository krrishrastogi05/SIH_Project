export async function sendSMS(userId: string, message: string) {
  console.log(`📲 SMS → ${userId}: ${message}`);
  return true;
}
