export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { objectType, recordId, title, content } = req.body;
  if (!objectType || !recordId || !title || !content)
    return res.status(400).json({ error: "Missing required fields" });

  // Try Attio v2 notes format
  const body = {
    data: {
      parent_object: objectType,
      parent_record_id: recordId,
      title: title,
      content_plaintext: content,
      format: "plaintext",
    },
  };

  try {
    const response = await fetch("https://api.attio.com/v2/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ATTIO_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      // Return the full Attio response so we can debug
      return res.status(response.status).json({
        error: data?.detail || data?.message || data?.errors?.[0]?.message || JSON.stringify(data),
        full: data,
        sentBody: body,
      });
    }

    res.status(200).json({ note: data.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
