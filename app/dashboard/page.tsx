import Link from "next/link"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
    ArrowRight,
    Bot,
    Clock3,
    Code2,
    GitPullRequest,
    ShieldCheck,
    Sparkles,
    Zap,
} from "lucide-react"

const signals = [
	"Repository status and review coverage",
	"Recent activity across connected projects",
	"Private and public repo visibility at a glance",
	"Fast access to each repository's GitHub source",
]

const pipeline = [
	{
		title: "Repository is connected",
		text: "Revix tracks the repo, keeps status visible, and prepares it for review runs.",
	},
	{
		title: "Reviews stack up",
		text: "Every review is counted and grouped so the dashboard stays useful at a glance.",
	},
	{
		title: "You jump to source",
		text: "Open the repo on GitHub whenever you need to inspect the code directly.",
	},
]

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date)
}

export default async function DashboardPage() {
    const session = await auth()
    const firstName = session?.user?.name?.split(" ")[0] ?? "builder"
    const userId = session?.user?.id

    const repos = userId
        ? await prisma.repository.findMany({
              where: { userId },
              orderBy: { updatedAt: "desc" },
              include: {
                  _count: {
                      select: { review: true },
                  },
              },
          })
        : []

    const trackedCount = repos.length
    const monitoredCount = repos.filter((repo) => repo.status === "monitored").length
    const privateCount = repos.filter((repo) => repo.private).length
    const totalReviews = repos.reduce((sum, repo) => sum + repo._count.review, 0)
    const latestUpdatedAt = repos[0]?.updatedAt

    const highlights = [
        {
            label: "Repositories tracked",
            value: trackedCount.toString(),
            detail: privateCount > 0 ? `${privateCount} private` : "All visible from one place",
            icon: GitPullRequest,
        },
        {
            label: "Monitored repos",
            value: monitoredCount.toString(),
            detail: "Ready for review automation",
            icon: ShieldCheck,
        },
        {
            label: "Total reviews",
            value: totalReviews.toString(),
            detail: latestUpdatedAt ? `Last update ${formatDate(latestUpdatedAt)}` : "No recent activity yet",
            icon: Clock3,
        },
    ]

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
                <header className="flex flex-col gap-4 rounded-3xl border border-white/8 bg-white/4 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d98e4c]/30 bg-[#d98e4c]/12 text-[#f0b37f] shadow-[0_0_40px_rgba(217,142,76,0.18)]">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Revix</p>
                            <h1 className="text-lg font-semibold text-white">Dashboard, tuned for review velocity</h1>
                        </div>
                    </div>

                    <form
                        action={async () => {
                            "use server"
                            await signOut({ redirectTo: "/user/signin" })
                        }}
                    >
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                        >
                            Sign out
                        </button>
                    </form>
                </header>

                <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
                    <section className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/4 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.32)] md:p-10">
                        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#d98e4c]/12 blur-3xl" />
                        <div className="absolute left-0 bottom-0 h-40 w-40 rounded-full bg-[#4c7cd9]/10 blur-3xl" />

                        <div className="relative flex flex-col gap-6">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d98e4c]/20 bg-[#d98e4c]/10 px-3 py-1 text-xs font-medium text-[#f0b37f]">
                                <Bot className="h-3.5 w-3.5" />
                                Repository review workspace
                            </div>

                            <div className="max-w-3xl space-y-4">
                                <p className="text-sm uppercase tracking-[0.32em] text-white/40">Welcome back, {firstName}</p>
                                <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                                    Keep every connected repository visible, reviewed, and ready to ship.
                                </h2>
                                <p className="max-w-2xl text-base leading-7 text-white/68 md:text-lg">
                                    Revix gives you a single place to watch repository status, inspect review volume, and jump into the source whenever you need more context.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="#repositories"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f1a463] px-5 py-3 text-sm font-semibold text-[#101318] transition hover:-translate-y-px hover:bg-[#f5b57d]"
                                >
                                    Explore repositories
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/settings"
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                                >
                                    Review settings
                                </Link>
                            </div>

                            <div className="grid gap-4 pt-3 sm:grid-cols-3">
                                {highlights.map((item) => {
                                    const Icon = item.icon

                                    return (
                                        <article
                                            key={item.label}
                                            className="rounded-2xl border border-white/8 bg-black/20 p-4 backdrop-blur"
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6 text-[#f0b37f]">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs uppercase tracking-[0.24em] text-white/35">Live</span>
                                            </div>
                                            <p className="text-3xl font-semibold text-white">{item.value}</p>
                                            <p className="mt-1 text-sm font-medium text-white/80">{item.label}</p>
                                            <p className="mt-1 text-xs text-white/45">{item.detail}</p>
                                        </article>
                                    )
                                })}
                            </div>
                        </div>
                    </section>

                    <aside className="grid gap-6">
                        <section className="rounded-[2rem] border border-white/8 bg-[#11161d]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.26)]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">What the dashboard shows</p>
                                    <h3 className="mt-2 text-xl font-semibold text-white">Signals that matter</h3>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d98e4c]/10 text-[#f0b37f]">
                                    <Code2 className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                {signals.map((signal) => (
                                    <div
                                        key={signal}
                                        className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/3 p-3"
                                    >
                                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#f1a463]" />
                                        <p className="text-sm leading-6 text-white/78">{signal}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-white/8 bg-white/3 p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/6 text-[#b8c7ff]">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.28em] text-white/40">Dashboard flow</p>
                                    <h3 className="text-lg font-semibold text-white">A simple pipeline</h3>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                {pipeline.map((step, index) => (
                                    <div key={step.title} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/6 text-xs font-semibold text-white/80">
                                                {index + 1}
                                            </div>
                                            {index < pipeline.length - 1 && <div className="mt-2 h-full w-px bg-white/8" />}
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-sm font-semibold text-white">{step.title}</p>
                                            <p className="mt-1 text-sm leading-6 text-white/60">{step.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>
                </div>

                <section id="repositories" className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] md:p-8">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-white/40">Connected repositories</p>
                            <h3 className="mt-2 text-2xl font-semibold text-white">Your review surface</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                                Open a repository on GitHub, check its status, and review the latest activity without leaving the dashboard.
                            </p>
                        </div>
                        <Link
                            href="/settings"
                            className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                        >
                            Manage connections
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {repos.length === 0 ? (
                            <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-black/12 p-8">
                                <p className="text-lg font-semibold text-white">No repositories connected yet.</p>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                                    Add a repository in settings to start tracking review activity, status, and updates in one place.
                                </p>
                                <Link
                                    href="/settings"
                                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#f1a463] px-5 py-3 text-sm font-semibold text-[#101318] transition hover:-translate-y-px hover:bg-[#f5b57d]"
                                >
                                    Add a repository
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            repos.map((repo) => (
                                <article
                                    key={repo.id}
                                    className="group rounded-[1.75rem] border border-white/8 bg-black/18 p-5 transition hover:border-white/14 hover:bg-black/24"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.28em] text-white/36">Repository</p>
                                            <h4 className="mt-2 text-xl font-semibold text-white">{repo.owner}/{repo.name}</h4>
                                            <p className="mt-2 text-sm leading-6 text-white/62">
                                                {repo.description ?? "No description added yet."}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-white/78">
                                            {repo.private ? "Private" : "Public"}
                                        </span>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/56">
                                        <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1">
                                            Status: {repo.status}
                                        </span>
                                        <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1">
                                            Reviews: {repo._count.review}
                                        </span>
                                        <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1">
                                            Updated {formatDate(repo.updatedAt)}
                                        </span>
                                    </div>

                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <Link
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f1a463] px-4 py-2.5 text-sm font-semibold text-[#101318] transition hover:-translate-y-px hover:bg-[#f5b57d]"
                                        >
                                            Open GitHub
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                        <p className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/72">
                                            {repo.status === "monitored" ? "Auto review ready" : "Reviewing paused"}
                                        </p>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </section>
        </main>
    )
}
