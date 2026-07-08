// review-engine.ts
import { Octokit } from "octokit"
import { prisma } from "./prisma"
import { analyzeCode } from "./analyzeCode"

interface triggerData {
  sha?:      string
  prNumber?: number
  repo:      string
  owner:     string
}

interface RawComment {
  fileName: string
  line:     number
  severity: string
  issue:    string
}

function resolvePaths(comments: RawComment[], filenames: string[]) {
  const validPaths = new Set(filenames)

  const basenameMap = new Map<string, string[]>()
  for (const f of filenames) {
    const base = f.split("/").pop()!
    basenameMap.set(base, [...(basenameMap.get(base) ?? []), f])
  }

  const resolved: (RawComment & { path: string })[] = []
  const unresolved: RawComment[] = []

  for (const c of comments) {
    if (validPaths.has(c.fileName)) {
      resolved.push({ ...c, path: c.fileName })
      continue
    }
    const base = c.fileName.split("/").pop()!
    const matches = basenameMap.get(base) ?? []
    if (matches.length === 1) {
      resolved.push({ ...c, path: matches[0] })
    } else {
      unresolved.push(c)
    }
  }

  return { resolved, unresolved }
}

export async function triggerReview(values: triggerData) {

  const repository = await prisma.repository.findFirst({
    where:   { name: values.repo, owner: values.owner },
    include: { user: { include: { accounts: true } } },
  })

  if (!repository) {
    throw new Error(`Repository ${values.owner}/${values.repo} not found in database`)
  }

  const githubAccessToken = repository.user.accounts
    .find((account) => account.provider === "github")
    ?.access_token

  if (!githubAccessToken) {
    throw new Error("GitHub access token not found")
  }

  const octokit = new Octokit({ auth: githubAccessToken })
  const { sha, prNumber, owner, repo } = values

  // fetch diff AND the file list once, up front, for both branches
  let diff: string | undefined
  let filenames: string[] = []

  if (sha) {
    const { data } = await octokit.rest.repos.getCommit({// the diff text to send to the AI
      owner,
      repo,
      ref: sha,
      mediaType: { format: "diff" },
    })
    diff = data as unknown as string

    // still need valid filenames for the sha case so analyzeCode is constrained
    const { data: commitData } = await octokit.rest.repos.getCommit({//the real filenames to validate the AI's answer against.
      owner,
      repo,
      ref: sha,
    })
    filenames = (commitData.files ?? []).map((f) => f.filename)

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
    filenames = files.map((f) => f.filename)
  }

  if (!diff) {
    throw new Error("Could not fetch diff — provide either sha or prNumber")
  }

  // analyze ONCE, constrained to real paths
  const analysis = await analyzeCode(diff, filenames)

  // resolve/validate paths BEFORE saving to DB, so DB reflects reality
  const { resolved, unresolved } = resolvePaths(analysis.comments ?? [], filenames)

  if (unresolved.length > 0) {
    console.warn(`${unresolved.length} comment(s) had unresolvable paths:`, unresolved)
  }

  // save to DB ONCE — store resolved comments with their exact path,
  // and unresolved ones flagged so they're visible, not silently lost
  const savedReview = await prisma.review.create({
    data: {
      bugScore:      analysis.bugScore,
      qualityScore:  analysis.qualityScore,
      securityScore: analysis.securityScore,
      overallScore:  analysis.overallScore,
      summary:       analysis.summary,
      ...(sha      && { sha }),
      ...(prNumber && { prNumber }),
      repoId: repository.id,
      comments: {
        create: [
          ...resolved.map((c) => ({
            fileName: c.path,
            line:     c.line,
            severity: c.severity,
            issue:    c.issue,
            resolved: true,
          })),
          ...unresolved.map((c) => ({
            fileName: c.fileName,
            line:     c.line,
            severity: c.severity,
            issue:    c.issue,
            resolved: false,
          })),
        ],
      },
    },
    include: { comments: true },
  })

  // post to GitHub — separate try/catch so DB save is not lost
  try {
    if (sha) {
      const lines = resolved.map(
        (c) => `**${c.severity.toUpperCase()}** — \`${c.path}\` line ${c.line}\n> ${c.issue}`
      )
      if (unresolved.length > 0) {
        lines.push(
          `\n_${unresolved.length} additional finding(s) could not be attached to a file:_\n` +
          unresolved.map((c) => `- \`${c.fileName}\` line ${c.line}: ${c.issue}`).join("\n")
        )
      }

      await octokit.rest.repos.createCommitComment({
        owner,
        repo,
        commit_sha: sha,
        body: lines.join("\n\n") || "No issues found",
      })

    } else if (prNumber) {
      if (resolved.length > 0) {
        await octokit.rest.pulls.createReview({
          owner,
          repo,
          pull_number: prNumber,
          event: "COMMENT",
          comments: resolved.map((c) => ({
            path: c.path,
            line: c.line,
            body: `**${c.severity.toUpperCase()}**: ${c.issue}`,
            side: "RIGHT",
          })),
        })
      }

      if (unresolved.length > 0) {
        const body =
          `Revix found ${unresolved.length} additional issue(s) that couldn't be attached to a specific file/line:\n\n` +
          unresolved
            .map((c) => `- **${c.severity.toUpperCase()}** \`${c.fileName}\` line ${c.line}: ${c.issue}`)
            .join("\n")

        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body,
        })
      }
    }
  } catch (err) {
    console.error("GitHub posting failed:", err)
  }

  return { success: true, review: savedReview }
}