'use client'
import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Settings, Menu, GitPullRequest, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const colors = {
  background:      "#0b0f14",
  backgroundAlt:   "#11161d",
  cardBackground:  "rgba(255,255,255,0.04)",
  border:          "rgba(255,255,255,0.08)",
  textPrimary:     "#f5f1ea",
  textSecondary:   "rgba(245,241,234,0.72)",
  textMuted:       "rgba(245,241,234,0.45)",
  accent:          "#f1a463",
  accentSoft:      "rgba(241,164,99,0.12)",
}

interface Repo {
  id:     string
  name:   string
  status: string
}

interface User {
  id:    string
  name:  string
  email: string
  image: string
}

function RepoRow({ repo, onSelect }: { repo: Repo; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(repo.id)}
      className="w-full flex items-center justify-between px-3 py-2 text-left rounded-r-md"
    >
      <span className="truncate text-sm" style={{ color: colors.textPrimary }}>
        {repo.name}
      </span>
      <span className="text-xs" style={{ color: colors.textMuted }}>
        {repo.status}
      </span>
    </button>
  )
}

export default function RevixSidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [reposExpanded, setReposExpanded]   = useState(true)
  const [repos, setRepos]                   = useState<Repo[]>([])
  const [user, setUser]                     = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // fetch repos from your API route
    async function loadRepos() {
      try {
        const res  = await fetch("/api/dashboard/repos")
        const data = await res.json()
        setRepos(data.data ?? [])
      } catch (err) {
        console.error("Failed to load repos:", err)
      }
    }

    // fetch session from Next.js session API
    async function loadUser() {
      try {
        const res  = await fetch("/api/auth/session")
        const data = await res.json()
        if (data?.user) setUser(data.user)
      } catch (err) {
        console.error("Failed to load user:", err)
      }
    }

    loadRepos()
    loadUser()
  }, [])

  function navigateTo(path: string) {
    router.push(path)
    setMobileMenuOpen(false)
  }

  const sidebar = (
    <div
      className="flex h-full flex-col"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(217,142,76,0.10), transparent 28%), linear-gradient(180deg, #10151c 0%, #0b0f14 58%, #090c10 100%)",
        color: colors.textPrimary,
      }}
    >

      {/* Brand */}
      <Link href={'/'}
        className="flex items-center gap-3 border-b px-4 py-4"
        style={{ borderColor: colors.border, background: colors.backgroundAlt }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl border"
          style={{ borderColor: "rgba(241,164,99,0.22)", background: colors.accentSoft, color: colors.accent }}
        >
          <Sparkles size={16} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: colors.textMuted }}>
            Revix
          </p>
          <p className="text-sm font-semibold">Review workspace</p>
        </div>
      </Link>

      {/* Repos list */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <button
          onClick={() => setReposExpanded((prev) => !prev)}
          className="mb-2 flex w-full items-center justify-between rounded-2xl px-3 py-2"
          style={{ color: colors.textMuted, background: colors.backgroundAlt, border: `1px solid ${colors.border}` }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">Repositories</span>
          {reposExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {reposExpanded && (
          <div className="flex flex-col gap-2">
            {repos.length === 0 && (
              <p className="rounded-2xl border px-3 py-3 text-xs" style={{ color: colors.textMuted, borderColor: colors.border, background: "rgba(255,255,255,0.02)" }}>
                No repos connected yet
              </p>
            )}
            {repos.map((repo) => (
              <RepoRow
                key={repo.id}
                repo={repo}
                onSelect={(id) => navigateTo(`/repo/${id}`)}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Settings */}
      <div className="px-3 pt-2">
        <button
          onClick={() => navigateTo("/settings")}
          className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 transition hover:-translate-y-px"
          style={{ color: colors.textSecondary, background: colors.backgroundAlt, border: `1px solid ${colors.border}` }}
        >
          <Settings size={15} />
          <span className="text-sm">Settings</span>
        </button>
      </div>

      {/* User card */}
      <div className="px-3 pb-3 pt-2">
        <button
          onClick={() => navigateTo("/user/profile")}
          className="flex w-full items-center gap-3 rounded-[1.25rem] px-3 py-3 text-left transition hover:-translate-y-px"
          style={{ background: colors.cardBackground, border: `1px solid ${colors.border}` }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-semibold"
            style={{ background: colors.accentSoft, color: colors.accent }}
          >
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">{user?.name ?? "Loading..."}</p>
            <p className="text-xs truncate" style={{ color: colors.textMuted }}>
              {user?.email ?? ""}
            </p>
          </div>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(217,142,76,0.08), transparent 30%), linear-gradient(180deg, #10151c 0%, #0b0f14 100%)",
        }}
      >
        <button onClick={() => setMobileMenuOpen(true)}>
          <Menu size={20} />
        </button>
        <span className="text-sm font-semibold">REVIX</span>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
          style={{ background: colors.accentSoft, color: colors.accent }}
        >
          {user?.name?.[0] ?? "U"}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-10 h-full w-72">{sidebar}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:h-screen md:w-60 md:flex-col"
        style={{ borderRight: `1px solid ${colors.border}` }}
      >
        {sidebar}
      </div>
    </>
  )
}