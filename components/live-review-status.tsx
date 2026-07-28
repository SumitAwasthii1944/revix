'use client'
import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

type Status = "queued" | "started" | "progress" | "done" | "failed"
type Severity = "bug" | "security" | "style"

interface Comment {
  fileName: string
  line:     number
  severity: Severity
  issue:    string
  resolved: boolean
}

interface Review {
  bugScore:      number
  securityScore: number
  qualityScore:  number
  overallScore:  number
  summary:       string
  comments:      Comment[]
}

interface Props {
  owner:     string
  repo:      string
  prNumber?: number
  sha?:      string
}

// ── helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 75) return "#4ade80"   // green
  if (score >= 50) return "#facc15"   // yellow
  return "#f87171"                     // red
}

function scoreLabel(score: number) {
  if (score >= 75) return "Good"
  if (score >= 50) return "Fair"
  return "Poor"
}

function severityColor(s: Severity) {
  if (s === "bug")      return { bg: "#3f1d1d", border: "#7f3030", text: "#f87171", dot: "#ef4444" }
  if (s === "security") return { bg: "#1d2e3f", border: "#2a4f70", text: "#60a5fa", dot: "#3b82f6" }
  return                       { bg: "#2a2a1a", border: "#4a4a20", text: "#facc15", dot: "#eab308" }
}

function severityLabel(s: Severity) {
  if (s === "bug")      return "Bug"
  if (s === "security") return "Security"
  return "Style"
}

// ── ring chart ───────────────────────────────────────────────────────────────

