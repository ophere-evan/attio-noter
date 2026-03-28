export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { objectType, query } = req.body;
  if (!objectType || !query) return res.status(400).json({ error: "Missing objectType or query" });

  try {
    const response = await fetch(`https://api.attio.com/v2/objects/${objectType}/records/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ATTIO_API_KEY}`,
      },
      body: JSON.stringify({
        filter: { name: { $contains: query } },
        limit: 8,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.detail || "Attio error" });
    }

    const data = await response.json();
    res.status(200).json({ records: data.data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
