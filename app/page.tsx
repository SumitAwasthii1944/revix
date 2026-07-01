import Link from "next/link"
import { auth, signOut } from "@/auth"
import {prisma} from '@/lib/prisma'
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
  "Comment tone and intent scoring",
  "Risky diff detection across files",
  "PR summaries with actionable next steps",
  "Webhook-triggered review automation",
]

const pipeline = [
  {
    title: "Pull request arrives",
    text: "GitHub webhook fires and Revix starts reading the diff.",
  },
  {
    title: "Model inspects context",
    text: "Code patterns, file changes, and review signals are evaluated together.",
  },
  {
    title: "Clear feedback lands",
    text: "You get a concise review that is easy to act on before merge.",
  },
]

export default async function Home() {
  const session = await auth()
  const firstName = session?.user?.name?.split(" ")[0] ?? "builder"
  const trackedCount = await prisma.repository.count({
    where: { userId: session?.user?.id },
  })
  const trackedThisWeek = await prisma.repository.count({
    where: {
      userId: session?.user?.id,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
      },
    },
  })
  const highlights = [
    {
      label: "Repositories tracked",
      value: trackedCount.toString(),
      detail: `+${trackedThisWeek} this week`,
      icon: GitPullRequest,
    },
    {
      label: "Review checks",
      value: "96%",
      detail: "Ready before merge",
      icon: ShieldCheck,
    },
    {
      label: "Median review time",
      value: "4m 12s",
      detail: "From trigger to summary",
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
              <h1 className="text-lg font-semibold text-white">Code review, sharpened for modern teams</h1>
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
                Intelligent review workspace
              </div>

              <div className="max-w-3xl space-y-4">
                <p className="text-sm uppercase tracking-[0.32em] text-white/40">Welcome back, {firstName}</p>
                <h2 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  Turn every pull request into a clear, fast, and useful review.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-white/68 md:text-lg">
                  Revix watches your repositories, understands the diff, and turns noisy code changes into focused feedback your team can trust.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f1a463] px-5 py-3 text-sm font-semibold text-[#101318] transition hover:-translate-y-px hover:bg-[#f5b57d]"
                >
                  Open dashboard
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
                  <p className="text-xs uppercase tracking-[0.28em] text-white/40">What Revix watches</p>
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
                  <p className="text-xs uppercase tracking-[0.28em] text-white/40">Review flow</p>
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
      </section>
    </main>
  )
}
