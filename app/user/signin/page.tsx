import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-6">
      {/* faint grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#2A2F36 1px, transparent 1px), linear-gradient(90deg, #2A2F36 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-120 w-120 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6E56CF] opacity-[0.10] blur-[120px]" />

      <div className="relative z-10 w-full max-w-105">
        {/* terminal-style card */}
        <div className="overflow-hidden rounded-xl border border-[#23272E] bg-[#111418] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_48px_-12px_rgba(0,0,0,0.6)]">
          {/* title bar */}
          <div className="flex items-center gap-2 border-b border-[#23272E] bg-[#15181D] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3A3F47]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3A3F47]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3A3F47]" />
            <span className="ml-2 font-mono text-[11px] tracking-wide text-[#5C6370]">
              ~/auth/sign-in
            </span>
          </div>

          {/* body */}
          <div className="px-8 py-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-[#23272E] bg-[#15181D]">
                <svg viewBox="0 0 16 16" className="h-5 w-5 fill-[#E6E8EB]">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </div>
              <h1 className="text-[19px] font-medium tracking-tight text-[#E6E8EB]">
                Sign in to continue
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-[#7C828A]">
                Authenticate with your GitHub account to access your workspace.
              </p>
            </div>

            <form
              action={async () => {
                "use server"
                await signIn("github", { redirectTo: "/" })
              }}
            >
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#2A2F36] bg-[#1A1D21] px-4 py-3 text-[14px] font-medium text-[#E6E8EB] transition-colors duration-150 hover:bg-[#21252A] focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D0F]"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Continue with GitHub
                <span className="ml-1 text-[#5C6370] transition-transform duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </form>
          </div>

          {/* footer strip */}
          <div className="border-t border-[#23272E] bg-[#0E1013] px-8 py-4">
            <p className="text-center text-[11px] leading-relaxed text-[#5C6370]">
              By continuing, you agree to our{" "}
              <a href="/terms" className="text-[#8A8FA0] underline-offset-2 hover:text-[#E6E8EB] hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-[#8A8FA0] underline-offset-2 hover:text-[#E6E8EB] hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] text-[#4A4F57]">
          Protected by GitHub OAuth
        </p>
      </div>
    </main>
  )
}