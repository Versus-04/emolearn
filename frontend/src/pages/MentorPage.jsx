import { useState, useEffect, useRef } from "react";
import { learningAPI } from "../api/api";
import { theme } from "../theme";

function StructuredReply({ text }) {
  // Split reply into paragraphs and render nicely
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {lines.map((line, i) => {
        // Bold headers like "**Title:**"
        if (line.startsWith("**") && line.includes("**")) {
          const clean = line.replace(/\*\*/g, "");
          return (
            <div key={i} style={{ fontWeight: 700, color: theme.accent, fontSize: 13, marginTop: 4 }}>
              {clean}
            </div>
          );
        }
        // Bullet points
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: theme.text }}>
              <span style={{ color: theme.accent, flexShrink: 0 }}>◆</span>
              <span>{line.replace(/^[-•]\s/, "")}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\./.test(line)) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: theme.text }}>
              <span style={{ color: theme.violet, flexShrink: 0, fontWeight: 700 }}>
                {line.match(/^\d+/)[0]}.
              </span>
              <span>{line.replace(/^\d+\.\s*/, "")}</span>
            </div>
          );
        }
        // Normal text
        return (
          <div key={i} style={{ fontSize: 13, color: theme.text, lineHeight: 1.6 }}>
            {line}
          </div>
        );
      })}
    </div>
  );
}

export default function MentorPage({ token }) {
  const [messages, setMessages] = useState([
    {
      role: "mentor",
      text: "Hey! I'm your AI mentor. I've been tracking your recent sessions. How are you feeling today? 🌟",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const data = await learningAPI.mentorChat(token, userMsg);
      if (data.reply) {
        setMessages((m) => [...m, { role: "mentor", text: data.reply }]);
      } else if (data.error) {
        setMessages((m) => [...m, { role: "mentor", text: "Error: " + data.error }]);
      } else {
        setMessages((m) => [...m, { role: "mentor", text: "Sorry, I couldn't get a response." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "mentor", text: "Sorry, I'm having trouble connecting right now." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>AI Mentor</h2>
      <p style={{ color: theme.muted, fontSize: 14, marginBottom: 20 }}>
        Your personal emotion-aware learning coach
      </p>

      <div className="card" style={{
        flex: 1, overflowY: "auto", marginBottom: 16,
        display: "flex", flexDirection: "column", gap: 16, padding: 20,
      }}>
        {messages.map((msg, i) => {
          const isMentor = msg.role === "mentor";
          return (
            <div key={i} className="fade-in" style={{
              display: "flex",
              justifyContent: isMentor ? "flex-start" : "flex-end",
              gap: 10, alignItems: "flex-end",
            }}>
              {isMentor && (
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: `conic-gradient(${theme.accent}, ${theme.violet})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>🧠</div>
              )}
              <div style={{
                maxWidth: "75%",
                background: isMentor ? theme.surface : `${theme.accent}22`,
                border: `1px solid ${isMentor ? theme.border : theme.accent + "44"}`,
                borderRadius: isMentor ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                padding: "14px 16px",
              }}>
                {isMentor ? <StructuredReply text={msg.text} /> : (
                  <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6 }}>{msg.text}</div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: `conic-gradient(${theme.accent}, ${theme.violet})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>🧠</div>
            <div style={{
              background: theme.surface, border: `1px solid ${theme.border}`,
              borderRadius: "4px 14px 14px 14px", padding: "14px 18px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: theme.muted,
                  animation: `pulse-glow 1.2s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask your mentor anything… e.g. 'How am I doing?' or 'Give me study tips'"
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={send} disabled={loading || !input.trim()}
          style={{ padding: "10px 20px", whiteSpace: "nowrap" }}>
          Send ↗
        </button>
      </div>
    </div>
  );
}