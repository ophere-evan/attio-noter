export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { objectType, recordId, title, content } = req.body;
  if (!objectType || !recordId || !title || !content)
    return res.status(400).json({ error: "Missing required fields", received: { objectType, recordId, title: !!title, content: !!content } });

  try {
    const body = {
      data: {
        parent_object: objectType,
        parent_record_id: recordId,
        title,
        content_plaintext: content,
      },
    };

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
      return res.status(response.status).json({
        error: data?.detail || data?.message || JSON.stringify(data),
        attioResponse: data,
      });
    }

    res.status(200).json({ note: data.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
