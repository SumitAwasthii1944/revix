import { Octokit } from "octokit"
import { prisma } from "./prisma"
import { analyzeCode } from "./analyzeCode"

interface triggerData {
  sha?:      string
  prNumber?: number
  repo:      string
  owner:     string
}

export async function triggerReview(values: triggerData) {

  //find repo in DB
  const repository = await prisma.repository.findFirst({
          where:   { 
                    name: values.repo, 
                    owner: values.owner 
          },
          include: { 
                    user: { 
                              include: { 
                                        accounts: true 
                              } 
                    } 
          }
  })

  if (!repository) {
    throw new Error(`Repository ${values.owner}/${values.repo} not found in database`)
  }

  //get token
  const githubAccessToken = repository.user.accounts
    .find((account) => account.provider === "github")
    ?.access_token

  if (!githubAccessToken) {
    throw new Error("GitHub access token not found")
  }

  //create octokit
  const octokit = new Octokit({ auth: githubAccessToken })

  //destructure
  const { sha, prNumber, owner, repo } = values

  //fetch diff
  let diff: string | undefined

  if (sha) {
    const { data } = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
      mediaType: { format: "diff" },
    })
    diff = data as unknown as string

  } else if (prNumber) {
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    })
    diff = files
      .map((f) => f.patch ?? "")
      .filter((patch) => patch !== "")
      .join("\n")
  }

  if (!diff) {
    throw new Error("Could not fetch diff — provide either sha or prNumber")
  }

  // 6. analyze ONCE
  const analysis = await analyzeCode(diff)

  // 7. save to DB ONCE
  const savedReview = await prisma.review.create({
    data: {
      bugScore:      analysis.bugScore,
      qualityScore:  analysis.qualityScore,
      securityScore: analysis.securityScore,
      overallScore:  analysis.overallScore,
      summary:       analysis.summary,
      sha,
      prNumber,
      repoId:        repository.id,
      comments: {
        create: analysis.comments.map((c: any) => ({
          fileName: c.fileName,
          line:     c.line,
          severity: c.severity,
          issue:    c.issue,
        }))
      }
    },
    include: { comments: true }
  })

  // post to GitHub — separate try/catch so DB save is not lost
  try {
    if (sha) {
      // simple commit comment — no inline positioning
      const commentBody = analysis.comments
        .map((c: any) =>
          `**${c.severity.toUpperCase()}** — \`${c.fileName}\` line ${c.line}\n> ${c.issue}`
        )
        .join("\n\n")

      await octokit.rest.repos.createCommitComment({
        owner,
        repo,
        commit_sha: sha,
        body: commentBody || "No issues found",
      })

    } else if (prNumber) {
      // PR — inline comments on exact lines
      await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        event:       "COMMENT",
        comments:    analysis.comments.map((c: any) => ({
          path: c.fileName,
          line: c.line,
          body: `**${c.severity.toUpperCase()}**: ${c.issue}`,
          side: "RIGHT",
        }))
      })
    }
  } catch (err) {
    console.error("GitHub posting failed:", err)
  }

  // return
  return { success: true, review: savedReview }
}