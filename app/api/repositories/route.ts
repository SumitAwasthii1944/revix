//called in settings page
import { auth } from "@/auth"
import {prisma} from '@/lib/prisma'
import { Octokit } from "octokit"
export async function GET(req:Request){
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
      },
      include: { accounts: true },
    })

    const githubAccessToken = user?.accounts.find((acc) => acc.provider === "github")?.access_token

    if (!githubAccessToken) {
      return Response.json({ error: "No GitHub token" }, { status: 401 })
    }

    const octokit = new Octokit({ auth: githubAccessToken })

    const response = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: "updated",
    })
    // fetch connected repos for this user from the DB
    const connectedRepos = await prisma.repository.findMany({
      where: { userId: session.user.id },
      select: { githubRepoId: true },
    })
    const connectedIds = new Set(connectedRepos.map((r) => r.githubRepoId))

    // merge is_connected flag into the GitHub response
    const data = response.data.map((repo) => ({
      ...repo,
      is_connected: connectedIds.has(repo.id.toString()),
    }))
    return Response.json(
      {
        success: true,
        data:data,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Repository listing failed:", error)

    const status = typeof error?.status === "number" ? error.status : 502
    const message = status === 401 || status === 403
      ? "GitHub access token is invalid or revoked. Please reconnect GitHub."
      : "Unable to fetch repositories from GitHub."

    return Response.json({ error: message }, { status })
  }
}

export async function POST(req: Request) {
  // connect a repo
          try {
            const session=await auth()
            if(!session?.user?.id){
                      return Response.json({
                                error:"unauthorized"
                      },{status:401})
            }
            const user = await prisma.user.findFirst({
                      where:{
                                id:session.user.id,
                      },
                      include:{accounts:true}
            })

            const githubAccessToken=user?.accounts.find((acc) => (acc.provider==="github"))?.access_token

            if (!githubAccessToken) {
                      return Response.json({ error: "No GitHub token" }, { status: 401 })
            }
            const octokit=new Octokit({auth:githubAccessToken})
            const {owner,repo} = await req.json()

            const repoDetails=await octokit.rest.repos.get({
                      owner,
                      repo
            })

            //create webhook
            const webhook = await octokit.rest.repos.createWebhook({
                      owner:owner,
                      repo:repo,
                      config: {
                                url:          `${process.env.APP_URL}/api/webhooks/github`,
                                content_type: "json",
                                secret:       process.env.GITHUB_WEBHOOK_SECRET!
                      },
                      events: ["push", "issue_comment","pull_request", "repository"],
                      active: true,
            })

            await prisma.repository.create({
                      data: {      
                        name:         repo,
                        owner:        owner,
                        githubRepoId: repoDetails.data.id.toString(),
                        html_url:     repoDetails.data.html_url,
                        description:  repoDetails.data.description ?? null,
                        private:      repoDetails.data.private,
                        userId:       session.user.id,
                      }
            })

            // save webhookId to repository
            await prisma.repository.update({
              where: { githubRepoId: repoDetails.data.id.toString() },
              data:  { webhookId: webhook.data.id.toString() }
            })

            return Response.json({ success: true }, { status: 200 })
          } catch (error:any) {
            console.error("Repository connection failed:", error)
            return Response.json({ error: error.message }, { status: 500 })
          }
}
export async function DELETE(req: Request) {
  // disconnect a repo
          try {
            const session=await auth()
            if(!session?.user?.id){
                      return Response.json({
                                error:"unauthorized"
                      },{status:401})
            }
            const {owner,repo} = await req.json()

            // find the repo, and make sure it belongs to this user
            const repository = await prisma.repository.findFirst({
              where: { name: repo, owner, userId: session.user.id },
            })

            if (!repository) {
              return Response.json({ error: "Repository not found" }, { status: 404 })
            }
            
            const user = await prisma.user.findFirst({
                      where:{
                                id:session.user.id,
                      },
                      include:{accounts:true}
            })

            const githubAccessToken=user?.accounts.find((acc) => (acc.provider==="github"))?.access_token

            if (!githubAccessToken) {
                      return Response.json({ error: "No GitHub token" }, { status: 401 })
            }
            const octokit=new Octokit({auth:githubAccessToken})
            // delete the webhook on GitHub, if one exists
            if (repository.webhookId) {
              try {
                await octokit.rest.repos.deleteWebhook({
                  owner,
                  repo,
                  hook_id: Number(repository.webhookId),
                })
              } catch (error) {
                // webhook might already be gone — don't block DB cleanup because of it
                console.error("Failed to delete GitHub webhook:", error)
              }
            }
            // now remove the DB row
            await prisma.repository.delete({
              where: { id: repository.id },
            })

            return Response.json({ success: true }, { status: 200 })
          } catch (error:any) {
            console.error("Repository disconnection failed:", error)
            return Response.json({ error: error.message }, { status: 500 })
          }
}