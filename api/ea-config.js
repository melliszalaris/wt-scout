// Vercel Serverless Function — Returns EA parser config to browser
// This endpoint supplies the Anthropic API key so the browser can call
// the Anthropic API directly (bypassing Vercel's 10s Hobby timeout).
// The key is stored in Vercel env vars, not exposed in source code.

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured. Set it in Vercel Environment Variables." });
  }

  return res.status(200).json({ k: apiKey });
}
