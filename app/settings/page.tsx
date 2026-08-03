"use client"

import { useEffect, useState } from "react"
import { GitBranch, Search, AlertCircle, Check, Loader2 } from "lucide-react"
import { axiosInstance } from "@/lib/axios"
import Link from "next/link"

interface Repo {
  id: number                    
  name: string
  owner: {
    login: string
    avatar_url?: string
  }
  is_connected?: boolean
}

export default function RepoList() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [connectingId, setConnectingId] = useState<number | null>(null)
  const [disConnectingId, setDisconnectingId] = useState<number | null>(null)
  const [connectedIds, setConnectedIds] = useState<Set<number>>(new Set())

  const handleConnect = async (repo: Repo) => {
    setConnectingId(repo.id)
    try {
      await axiosInstance.post("/repositories", {//post() takes the body as its own, second argument — no wrapping needed.
        owner: repo.owner.login,
        repo: repo.name,
      })
      setConnectedIds((prev) => new Set(prev).add(repo.id))
    } catch (error) {
      console.error(error)
    } finally {
      setConnectingId(null)
    }
  }

  const handleDisconnect = async (repo: Repo) => {
      setDisconnectingId(repo.id)
      try {
        await axiosInstance.delete('/repositories',{//delete() (and also get()) only take two arguments total: (url, config). There's no dedicated "body" slot in the function signature, 
          //Since Axios still needs some way to let you attach a body when you really want one, it repurposes the config object's data field for it
          data:{
            owner:repo.owner.login,
            repo:repo.name
          }
        })
        setConnectedIds((prev) => {
          const next = new Set(prev)
          next.delete(repo.id)
          return next
        })
      } catch (error) {
        console.error(error)
      }finally{
        setDisconnectingId(null)
      }
  }

  useEffect(() => {
    async function fetchRepos() {
      try {
        setError(null)
        setLoading(true)
        const response = await axiosInstance.get("/repositories")
        const data: Repo[] = response.data.data ?? []
        setRepos(data)
        const connected = data.filter((r) => r.is_connected).map((r) => r.id)
        setConnectedIds(new Set(connected))
      } catch (error: any) {
        setRepos([])
        const status = error?.response?.status
        const message = error?.response?.data?.error

        if (status === 401) {
          setError(message ?? "GitHub access token is invalid or revoked. Reconnect GitHub to continue.")
        } else {
          setError(message ?? "Unable to load repositories right now. Check your GitHub connection and try again.")
        }
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [])

  const filtered = repos.filter((r) =>
    `${r.owner.login}/${r.name}`.toLowerCase().includes(query.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-8 text-sm text-zinc-500">
        <Loader2 size={15} className="animate-spin" />
        Loading repositories…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center text-center gap-3 border border-white/10 rounded-xl bg-zinc-900/40 px-6 py-10">
        <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle size={16} className="text-red-400" />
        </div>
        <p className="text-sm text-zinc-300 max-w-sm">{error}</p>
        <Link
          href="/user/signin?callbackUrl=/settings"
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-white/15 text-zinc-200 hover:bg-white/10 hover:border-white/25 transition-colors"
        >
          Reconnect GitHub
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mt-2 ml-2">
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search repositories"
          className="w-full bg-white/5 border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-colors"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/40 overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((r) => {
            const isConnecting = connectingId === r.id
            const isConnected = connectedIds.has(r.id)
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 px-4 py-3.5 border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <GitBranch size={16} className="text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-100 font-medium truncate">{r.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{r.owner.login}</p>
                  </div>
                </div>
                <button
                  onClick={() => (isConnected ? handleDisconnect(r) : handleConnect(r))}
                  disabled={isConnecting || disConnectingId === r.id}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                    isConnected
                      ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                      : "bg-transparent border-white/15 text-zinc-200 hover:bg-white/10 hover:border-white/25 disabled:opacity-60"
                  }`}
                >
                  {isConnected && disConnectingId !== r.id && <Check size={13} />}
                  {(isConnecting || disConnectingId === r.id) && <Loader2 size={13} className="animate-spin" />}
                  {disConnectingId === r.id ? "Disconnecting" : isConnected ? "Connected" : isConnecting ? "Connecting" : "Connect"}
                </button>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <GitBranch size={16} className="text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-300 font-medium">No repositories found</p>
            <p className="text-xs text-zinc-500 mt-1">
              {query ? "Try a different search." : "Connect a GitHub account to see your repositories here."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}