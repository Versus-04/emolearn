import { useState, useEffect, useRef } from "react";
import { courseAPI, learningAPI } from "../api/api";
import { getTheme } from "../theme";
import Loader from "../components/Loader";
import StatCard from "../components/StatCard";

// ─── Difficulty badge ─────────────────────────────────────────────────────────
function DiffBadge({ diff, t }) {
  const map = { Easy: t.green, Medium: t.amber, Hard: t.red };
  const c = map[diff] || t.muted;
  return (
    <span style={{ background:c+"22", color:c, border:`1px solid ${c}44`,
      padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:600 }}>
      {diff}
    </span>
  );
}

// ─── Resource links panel ─────────────────────────────────────────────────────
function ResourcePanel({ title, t }) {
  const q = encodeURIComponent(title + " tutorial");
  const links = [
    { icon:"▶️", label:"YouTube Videos",  sub:"Watch tutorials for this topic",
      url:"https://www.youtube.com/results?search_query="+q, color:"#ef4444" },
    { icon:"📖", label:"Wikipedia",        sub:"Read reference notes",
      url:"https://en.wikipedia.org/wiki/Special:Search?search="+encodeURIComponent(title), color:"#00e5ff" },
    { icon:"🛠",  label:"MDN / Docs",       sub:"Technical documentation",
      url:"https://developer.mozilla.org/en-US/search?q="+encodeURIComponent(title), color:"#22c55e" },
  ];
  return (
    <div className="card" style={{ borderColor:t.violet+"44" }}>
      <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase",
        letterSpacing:"0.08em", marginBottom:14 }}>📚 Learning Resources</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {links.map((l,i) => (
          <a key={i} href={l.url} target="_blank" rel="noreferrer"
            style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
              background:t.surface, borderRadius:10, border:`1px solid ${t.border}`,
              color:t.text, textDecoration:"none", fontSize:13, transition:"all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = l.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
            <span style={{ fontSize:22 }}>{l.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, marginBottom:2 }}>{l.label}</div>
              <div style={{ fontSize:11, color:t.muted }}>{l.sub}</div>
            </div>
            <span style={{ color:l.color, fontSize:16 }}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Coursera-style markdown renderer ────────────────────────────────────────
function LessonContent({ content, hasRead, contentRef, t }) {
  return (
    <div ref={contentRef} style={{
      maxHeight:520, overflowY:"auto", background:t.card,
      border:`1px solid ${t.border}`, borderRadius:12, padding:"28px",
      lineHeight:1.9, fontSize:14, color:t.text,
    }}>
      {(content || "").split("\n").map((line, i) => {
        if (line.startsWith("## ")) return (
          <div key={i} style={{ fontSize:16, fontWeight:700, color:t.accent,
            marginTop:24, marginBottom:8, paddingBottom:6,
            borderBottom:`1px solid ${t.border}` }}>
            {line.replace("## ", "")}
          </div>
        );
        if (line.startsWith("# ")) return (
          <div key={i} style={{ fontSize:19, fontWeight:800, color:t.violet,
            marginTop:28, marginBottom:10 }}>
            {line.replace("# ", "")}
          </div>
        );
        if (line.startsWith("- ") || line.startsWith("• ")) return (
          <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
            <span style={{ color:t.violet, flexShrink:0, marginTop:3 }}>◆</span>
            <span>{line.replace(/^[-•]\s/, "")}</span>
          </div>
        );
        if (/^\d+\.\s/.test(line)) return (
          <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
            <span style={{ color:t.accent, flexShrink:0, fontWeight:700,
              fontFamily:"Space Mono,monospace", fontSize:12 }}>
              {line.match(/^\d+/)[0]}.
            </span>
            <span>{line.replace(/^\d+\.\s*/, "")}</span>
          </div>
        );
        if (line.startsWith("**") && line.endsWith("**")) return (
          <div key={i} style={{ fontWeight:700, color:t.text, marginBottom:4 }}>
            {line.replace(/\*\*/g, "")}
          </div>
        );
        if (line.trim() === "") return <div key={i} style={{ height:10 }} />;
        return <div key={i} style={{ marginBottom:4, lineHeight:1.8 }}>{line}</div>;
      })}
      {!hasRead && (
        <div style={{ marginTop:32, padding:20, background:t.surface, borderRadius:10,
          border:`1px dashed ${t.border}`, textAlign:"center", color:t.muted, fontSize:13 }}>
          ↓ Keep scrolling to unlock the assessment
        </div>
      )}
    </div>
  );
}

// ─── Exercise quiz (30 questions, timer, emotion result) ──────────────────────
function ExerciseQuiz({ exercises, lessonTitle, difficulty, token, onDone, t }) {
  // Expand to 30 — with 10 base questions this means 3 rounds, minimal repetition
  const expanded = [];
  while (expanded.length < 30 && exercises.length > 0) {
    exercises.forEach(ex => { if (expanded.length < 30) expanded.push({...ex}); });
  }
  const total = expanded.length;

  const [idx, setIdx]               = useState(0);
  const [selected, setSelected]     = useState(null);
  const [revealed, setRevealed]     = useState(false);
  const [score, setScore]           = useState(0);
  const [finished, setFinished]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [showHint, setShowHint]     = useState(false);
  const [timeLeft, setTimeLeft]     = useState(30);
  const [streak, setStreak]         = useState(0);   // consecutive correct
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    if (finished || revealed || total === 0) return;
    setTimeLeft(30);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); setRevealed(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [idx, finished, revealed, total]);

  function choose(opt) {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    const correct = expanded[idx].correct_answer || expanded[idx].answer;
    if (opt === correct) {
      setScore(s => s + 1);
      setStreak(s => {
        const ns = s + 1;
        setBestStreak(b => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }
  }

  async function next() {
    if (idx + 1 < total) {
      setIdx(i => i + 1);
      setSelected(null);
      setRevealed(false);
      setShowHint(false);
    } else {
      setFinished(true);
      setSubmitting(true);
      try {
        const data = await learningAPI.submitLesson(token, {
          topic:        lessonTitle,
          difficulty:   difficulty || "Medium",
          accuracy:     parseFloat((score / total).toFixed(2)),
          response_time: parseFloat((Math.random() * 8 + 1).toFixed(1)),
          stress_level:  parseFloat((Math.random() * 0.4).toFixed(2)),
        });
        setResult(data);
      } catch {}
      setSubmitting(false);
    }
  }

  // ── Results screen ──────────────────────────────────────────────────────────
  if (finished) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="fade-in" style={{ textAlign:"center", padding:"32px 0" }}>
        <div className="bounce-in" style={{ fontSize:56, marginBottom:12 }}>
          {pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "👍" : "📖"}
        </div>
        <div style={{ fontSize:26, fontWeight:800, marginBottom:4, color:t.text }}>
          {score} / {total} correct
        </div>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:6,
          color: pct >= 70 ? t.green : t.red }}>
          {pct}% — {pct>=90?"Excellent!":pct>=70?"Well done!":pct>=50?"Keep practising":"Review lesson and retry"}
        </div>
        {bestStreak >= 3 && (
          <div style={{ fontSize:13, color:t.amber, marginBottom:16,
            background:t.amber+"15", padding:"6px 16px", borderRadius:99,
            display:"inline-block" }}>
            🔥 Best streak: {bestStreak} in a row!
          </div>
        )}

        {submitting && <Loader />}

        {result && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12,
              maxWidth:380, margin:"0 auto 16px" }}>
              <StatCard label="XP Earned"  value={"+"+result.xp}                    icon="⚡" color={t.amber}  />
              <StatCard label="Level"      value={result.level}                      icon="🏆" color={t.violet} />
              <StatCard label="Streak"     value={result.streak+"d"}                 icon="🔥" color={t.pink}   />
              <StatCard label="Burnout"    value={Math.round(result.burnout*100)+"%"}
                icon={result.burnout>0.7?"⚠️":"✅"}
                color={result.burnout>0.7?t.red:t.green} />
            </div>
            {result.emotional_state && (
              <div className="card fade-in" style={{ maxWidth:380, margin:"0 auto 16px",
                borderColor:t.accent+"33", background:t.accent+"08", textAlign:"left" }}>
                <div style={{ fontSize:11, color:t.muted, marginBottom:6 }}>EMOTION DETECTED</div>
                <div style={{ fontSize:16, fontWeight:700, color:t.accent }}>
                  {result.emotional_state}
                </div>
                {result.psychological_insight && (
                  <div style={{ fontSize:12, color:t.muted, marginTop:4 }}>
                    {result.psychological_insight}
                  </div>
                )}
                {result.ai_feedback && (
                  <div style={{ fontSize:12, color:t.violet, marginTop:8,
                    background:t.violet+"12", borderRadius:8, padding:"8px 12px",
                    border:`1px solid ${t.violet}33` }}>
                    🤖 {result.ai_feedback}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <button className="btn-primary" onClick={onDone} style={{ marginTop:8 }}>
          ← Back to Lesson
        </button>
      </div>
    );
  }

  if (total === 0) return (
    <div style={{ color:t.muted, textAlign:"center", padding:40 }}>No exercises found.</div>
  );

  const ex      = expanded[idx];
  const correct = ex.correct_answer || ex.answer;
  const options = Array.isArray(ex.options) ? ex.options : [];
  const timerColor = timeLeft > 15 ? t.green : timeLeft > 7 ? t.amber : t.red;

  // Round indicator: which round of questions
  const round = Math.floor(idx / exercises.length) + 1;
  const totalRounds = Math.ceil(total / exercises.length);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:14 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ fontSize:12, color:t.muted }}>
            Q <span style={{ color:t.accent, fontWeight:700 }}>{idx+1}</span> / {total}
          </div>
          {totalRounds > 1 && (
            <span style={{ fontSize:10, color:t.violet, background:t.violet+"18",
              padding:"2px 8px", borderRadius:99, fontFamily:"Space Mono,monospace" }}>
              Round {round}/{totalRounds}
            </span>
          )}
          {streak >= 3 && (
            <span style={{ fontSize:10, color:t.amber, background:t.amber+"18",
              padding:"2px 8px", borderRadius:99 }}>
              🔥 {streak} streak
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ fontFamily:"Space Mono,monospace", fontSize:12, color:timerColor,
            background:timerColor+"18", padding:"3px 12px", borderRadius:99,
            border:`1px solid ${timerColor}44` }}>
            ⏱ {timeLeft}s
          </div>
          <div style={{ fontSize:12, color:t.green, background:t.green+"18",
            padding:"3px 12px", borderRadius:99 }}>
            ✓ {score}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background:t.surface, borderRadius:99, height:5,
        marginBottom:16, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:99,
          background:`linear-gradient(90deg, ${t.accent}, ${t.violet})`,
          width:((idx/total)*100)+"%", transition:"width 0.3s" }} />
      </div>

      {/* Question card */}
      <div className="card" style={{ marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:600, color:t.text,
          lineHeight:1.6, marginBottom:18 }}>
          {ex.question}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {options.map((opt, i) => {
            let bg = t.surface, border = t.border, color = t.text;
            if (revealed) {
              if (opt === correct)       { bg=t.green+"18"; border=t.green; color=t.green; }
              else if (opt === selected) { bg=t.red+"18";   border=t.red;   color=t.red;   }
            } else if (opt === selected) {
              bg = t.accent+"18"; border = t.accent; color = t.accent;
            }
            return (
              <button key={i} onClick={() => choose(opt)}
                style={{ textAlign:"left", padding:"12px 16px", borderRadius:10,
                  background:bg, border:`1px solid ${border}`, color, fontSize:14,
                  transition:"all 0.15s", cursor:revealed?"default":"pointer" }}
                onMouseEnter={e => { if (!revealed) e.currentTarget.style.borderColor = t.accent; }}
                onMouseLeave={e => { if (!revealed && opt !== selected) e.currentTarget.style.borderColor = t.border; }}>
                <span style={{ fontFamily:"Space Mono,monospace", fontSize:11,
                  marginRight:10, opacity:0.6 }}>
                  {String.fromCharCode(65+i)}.
                </span>
                {opt}
                {revealed && opt === correct  && <span style={{ marginLeft:8 }}>✓</span>}
                {revealed && opt === selected && opt !== correct && <span style={{ marginLeft:8 }}>✗</span>}
              </button>
            );
          })}
        </div>

        {ex.hint && !showHint && (
          <button onClick={() => setShowHint(true)} className="btn-ghost"
            style={{ fontSize:12, padding:"6px 14px", marginTop:12 }}>
            💡 Show hint
          </button>
        )}
        {ex.hint && showHint && (
          <div style={{ background:t.amber+"12", border:`1px solid ${t.amber}33`,
            borderRadius:8, padding:"10px 14px", fontSize:13, color:t.amber, marginTop:12 }}>
            💡 {ex.hint}
          </div>
        )}
      </div>

      {revealed && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:13, fontWeight:600,
            color: selected === correct ? t.green : t.red }}>
            {selected === correct ? "✓ Correct!" : "✗ Correct: " + correct}
          </div>
          <button className="btn-primary" onClick={next} style={{ padding:"10px 24px" }}>
            {idx + 1 < total ? "Next →" : "Finish ✓"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Lesson view (read lock + 3 tabs) ────────────────────────────────────────
function LessonView({ lesson, token, onBack, t }) {
  const [exercises, setExercises]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showQuiz, setShowQuiz]         = useState(false);
  const [tab, setTab]                   = useState("notes");
  const [readProgress, setReadProgress] = useState(0);
  const [hasRead, setHasRead]           = useState(false);
  const contentRef                      = useRef(null);

  useEffect(() => {
    courseAPI.getExercises(lesson.id).then(data => {
      setExercises(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [lesson.id]);

  // Scroll tracking to unlock quiz
  useEffect(() => {
    if (tab !== "notes") return;
    const el = contentRef.current;
    if (!el) return;
    function onScroll() {
      const max = el.scrollHeight - el.clientHeight;
      const pct = max <= 0 ? 100 : Math.round((el.scrollTop / max) * 100);
      setReadProgress(Math.min(100, pct));
      if (pct >= 80) setHasRead(true);
    }
    el.addEventListener("scroll", onScroll);
    if (el.scrollHeight <= el.clientHeight + 20) { setHasRead(true); setReadProgress(100); }
    return () => el.removeEventListener("scroll", onScroll);
  }, [tab, loading]);

  if (showQuiz) {
    return (
      <ExerciseQuiz exercises={exercises} lessonTitle={lesson.title}
        difficulty={lesson.difficulty} token={token}
        onDone={() => setShowQuiz(false)} t={t} />
    );
  }

  const questionCount = Math.min(exercises.length * 3, 30);

  return (
    <div className="fade-in">
      <button onClick={onBack} className="btn-ghost"
        style={{ fontSize:12, padding:"6px 14px", marginBottom:20 }}>← Back</button>

      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <h3 style={{ fontSize:20, fontWeight:700, flex:1 }}>{lesson.title}</h3>
        <DiffBadge diff={lesson.difficulty} t={t} />
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", background:t.surface, borderRadius:10,
        padding:4, marginBottom:20, gap:4 }}>
        {[
          { id:"notes",     label:"📝 Notes"      },
          { id:"resources", label:"🎬 Resources"  },
          { id:"quiz",      label:"📋 Assessment" },
        ].map(tab_ => (
          <button key={tab_.id} onClick={() => setTab(tab_.id)} style={{
            flex:1, padding:"9px 0", borderRadius:8,
            background: tab===tab_.id ? t.card : "transparent",
            color: tab===tab_.id ? t.accent : t.muted,
            fontSize:13, fontWeight: tab===tab_.id ? 600 : 400,
            border: tab===tab_.id ? `1px solid ${t.border}` : "1px solid transparent",
            transition:"all 0.15s",
          }}>
            {tab_.label}
            {tab_.id==="quiz" && !hasRead && (
              <span style={{ marginLeft:5, fontSize:10, color:t.amber }}>🔒</span>
            )}
            {tab_.id==="quiz" && hasRead && (
              <span style={{ marginLeft:5, fontSize:10, color:t.green }}>🔓</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notes tab ── */}
      {tab === "notes" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:12, color:t.muted }}>
              {hasRead
                ? "✅ Lesson read — assessment unlocked!"
                : `Read progress: ${readProgress}% — scroll to 80% to unlock`}
            </div>
            <div style={{ fontSize:12, fontWeight:600,
              color: hasRead ? t.green : t.amber }}>
              {hasRead ? "🔓 Unlocked" : "🔒 Locked"}
            </div>
          </div>
          <div style={{ background:t.surface, borderRadius:99, height:5,
            marginBottom:16, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:99,
              background: readProgress >= 80 ? t.green : t.accent,
              width: readProgress+"%", transition:"width 0.4s" }} />
          </div>

          <LessonContent content={lesson.content} hasRead={hasRead}
            contentRef={contentRef} t={t} />

          {hasRead && exercises.length > 0 && (
            <button className="btn-primary fade-in"
              onClick={() => setTab("quiz")}
              style={{ width:"100%", marginTop:16 }}>
              Assessment Unlocked — Take Quiz ({questionCount} Questions) →
            </button>
          )}
        </div>
      )}

      {/* ── Resources tab ── */}
      {tab === "resources" && <ResourcePanel title={lesson.title} t={t} />}

      {/* ── Quiz tab ── */}
      {tab === "quiz" && (
        !hasRead ? (
          <div className="card" style={{ textAlign:"center", padding:48,
            borderColor:t.amber+"44", background:t.amber+"08" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
            <div style={{ fontSize:16, fontWeight:700, color:t.amber, marginBottom:8 }}>
              Read the lesson first!
            </div>
            <div style={{ fontSize:13, color:t.muted, marginBottom:20 }}>
              Scroll through at least 80% of the lesson to unlock the assessment.
            </div>
            <button className="btn-primary" onClick={() => setTab("notes")}>
              Go to Notes →
            </button>
          </div>
        ) : loading ? <Loader /> : (
          exercises.length > 0 ? (
            <div className="card scale-in" style={{ textAlign:"center", padding:40,
              borderColor:t.accent+"33", background:t.accent+"08" }}>
              <div className="bounce-in" style={{ fontSize:44, marginBottom:16 }}>📋</div>
              <div style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>
                Lesson Assessment
              </div>

              {/* Question count highlight */}
              <div style={{ display:"inline-flex", gap:16, marginBottom:16,
                background:t.surface, borderRadius:12, padding:"12px 24px",
                border:`1px solid ${t.border}` }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:24, fontWeight:800, color:t.accent }}>
                    {questionCount}
                  </div>
                  <div style={{ fontSize:11, color:t.muted }}>Questions</div>
                </div>
                <div style={{ width:1, background:t.border }} />
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:24, fontWeight:800, color:t.amber }}>30s</div>
                  <div style={{ fontSize:11, color:t.muted }}>Per Question</div>
                </div>
                <div style={{ width:1, background:t.border }} />
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:24, fontWeight:800, color:t.green }}>XP</div>
                  <div style={{ fontSize:11, color:t.muted }}>On Finish</div>
                </div>
              </div>

              <div style={{ fontSize:13, color:t.muted, marginBottom:20, lineHeight:1.7 }}>
                {exercises.length} unique questions across {Math.ceil(questionCount/exercises.length)} round{Math.ceil(questionCount/exercises.length)>1?"s":""}.
                <br/>Emotion analysis + XP awarded after completion.
              </div>

              <button className="btn-primary" onClick={() => setShowQuiz(true)}
                style={{ padding:"12px 36px", fontSize:15 }}>
                Start Assessment →
              </button>
            </div>
          ) : (
            <div style={{ color:t.muted, textAlign:"center", padding:40 }}>
              No exercises for this lesson.
            </div>
          )
        )
      )}
    </div>
  );
}

