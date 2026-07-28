import {Worker} from "bullmq"
import { redis } from "./redis"
import { emitToRoom } from "./socket"
import { triggerReview } from "./review-engine"

export function startWorker(){
          const worker=new Worker(
                    "review",
                    async (job) => { 
                              const {sha, prNumber,owner,repo} =job.data
                              const roomId = `review:${owner}:${repo}:${prNumber ?? sha}`

                              try {
                                        emitToRoom(roomId,"review:started",{
                                                  jobId:job.id,
                                                  sha,
                                                  prNumber,
                                                  owner,
                                                  repo
                                        })
                                        
                                        emitToRoom(roomId,"review:progress",{step:"fetching diff"})
                                        const result = await triggerReview(
                                                  {sha,prNumber,owner,repo},
                                                  (step) => emitToRoom(
                                                            roomId,
                                                            "review:progress",
                                                            {step}
                                                  )
                                        )

                                        emitToRoom(roomId,"review:done",{
                                                  review:result.review
                                        })

                                        return result
                              } catch (error:any) {
                                        emitToRoom(roomId, "review:failed", {
                                                  error: error.message,
                                        })
                                        throw error
                              }
                    },
                    {
                              connection:  redis,
                              concurrency: 3,  // process 3 reviews at once
                    }
          )
          worker.on("completed", (job) => console.log(`Job ${job.id} completed`))
          worker.on("failed",    (job, err) => console.error(`Job ${job?.id} failed:`, err))

          console.log("Review worker started")
          return worker
}