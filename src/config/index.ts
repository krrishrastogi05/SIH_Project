import dotenv from "dotenv";
import path from "path";

// Load .env file from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Environment variable ${key} is not set.`);
};

export const config = {
  port: getEnv("PORT", "3000"),
  redisUrl: getEnv("REDIS_URL", "redis://127.0.0.1:6379"),
  databaseUrl: getEnv("DATABASE_URL"),
  jwtSecret: getEnv("JWT_SECRET"),
};
