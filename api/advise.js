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
      temperature: 0.8
    })
  });

  const data = await response.json();

  // 🔥 LOG FULL RAW RESPONSE TO VERCEL
  console.log("RAW OPENAI RESPONSE:", JSON.stringify(data, null, 2));

  // Try all possible shapes:
  try {
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    if (Array.isArray(data.choices?.[0]?.message?.content)) {
      return data.choices[0].message.content.map(block => block.text || "").join(" ");
    }
  } catch (err) {
    console.log("Parsing error:", err);
  }

  return "NO CONTENT FOUND";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt: userPrompt } = req.body || {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing API key" });

  try {
    const calmSys = "Give soft, helpful, therapist-like advice.";
    const chaosSys = "Give dramatic, chaotic, sarcastic advice but SAFE and friendly.";

    const [calm, chaos] = await Promise.all([
      callOpenAI(calmSys, userPrompt, apiKey),
      callOpenAI(chaosSys, userPrompt, apiKey)
    ]);

    return res.status(200).json({ calm, chaos });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
