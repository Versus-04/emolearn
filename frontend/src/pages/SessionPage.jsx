import { useState } from "react";
import { learningAPI } from "../api/api";
import { theme } from "../theme";
import StatCard from "../components/StatCard";

// ─── Emotion colour map ───────────────────────────────────────────────────────
const emotionMeta = {
  Happy:    { icon:"😊", color:"#22c55e" },
  Focused:  { icon:"🎯", color:"#00e5ff" },
  Neutral:  { icon:"😐", color:"#94a3b8" },
  Anxious:  { icon:"😰", color:"#f59e0b" },
  Stressed: { icon:"😤", color:"#ef4444" },
  Confused: { icon:"😕", color:"#a78bfa" },
  Tired:    { icon:"😴", color:"#64748b" },
  Excited:  { icon:"🤩", color:"#ec4899" },
};

function EmotionCard({ emotion, insight, aiFeedback }) {
  const meta  = emotionMeta[emotion] || { icon:"😐", color:"#94a3b8" };
  return (
    <div className="card fade-in" style={{
      borderColor: meta.color+"44", background: meta.color+"08" }}>
      <div style={{ fontSize:11, color:theme.muted, textTransform:"uppercase",
        letterSpacing:"0.08em", marginBottom:12 }}>🧠 Emotion Analysis</div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        <div style={{ width:48, height:48, borderRadius:"50%",
          background: meta.color+"22", border:"2px solid "+meta.color+"55",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
          {meta.icon}
        </div>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:meta.color }}>{emotion}</div>
          <div style={{ fontSize:11, color:theme.muted }}>Detected emotional state</div>
        </div>
      </div>
      {insight && (
        <div style={{ fontSize:13, color:theme.text, lineHeight:1.6,
          background:theme.surface, borderRadius:8, padding:"10px 14px",
          marginBottom: aiFeedback ? 10 : 0 }}>
          💡 {insight}
        </div>
      )}
      {aiFeedback && (
        <div style={{ fontSize:13, color:theme.violet, lineHeight:1.6,
          background:theme.violet+"10", borderRadius:8, padding:"10px 14px",
          border:"1px solid "+theme.violet+"33" }}>
          🤖 {aiFeedback}
        </div>
      )}
    </div>
  );
}

function SliderField({ label, desc, value, onChange, min=0, max=1, step=0.01, color }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <label style={{ fontSize:13, color:theme.text, fontWeight:500 }}>{label}</label>
        <span style={{ fontFamily:"Space Mono,monospace", fontSize:12, color,
          background:color+"18", padding:"2px 8px", borderRadius:4 }}>
          {parseFloat(value).toFixed(2)}
        </span>
      </div>
      {desc && <div style={{ fontSize:11, color:theme.muted, marginBottom:8 }}>{desc}</div>}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(e.target.value)}
        style={{ padding:0, height:"auto", border:"none", background:"transparent",
          accentColor:color, cursor:"pointer", width:"100%" }} />
    </div>
  );
}

