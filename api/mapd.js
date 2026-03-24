// Vercel Serverless Function — MAPD API Proxy
// Proxies requests to the FWC Modern Awards Pay Database API
// API key is stored as Vercel environment variable: FWC_MAPD_API_KEY

export default async function handler(req, res) {
  // CORS headers for the frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.FWC_MAPD_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "FWC_MAPD_API_KEY not configured",
      help: "Set FWC_MAPD_API_KEY in Vercel Environment Variables (Settings → Environment Variables)",
    });
  }

  // The path to forward to the MAPD API
  // e.g. /api/mapd?path=/awards or /api/mapd?path=/awards/MA000004/classifications&year=2025
  const { path, ...otherParams } = req.query;
  if (!path) {
    return res.status(400).json({ error: "Missing 'path' query parameter", example: "/api/mapd?path=/awards" });
  }

  // Build the MAPD API URL
  // FWC MAPD API base URL — Azure API Management gateway
  const baseUrl = process.env.FWC_MAPD_BASE_URL || "https://api.fwc.gov.au";
  const apiPath = process.env.FWC_MAPD_API_PATH || "/api/v1";

  // Forward any additional query params (year, etc.)
  const queryString = Object.entries(otherParams)
    .filter(([k, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const fullUrl = `${baseUrl}${apiPath}${path}${queryString ? "?" + queryString : ""}`;

  try {
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Accept": "application/json",
      },
    });

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      // Add debug info for troubleshooting
      if (response.status !== 200) {
        data._debug = { requestedUrl: fullUrl.replace(apiKey, "***"), status: response.status };
      }
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).json({
        error: "Non-JSON response from MAPD API",
        status: response.status,
        statusText: response.statusText,
        body: text.substring(0, 500),
        requestedUrl: fullUrl.replace(apiKey, "***"),
      });
    }
  } catch (err) {
    return res.status(502).json({
      error: "Failed to reach MAPD API",
      message: err.message,
      requestedUrl: fullUrl.replace(apiKey, "***"),
    });
  }
}
