import { useState } from "react";

const steps = ["Transcript", "Review", "Find record", "Done"];

const getRecordName = (record) => {
  const nameVals = record?.values?.name;
  if (!nameVals?.length) return "Unnamed";
  const v = nameVals[0];
  if (typeof v.value === "string") return v.value;
  if (v.value?.first_name) return `${v.value.first_name} ${v.value.last_name || ""}`.trim();
  return "Unnamed";
};

const getRecordSub = (record, type) => {
  if (type === "companies") return record?.values?.domains?.[0]?.value || "";
  const title = record?.values?.job_title?.[0]?.value;
  const company = record?.values?.company_name?.[0]?.value;
  return [title, company].filter(Boolean).join(" · ");
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [searchType, setSearchType] = useState("companies");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const defaultTitle = () =>
    "Claude chat — " +
    new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const summarize = async () => {
    setSummarizing(true);
    setError("");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Summarization failed");
      setSummary(data.summary);
      setNoteTitle(defaultTitle());
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setSummarizing(false);
    }
  };

  const skipSummary = () => {
    setSummary(transcript);
    setNoteTitle(defaultTitle());
    setStep(2);
  };

  const searchAttio = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    setSearchResults([]);
    setSelectedRecord(null);
    try {
      const res = await fetch("/api/attio-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectType: searchType, query: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data.records || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const postNote = async () => {
    if (!selectedRecord) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/attio-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectType: searchType,
          recordId: selectedRecord.id.record_id,
          title: noteTitle,
          content: summary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post note");
      setStep(4);
    } catch (e) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setTranscript("");
    setSummary("");
    setNoteTitle("");
    setSelectedRecord(null);
    setSearchResults([]);
    setSearchQuery("");
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f9f9f8",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "3rem 1rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 580 }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px" }}>Claude → Attio</p>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0, color: "#111" }}>Post chat transcript as CRM note</h1>
        </div>

        {/* Step bar */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
          {steps.map((label, i) => {
            const num = i + 1;
            const done = num < step;
            const active = num === step;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: done ? "#e6f4ec" : active ? "#fff" : "#f3f3f2",
                    border: active ? "1.5px solid #111" : done ? "none" : "0.5px solid #ddd",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 500,
                    color: done ? "#2d7a4f" : active ? "#111" : "#aaa",
                  }}>
                    {done ? "✓" : num}
                  </div>
                  <span style={{ fontSize: 11, color: active ? "#111" : "#aaa", whiteSpace: "nowrap" }}>{label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: "0.5px", background: done ? "#2d7a4f" : "#e0e0e0", margin: "0 8px", marginBottom: 16 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: 12,
          padding: "1.5rem",
        }}>

          {/* Step 1 — Transcript */}
          {step === 1 && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Paste your transcript</h2>
              <p style={{ fontSize: 13, color: "#777", marginTop: 0, marginBottom: 20 }}>
                Copy the full Claude chat and paste it below. Claude will summarize it into a clean CRM note.
              </p>
              <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 6 }}>Chat transcript</label>
              <textarea
                rows={10}
                placeholder={"Human: Can you help me analyze...\nAssistant: Of course..."}
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box", resize: "vertical",
                  fontSize: 13, fontFamily: "monospace", lineHeight: 1.6,
                  border: "0.5px solid #ddd", borderRadius: 8, padding: "10px 12px",
                  outline: "none", background: "#fafaf9",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button onClick={summarize} disabled={!transcript.trim() || summarizing}
                  style={btnStyle("primary", !transcript.trim() || summarizing)}>
                  {summarizing ? "Summarizing…" : "Summarize with Claude"}
                </button>
                <button onClick={skipSummary} disabled={!transcript.trim()} style={btnStyle("ghost", !transcript.trim())}>
                  Use as-is
                </button>
              </div>
            </>
          )}

          {/* Step 2 — Review */}
          {step === 2 && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Review note content</h2>
              <p style={{ fontSize: 13, color: "#777", marginTop: 0, marginBottom: 20 }}>
                Edit the summary and title before posting to Attio.
              </p>
              <label style={labelStyle}>Note title</label>
              <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} />
              <label style={labelStyle}>Note content</label>
              <textarea rows={10} value={summary} onChange={e => setSummary(e.target.value)}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button onClick={() => setStep(3)} disabled={!summary.trim()} style={btnStyle("primary", !summary.trim())}>
                  Choose CRM record →
                </button>
                <button onClick={() => setStep(1)} style={btnStyle("ghost")}>Back</button>
              </div>
            </>
          )}

          {/* Step 3 — Find record */}
          {step === 3 && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Find the Attio record</h2>
              <p style={{ fontSize: 13, color: "#777", marginTop: 0, marginBottom: 20 }}>
                Search for the company or person to attach this note to.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["companies", "people"].map(t => (
                  <button key={t} onClick={() => { setSearchType(t); setSearchResults([]); setSelectedRecord(null); }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                      background: searchType === t ? "#111" : "transparent",
                      color: searchType === t ? "#fff" : "#666",
                      border: searchType === t ? "none" : "0.5px solid #ddd",
                    }}>
                    {t === "companies" ? "Company" : "Person"}
                  </button>
                ))}
              </div>
              <label style={labelStyle}>Search {searchType === "companies" ? "company" : "person"} name</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchAttio()}
                  placeholder={searchType === "companies" ? "e.g. Acme Corp" : "e.g. Sarah Chen"}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={searchAttio} disabled={searching || !searchQuery.trim()} style={btnStyle("primary", searching || !searchQuery.trim())}>
                  {searching ? "…" : "Search"}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {searchResults.map(record => {
                    const name = getRecordName(record);
                    const sub = getRecordSub(record, searchType);
                    const selected = selectedRecord?.id?.record_id === record.id?.record_id;
                    return (
                      <div key={record.id?.record_id} onClick={() => setSelectedRecord(record)}
                        style={{
                          padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                          border: selected ? "1.5px solid #111" : "0.5px solid #e5e5e5",
                          background: selected ? "#f7f7f6" : "#fff",
                        }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: selected ? 500 : 400 }}>{name}</p>
                        {sub && <p style={{ margin: 0, fontSize: 12, color: "#999" }}>{sub}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {searchResults.length === 0 && !searching && searchQuery && !error && (
                <p style={{ fontSize: 13, color: "#aaa", marginTop: 12 }}>No results. Try a different name.</p>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button onClick={postNote} disabled={!selectedRecord || posting} style={btnStyle("primary", !selectedRecord || posting)}>
                  {posting ? "Posting…" : `Post note${selectedRecord ? " to " + getRecordName(selectedRecord) : ""}`}
                </button>
                <button onClick={() => setStep(2)} style={btnStyle("ghost")}>Back</button>
              </div>
            </>
          )}

          {/* Step 4 — Done */}
          {step === 4 && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#e6f4ec", color: "#2d7a4f",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, margin: "0 auto 16px",
              }}>✓</div>
              <h2 style={{ margin: "0 0 8px", fontWeight: 500, fontSize: 18 }}>Note posted to Attio</h2>
              <p style={{ fontSize: 13, color: "#777", margin: "0 0 24px" }}>
                "{noteTitle}" was added to {selectedRecord ? getRecordName(selectedRecord) : "the record"}.
              </p>
              <button onClick={reset} style={btnStyle("primary")}>Post another</button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#fff5f5", color: "#c0392b",
              border: "0.5px solid #f5c6c6", borderRadius: 8,
              padding: "10px 14px", fontSize: 13, marginTop: 12,
            }}>{error}</div>
          )}
        </div>

        <p style={{ fontSize: 11, color: "#bbb", marginTop: 16, textAlign: "center" }}>
          API keys are stored securely as server environment variables and never exposed to the browser.
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  border: "0.5px solid #ddd", borderRadius: 8,
  padding: "9px 12px", fontSize: 14,
  outline: "none", background: "#fafaf9",
};

const labelStyle = { fontSize: 13, color: "#555", display: "block", marginBottom: 6 };

const btnStyle = (variant, disabled) => ({
  padding: "9px 18px", borderRadius: 8,
  fontSize: 14, fontWeight: 500,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.45 : 1,
  ...(variant === "primary"
    ? { background: "#111", color: "#fff", border: "none" }
    : { background: "transparent", color: "#555", border: "0.5px solid #ddd" }),
});
