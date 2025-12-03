import IORedis from "ioredis";
import { config } from "../config";

const redisClient = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export default redisClient;
