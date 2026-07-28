import LiveReviewStatus from "@/components/live-review-status";

interface Props {
  params: Promise<{
    owner: string
    repo:  string
    prNumber:   string
  }>
}
export default async function PRReviewPage({ params }: Props) {
  const { owner, repo, prNumber } =await params

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-lg font-semibold mb-4">
        Reviewing {owner}/{repo}
      </h1>
      <p className="text-sm text-zinc-400 mb-6">
        Pull Request <code>#{prNumber}</code>
      </p>

      <LiveReviewStatus
        owner={owner}
        repo={repo}
        prNumber={parseInt(prNumber)}
      />
    </div>
  )
}