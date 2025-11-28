export async function sendWhatsApp(userId: string, message: string) {
  console.log(`📲 WhatsApp → ${userId}: ${message}`);
  return true;
}
