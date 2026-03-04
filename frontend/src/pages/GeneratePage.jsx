import { useState } from "react";
import { courseAPI } from "../api/api";
import { theme } from "../theme";

export default function GeneratePage({ token, onGenerated }) {
  const [title, setTitle]           = useState("");
  const [category, setCategory]     = useState("Technology");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numModules, setNumModules] = useState(3);
  const [lessonsPerModule, setLessonsPerModule] = useState(3);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState("");
  const [error, setError]           = useState("");
  const [genStep, setGenStep]       = useState("");

  const categories = [
    "Technology","Science","Mathematics","History",
    "Language","Business","Design","Health",
    "Engineering","Psychology","Economics","Art",
  ];

  const totalLessons   = parseInt(numModules) * parseInt(lessonsPerModule);
  const totalExercises = totalLessons * 5;   // 5 per lesson now
  const estSeconds     = totalLessons * 8;   // ~8s per lesson via OpenRouter
  const estMin         = Math.ceil(estSeconds / 60);

  async function generate() {
    if (!title.trim()) { setError("Please enter a course title"); return; }
    setLoading(true); setError(""); setSuccess(""); setGenStep("Sending request to AI…");

    // Fake progress steps so user knows it's working
    const steps = [
      "Creating course structure…",
      "Writing module outlines…",
      "Generating lesson content…",
      "Building exercises and quizzes…",
      "Finalising course…",
    ];
    let si = 0;
    const stepTimer = setInterval(() => {
      si = (si + 1) % steps.length;
      setGenStep(steps[si]);
    }, Math.max(4000, (estSeconds * 1000) / steps.length));

    try {
      const data = await courseAPI.generateCourse(token, {
        course_title: title.trim(),
        category,
        difficulty,
        num_modules:       parseInt(numModules),
        lessons_per_module: parseInt(lessonsPerModule),
      });
      clearInterval(stepTimer);
      console.log("Generate response:", data);

      if (data.message) {
        setSuccess(data.message);
        setGenStep("");
        setTitle("");
        if (onGenerated) onGenerated();
      } else {
        setError(data.detail || data.error || "Generation failed — check backend terminal");
        setGenStep("");
      }
    } catch (err) {
      clearInterval(stepTimer);
      console.error(err);
      setError("Cannot connect to backend. Is uvicorn running?");
      setGenStep("");
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Generate Course</h2>
      <p style={{ color:theme.muted, fontSize:14, marginBottom:28 }}>
        Let AI build a full Coursera-style course with structured lessons, notes and quizzes
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <div className="card">
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            <div>
              <label style={{ fontSize:12, color:theme.muted, display:"block", marginBottom:6 }}>
                Course Title
              </label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Machine Learning"
                onKeyDown={e => e.key === "Enter" && generate()} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ fontSize:12, color:theme.muted, display:"block", marginBottom:6 }}>
                  Category
                </label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
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
            </div>

            {/* Modules slider */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <label style={{ fontSize:12, color:theme.muted }}>Number of Modules</label>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:12,
                  color:theme.accent, background:theme.accent+"18",
                  padding:"2px 8px", borderRadius:4 }}>
                  {numModules}
                </span>
              </div>
              <input type="range" min={1} max={12} value={numModules}
                onChange={e => setNumModules(e.target.value)}
                style={{ padding:0, height:"auto", border:"none",
                  background:"transparent", accentColor:theme.accent, width:"100%" }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:theme.muted, marginTop:2 }}>
                <span>1</span><span>12</span>
              </div>
            </div>

            {/* Lessons slider */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <label style={{ fontSize:12, color:theme.muted }}>Lessons per Module</label>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:12,
                  color:theme.violet, background:theme.violet+"18",
                  padding:"2px 8px", borderRadius:4 }}>
                  {lessonsPerModule}
                </span>
              </div>
              <input type="range" min={1} max={6} value={lessonsPerModule}
                onChange={e => setLessonsPerModule(e.target.value)}
                style={{ padding:0, height:"auto", border:"none",
                  background:"transparent", accentColor:theme.violet, width:"100%" }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:theme.muted, marginTop:2 }}>
                <span>1</span><span>6</span>
              </div>
            </div>

            {/* Time warning */}
            <div style={{ background: estMin > 3 ? theme.amber+"10" : theme.green+"10",
              border:"1px solid "+(estMin > 3 ? theme.amber : theme.green)+"33",
              borderRadius:8, padding:"10px 14px", fontSize:12,
              color: estMin > 3 ? theme.amber : theme.green }}>
              ⏱ Estimated generation time: <b>~{estMin} minute{estMin > 1 ? "s" : ""}</b>
              {estMin > 3 && " — grab a coffee ☕"}
            </div>

            {error && (
              <div style={{ background:theme.red+"15", border:"1px solid "+theme.red+"40",
                borderRadius:8, padding:"10px 14px", fontSize:13, color:theme.red }}>
                ✕ {error}
              </div>
            )}
            {success && (
              <div style={{ background:theme.green+"15", border:"1px solid "+theme.green+"40",
                borderRadius:8, padding:"10px 14px", fontSize:13, color:theme.green }}>
                ✓ {success}
              </div>
            )}

            <button className="btn-primary" onClick={generate}
              disabled={loading || !title.trim()} style={{ width:"100%" }}>
              {loading ? "Generating…" : "Generate Course ✦"}
            </button>

          </div>
        </div>

        {/* ── Right panel ──────────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Course preview */}
          <div className="card" style={{ borderColor:theme.accent+"33" }}>
            <div style={{ fontSize:11, color:theme.muted, textTransform:"uppercase",
              letterSpacing:"0.08em", marginBottom:14 }}>Course Preview</div>
            <div style={{ fontSize:18, fontWeight:800, color:theme.text, marginBottom:4 }}>
              {title || "Your Course Title"}
            </div>
            <div style={{ fontSize:13, color:theme.muted, marginBottom:16 }}>
              {category} · {difficulty}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8,
              maxHeight:220, overflowY:"auto" }}>
              {Array.from({ length: parseInt(numModules) }).map((_, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"10px 14px", background:theme.surface, borderRadius:8,
                  border:"1px solid "+theme.border }}>
                  <div style={{ width:26, height:26, borderRadius:6,
                    background:theme.violet+"22", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:11, fontWeight:700,
                    color:theme.violet, flexShrink:0 }}>
                    M{i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:theme.text }}>Module {i+1}</div>
                    <div style={{ fontSize:11, color:theme.muted }}>
                      {lessonsPerModule} lessons · {parseInt(lessonsPerModule)*5} exercises
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="card" style={{ borderColor:theme.amber+"33" }}>
            <div style={{ fontSize:11, color:theme.muted, textTransform:"uppercase",
              letterSpacing:"0.08em", marginBottom:12 }}>Course Stats</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { label:"Modules",    value:numModules,      color:theme.violet },
                { label:"Lessons",    value:totalLessons,    color:theme.accent },
                { label:"Exercises",  value:totalExercises,  color:theme.amber  },
                { label:"Est. Time",  value:estMin+"m",      color:theme.green  },
              ].map(s => (
                <div key={s.label} style={{ background:theme.surface,
                  borderRadius:8, padding:"12px 14px" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:theme.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading state with progress steps */}
          {loading && (
            <div className="card fade-in" style={{ textAlign:"center", padding:28,
              borderColor:theme.accent+"33" }}>
              <div style={{ width:44, height:44, borderRadius:"50%",
                border:"3px solid "+theme.border, borderTopColor:theme.accent,
                animation:"spin-slow 0.8s linear infinite", margin:"0 auto 14px" }} />
              <div style={{ fontSize:14, color:theme.accent, fontWeight:600, marginBottom:6 }}>
                {genStep || "AI is writing your course…"}
              </div>
              <div style={{ fontSize:12, color:theme.muted }}>
                {totalLessons} lessons · {totalExercises} exercises
              </div>
              <div style={{ fontSize:11, color:theme.muted, marginTop:4 }}>
                ~{estMin} min · Do not close this tab ☕
              </div>
            </div>
          )}

          {/* Success */}
          {success && !loading && (
            <div className="card fade-in" style={{ textAlign:"center", padding:28,
              borderColor:theme.green+"44", background:theme.green+"08" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
              <div style={{ fontSize:15, fontWeight:700, color:theme.green, marginBottom:6 }}>
                Course Created!
              </div>
              <div style={{ fontSize:12, color:theme.muted }}>
                Redirecting to Courses tab…
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}