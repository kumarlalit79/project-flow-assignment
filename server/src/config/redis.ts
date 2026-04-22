import { Redis } from "ioredis";
import { env } from "./env.js";

// Upstash requires TLS — ioredis uses rediss:// protocol
export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
  retryStrategy(times: number): number | null {
    if (times > 3) {
      console.error("Redis connection failed after 3 retries");
      return null;
    }
    const delay = Math.min(times * 200, 1000);
    return delay;
  },
  lazyConnect: false,
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (error: Error) => {
  console.error("Redis error:", error);
});

redisClient.on("reconnecting", () => {
  console.warn("Redis reconnecting...");
});
