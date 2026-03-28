import { useState, useRef, useEffect } from "react";

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

const steps = ["Record", "Review", "Find record", "Done"];

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

function StepBar({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
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
  );
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
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
  const [browserSupported, setBrowserSupported] = useState(true);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) setBrowserSupported(false);
    }
  }, []);

  const startRecording = () => {
    setError("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Speech recognition is not supported in this browser. Please use Chrome."); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      let interim = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      if (finalChunk) { transcriptRef.current += finalChunk; setTranscript(transcriptRef.current); }
      setInterimText(interim);
    };
    recognition.onerror = (e) => { if (e.error !== "aborted") setError("Microphone error: " + e.error); setRecording(false); };
    recognition.onend = () => { setRecording(false); setInterimText(""); };
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  const stopRecording = () => { recognitionRef.current?.stop(); setRecording(false); setInterimText(""); };
  const clearAndReRecord = () => { transcriptRef.current = ""; setTranscript(""); setInterimText(""); setError(""); };

  const defaultTitle = () => "Voice note — " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const summarize = async () => {
    setSummarizing(true); setError("");
    try {
      const res = await fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Summarization failed");
      setSummary(data.summary); setNoteTitle(defaultTitle()); setStep(2);
    } catch (e) { setError(e.message); } finally { setSummarizing(false); }
  };

  const skipSummary = () => { setSummary(transcript); setNoteTitle(defaultTitle()); setStep(2); };

  const searchAttio = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true); setError(""); setSearchResults([]); setSelectedRecord(null);
    try {
      const res = await fetch("/api/attio-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ objectType: searchType, query: searchQuery }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data.records || []);
    } catch (e) { setError(e.message); } finally { setSearching(false); }
  };

  const postNote = async () => {
    if (!selectedRecord) return;
    setPosting(true); setError("");
    try {
      const res = await fetch("/api/attio-note", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ objectType: searchType, recordId: selectedRecord.id.record_id, title: noteTitle, content: summary }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post note");
      setStep(4);
    } catch (e) { setError(e.message); } finally { setPosting(false); }
  };

  const reset = () => {
    setStep(1); transcriptRef.current = ""; setTranscript(""); setInterimText("");
    setSummary(""); setNoteTitle(""); setSelectedRecord(null); setSearchResults([]); setSearchQuery(""); setError("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9f9f8", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "3rem 1rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      <div style={{ width: "100%", maxWidth: 580 }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 264.28 113" style={{ height: 28, width: "auto", display: "block" }}>
              <g>
                <path fill="#161818" d="M0,65.33h7.48l13.89,39.46,13.82-39.46h7.54l-16.83,46.74h-9.08L0,65.33Z"/>
                <path fill="#161818" d="M43.07,95.84c0-10.35,6.41-16.83,15.56-16.83s15.42,6.21,15.42,16.02c0,.87-.07,1.74-.2,3.07h-24.37c.27,5.88,3.87,9.41,9.61,9.41,3.81,0,6.48-1.74,7.75-4.61h6.61c-2,6.21-6.94,10.08-14.36,10.08-9.61,0-16.02-6.74-16.02-17.16ZM67.5,93.04v-.33c0-4.94-3.2-8.48-8.88-8.48s-8.88,3.61-9.15,8.81h18.03Z"/>
                <path fill="#161818" d="M81.86,79.95h5.74v4.21c1.94-3.47,5.81-5.14,10.15-5.14,7.88,0,12.82,4.81,12.82,13.69v19.36h-6.48v-18.76c0-5.74-2.8-8.41-7.54-8.41s-8.21,3.41-8.21,8.61v18.56h-6.48v-32.12Z"/>
                <path fill="#161818" d="M118.66,104.32v-33.98h6.48v9.61h10.08v5.68h-10.08v17.43c0,2.34.93,3.34,3.4,3.34h6.68v5.68h-8.61c-5.54,0-7.95-2.2-7.95-7.75Z"/>
                <path fill="#161818" d="M141.42,99.31v-19.36h6.48v18.76c0,5.74,2.67,8.41,7.34,8.41s8.01-3.47,8.01-8.61v-18.56h6.48v32.12h-5.74v-3.67c-2.14,3.14-5.81,4.61-9.95,4.61-7.81,0-12.62-4.81-12.62-13.69Z"/>
                <path fill="#161818" d="M179.62,79.95h5.74v5.21c.8-3.21,3.2-5.21,7.01-5.21h6.14v5.68h-6.74c-4.01,0-5.68,2.27-5.68,6.61v19.83h-6.48v-32.12Z"/>
                <path fill="#161818" d="M200.78,95.84c0-10.35,6.41-16.83,15.56-16.83s15.42,6.21,15.42,16.02c0,.87-.07,1.74-.2,3.07h-24.37c.27,5.88,3.87,9.41,9.61,9.41,3.81,0,6.48-1.74,7.75-4.61h6.61c-2,6.21-6.94,10.08-14.36,10.08-9.61,0-16.02-6.74-16.02-17.16ZM225.22,93.04v-.33c0-4.94-3.2-8.48-8.88-8.48s-8.88,3.61-9.15,8.81h18.03Z"/>
                <path fill="#161818" d="M236.57,102.92h6.68c.33,3.2,2.94,4.81,7.61,4.81,4.27,0,6.88-1.8,6.88-4.74,0-2.4-1.8-3.81-5.14-4.14l-5.14-.53c-6.01-.6-9.81-3.94-9.81-9.28,0-6.14,5.14-10.01,13.02-10.01s12.95,3.34,13.35,9.88h-6.48c-.2-3.07-2.74-4.61-6.94-4.61s-6.54,1.67-6.54,4.41c0,2.34,1.74,3.61,5.47,4.07l5.21.6c6.08.67,9.55,4.07,9.55,9.35,0,6.28-5.27,10.28-13.55,10.28s-13.82-3.47-14.15-10.08Z"/>
              </g>
              <g>
                <path fill="#161818" d="M0,33.38h6.88c.07,5.68,4.47,9.28,11.68,9.28,6.41,0,10.48-3.34,10.48-8.41,0-4.07-2.6-6.54-7.95-7.28l-6.14-.87C6.01,24.9,1.54,20.5,1.54,13.49,1.54,5.27,8.15,0,18.23,0s16.89,5.07,17.09,13.22h-6.88c-.2-4.54-4.07-7.34-10.22-7.34s-9.75,2.8-9.75,7.21c0,3.81,2.74,5.94,8.48,6.74l5.81.8c8.68,1.2,13.22,5.68,13.22,13.22,0,8.95-6.61,14.76-17.43,14.76C7.01,48.61.07,42.8,0,33.38Z"/>
                <path fill="#161818" d="M43.41,39.93V5.94h6.48v9.61h10.08v5.68h-10.08v17.43c0,2.34.93,3.34,3.4,3.34h6.68v5.68h-8.61c-5.54,0-7.95-2.2-7.95-7.75Z"/>
                <path fill="#161818" d="M66.44,1.4h7.21v7.68h-7.21V1.4ZM66.84,15.56h6.48v32.12h-6.48V15.56Z"/>
                <path fill="#161818" d="M81.33,31.71c0-10.02,6.54-17.09,16.22-17.09,8.15,0,13.69,4.74,14.42,11.48h-6.61c-.6-3-3.27-5.61-7.88-5.61-5.74,0-9.48,4.34-9.48,11.08s3.81,11.15,9.35,11.15c4.34,0,7.48-2.54,8.15-6.28h6.61c-.87,6.41-6.21,12.15-14.96,12.15-9.61,0-15.82-7.14-15.82-16.89Z"/>
                <path fill="#161818" d="M128.6,33.25h-3.41v14.42h-6.48V.93h6.48v26.31h3.41l10.82-11.68h7.95l-13.09,14.56,13.09,17.56h-7.81l-10.95-14.42Z"/>
                <path fill="#161818" d="M149.77,31.45c0-10.35,6.41-16.83,15.56-16.83s15.42,6.21,15.42,16.02c0,.87-.07,1.74-.2,3.07h-24.37c.27,5.88,3.87,9.41,9.61,9.41,3.81,0,6.48-1.74,7.75-4.61h6.61c-2,6.21-6.94,10.08-14.36,10.08-9.61,0-16.02-6.74-16.02-17.16ZM174.21,28.64v-.33c0-4.94-3.2-8.48-8.88-8.48s-8.88,3.61-9.15,8.81h18.03Z"/>
                <path fill="#161818" d="M188.56,15.56h5.74v5.21c.8-3.21,3.2-5.21,7.01-5.21h6.14v5.68h-6.74c-4.01,0-5.68,2.27-5.68,6.61v19.83h-6.48V15.56Z"/>
              </g>
            </svg>
          </div>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px" }}>Voice → Claude → Attio</p>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0, color: "#111" }}>Record a voice note to CRM</h1>
        </div>
        <StepBar current={step} />
        <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 12, padding: "1.5rem" }}>

          {step === 1 && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Record your voice note</h2>
              <p style={{ fontSize: 13, color: "#777", marginTop: 0, marginBottom: 24 }}>Hit record and speak naturally — mention the company, person, key topics, next steps. Claude will clean it up.</p>
              {!browserSupported && (
                <div style={{ background: "#fff8e1", color: "#7a5c00", border: "0.5px solid #f5d97a", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                  Your browser does not support speech recognition. Please open this in Chrome.
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <button onClick={recording ? stopRecording : startRecording} disabled={!browserSupported}
                  style={{ width: 80, height: 80, borderRadius: "50%", border: "none", cursor: "pointer", background: recording ? "#e74c3c" : "#111", color: "#fff", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {recording ? "■" : "●"}
                </button>
              </div>
              <div style={{ textAlign: "center", marginBottom: 20, minHeight: 22 }}>
                {recording ? (
                  <span style={{ fontSize: 13, color: "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#e74c3c", marginRight: 8, animation: "pulse 1.2s ease-in-out infinite" }} />
                    Recording — speak now
                  </span>
                ) : transcript ? (
                  <span style={{ fontSize: 13, color: "#2d7a4f" }}>Recording stopped — transcript ready</span>
                ) : (
                  <span style={{ fontSize: 13, color: "#aaa" }}>Press ● to start recording</span>
                )}
              </div>
              {(transcript || interimText) && (
                <div style={{ background: "#fafaf9", border: "0.5px solid #e5e5e5", borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.7, minHeight: 80, marginBottom: 16, color: "#333" }}>
                  {transcript}<span style={{ color: "#aaa" }}>{interimText}</span>
                </div>
              )}
              {transcript && !recording && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={summarize} disabled={summarizing} style={btnStyle("primary", summarizing)}>{summarizing ? "Summarizing…" : "Summarize with Claude"}</button>
                  <button onClick={skipSummary} style={btnStyle("ghost")}>Use as-is</button>
                  <button onClick={clearAndReRecord} style={btnStyle("ghost")}>Re-record</button>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Review note content</h2>
              <p style={{ fontSize: 13, color: "#777", marginTop: 0, marginBottom: 20 }}>Edit before posting to Attio.</p>
              <label style={labelStyle}>Note title</label>
              <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} />
              <label style={labelStyle}>Note content</label>
              <textarea rows={10} value={summary} onChange={e => setSummary(e.target.value)} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button onClick={() => setStep(3)} disabled={!summary.trim()} style={btnStyle("primary", !summary.trim())}>Choose CRM record →</button>
                <button onClick={() => setStep(1)} style={btnStyle("ghost")}>Back</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Find the Attio record</h2>
              <p style={{ fontSize: 13, color: "#777", marginTop: 0, marginBottom: 20 }}>Search for the company or person to attach this note to.</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["companies", "people"].map(t => (
                  <button key={t} onClick={() => { setSearchType(t); setSearchResults([]); setSelectedRecord(null); }}
                    style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", background: searchType === t ? "#111" : "transparent", color: searchType === t ? "#fff" : "#666", border: searchType === t ? "none" : "0.5px solid #ddd" }}>
                    {t === "companies" ? "Company" : "Person"}
                  </button>
                ))}
              </div>
              <label style={labelStyle}>Search {searchType === "companies" ? "company" : "person"} name</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchAttio()}
                  placeholder={searchType === "companies" ? "e.g. Acme Corp" : "e.g. Sarah Chen"} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={searchAttio} disabled={searching || !searchQuery.trim()} style={btnStyle("primary", searching || !searchQuery.trim())}>{searching ? "…" : "Search"}</button>
              </div>
              {searchResults.length > 0 && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {searchResults.map(record => {
                    const name = getRecordName(record); const sub = getRecordSub(record, searchType);
                    const selected = selectedRecord?.id?.record_id === record.id?.record_id;
                    return (
                      <div key={record.id?.record_id} onClick={() => setSelectedRecord(record)}
                        style={{ padding: "10px 14px", borderRadius: 8, cursor: "pointer", border: selected ? "1.5px solid #111" : "0.5px solid #e5e5e5", background: selected ? "#f7f7f6" : "#fff" }}>
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

          {step === 4 && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e6f4ec", color: "#2d7a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 16px" }}>✓</div>
              <h2 style={{ margin: "0 0 8px", fontWeight: 500, fontSize: 18 }}>Note posted to Attio</h2>
              <p style={{ fontSize: 13, color: "#777", margin: "0 0 24px" }}>"{noteTitle}" was added to {selectedRecord ? getRecordName(selectedRecord) : "the record"}.</p>
              <button onClick={reset} style={btnStyle("primary")}>Record another</button>
            </div>
          )}

          {error && (
            <div style={{ background: "#fff5f5", color: "#c0392b", border: "0.5px solid #f5c6c6", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 }}>{error}</div>
          )}
        </div>
        <p style={{ fontSize: 11, color: "#bbb", marginTop: 16, textAlign: "center" }}>
          Voice is transcribed locally in your browser — audio never leaves your device. Works best in Chrome.
        </p>
      </div>
    </div>
  );
}
