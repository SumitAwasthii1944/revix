import LiveReviewStatus from "@/components/live-review-status"

interface Props {
  params: Promise<{
    owner: string
    repo:  string
    sha:   string
  }>
}

export default async function ReviewPage({ params }: Props) {
  const { owner, repo, sha } =await params

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-lg font-semibold mb-2">
        AI Review
      </h1>
      <p className="text-sm text-zinc-400 mb-6">
        {owner}/{repo} · commit <code className="text-zinc-300">{sha.slice(0, 7)}</code>
      </p>

      <LiveReviewStatus
        owner={owner}
        repo={repo}
        sha={sha}
      />
    </div>
  )
}