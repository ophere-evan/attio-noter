import { google } from "googleapis";

const FOLDER_MAP = {
  "prism":             "1UCUS3rvBsSWtygEqp75mbEcX9Hcih3Xy",
  "invitfull":         "1cCWK2MdMxepx86XabH4cZRtRi1-di70k",
  "owlue":             "1Ixkd5mEv28jIjYc6d708TjkxRyqDXP4f",
  "highlight studios": "1m0nPUyADkjOFLMRS2CQ57iKQpushx0LK",
  "sunsay":            "10FM7uZu5Io-ycTnofVhgur3gI7yVjpWW",
  "turnout":           "1Z_broWoTPKT2QkNOb-rzdSfpbTHXhH0s",
  "yomu":              "17fAo9RmHUWhn30YNdEI2TM-Ghs2OA9_b",
  "horizon":           "1I8JuqNBGt1i2u5JeJ2c-Tb5CNEK-FKBi",
  "banditos":          "1egzIoR9PriO1GHq_FGPto0e4l7O33MCA",
  "archie & dennis":   "1ZDTrVWuAUYBEJwlFCZ0HnrSI1fqT1dXm",
  "gravy pass":        "1nlirboYEuf1MKhC74z2EYTnJsKdd6Yb2",
  "shortical":         "1B0G1KdzuQ2poz7M-ulUS1rCDyroHkDl7",
};

function findFolderId(companyName) {
  const q = companyName.toLowerCase().trim();
  if (FOLDER_MAP[q]) return FOLDER_MAP[q];
  for (const [key, id] of Object.entries(FOLDER_MAP)) {
    if (q.includes(key) || key.includes(q)) return id;
  }
  return null;
}

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { companyName, title, content } = req.body;
  if (!companyName || !title || !content)
    return res.status(400).json({ error: "Missing required fields" });

  const folderId = findFolderId(companyName);
  if (!folderId)
    return res.status(404).json({ error: `No Drive folder found for: ${companyName}` });

  try {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });
    const docs  = google.docs({ version: "v1", auth });

    const file = await drive.files.create({
      requestBody: {
        name: title,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId],
      },
      fields: "id,webViewLink",
      supportsAllDrives: true,
    });

    const docId  = file.data.id;
    const docUrl = file.data.webViewLink;

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [{ insertText: { location: { index: 1 }, text: content } }],
      },
    });

    return res.status(200).json({ docUrl, docId });
  } catch (err) {
    console.error("[drive-doc]", err);
    return res.status(500).json({ error: err.message });
  }
}
