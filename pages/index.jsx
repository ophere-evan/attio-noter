import { useState, useRef } from "react";

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

const stepsVoice = ["Record", "Review", "Find record", "Done"];
const stepsFile = ["Upload", "Review", "Find record", "Done"];

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

function StepBar({ current, steps }) {
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

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Home() {
  const [tab, setTab] = useState("voice");
  
  // Voice note state
  const [step, setStep] = useState(1);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // File upload state
  const [stepFile, setStepFile] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileBuffer, setFileBuffer] = useState("");
  const [fileSummary, setFileSummary] = useState("");
  const [fileNoteTitle, setFileNoteTitle] = useState("");
  const [extracting, setExtracting] = useState(false);

  // Shared state
  const [searchType, setSearchType] = useState("companies");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const mimeTypeRef = useRef("audio/webm");
  const fileInputRef = useRef(null);

  // ===== VOICE NOTE FUNCTIONS =====
  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/ogg";
      mimeTypeRef.current = mimeType;
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (e) {
      setError("Microphone access denied. Please allow microphone permissions and try again.");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      await transcribeAudio(blob, mimeTypeRef.current);
    };
  };

  const transcribeAudio = async (blob, mimeType) => {
    setTranscribing(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64, mimeType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Transcription failed");
        setTranscript(data.transcript);
        setTranscribing(false);
      };
    } catch (e) {
      setError(e.message);
      setTranscribing(false);
    }
  };

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
      setNoteTitle(transcript.split("\n")[0].slice(0, 60));
      setSummarizing(false);
      setStep(2);
    } catch (e) {
      setError(e.message);
      setSummarizing(false);
    }
  };

  const skipSummary = () => {
    setSummary(transcript);
    setNoteTitle(transcript.split("\n")[0].slice(0, 60));
    setStep(2);
  };

  const clearAndReRecord = () => { setTranscript(""); setError(""); setRecordingTime(0); };

  // ===== FILE UPLOAD FUNCTIONS =====
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"];
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload PDF, Word, Excel, or CSV.");
      return;
    }

    setUploadedFile(file);
    setError("");
    extractAndSummarizeFile(file);
  };

  const extractAndSummarizeFile = async (file) => {
    setExtracting(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = async () => {
        const buffer = reader.result;
        const base64 = Buffer.from(new Uint8Array(buffer)).toString("base64");
        setFileBuffer(base64);

        const res = await fetch("/api/extract-and-summarize-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBuffer: base64, fileName: file.name }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "File processing failed");

        setFileSummary(data.summary);
        setFileNoteTitle(`${file.name.split(".")[0]} — Summary`);
        setExtracting(false);
        setStepFile(2);
      };
    } catch (e) {
      setError(e.message);
      setExtracting(false);
    }
  };

  const clearAndReUpload = () => { setUploadedFile(null); setFileSummary(""); setError(""); fileInputRef.current?.click(); };

  // ===== SHARED FUNCTIONS =====
  const searchAttio = async () => {
    setSearching(true);
    setError("");
    try {
      const res = await fetch("/api/attio-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectType: searchType, query: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data.records || []);
      setSearching(false);
    } catch (e) {
      setError(e.message);
      setSearching(false);
    }
  };

  const postNote = async () => {
    if (!selectedRecord) return;
    setPosting(true);
    setError("");

    const currentSummary = tab === "voice" ? summary : fileSummary;
    const currentTitle = tab === "voice" ? noteTitle : fileNoteTitle;
    const fileLink = tab === "file" && uploadedFile ? `\n\nFile: ${uploadedFile.name}` : "";

    try {
      const res = await fetch("/api/attio-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectType: searchType,
          recordId: selectedRecord.id?.record_id,
          title: currentTitle,
          content: currentSummary + fileLink,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post note");
      setPosting(false);

      if (tab === "voice") {
        setStep(4);
      } else {
        setStepFile(4);
      }
    } catch (e) {
      setError(e.message);
      setPosting(false);
    }
  };

  const reset = () => {
    if (tab === "voice") {
      setStep(1);
      setTranscript("");
      setSummary("");
      setNoteTitle("");
      setRecordingTime(0);
    } else {
      setStepFile(1);
      setUploadedFile(null);
      setFileSummary("");
      setFileNoteTitle("");
    }
    setSearchQuery("");
    setSearchResults([]);
    setSelectedRecord(null);
    setError("");
  };

  const currentStep = tab === "voice" ? step : stepFile;
  const steps = tab === "voice" ? stepsVoice : stepsFile;

  return (
    <div style={{ background: "#fafaf9", minHeight: "100vh", padding: "2rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px" }}>Voice & File → Claude → Attio</p>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0, color: "#111" }}>Add notes to Attio</h1>
        </div>

        {/* Tab Selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: "2rem", borderBottom: "0.5px solid #e5e5e5", paddingBottom: 12 }}>
          <button onClick={() => { setTab("voice"); setError(""); setSelectedRecord(null); setSearchResults([]); }}
            style={{ padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer", background: tab === "voice" ? "#111" : "transparent", color: tab === "voice" ? "#fff" : "#666", border: "none" }}>
            🎙️ Voice Note
          </button>
          <button onClick={() => { setTab("file"); setError(""); setSelectedRecord(null); setSearchResults([]); }}
            style={{ padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer", background: tab === "file" ? "#111" : "transparent", color: tab === "file" ? "#fff" : "#666", border: "none" }}>
            📄 Upload File
          </button>
        </div>

        <StepBar current={currentStep} steps={steps} />

        <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 12, padding: "1.5rem" }}>

          {/* ===== VOICE NOTE TAB ===== */}
          {tab === "voice" && (
            <>
              {step === 1 && (
                <>
                  <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Record your voice note</h2>
                  <p style={{ fontSize: 13, color: "#777", marginTop: 0, marginBottom: 24 }}>Speak naturally — mention the company, person, key topics, next steps.</p>

                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <button onClick={recording ? stopRecording : startRecording}
                      style={{ width: 80, height: 80, borderRadius: "50%", border: "none", cursor: "pointer", background: recording ? "#e74c3c" : "#111", color: "#fff", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {recording ? "■" : "●"}
                    </button>
                  </div>

                  <div style={{ textAlign: "center", marginBottom: 20, minHeight: 22 }}>
                    {recording ? (
                      <span style={{ fontSize: 13, color: "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#e74c3c", animation: "pulse 1.2s ease-in-out infinite" }} />
                        Recording — {formatTime(recordingTime)}
                      </span>
                    ) : transcribing ? (
                      <span style={{ fontSize: 13, color: "#888" }}>Transcribing…</span>
                    ) : transcript ? (
                      <span style={{ fontSize: 13, color: "#2d7a4f" }}>Transcript ready</span>
                    ) : (
                      <span style={{ fontSize: 13, color: "#aaa" }}>Press ● to start recording</span>
                    )}
                  </div>

                  {transcript && !recording && (
                    <>
                      <label style={labelStyle}>Transcript</label>
                      <textarea rows={6} value={transcript} onChange={e => setTranscript(e.target.value)}
                        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, marginBottom: 16 }} />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={summarize} disabled={summarizing} style={btnStyle("primary", summarizing)}>
                          {summarizing ? "Summarizing…" : "Summarize with Claude"}
                        </button>
                        <button onClick={skipSummary} style={btnStyle("ghost")}>Use as-is</button>
                        <button onClick={clearAndReRecord} style={btnStyle("ghost")}>Re-record</button>
                      </div>
                    </>
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
                  <textarea rows={10} value={summary} onChange={e => setSummary(e.target.value)}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button onClick={() => setStep(3)} disabled={!summary.trim()} style={btnStyle("primary", !summary.trim())}>Choose CRM record →</button>
                    <button onClick={() => setStep(1)} style={btnStyle("ghost")}>Back</button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ===== FILE UPLOAD TAB ===== */}
          {tab === "file" && (
            <>
              {stepFile === 1 && (
                <>
                  <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Upload a document</h2>
                  <p style={{ fontSize: 13, color: "#777", marginTop: 0, marginBottom: 24 }}>PDF, Word, or Excel files are extracted and summarized with Claude.</p>

                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" onChange={handleFileSelect} style={{ display: "none" }} />

                  <div onClick={() => fileInputRef.current?.click()}
                    style={{ border: "1.5px dashed #ddd", borderRadius: 8, padding: "2rem", textAlign: "center", cursor: "pointer", background: "#fafaf9", marginBottom: 16 }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = "#111"}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = "#ddd"}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Click to upload or drag file</p>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#888" }}>PDF, Word, Excel (up to 50MB)</p>
                  </div>

                  {uploadedFile && !extracting && (
                    <>
                      <label style={labelStyle}>File selected</label>
                      <div style={{ padding: "10px 14px", borderRadius: 8, border: "0.5px solid #e5e5e5", background: "#f7f7f6", marginBottom: 16 }}>
                        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 500 }}>{uploadedFile.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#999" }}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </>
                  )}

                  {extracting && <div style={{ textAlign: "center", marginTop: 16 }}><p style={{ fontSize: 13, color: "#888" }}>Extracting and summarizing…</p></div>}
                </>
              )}

              {stepFile === 2 && (
                <>
                  <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Review summary</h2>
                  <p style={{ fontSize: 13, color: "#777", marginTop: 0, marginBottom: 20 }}>Edit the summary before posting to Attio.</p>
                  <label style={labelStyle}>Note title</label>
                  <input value={fileNoteTitle} onChange={e => setFileNoteTitle(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} />
                  <label style={labelStyle}>Note content</label>
                  <textarea rows={10} value={fileSummary} onChange={e => setFileSummary(e.target.value)}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button onClick={() => setStepFile(3)} disabled={!fileSummary.trim()} style={btnStyle("primary", !fileSummary.trim())}>Choose CRM record →</button>
                    <button onClick={clearAndReUpload} style={btnStyle("ghost")}>Re-upload</button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ===== SHARED STEPS (Find record + Done) ===== */}
          {currentStep === 3 && (
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
                <button onClick={searchAttio} disabled={searching || !searchQuery.trim()} style={btnStyle("primary", searching || !searchQuery.trim())}>
                  {searching ? "…" : "Search"}
                </button>
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
                <button onClick={() => { if (tab === "voice") setStep(2); else setStepFile(2); }} style={btnStyle("ghost")}>Back</button>
              </div>
            </>
          )}

          {currentStep === 4 && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e6f4ec", color: "#2d7a4f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 16px" }}>✓</div>
              <h2 style={{ margin: "0 0 8px", fontWeight: 500, fontSize: 18 }}>Note posted to Attio</h2>
              <p style={{ fontSize: 13, color: "#777", margin: "0 0 24px" }}>{selectedRecord ? getRecordName(selectedRecord) : "the record"}</p>
              <button onClick={reset} style={btnStyle("primary")}>Add another note</button>
            </div>
          )}

          {error && (
            <div style={{ background: "#fff5f5", color: "#c0392b", border: "0.5px solid #f5c6c6", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 }}>{error}</div>
          )}
        </div>

        <p style={{ fontSize: 11, color: "#bbb", marginTop: 16, textAlign: "center" }}>
          {tab === "voice" ? "Audio is transcribed via OpenAI Whisper. Works on all devices." : "Files are processed via Claude API. Supports PDF, Word, Excel, and CSV."}
        </p>
      </div>
    </div>
  );
}
