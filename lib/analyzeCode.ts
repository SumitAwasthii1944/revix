import Groq from "groq-sdk"

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})


export async function analyzeCode(diff: string) {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens:      2048,
    response_format: { type: "json_object" },  // forces valid JSON — no parse errors
    messages: [
      {
        role:    "system",
        content: `You are Revix, an expert code reviewer. Analyze code diffs and return structured JSON only. No explanation. No markdown. No backticks.`,
      },
      {
        role:    "user",
        content: `Analyze this diff and return exactly this JSON:
        {
          "bugScore":      0-100,
          "securityScore": 0-100,
          "qualityScore":  0-100,
          "overallScore":  0-100,
          "summary":       "overall feedback",
          "comments": [
            {
              "fileName": "path/to/file.ts",
              "line":     42,
              "severity": "bug | security | style",
              "issue":    "description"
            }
          ]
        }

        Diff:
        ${diff}`,
      }
    ]
  })

  const text = response.choices[0]?.message?.content ?? ""

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`xAI returned invalid JSON: ${text}`)
  }
}