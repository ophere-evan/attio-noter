export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: "No transcript provided" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are a VC fund analyst at Sticker Ventures. Summarize this voice note into a concise CRM note. 

Rules:
- Use today's date: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
- No markdown bold (no ** anywhere)
- No Action Items section
- Sections: Date, Meeting Type, Key Topics, Financial Metrics (only if numbers/revenue/funding mentioned), Next Steps only
- Keep it short and informative — bullet points, no fluff
- If a company name is mentioned, match it to our portfolio if relevant: Prism, Turnout, Gravy Pass, Horizon, SunSay, Archie And Dennis, Highlight Studios, Yomu, Owlue, banditos.studio, Invitfull, Shortical

Voice note:\n${transcript}`,
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find((b) => b.type === "text")?.text || "";
    res.status(200).json({ summary: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