export default function SessionPage({ token }) {
  const [topic, setTopic]           = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [accuracy, setAccuracy]     = useState(0.75);
  const [responseTime, setResponseTime] = useState(3);
  const [stressLevel, setStressLevel]   = useState(0.3);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");

  async function submit() {
    if (!topic.trim()) { setError("Please enter a topic"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await learningAPI.submitLesson(token, {
        topic: topic.trim(),
        difficulty,
        accuracy:       parseFloat(accuracy),
        response_time:  parseFloat(responseTime),
        stress_level:   parseFloat(stressLevel),
      });
      console.log("Session result:", data);
      if (data.error || data.detail) {
        setError(data.detail || "Submission failed — check backend");
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error(err);
      setError("Request failed. Make sure uvicorn is running on port 8000.");
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Log Session</h2>
      <p style={{ color:theme.muted, fontSize:14, marginBottom:16 }}>
        Submit a study session — AI analyses your emotional state and awards XP
      </p>

      {/* How emotion works banner */}
      <div className="card" style={{ marginBottom:24, borderColor:"#00e5ff33",
        background:"#00e5ff06", display:"flex", alignItems:"flex-start", gap:14 }}>
        <span style={{ fontSize:28, flexShrink:0 }}>🧠</span>
        <div style={{ fontSize:13, color:theme.muted, lineHeight:1.7 }}>
          <b style={{ color:"#00e5ff" }}>How emotion is detected:</b> Your accuracy, stress level
          and response time are sent to the backend. The ML model predicts burnout risk, then
          OpenRouter GPT-4o-mini analyses the combined data to detect your emotional state
          (Happy, Focused, Anxious, Stressed, etc.) and gives a psychological insight.
          AI feedback is triggered when burnout &gt; 70% or confidence &lt; 60%.
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <div className="card">
          <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

            <div>
              <label style={{ fontSize:12, color:theme.muted, display:"block", marginBottom:6 }}>
                Topic / Subject
              </label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Calculus, Machine Learning, Python…"
                onKeyDown={e => e.key === "Enter" && submit()} />
            </div>

            <div>
              <label style={{ fontSize:12, color:theme.muted, display:"block", marginBottom:6 }}>
                Difficulty
              </label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            <SliderField
              label="Accuracy"
              desc="How well you answered — 0 = all wrong, 1 = all correct"
              value={accuracy} onChange={setAccuracy}
              color={theme.green} />

            <SliderField
              label="Response Time (seconds)"
              desc="Average seconds you took per question"
              value={responseTime} onChange={setResponseTime}
              min={0.5} max={30} step={0.5}
              color={theme.accent} />

            <SliderField
              label="Stress Level"
              desc="How stressed you felt — 0 = calm, 1 = very stressed"
              value={stressLevel} onChange={setStressLevel}
              color={theme.red} />

            {error && (
              <div style={{ background:theme.red+"15", border:"1px solid "+theme.red+"40",
                borderRadius:8, padding:"10px 14px", fontSize:13, color:theme.red }}>
                ✕ {error}
              </div>
            )}

            <button className="btn-primary" onClick={submit}
              disabled={loading || !topic.trim()} style={{ width:"100%" }}>
              {loading ? "Analysing with AI…" : "Submit Session →"}
            </button>
          </div>
        </div>

        {/* ── Results ──────────────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {loading && (
            <div className="card" style={{ display:"flex", alignItems:"center",
              justifyContent:"center", minHeight:300, flexDirection:"column", gap:16 }}>
              <div style={{ width:52, height:52, borderRadius:"50%",
                border:"3px solid "+theme.border, borderTopColor:"#00e5ff",
                animation:"spin-slow 0.8s linear infinite" }} />
              <div style={{ textAlign:"center" }}>
                <div style={{ color:"#00e5ff", fontSize:14, fontWeight:600, marginBottom:4 }}>
                  Analysing emotional state…
                </div>
                <div style={{ color:theme.muted, fontSize:12 }}>
                  ML model + GPT-4o-mini processing your session
                </div>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="card" style={{ minHeight:300, display:"flex",
              alignItems:"center", justifyContent:"center",
              borderStyle:"dashed", flexDirection:"column", gap:12 }}>
              <div style={{ fontSize:48 }}>🔮</div>
              <div style={{ color:theme.muted, fontSize:13, textAlign:"center" }}>
                Submit a session to see<br />your AI emotion analysis
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* XP / stats grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <StatCard label="XP Earned"   value={"+"+result.xp}                      icon="⚡" color={theme.amber}  />
                <StatCard label="Level"        value={result.level}                       icon="🏆" color={theme.violet} />
                <StatCard label="Streak"       value={result.streak+"d"}                  icon="🔥" color={theme.pink}   />
                <StatCard label="Burnout Risk" value={Math.round(result.burnout*100)+"%"}
                  icon={result.burnout>0.7?"⚠️":"✅"}
                  color={result.burnout>0.7?theme.red:theme.green} />
              </div>

              {/* Emotion card */}
              {result.emotional_state && (
                <EmotionCard
                  emotion={result.emotional_state}
                  insight={result.psychological_insight}
                  aiFeedback={result.ai_feedback}
                />
              )}

              {/* Burnout warning */}
              {result.burnout > 0.7 && (
                <div className="card fade-in" style={{
                  borderColor:theme.amber+"44", background:theme.amber+"08" }}>
                  <div style={{ fontSize:13, color:theme.amber, fontWeight:600, marginBottom:4 }}>
                    ⚠️ High Burnout Risk Detected
                  </div>
                  <div style={{ fontSize:12, color:theme.muted }}>
                    Take a short break. Go to Dashboard for break activities — memory game, trivia or breathing exercise.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}