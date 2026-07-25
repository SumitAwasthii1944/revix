import {Redis} from "ioredis"

export const redis = new Redis(process.env.REDIS_URL!,{
          maxRetriesPerRequest: null,  // required by BullMQ
          enableReadyCheck:     false,
})

redis.on("error", (err) => console.error("Redis error:", err))
redis.on("connect", () => console.log("Redis connected"))