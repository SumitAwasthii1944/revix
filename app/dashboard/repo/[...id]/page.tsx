"use client"
import {toast} from '@/components/ui/use-toast'
import Link from "next/link"
import { useParams,useRouter } from "next/navigation"
import { useCallback,useEffect, useMemo, useState } from "react"
import {
    ArrowLeft,
    ArrowRight,
    Clock3,
    Code2,
    GitPullRequest,
    ShieldCheck,
    Sparkles,
} from "lucide-react"
import axios from "axios"

interface PullRequest{
    number?: number
    title?: string
    html_url?: string
    updated_at?: string
    user?: { login?: string }
}

type Commit = {
    sha?: string
    html_url?: string
    commit?: {
        message?: string
        author?: { name?: string; date?: string }
    }
}
interface Repo{
          status:string
          name:string
          createdAt:Date
          updatedAt:Date
          private:boolean
          gitHubRepoId:string
          description:string
          html_url:string
          owner:string
}
interface RepoResponse{
    success: boolean
    data?: {
        repo?:Repo
        reviewCount?: number
        pull_requests?: PullRequest[]
        commits?: Commit[]
    }
    error?: string
}

function formatDate(date: string | Date) {
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date))
}

export default function RepoDashboardPage() {
    const params = useParams<{ id?: string | string[] }>()
    const repoId = useMemo(() => {
        const rawId = params?.id
        return Array.isArray(rawId) ? rawId[0] : rawId
    }, [params])

    const [pulls, setPulls] = useState<PullRequest[]>([])
    const [commits, setCommits] = useState<Commit[]>([])
    const [repoName, setRepoName] = useState<string>("Repository detail")
    const [repoDescription, setRepoDescription] = useState<string>("A repository ready for review and inspection.")
    const [repoOwner, setRepoOwner] = useState<string>("")
    const [repoHtmlUrl, setRepoHtmlUrl] = useState<string>("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [reviewCount, setReviewCount] = useState(0)
    const [status, setStatus] = useState("monitored")
    const [updatedAt, setUpdatedAt] = useState<string | Date | null>(null)
    const [latestCommitDate, setLatestCommitDate] = useState<string | Date | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [commitLimit, setCommitLimit] = useState(6)

    const loadRepoData = useCallback(async (options?: { silent?: boolean }) => {
    if (!repoId) {
        setLoading(false)
        setError("Missing repository id")
        return
    }

    try {
        // "silent" refetches (polling, post-action refresh) shouldn't
        // flip the whole page back into a loading state
        if (!options?.silent) {
            setLoading(true)
        }
        setError(null)

        const response = await axios.get<RepoResponse>(`/api/dashboard/repo/${repoId}`)
        const payload = response.data.data

        if (!payload) {
            throw new Error(response.data.error ?? "Unable to load repository data")
        }

        const nextPulls = payload.pull_requests ?? []
        const nextCommits = payload.commits ?? []
        const repository = payload.repo ?? undefined
        setRepoName(repository?.name ?? "Repository detail")
        setRepoDescription(repository?.description ?? "A repository ready for review and inspection.")
        setRepoHtmlUrl(repository?.html_url ?? "")
        setRepoOwner(repository?.owner ?? "")
        setIsPrivate(repository?.private ?? false)
        setStatus(repository?.status ?? '')
        setReviewCount(payload.reviewCount ?? 0)
        setPulls(nextPulls)
        setCommits(nextCommits)
        setUpdatedAt(repository?.updatedAt ?? null)
        setLatestCommitDate(nextCommits[0]?.commit?.author?.date ?? null)

        if (nextCommits.length === 0 && nextPulls.length === 0) {
            setError("No pull requests or commits were returned for this repository yet.")
        }
    } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load repository data")
        if (!options?.silent) {
            setPulls([])
            setCommits([])
        }
    } finally {
        setLoading(false)
    }
}, [repoId])

useEffect(() => {
    void loadRepoData()

    // Poll for updates so new commits/PRs and review status
    // show up without a manual refresh
    const intervalId = setInterval(() => {
        void loadRepoData({ silent: true })
    }, 30000)

    return () => {
        clearInterval(intervalId)
    }
}, [loadRepoData])
    
    async function handlePrClick(prNumber:number){
        try {
            await axios.post('/api/trigger-review',{prNumber,repo:repoName,owner:repoOwner})
            toast({
                title:'review Started',
                description:'Revix has started reviewing your pull_request',
                variant:'success'
            })
            void loadRepoData({ silent: true })
        } catch (error) {
            toast({
                title:'review failed',
                description:'Revix review failed, try again!',
                variant:'warning'
            })
        }
    }
    async function handleCommitClick(sha:string){
        try {
            await axios.post('/api/trigger-review',{sha,repo:repoName,owner:repoOwner})
            toast({
                title:'review Started',
                description:'Revix has started reviewing your commit',
                variant:'success'
            })
            void loadRepoData({ silent: true })
        } catch (error) {
            toast({
                title:'review failed',
                description:'Revix review failed, try again!',
                variant:'warning'
            })
        }
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#0b0f14] text-[#f5f1ea]">
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(circle at top left, rgba(217, 142, 76, 0.24), transparent 34%), radial-gradient(circle at right, rgba(76, 124, 217, 0.16), transparent 28%), linear-gradient(180deg, #10151c 0%, #0b0f14 58%, #090c10 100%)",
                }}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

            <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
                <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/8 bg-white/4 p-5 backdrop-blur">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d98e4c]/30 bg-[#d98e4c]/12 text-[#f0b37f] shadow-[0_0_40px_rgba(217,142,76,0.18)]">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Revix</p>
                            <h1 className="text-lg font-semibold text-white">Repository detail</h1>
                        </div>
                    </div>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-0.5 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[10px] md:text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                    >
                        <ArrowLeft className="h-4 w-4 shrink" />
                        Back to dashboard
                    </Link>
                </div>

                <section className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/4 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.32)] md:p-10">
                    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#d98e4c]/12 blur-3xl" />
                    <div className="absolute left-0 bottom-0 h-40 w-40 rounded-full bg-[#4c7cd9]/10 blur-3xl" />

                    <div className="relative flex flex-col gap-6">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d98e4c]/20 bg-[#d98e4c]/10 px-3 py-1 text-xs font-medium text-[#f0b37f]">
                            <GitPullRequest className="h-3.5 w-3.5" />
                            {isPrivate ? "Private repository" : "Public repository"}
                        </div>

                        <div className="max-w-3xl space-y-4">
                            <p className="text-sm uppercase tracking-[0.32em] text-white/40">
                                {repoOwner ? `${repoOwner}/` : ""}{repoId}
                            </p>
                            <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                                {repoName}
                            </h2>
                            <p className="max-w-2xl text-base leading-7 text-white/68 md:text-lg">
                                {loading
                                    ? "Loading repository activity..."
                                    : repoDescription}
                            </p>
                            {error ? (
                                <p className="max-w-2xl text-sm leading-6 text-[#f6b0a8]">
                                    {error}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={repoHtmlUrl || `/dashboard/repo/${repoId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f1a463] px-5 py-3 text-sm font-semibold text-[#101318] transition hover:-translate-y-px hover:bg-[#f5b57d]"
                            >
                                Open on GitHub
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <p className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/72">
                                {status === "monitored" ? "Auto review enabled" : "Reviewing paused"}
                            </p>
                        </div>

                        <div className="grid gap-4 pt-3 sm:grid-cols-3">
                            <article className="rounded-2xl border border-white/8 bg-black/20 p-4 backdrop-blur">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6 text-[#f0b37f]">
                                        <Code2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs uppercase tracking-[0.24em] text-white/35">Live</span>
                                </div>
                                <p className="text-3xl font-semibold text-white">{reviewCount}</p>
                                <p className="mt-1 text-sm font-medium text-white/80">Reviews tracked</p>
                                <p className="mt-1 text-xs text-white/45">Revix keeps the total in sync with this repo.</p>
                            </article>

                            <article className="rounded-2xl border border-white/8 bg-black/20 p-4 backdrop-blur">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6 text-[#f0b37f]">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs uppercase tracking-[0.24em] text-white/35">Live</span>
                                </div>
                                <p className="text-3xl font-semibold text-white">{isPrivate ? "Private" : "Public"}</p>
                                <p className="mt-1 text-sm font-medium text-white/80">Visibility</p>
                                <p className="mt-1 text-xs text-white/45">Matches the GitHub repository setting.</p>
                            </article>

                            <article className="rounded-2xl border border-white/8 bg-black/20 p-4 backdrop-blur">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6 text-[#f0b37f]">
                                        <Clock3 className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs uppercase tracking-[0.24em] text-white/35">Live</span>
                                </div>
                                <p className="text-3xl font-semibold text-white">
                                    {updatedAt ? formatDate(updatedAt) : "--"}
                                </p>
                                <p className="mt-1 text-sm font-medium text-white/80">Last synced</p>
                                <p className="mt-1 text-xs text-white/45">
                                    {latestCommitDate ? `Latest commit ${formatDate(latestCommitDate)}` : "No commit activity synced yet"}
                                </p>
                            </article>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-[2rem] border border-white/8 bg-[#11161d]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.26)] md:p-8">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.28em] text-white/40">Pull requests</p>
                                <h3 className="mt-2 text-xl font-semibold text-white">Open review candidates</h3>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d98e4c]/10 text-[#f0b37f]">
                                <GitPullRequest className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {loading ? (
                                <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-sm leading-6 text-white/65">
                                    Loading pull requests...
                                </div>
                            ) : pulls.length === 0 ? (
                                <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-sm leading-6 text-white/65">
                                    No open pull requests were returned for this repository yet.
                                </div>
                            ) : (
                                pulls.map((pullRequest) => (
                                    <article key={pullRequest.number ?? pullRequest.title} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.24em] text-white/40">PR #{pullRequest.number ?? "?"}</p>
                                                <h4 className="mt-2 text-sm font-semibold text-white">{pullRequest.title ?? "Untitled pull request"}</h4>
                                                <p className="mt-2 text-xs text-white/48">
                                                    {pullRequest.user?.login ? `Opened by ${pullRequest.user.login}` : "Pull request author unavailable"}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-row gap-1">
                                                <Link
                                                    href={pullRequest.html_url ?? repoHtmlUrl ?? `/dashboard/repo/${repoId}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                                                >
                                                    View
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => handlePrClick(pullRequest.number!)}
                                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                
                                                    >
                                                    <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">review</span>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs text-white/45">
                                            {pullRequest.updated_at ? `Updated ${formatDate(pullRequest.updated_at)}` : "Update time unavailable"}
                                        </p>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-white/8 bg-white/3 p-6 md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/6 text-[#b8c7ff]">
                                <Code2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.28em] text-white/40">Commits</p>
                                <h3 className="text-lg font-semibold text-white">Recent activity</h3>
                            </div>
                        </div>

                        <div className="mt-5 space-y-4">
                            {loading ? (
                                <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-sm leading-6 text-white/65">
                                    Loading commits...
                                </div>
                            ) : commits.length === 0 ? (
                                <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-sm leading-6 text-white/65">
                                    No commits were synced for this repository yet.
                                </div>
                            ) : (
                                commits.slice(0, commitLimit).map((commit) => (
                                    <div key={commit.sha} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                                                    {commit.sha ? commit.sha.slice(0, 7) : "Commit"}
                                                </p>
                                                <p className="mt-2 text-sm font-semibold text-white">
                                                    {commit.commit?.message?.split("\n")[0] ?? "Commit message unavailable"}
                                                </p>
                                                <p className="mt-2 text-xs text-white/48">
                                                    {commit.commit?.author?.name ?? "Unknown author"}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-row gap-1">
                                                <Link
                                                    href={commit.html_url ?? repoHtmlUrl ?? `/dashboard/repo/${repoId}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                                                >
                                                    Open
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleCommitClick(commit.sha!)}
                                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                
                                                    >
                                                    <span className="text-[10px] font-semibold uppercase tracking-[0.28em]">review</span>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs text-white/45">
                                            {commit.commit?.author?.date ? `Committed ${formatDate(commit.commit.author.date)}` : "Commit date unavailable"}
                                        </p>
                                    </div>
                                    
                                ))
                                
                            )}
                            {commits.length > commitLimit && (
                                    <button
                                        onClick={() => setCommitLimit((n) => n + 6)}
                                        className="w-full rounded-2xl border border-white/8 bg-white/3 p-3 text-xs font-medium text-white/60 transition hover:border-white/20 hover:bg-white/6 hover:text-white/90"
                                    >
                                        Show more commits
                                    </button>
                            )}
                        </div>
                    </section>
                </div>
            </section>
        </main>
    )
}