export const config = { api: { bodyParser: { sizeLimit: "25mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { audio, mimeType } = req.body;
  if (!audio) return res.status(400).json({ error: "No audio provided" });

  try {
    const buffer = Buffer.from(audio, "base64");
    const ext = mimeType?.includes("mp4") ? "mp4" : mimeType?.includes("ogg") ? "ogg" : mimeType?.includes("webm") ? "webm" : "wav";

    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType || "audio/webm" });
    formData.append("file", blob, `recording.${ext}`);
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Whisper transcription failed");

    res.status(200).json({ transcript: data.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