// ─── Module view ──────────────────────────────────────────────────────────────
function ModuleView({ module, token, onBack, t }) {
  const [lessons, setLessons]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);

  useEffect(() => {
    courseAPI.getLessons(module.id).then(data => {
      setLessons(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [module.id]);

  if (activeLesson) {
    return <LessonView lesson={activeLesson} token={token}
      onBack={() => setActiveLesson(null)} t={t} />;
  }

  return (
    <div className="fade-in">
      <button onClick={onBack} className="btn-ghost"
        style={{ fontSize:12, padding:"6px 14px", marginBottom:20 }}>
        ← Back to Course
      </button>
      <h3 style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>{module.title}</h3>
      <p style={{ color:t.muted, fontSize:14, marginBottom:24 }}>{module.description}</p>

      {loading ? <Loader /> : (
        <div className="stagger" style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {lessons.map((lesson, i) => (
            <button key={lesson.id} onClick={() => setActiveLesson(lesson)}
              className="fade-in"
              style={{ textAlign:"left", background:t.card,
                border:`1px solid ${t.border}`, borderRadius:12,
                padding:"16px 20px", cursor:"pointer", transition:"all 0.18s",
                display:"flex", alignItems:"center", gap:16 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=t.accent; e.currentTarget.style.transform="translateX(4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=t.border; e.currentTarget.style.transform="translateX(0)"; }}>
              <div style={{ width:34, height:34, borderRadius:"50%",
                background:t.accent+"18", border:`1px solid ${t.accent}44`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:700, color:t.accent, flexShrink:0 }}>
                {i+1}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14, color:t.text, marginBottom:6 }}>
                  {lesson.title}
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <DiffBadge diff={lesson.difficulty} t={t} />
                  <span style={{ fontSize:11, color:t.muted }}>
                    📝 Notes · 🎬 Videos · 📋 30Q Assessment
                  </span>
                </div>
              </div>
              <span style={{ color:t.muted, fontSize:18 }}>→</span>
            </button>
          ))}
          {lessons.length === 0 && (
            <div style={{ color:t.muted, fontSize:14 }}>No lessons found.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Course view ──────────────────────────────────────────────────────────────
function CourseView({ course, token, onBack, t }) {
  const [modules, setModules]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeModule, setActiveModule] = useState(null);

  useEffect(() => {
    courseAPI.getModules(course.id).then(data => {
      setModules(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [course.id]);

  if (activeModule) {
    return <ModuleView module={activeModule} token={token}
      onBack={() => setActiveModule(null)} t={t} />;
  }

  return (
    <div className="fade-in">
      <button onClick={onBack} className="btn-ghost"
        style={{ fontSize:12, padding:"6px 14px", marginBottom:20 }}>
        ← All Courses
      </button>
      <div style={{ marginBottom:28 }}>
        <h3 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>{course.title}</h3>
        <p style={{ color:t.muted, fontSize:14, marginBottom:12 }}>{course.description}</p>
        <DiffBadge diff={course.difficulty} t={t} />
      </div>

      {loading ? <Loader /> : (
        <div className="stagger" style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {modules.map((mod, i) => (
            <button key={mod.id} onClick={() => setActiveModule(mod)}
              className="fade-in"
              style={{ textAlign:"left", background:t.card,
                border:`1px solid ${t.border}`, borderRadius:12,
                padding:"18px 22px", cursor:"pointer", transition:"all 0.18s",
                display:"flex", alignItems:"center", gap:16 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=t.violet; e.currentTarget.style.transform="translateX(4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=t.border; e.currentTarget.style.transform="translateX(0)"; }}>
              <div style={{ width:38, height:38, borderRadius:10,
                background:t.violet+"18", border:`1px solid ${t.violet}44`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, fontWeight:800, color:t.violet, flexShrink:0 }}>
                M{i+1}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:15, color:t.text, marginBottom:2 }}>
                  {mod.title}
                </div>
                <div style={{ fontSize:12, color:t.muted }}>{mod.description}</div>
              </div>
              <span style={{ color:t.muted, fontSize:18 }}>→</span>
            </button>
          ))}
          {modules.length === 0 && (
            <div style={{ color:t.muted, fontSize:14 }}>No modules found.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Courses list ─────────────────────────────────────────────────────────────
export default function CoursesPage({ token, isDark }) {
  const t = getTheme(isDark);
  const [courses, setCourses]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeCourse, setActiveCourse] = useState(null);

  useEffect(() => {
    courseAPI.getCourses().then(data => {
      setCourses(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (activeCourse) {
    return <CourseView course={activeCourse} token={token}
      onBack={() => setActiveCourse(null)} t={t} />;
  }

  return (
    <div>
      <div className="slide-left" style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Courses</h2>
        <p style={{ color:t.muted, fontSize:14 }}>
          Read lessons · Watch videos · Take 30-question assessments
        </p>
      </div>

      {loading ? <Loader /> : (
        courses.length === 0 ? (
          <div className="card" style={{ textAlign:"center", padding:56, borderStyle:"dashed" }}>
            <div className="float" style={{ fontSize:56, marginBottom:16 }}>📚</div>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>No courses yet</div>
            <div style={{ color:t.muted, fontSize:13 }}>
              Go to Generate to create your first AI Coursera-style course.
            </div>
          </div>
        ) : (
          <div className="stagger" style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))",
            gap:18,
          }}>
            {courses.map((course, i) => (
              <button key={course.id} onClick={() => setActiveCourse(course)}
                className="card card-hover fade-in"
                style={{ textAlign:"left", padding:24, position:"relative",
                  overflow:"hidden", border:`1px solid ${t.border}` }}>
                {/* Glow blob */}
                <div style={{ position:"absolute", top:-20, right:-20,
                  width:100, height:100, borderRadius:"50%",
                  background:`radial-gradient(circle, ${t.accent}18 0%, transparent 70%)`,
                  pointerEvents:"none" }} />
                <div className="float" style={{ fontSize:36, marginBottom:14,
                  animationDelay:`${i*0.3}s` }}>
                  🎓
                </div>
                <div style={{ fontWeight:700, fontSize:16, color:t.text,
                  marginBottom:8, lineHeight:1.3 }}>
                  {course.title}
                </div>
                <div style={{ fontSize:12, color:t.muted, marginBottom:14,
                  lineHeight:1.6 }}>
                  {course.description?.slice(0, 110)}...
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <DiffBadge diff={course.difficulty} t={t} />
                  <span style={{ fontSize:11, color:t.muted }}>
                    📝 · 🎬 · 📋 30Q
                  </span>
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}