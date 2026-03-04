import { useState, useEffect, useCallback } from "react";
import { learningAPI } from "../api/api";
import { getTheme } from "../theme";
import Loader from "../components/Loader";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";

const recIcons = {
  "Micro Practice Mode":"🌱","Revision Mode":"📖",
  "Advanced Challenge":"🔥","Standard Lesson":"⚡","Beginner Lesson":"🌟",
};

// Breathing phases defined outside component — fixes missing-dependency warning
const PHASES = [
  { l:"Inhale", d:4  },
  { l:"Hold",   d:4  },
  { l:"Exhale", d:6  },
  { l:"Hold",   d:2  },
];

// ─── Mini stat card ───────────────────────────────────────────────────────────
function MiniStat({ label, value, icon, color, delay=0 }) {
  return (
    <div className="card fade-in" style={{ textAlign:"center",
      borderColor:color+"33", animationDelay:`${delay}s` }}>
      <div style={{ fontSize:28, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:11, color:"var(--muted)" }}>{label}</div>
    </div>
  );
}

// ─── Memory Match ─────────────────────────────────────────────────────────────
function MemoryGame({ onClose, t }) {
  const emojis = ["🧠","🎯","🔥","⚡","🌟","💡","🎓","🏆"];
  const makeCards = () =>
    [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((e, i) => ({ id:i, emoji:e, flipped:false, matched:false }));

  const [deck, setDeck]   = useState(makeCards);
  const [open, setOpen]   = useState([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon]     = useState(false);

  function flip(id) {
    if (open.length === 2) return;
    const card = deck.find(c => c.id === id);
    if (card.flipped || card.matched) return;
    const nd = deck.map(c => c.id === id ? { ...c, flipped:true } : c);
    const no = [...open, id];
    setDeck(nd); setOpen(no); setMoves(m => m + 1);
    if (no.length === 2) {
      const [a, b] = no.map(fid => nd.find(c => c.id === fid));
      if (a.emoji === b.emoji) {
        const md = nd.map(c => no.includes(c.id) ? { ...c, matched:true } : c);
        setDeck(md); setOpen([]);
        if (md.every(c => c.matched)) setWon(true);
      } else {
        setTimeout(() => {
          setDeck(d => d.map(c => no.includes(c.id) ? { ...c, flipped:false } : c));
          setOpen([]);
        }, 700);
      }
    }
  }

  if (won) return (
    <div style={{ textAlign:"center", padding:20 }}>
      <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
      <div style={{ fontSize:15, fontWeight:700, color:t.green, marginBottom:12 }}>
        Won in {moves} moves!
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn-primary" style={{ flex:1 }}
          onClick={() => { setDeck(makeCards()); setMoves(0); setWon(false); setOpen([]); }}>
          Again
        </button>
        <button className="btn-ghost" style={{ flex:1 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:600 }}>🃏 Memory Match</span>
        <span style={{ fontSize:12, color:t.muted }}>Moves: {moves}</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
        {deck.map(card => (
          <button key={card.id} onClick={() => flip(card.id)} style={{
            aspectRatio:"1", borderRadius:8, fontSize:20,
            background: card.flipped||card.matched ? t.border : t.surface,
            border:`1px solid ${card.matched ? t.green : card.flipped ? t.accent : t.border}`,
            transition:"all 0.2s",
          }}>
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>
      <button className="btn-ghost" onClick={onClose} style={{ width:"100%", fontSize:12 }}>
        Close
      </button>
    </div>
  );
}

// ─── Quick Trivia ─────────────────────────────────────────────────────────────
const TQS = [
  { q:"CPU stands for?",            opts:["Central Processing Unit","Computer Personal Unit","Core Power Unit","Central Program Utility"], a:0 },
  { q:"Closest planet to the Sun?", opts:["Venus","Earth","Mercury","Mars"],              a:2 },
  { q:"12 × 12 = ?",                opts:["132","144","124","148"],                       a:1 },
  { q:"Language that runs in browsers?", opts:["Python","Java","JavaScript","C++"],       a:2 },
  { q:"Sides of a hexagon?",        opts:["5","7","8","6"],                               a:3 },
  { q:"Chemical symbol for water?", opts:["WO","HO","H2O","W2O"],                        a:2 },
  { q:"Author of Romeo and Juliet?",opts:["Dickens","Shakespeare","Tolkien","Austen"],    a:1 },
  { q:"√81 = ?",                    opts:["7","8","9","10"],                              a:2 },
];

function TriviaQuiz({ onClose, t }) {
  const [idx, setIdx]       = useState(0);
  const [score, setScore]   = useState(0);
  const [chosen, setChosen] = useState(null);
  const [done, setDone]     = useState(false);
  const q = TQS[idx];

  function pick(i) {
    if (chosen !== null) return;
    setChosen(i);
    if (i === q.a) setScore(s => s + 1);
    setTimeout(() => {
      if (idx + 1 < TQS.length) { setIdx(x => x + 1); setChosen(null); }
      else setDone(true);
    }, 800);
  }

  if (done) return (
    <div style={{ textAlign:"center", padding:20 }}>
      <div style={{ fontSize:36, marginBottom:8 }}>{score>=6?"🏆":score>=4?"👍":"📖"}</div>
      <div style={{ fontSize:15, fontWeight:700, color:t.accent, marginBottom:12 }}>
        {score}/{TQS.length} correct!
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn-primary" style={{ flex:1 }}
          onClick={() => { setIdx(0); setScore(0); setChosen(null); setDone(false); }}>
          Again
        </button>
        <button className="btn-ghost" style={{ flex:1 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:13, fontWeight:600 }}>🧠 Trivia</span>
        <span style={{ fontSize:12, color:t.muted }}>{idx+1}/{TQS.length} · {score} ✓</span>
      </div>
      <div style={{ background:t.surface, borderRadius:99, height:3,
        marginBottom:12, overflow:"hidden" }}>
        <div style={{ height:"100%", background:t.accent,
          width:((idx/TQS.length)*100)+"%", transition:"width 0.3s" }} />
      </div>
      <div style={{ fontSize:14, fontWeight:600, color:t.text,
        marginBottom:12, lineHeight:1.5 }}>{q.q}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {q.opts.map((opt, i) => {
          let bg=t.surface, border=t.border, color=t.text;
          if (chosen !== null) {
            if (i===q.a)       { bg=t.green+"18"; border=t.green; color=t.green; }
            else if (i===chosen){ bg=t.red+"18";  border=t.red;   color=t.red;   }
          }
          return (
            <button key={i} onClick={() => pick(i)} style={{
              textAlign:"left", padding:"9px 13px", borderRadius:8,
              background:bg, border:`1px solid ${border}`, color,
              fontSize:13, transition:"all 0.2s",
            }}>{opt}</button>
          );
        })}
      </div>
      <button className="btn-ghost" onClick={onClose}
        style={{ width:"100%", marginTop:10, fontSize:12 }}>Close</button>
    </div>
  );
}

// ─── Breathing (phases defined outside — no dep warning) ─────────────────────
function Breathing({ onClose, t }) {
  const phaseColors = [t.accent, t.amber, t.green, t.violet];
  const [ph, setPh]   = useState(0);
  const [cnt, setCnt] = useState(PHASES[0].d);
  const [cyc, setCyc] = useState(0);
  const [run, setRun] = useState(false);

  const tick = useCallback(() => {
    setCnt(c => {
      if (c > 1) return c - 1;
      // move to next phase
      setPh(p => {
        const next = (p + 1) % PHASES.length;
        setCnt(PHASES[next].d);
        if (next === 0) setCyc(cy => cy + 1);
        return next;
      });
      return c; // will be overwritten by setPh callback
    });
  }, []);

  useEffect(() => {
    if (!run) return;
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [run, tick]);

  const phase = PHASES[ph];
  const color = phaseColors[ph];
  const pct   = ((phase.d - cnt) / phase.d) * 100;

  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>🫁 4-4-6-2 Breathing</div>
      <div style={{ fontSize:11, color:t.muted, marginBottom:16 }}>{cyc} cycles completed</div>
      <div style={{ position:"relative", width:100, height:100, margin:"0 auto 16px" }}>
        <svg width="100" height="100" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke={t.border} strokeWidth="7"/>
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={264}
            strokeDashoffset={264 * (1 - pct / 100)}
            style={{ transition:"stroke-dashoffset 0.9s" }}/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex",
          flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:20, fontWeight:800, color }}>{cnt}</div>
          <div style={{ fontSize:10, color:t.muted }}>{phase.l}</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        <button className="btn-primary" onClick={() => setRun(r => !r)}
          style={{ padding:"8px 20px" }}>{run ? "Pause" : "Start"}</button>
        <button className="btn-ghost" onClick={onClose}
          style={{ padding:"8px 16px", fontSize:12 }}>Close</button>
      </div>
    </div>
  );
}

// ─── Break panel ──────────────────────────────────────────────────────────────
function BreakPanel({ suggestion, t }) {
  const [active, setActive] = useState(null);
  if (active==="memory")  return <MemoryGame onClose={() => setActive(null)} t={t} />;
  if (active==="trivia")  return <TriviaQuiz onClose={() => setActive(null)} t={t} />;
  if (active==="breathe") return <Breathing  onClose={() => setActive(null)} t={t} />;
  return (
    <div>
      <div style={{ fontSize:13, color:t.amber, marginBottom:12 }}>
        💡 Suggested: <b>{suggestion || "5-minute break"}</b>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {[
          { id:"memory",  icon:"🃏", label:"Memory Match", sub:"Flip cards to match pairs"      },
          { id:"trivia",  icon:"🧠", label:"Quick Trivia",  sub:"8 fun brain questions"          },
          { id:"breathe", icon:"🫁", label:"Breathing",     sub:"4-4-6-2 calming technique"      },
        ].map(a => (
          <button key={a.id} onClick={() => setActive(a.id)} style={{
            display:"flex", alignItems:"center", gap:10, padding:"10px 13px",
            background:t.surface, borderRadius:10, border:`1px solid ${t.border}`,
            textAlign:"left", transition:"all 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = t.amber}
          onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
            <span style={{ fontSize:22 }}>{a.icon}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:t.text }}>{a.label}</div>
              <div style={{ fontSize:11, color:t.muted }}>{a.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Burnout radial gauge — now USED in dashboard ────────────────────────────
function BurnoutGauge({ value, t }) {
  const pct   = Math.round((value || 0) * 100);
  const color = pct > 70 ? t.red : pct > 40 ? t.amber : t.green;
  const data  = [{ value: pct, fill: color }];
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase",
        letterSpacing:"0.08em", marginBottom:4 }}>Burnout Risk</div>
      <RadialBarChart width={110} height={70} cx={55} cy={65}
        innerRadius={44} outerRadius={60} startAngle={180} endAngle={0} data={data}>
        <PolarAngleAxis type="number" domain={[0,100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={5} background={{ fill:t.surface }} />
      </RadialBarChart>
      <div style={{ marginTop:-18, fontSize:18, fontWeight:800, color }}>{pct}%</div>
    </div>
  );
}

// ─── Engagement sparkline — now USED in dashboard ────────────────────────────
function EngagementChart({ sessions, t }) {
  if (!sessions || sessions.length < 2) return (
    <div style={{ fontSize:12, color:t.muted, textAlign:"center", padding:"20px 0" }}>
      Complete more sessions to see engagement trends
    </div>
  );
  const data = sessions.slice(-7).map((s, i) => ({
    name: `S${i+1}`,
    engagement: Math.round((s.engagement_score || 0) * 100),
    xp: s.xp_earned || 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={90}>
      <LineChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize:10, fill:t.muted }}
          axisLine={false} tickLine={false} />
        <YAxis hide domain={[0,100]} />
        <Tooltip contentStyle={{ background:t.card, border:`1px solid ${t.border}`,
          borderRadius:8, fontSize:11 }} labelStyle={{ color:t.muted }} />
        <Line type="monotone" dataKey="engagement" stroke={t.accent}
          strokeWidth={2} dot={{ fill:t.accent, r:3 }} name="Engagement %" />
        <Line type="monotone" dataKey="xp" stroke={t.violet}
          strokeWidth={2} dot={{ fill:t.violet, r:3 }} name="XP" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ token, user, isDark }) {
  const t = getTheme(isDark);
  const [wellness,  setWellness]  = useState(null);
  const [rec,       setRec]       = useState(null);
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [w, r] = await Promise.all([
          learningAPI.wellness(token),
          learningAPI.recommend(token),
        ]);
        setWellness(w);
        setRec(r);
        // sessions may be inside wellness response or separate
        if (Array.isArray(w?.recent_sessions)) setSessions(w.recent_sessions);
      } catch {}
      setLoading(false);
    }
    load();
  }, [token]);

  return (
    <div>
      <div className="slide-left" style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>
          {user?.name ? `Hey, ${user.name.split(" ")[0]} 👋` : "Dashboard"}
        </h2>
        <p style={{ color:t.muted, fontSize:14 }}>Your learning overview and wellness status</p>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* ── Top stats row ── */}
          <div className="stagger" style={{
            display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24,
          }}>
            <MiniStat label="Level"  value={user?.level||1}                 icon="🏆" color={t.violet} delay={0}    />
            <MiniStat label="XP"     value={user?.xp||0}                    icon="⚡" color={t.amber}  delay={0.05} />
            <MiniStat label="Streak" value={(user?.streak||0)+"d"}          icon="🔥" color={t.pink}   delay={0.1}  />
            <MiniStat label="Status" value={wellness?.take_break?"Rest":"Active"}
              icon={wellness?.take_break?"😴":"💪"}
              color={wellness?.take_break?t.amber:t.green} delay={0.15} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

            {/* ── Left column ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* Wellness / break panel */}
              {wellness && (
                <div className="card fade-in" style={{
                  borderColor: wellness.take_break ? t.amber+"44" : wellness.status ? t.border : t.green+"44",
                  background:  wellness.take_break ? t.amber+"06" : "transparent",
                }}>
                  {wellness.status ? (
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <span style={{ fontSize:32 }}>📊</span>
                      <div>
                        <div style={{ fontWeight:700, color:t.muted, marginBottom:4 }}>
                          No sessions yet
                        </div>
                        <div style={{ fontSize:13, color:t.muted }}>
                          Complete a lesson to see wellness data.
                        </div>
                      </div>
                    </div>
                  ) : wellness.take_break ? (
                    <div>
                      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16 }}>
                        <span style={{ fontSize:32 }}>⚠️</span>
                        <div>
                          <div style={{ fontWeight:700, fontSize:15, color:t.amber, marginBottom:4 }}>
                            Break Recommended
                          </div>
                          <div style={{ fontSize:13, color:t.muted }}>{wellness.reason}</div>
                        </div>
                      </div>
                      <BreakPanel suggestion={wellness.suggestion} t={t} />
                    </div>
                  ) : (
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <span style={{ fontSize:32 }}>✅</span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:t.green, marginBottom:4 }}>
                          You're in great shape!
                        </div>
                        <div style={{ fontSize:13, color:t.muted }}>Keep up the momentum.</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendation */}
              {rec && (
                <div className="card fade-in" style={{ borderColor:t.violet+"44" }}>
                  <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase",
                    letterSpacing:"0.08em", marginBottom:10 }}>Next Recommended</div>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:32 }}>{recIcons[rec.recommendation]||"📚"}</span>
                    <div>
                      <div style={{ fontSize:17, fontWeight:700, color:t.violet }}>
                        {rec.recommendation}
                      </div>
                      <div style={{ fontSize:12, color:t.muted }}>
                        Based on your recent performance
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Burnout gauge — uses BurnoutGauge */}
              {wellness && !wellness.status && (
                <div className="card fade-in" style={{ borderColor:t.border }}>
                  <BurnoutGauge value={wellness.burnout_risk || 0} t={t} />
                </div>
              )}
            </div>

            {/* ── Right column ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* XP progress */}
              <div className="card fade-in" style={{ borderColor:t.accent+"33" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase",
                      letterSpacing:"0.08em", marginBottom:4 }}>XP Progress</div>
                    <div style={{ fontSize:22, fontWeight:800, color:t.accent }}>
                      {user?.xp||0} XP
                    </div>
                  </div>
                  <div className="level-badge" style={{ height:"fit-content" }}>
                    Level {user?.level||1}
                  </div>
                </div>
                <div className="xp-bar-track" style={{ marginBottom:6 }}>
                  <div className="xp-bar-fill" style={{ width:`${(user?.xp||0)%100}%` }} />
                </div>
                <div style={{ fontSize:11, color:t.muted }}>
                  {100 - ((user?.xp||0) % 100)} XP to Level {(user?.level||1)+1}
                </div>
              </div>

              {/* Engagement sparkline — uses EngagementChart */}
              <div className="card fade-in" style={{ borderColor:t.accent+"22" }}>
                <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase",
                  letterSpacing:"0.08em", marginBottom:12 }}>Session Engagement</div>
                <EngagementChart sessions={sessions} t={t} />
              </div>

              {/* Quick guide */}
              <div className="card fade-in" style={{ borderColor:t.border }}>
                <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase",
                  letterSpacing:"0.08em", marginBottom:14 }}>Quick Guide</div>
                <div className="stagger" style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { icon:"◉", text:"Courses — read, watch, assess",   color:t.accent },
                    { icon:"✦", text:"Generate — AI course creator",    color:t.violet },
                    { icon:"◈", text:"Session — log and get analysed",  color:t.pink   },
                    { icon:"◎", text:"Mentor — AI coach chat",          color:t.green  },
                    { icon:"◆", text:"Badges — your achievements",      color:t.amber  },
                  ].map((tip, i) => (
                    <div key={i} className="fade-in" style={{
                      display:"flex", gap:10, fontSize:13, color:t.muted, lineHeight:1.5,
                    }}>
                      <span style={{ color:tip.color, fontSize:15, flexShrink:0 }}>{tip.icon}</span>
                      {tip.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}