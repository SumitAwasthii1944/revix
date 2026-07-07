import { auth } from '@/auth'
import {prisma} from '@/lib/prisma'
import { Octokit } from 'octokit'

export async function GET(
  req: Request,
        { params }: { params: { id: string[] | string } | Promise<{ id: string[] | string }> }  //array not string
) {
        try {
                const resolvedParams = await params
                const rawId = resolvedParams?.id ?? new URL(req.url).pathname.split("/").at(-1)
                const repoId = Array.isArray(rawId) ? rawId[0] : rawId

                if (!repoId) {
                        return Response.json(
                                { success: false, error: "Missing repository id" },
                                { status: 400 }
                        )
                }

                const session = await auth()
                const userId = session?.user?.id

                if (!userId) {
                        return Response.json(
                                { success: false, error: "Unauthorized" },
                                { status: 401 }
                        )
                }

                const repo = await prisma.repository.findFirst({
                        where: {
                                id: repoId,
                                userId,
                        },
                })

                if (!repo) {
                        return Response.json(
                                { success: false, error: "Repo not found" },
                                { status: 404 }
                        )
                }

                const user = await prisma.user.findFirst({
                        where: {
                                id: userId,
                        },
                        include: { accounts: true },
                })

                const githubAccessToken = user?.accounts.find((acc) => acc.provider === "github")?.access_token

                if (!githubAccessToken) {
                        return Response.json(
                                {
                                        success: false,
                                        error: "GitHub access token missing",
                                },
                                { status: 401 }
                        )
                }

                const octokit = new Octokit({ auth: githubAccessToken })
                const reviewCount = await prisma.review.count({
                        where: {
                                repoId: repo.id,
                        },
                })

                const [pullRequestsResult, commitsResult] = await Promise.all([
                        octokit.rest.pulls.list({
                                owner: repo.owner,
                                repo: repo.name,
                                per_page: 100,
                                state: 'open',
                        }),
                        octokit.paginate(octokit.rest.repos.listCommits, {
                        owner: repo.owner,
                        repo: repo.name,
                        per_page: 100,
                        }),
                ])
                console.log("commits fetched:", commitsResult.length)
                return Response.json(
                        {
                                success: true,
                                data: {
                                        repo:repo,
                                        reviewCount,
                                        pull_requests: pullRequestsResult.data,
                                        commits: commitsResult,
                                },
                        },
                        { status: 200 }
                )
        } catch (error) {
                console.error("Error in GET /api/dashboard/repo/[...id]:", error)
                return Response.json(
                        {
                                success: false,
                                error: "Internal Server Error",
                        },
                        { status: 500 }
                )
        }

}