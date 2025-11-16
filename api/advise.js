const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

async function callOpenAI(systemMessage, userPrompt, apiKey) {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  const data = await response.json();

  // 🔥 FIXED PARSING — handles both content and array-based outputs
  let text = "";

  try {
    const msg = data.choices?.[0]?.message;
    if (typeof msg?.content === "string") {
      text = msg.content.trim();
    } else if (Array.isArray(msg?.content)) {
      // Newer API returns array blocks
      text = msg.content.map(block => block.text || "").join(" ").trim();
    }
  } catch (e) {
    console.error("Parsing error:", e, "Full response:", data);
  }

  return text || "No response generated.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt: userPrompt } = req.body || {};
  if (!userPrompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server misconfigured: OPENAI_API_KEY missing",
    });
  }

  const calmSys =
    "You are a soft, supportive life coach. Give short, practical, kind advice.";
  const chaosSys =
    "You are a dramatic but friendly chaos coach. Give short, sarcastic, chaotic advice, but keep it safe and playful.";

  try {
    const [calm, chaos] = await Promise.all([
      callOpenAI(calmSys, userPrompt, apiKey),
      callOpenAI(chaosSys, userPrompt, apiKey),
    ]);

    return res.status(200).json({ calm, chaos });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Server error talking to OpenAI" });
  }
}
