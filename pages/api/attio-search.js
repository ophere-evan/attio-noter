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
      return res.status(response.status).json({ error: err?.detail || err?.message || JSON.stringify(err) });
    }

    const data = await response.json();
    const records = data.data || [];

    // Normalise: make sure every record exposes a flat record_id
    const normalised = records.map((r) => ({
      ...r,
      id: {
        ...r.id,
        record_id: r.id?.record_id ?? r.id?.object_id ?? r.id ?? null,
      },
    }));

    res.status(200).json({ records: normalised });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
