import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const userPrompt = req.body.prompt;
  if (!userPrompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Calm advice
    const calmRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Give soft, helpful, therapist-like advice." },
        { role: "user", content: userPrompt }
      ]
    });

    // Chaos advice
    const chaosRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Give dramatic, chaotic, sarcastic advice but SAFE and friendly." },
        { role: "user", content: userPrompt }
      ]
    });

    res.status(200).json({
      calm: calmRes.choices[0].message.content,
      chaos: chaosRes.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
