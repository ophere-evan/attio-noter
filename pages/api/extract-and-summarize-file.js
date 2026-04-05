export const config = { api: { bodyParser: { sizeLimit: "50mb" } } };

const XLSX = require("xlsx");
const mammoth = require("mammoth");

async function extractTextFromWord(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    throw new Error(`Word parsing failed: ${err.message}`);
  }
}

function extractTextFromExcel(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    let text = "";
    workbook.SheetNames.forEach((sheetName) => {
      text += `\n--- Sheet: ${sheetName} ---\n`;
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      text += csv;
    });
    return text;
  } catch (err) {
    throw new Error(`Excel parsing failed: ${err.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { fileBuffer, fileName } = req.body;
  if (!fileBuffer || !fileName) {
    return res.status(400).json({ error: "Missing fileBuffer or fileName" });
  }

  try {
    const buffer = Buffer.from(fileBuffer, "base64");
    const ext = fileName.split(".").pop().toLowerCase();
    let textToSummarize = "";

    if (ext === "pdf") {
      // For PDFs, send directly to Claude for extraction + summarization
      const summaryResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: fileBuffer,
                  },
                },
                {
                  type: "text",
                  text: `You are a VC fund analyst. Extract and summarize financial data, usage metrics, growth, and latest updates from this PDF.

Rules:
- Focus ONLY on: financial metrics, revenue, funding, usage data, growth rates, user/customer numbers, technical metrics, latest updates, partnerships
- No markdown bold (no **)
- Use bullet points for clarity
- Include numbers, percentages, dates where available
- If sections don't apply, omit them entirely
- Keep it comprehensive but focused`,
                },
              ],
            },
          ],
        }),
      });

      const summaryData = await summaryResponse.json();
      if (!summaryResponse.ok) {
        throw new Error(summaryData?.error?.message || "PDF summarization failed");
      }

      const summary = summaryData.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      res.status(200).json({ summary, fileName, extractedLength: -1 });
    } else {
      // For Word/Excel, extract text first, then summarize
      if (["docx", "doc"].includes(ext)) {
        const result = await mammoth.extractRawText({ buffer });
        textToSummarize = result.value;
      } else if (["xlsx", "xls", "csv"].includes(ext)) {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        let text = "";
        workbook.SheetNames.forEach((sheetName) => {
          text += `\n--- Sheet: ${sheetName} ---\n`;
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          text += csv;
        });
        textToSummarize = text;
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      if (!textToSummarize || textToSummarize.trim().length === 0) {
        throw new Error("No text could be extracted from the file");
      }

      const textSlice = textToSummarize.slice(0, 8000);

      const summaryResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: `You are a VC fund analyst. Extract and summarize financial data, usage metrics, growth, and latest updates.

Rules:
- Focus ONLY on: financial metrics, revenue, funding, usage data, growth rates, user/customer numbers, technical metrics, latest updates, partnerships
- No markdown bold (no **)
- Use bullet points for clarity
- Include numbers, percentages, dates
- Omit sections that don't apply
- Keep it comprehensive but focused

Document:
${textSlice}`,
            },
          ],
        }),
      });

      const summaryData = await summaryResponse.json();
      if (!summaryResponse.ok) {
        throw new Error(summaryData?.error?.message || "Summarization failed");
      }

      const summary = summaryData.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      res.status(200).json({ summary, fileName, extractedLength: textToSummarize.length });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
}
