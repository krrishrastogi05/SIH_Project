import { redis } from "../utils/redis.js";

export async function enqueue(queueName: string, payload: any) {
  await redis.lpush(queueName, JSON.stringify(payload));
}

export async function dequeue(queueName: string) {
  const data = await redis.rpop(queueName);
  return data ? JSON.parse(data) : null;
}
