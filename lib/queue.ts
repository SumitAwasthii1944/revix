import {Queue} from "bullmq"
import {redis} from "./redis"

export const reviewQueue=new Queue("review",{
          connection:redis,
          defaultJobOptions:{
                    attempts:3,
                    backoff: {//This decides how long BullMQ waits before retrying.
                              type:  "exponential",
                              delay: 2000,
                    },
                    removeOnComplete: 100,  // keep last 100 completed jobs
                    removeOnFail:     50,   // keep last 50 failed jobs
          }
})

export async function addJob(data:{sha?:string,prNumber?:number,owner:string,repo:string}){
          const job= await reviewQueue.add("review",data)
          console.log(`review job with ${job.id} id is added to queue`)
          return job
}