import { Webhooks } from "@octokit/webhooks";
import { triggerReview } from "@/lib/review-engine";
import {prisma} from "@/lib/prisma"
const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
});

export async function POST(req :Request){
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 })
  }
  const event = req.headers.get("x-github-event");
  const body = await req.text()//why text-> webhooks.verify(body, signature) expects body to be the exact string of bytes that GitHub sent
  
  if (!(await webhooks.verify(body, signature))) {
    return Response.json({
          success:false,
          message:"event not from github"
    },{status:401})
  }
  const payload = JSON.parse(body)

  if(event === 'push'){
          const {head_commit, repository} = payload
          if (head_commit?.message.includes("[review]")){
              // trigger commit review
              // pass: sha, owner, repo
              const owner=repository.owner.login
              const sha= payload.after
              const repo=repository.name
              triggerReview({sha,owner,repo}).catch(console.error)
          }
  }
  if (event === "pull_request") {
    const { action, pull_request, repository } = payload

    if (action === "opened") {
      const prBody = pull_request.body ?? ""

      if (prBody.includes("/review")) {
        const owner    = repository.owner.login
        const repo     = repository.name
        const prNumber = pull_request.number

        triggerReview({ prNumber, owner, repo }).catch(console.error)
      }
    }
  }
  if(event === "issue_comment"){
    const {comment, issue, repository} = payload
    const isReviewCommand = comment.body.trim() === "/review"
    const isPRComment     = !!issue.pull_request
    const isCreated       = payload.action === "created"
    
    if (isReviewCommand && isPRComment && isCreated) {
      // trigger PR review
      // pass: prNumber, owner, repo
      const owner=repository.owner.login
      const repo=repository.name
      const prNumber=issue.number

      triggerReview({ prNumber, owner, repo }).catch(console.error)
    }
  }
  if (event === "repository") {
    const { action, repository } = payload

    if (action === "deleted") {
      try {
        await prisma.repository.deleteMany({//delete requires you to be 100% certain exactly one row matches (it throws an error if zero rows are found). deleteMany matches zero or more rows and won't throw if nothing matches
          where: { githubRepoId: repository.id.toString() }
        })
        console.log(`Deleted repo ${repository.full_name} from database`)
      } catch (error) {
        console.error("Failed to delete repo from database:", error)
      }
    }
  }
  return Response.json({
    success:true,
  },{status:200})
};
