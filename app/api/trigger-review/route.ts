import { triggerReview } from "@/lib/review-engine"

export async function POST(req:Request){
          const body =await req.json()
          const { sha, prNumber, owner, repo } = body

          if (!owner || !repo) {
                    return Response.json({ error: "owner and repo are required" }, { status: 400 })
          }

          if (!sha && !prNumber) {
                    return Response.json({ error: "provide either sha or prNumber" }, { status: 400 })
          }
          
          triggerReview({ sha, prNumber, owner, repo }).catch(console.error)

          return Response.json({ success: true, message: "Review queued" })
}