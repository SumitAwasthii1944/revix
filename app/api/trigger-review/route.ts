import { triggerReview } from "@/lib/review-engine"
import {auth} from '@/auth'
import { prisma } from "@/lib/prisma"

export async function POST(req:Request){
          const session = await auth()
          if (!session?.user?.id) {
          return Response.json({ error: "Unauthorized" }, { status: 401 })
          }


          const body =await req.json()
          const { sha, prNumber, owner, repo } = body

          if (!owner || !repo) {
                    return Response.json({ error: "owner and repo are required" }, { status: 400 })
          }

          if (!sha && !prNumber) {
                    return Response.json({ error: "provide either sha or prNumber" }, { status: 400 })
          }
          // confirm this repo actually belongs to the logged-in user
          const repository = await prisma.repository.findFirst({
                    where: { name: repo, owner, userId: session.user.id },
          })

          if (!repository) {
                    return Response.json({ error: "Repository not found" }, { status: 404 })
          }
          
          triggerReview({ sha, prNumber, owner, repo }).catch(console.error)

          return Response.json({ success: true, message: "Review queued" })
}