function RingScore({ score, label }: { score: number; label: string }) {
  const r   = 28
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = scoreColor(score)

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="#1e2028" strokeWidth={6} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
        />
        <text
          x={36} y={40}
          textAnchor="middle"
          style={{
            transform:  "rotate(90deg) translate(0,-72px)",
            fontSize:   15,
            fontWeight: 700,
            fill:       color,
            fontFamily: "monospace",
          }}
        >
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>
        {scoreLabel(score)}
      </span>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function LiveReviewStatus({ owner, repo, prNumber, sha }: Props) {
  const [status, setStatus] = useState<Status>("queued")
  const [step,   setStep]   = useState<string>("Waiting for worker...")
  const [review, setReview] = useState<Review | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const roomId = `review:${owner}:${repo}:${prNumber ?? sha}`
  const ref    = sha ? sha.slice(0, 7) : `#${prNumber}`

  // elapsed timer while review is running
  useEffect(() => {
    if (status === "queued" || status === "started" || status === "progress") {
      const t = setInterval(() => setElapsed(e => e + 1), 1000)
      return () => clearInterval(t)
    }
  }, [status])

  useEffect(() => {
    const s = io({ path: "/socket.io" })

    s.on("connect", () => {
      s.emit("join:review", { roomId })
    })

    s.on("review:started",  ()            => setStatus("started"))
    s.on("review:progress", ({ step })    => { setStatus("progress"); setStep(step) })
    s.on("review:done",     ({ review })  => { setStatus("done");     setReview(review) })
    s.on("review:failed",   ()            => setStatus("failed"))

    setSocket(s)
    return () => { s.disconnect() }
  }, [roomId])

  // ── styles ──────────────────────────────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight:       "100vh",
    background:      "#0c0d10",
    color:           "#e2e8f0",
    fontFamily:      "'Inter', 'Segoe UI', sans-serif",
    padding:         "2rem 1rem",
  }

  const container: React.CSSProperties = {
    maxWidth:  780,
    margin:    "0 auto",
  }

  const card: React.CSSProperties = {
    background:   "#13151c",
    border:       "1px solid #1e2028",
    borderRadius: 14,
    padding:      "1.5rem",
    marginBottom: "1rem",
  }

  const pill = (color: string): React.CSSProperties => ({
    display:      "inline-flex",
    alignItems:   "center",
    gap:          5,
    padding:      "3px 10px",
    borderRadius: 99,
    fontSize:     11,
    fontWeight:   600,
    letterSpacing: "0.05em",
    background:   color + "22",
    color:        color,
    border:       `1px solid ${color}44`,
  })

  // ── header ──────────────────────────────────────────────────────────────────
  const header = (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Revix AI Review</h1>
        {status === "done" && (
          <span style={pill("#4ade80")}>● Complete</span>
        )}
        {(status === "queued" || status === "started" || status === "progress") && (
          <span style={pill("#facc15")}>● Running · {elapsed}s</span>
        )}
        {status === "failed" && (
          <span style={pill("#f87171")}>● Failed</span>
        )}
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
        {owner}/{repo} · {sha ? "commit" : "PR"}{" "}
        <code style={{ fontFamily: "monospace", color: "#94a3b8" }}>{ref}</code>
      </p>
    </div>
  )

  // ── loading states ──────────────────────────────────────────────────────────
  if (status !== "done" && status !== "failed") {
    const steps = [
      "Waiting for worker...",
      "Finding repository...",
      "Fetching diff from GitHub...",
      "Analyzing code with Groq AI...",
      "Saving review to database...",
      "Posting feedback to GitHub...",
    ]

    return (
      <div style={page}>
        <div style={container}>
          {header}
          <div style={card}>
            {/* progress bar */}
            <div style={{ background: "#1e2028", borderRadius: 4, height: 4, marginBottom: "1.5rem", overflow: "hidden" }}>
              <div style={{
                height:     "100%",
                width:      status === "queued" ? "10%" : status === "started" ? "25%" : "65%",
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                borderRadius: 4,
                transition: "width 0.8s ease",
              }} />
            </div>

            {/* current step */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
              <span style={{
                display:    "inline-block",
                width:      8,
                height:     8,
                borderRadius: "50%",
                background: "#6366f1",
                boxShadow:  "0 0 8px #6366f1",
                animation:  "pulse 1.5s infinite",
              }} />
              <span style={{ fontSize: 14, color: "#a5b4fc" }}>{step}</span>
            </div>

            {/* step list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {steps.map((s, i) => {
                const isDone    = steps.indexOf(step) > i
                const isCurrent = step === s
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width:      18,
                      height:     18,
                      borderRadius: "50%",
                      border:     `2px solid ${isDone ? "#4ade80" : isCurrent ? "#6366f1" : "#1e2028"}`,
                      background: isDone ? "#4ade80" : "transparent",
                      display:    "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize:   10,
                      color:      "#0c0d10",
                      flexShrink: 0,
                      transition: "all 0.3s",
                    }}>
                      {isDone ? "✓" : ""}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color:    isDone ? "#4ade80" : isCurrent ? "#e2e8f0" : "#374151",
                      transition: "color 0.3s",
                    }}>
                      {s}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.5; transform: scale(0.8); }
          }
        `}</style>
      </div>
    )
  }

  // ── failed ──────────────────────────────────────────────────────────────────
  if (status === "failed") {
    return (
      <div style={page}>
        <div style={container}>
          {header}
          <div style={{ ...card, borderColor: "#7f1d1d", textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: "#f87171", fontWeight: 600, marginBottom: 6 }}>Review failed</p>
            <p style={{ color: "#6b7280", fontSize: 13 }}>
              Something went wrong during analysis. Try triggering the review again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── done ────────────────────────────────────────────────────────────────────
  if (!review) return null

  const byFile = review.comments.reduce((acc: Record<string, Comment[]>, c) => {
    acc[c.fileName] = acc[c.fileName] ?? []
    acc[c.fileName].push(c)
    return acc
  }, {})

  const bugCount      = review.comments.filter(c => c.severity === "bug").length
  const secCount      = review.comments.filter(c => c.severity === "security").length
  const styleCount    = review.comments.filter(c => c.severity === "style").length

  return (
    <div style={page}>
      <div style={container}>
        {header}

        {/* ── score cards ── */}
        <div style={{ ...card }}>
          <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.2rem" }}>
            Scores
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, justifyItems: "center" }}>
            <RingScore score={review.overallScore}  label="Overall"  />
            <RingScore score={review.bugScore}      label="Bugs"     />
            <RingScore score={review.securityScore} label="Security" />
            <RingScore score={review.qualityScore}  label="Quality"  />
          </div>
        </div>

        {/* ── summary ── */}
        <div style={card}>
          <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            Summary
          </p>
          <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>
            {review.summary}
          </p>
        </div>

        {/* ── issue counts ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1rem" }}>
          {[
            { label: "Bugs",            count: bugCount,   color: "#f87171" },
            { label: "Security issues", count: secCount,   color: "#60a5fa" },
            { label: "Style issues",    count: styleCount, color: "#facc15" },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ ...card, marginBottom: 0, textAlign: "center", padding: "1rem" }}>
              <p style={{ fontSize: 28, fontWeight: 700, color, margin: 0, fontFamily: "monospace" }}>
                {count}
              </p>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── comments by file ── */}
        {Object.keys(byFile).length > 0 && (
          <div style={card}>
            <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              Inline Comments — {review.comments.length} issue{review.comments.length !== 1 ? "s" : ""}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {Object.entries(byFile).map(([file, comments]) => (
                <div key={file}>
                  {/* file header */}
                  <div style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          8,
                    padding:      "6px 10px",
                    background:   "#0c0d10",
                    borderRadius: "6px 6px 0 0",
                    border:       "1px solid #1e2028",
                    borderBottom: "none",
                  }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>📄</span>
                    <code style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>
                      {file}
                    </code>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#374151" }}>
                      {comments.length} issue{comments.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* comments */}
                  <div style={{
                    border:       "1px solid #1e2028",
                    borderRadius: "0 0 6px 6px",
                    overflow:     "hidden",
                  }}>
                    {comments.map((c, i) => {
                      const col = severityColor(c.severity)
                      return (
                        <div
                          key={i}
                          style={{
                            display:       "flex",
                            gap:           12,
                            padding:       "12px 14px",
                            background:    i % 2 === 0 ? "#0f1117" : "#0c0d10",
                            borderTop:     i > 0 ? "1px solid #1e2028" : "none",
                            alignItems:    "flex-start",
                          }}
                        >
                          {/* line number */}
                          <div style={{
                            flexShrink:  0,
                            minWidth:    40,
                            textAlign:   "right",
                          }}>
                            <code style={{
                              fontSize:   11,
                              color:      "#374151",
                              fontFamily: "monospace",
                            }}>
                              L{c.line}
                            </code>
                          </div>

                          {/* severity badge */}
                          <div style={{ flexShrink: 0, paddingTop: 1 }}>
                            <span style={{
                              display:      "inline-block",
                              padding:      "2px 7px",
                              borderRadius: 4,
                              fontSize:     10,
                              fontWeight:   700,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              background:   col.bg,
                              color:        col.text,
                              border:       `1px solid ${col.border}`,
                            }}>
                              {severityLabel(c.severity)}
                            </span>
                          </div>

                          {/* issue text */}
                          <p style={{
                            fontSize:   13,
                            color:      "#cbd5e1",
                            lineHeight: 1.6,
                            margin:     0,
                            flex:       1,
                          }}>
                            {c.issue}
                          </p>

                          {/* resolved dot */}
                          <div style={{ flexShrink: 0, paddingTop: 4 }}>
                            <span
                              title={c.resolved ? "Path resolved" : "Path unresolved"}
                              style={{
                                display:      "inline-block",
                                width:        8,
                                height:       8,
                                borderRadius: "50%",
                                background:   c.resolved ? "#4ade80" : "#374151",
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {review.comments.length === 0 && (
          <div style={{ ...card, textAlign: "center", padding: "2.5rem" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
            <p style={{ color: "#4ade80", fontWeight: 600, margin: 0 }}>No issues found</p>
            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
              This code looks clean. Nice work.
            </p>
          </div>
        )}

        {/* ── footer ── */}
        <p style={{ textAlign: "center", fontSize: 11, color: "#374151", marginTop: "1rem" }}>
          Reviewed by Revix · {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  )
}