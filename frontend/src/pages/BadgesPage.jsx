import { useState, useEffect } from "react";
import { learningAPI } from "../api/api";
import { getTheme } from "../theme";
import Loader from "../components/Loader";

const ALL_BADGES = [
  { name:"Consistency Master", icon:"🔥", desc:"7-day learning streak",          color:"#ec4899", xp:50  },
  { name:"Quick Learner",      icon:"⚡", desc:"Complete 5 sessions",            color:"#f59e0b", xp:30  },
  { name:"Zen Mode",           icon:"🧘", desc:"Maintain low stress 3 sessions", color:"#22c55e", xp:40  },
  { name:"Deep Focus",         icon:"🎯", desc:"90%+ accuracy 3 sessions",       color:"#00e5ff", xp:50  },
  { name:"Level Up!",          icon:"🚀", desc:"Reach level 5",                  color:"#7c3aed", xp:100 },
  { name:"Night Owl",          icon:"🦉", desc:"Study for 10 sessions",          color:"#a78bfa", xp:60  },
  { name:"Course Creator",     icon:"🎓", desc:"Generate your first course",     color:"#f59e0b", xp:25  },
  { name:"Perfect Score",      icon:"💯", desc:"Get 100% on a quiz",             color:"#22c55e", xp:75  },
];

export default function BadgesPage({ token, isDark }) {
  const t = getTheme(isDark);
  const [unlocked, setUnlocked]   = useState([]);
  const [unlockedAt, setUnlockedAt] = useState({});
  const [loading, setLoading]     = useState(true);
  const [hover, setHover]         = useState(null);

  useEffect(() => {
    learningAPI.badges(token).then(data => {
      if (Array.isArray(data)) {
        setUnlocked(data.map(b => b.name));
        const map = {};
        data.forEach(b => { map[b.name] = b.unlocked_at; });
        setUnlockedAt(map);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const earnedCount = unlocked.length;
  const totalXP     = ALL_BADGES.filter(b => unlocked.includes(b.name)).reduce((s,b)=>s+b.xp, 0);
  const pct         = Math.round((earnedCount / ALL_BADGES.length) * 100);

  return (
    <div>
      <div className="slide-left" style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Badges</h2>
        <p style={{ color:t.muted, fontSize:14 }}>Achievements earned through your learning journey</p>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Summary bar */}
          <div className="card fade-in" style={{ marginBottom:24, borderColor:t.amber+"44" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>
                  Collection Progress
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:t.amber }}>
                  {earnedCount} / {ALL_BADGES.length} badges
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:t.muted, marginBottom:4 }}>Badge XP earned</div>
                <div style={{ fontSize:20, fontWeight:800, color:t.green }}>+{totalXP} XP</div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ background:t.surface, borderRadius:99, height:8, overflow:"hidden", marginBottom:6 }}>
              <div style={{
                height:"100%", borderRadius:99,
                background:`linear-gradient(90deg, ${t.amber}, ${t.pink})`,
                width:`${pct}%`, transition:"width 1s cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
            <div style={{ fontSize:11, color:t.muted }}>{pct}% complete</div>
          </div>

          {/* Badge grid */}
          <div className="stagger" style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(190px, 1fr))",
            gap:16,
          }}>
            {ALL_BADGES.map((badge, i) => {
              const earned = unlocked.includes(badge.name);
              const date   = unlockedAt[badge.name];
              const isHover = hover === badge.name;

              return (
                <div key={badge.name}
                  className={`card fade-in ${earned ? "card-hover" : ""}`}
                  onMouseEnter={() => setHover(badge.name)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    textAlign:"center", position:"relative", overflow:"hidden",
                    borderColor: earned ? badge.color+"55" : t.border,
                    background: earned ? badge.color+"08" : t.card,
                    filter: earned ? "none" : "grayscale(0.7) opacity(0.5)",
                    transform: isHover && earned ? "translateY(-4px)" : "translateY(0)",
                    boxShadow: isHover && earned ? `0 12px 32px ${badge.color}22` : "none",
                    transition:"all 0.25s",
                  }}>

                  {/* Glow dot for earned */}
                  {earned && (
                    <div style={{ position:"absolute", top:10, right:10,
                      width:8, height:8, borderRadius:"50%", background:badge.color,
                      boxShadow:`0 0 10px ${badge.color}`, animation:"pulse-glow 2s infinite" }} />
                  )}

                  {/* Shimmer overlay on hover */}
                  {isHover && earned && (
                    <div style={{ position:"absolute", inset:0, borderRadius:16,
                      background:`linear-gradient(135deg, ${badge.color}08, transparent, ${badge.color}08)`,
                      pointerEvents:"none" }} />
                  )}

                  <div className={earned ? "bounce-in" : ""}
                    style={{ fontSize:44, marginBottom:10, display:"block",
                      filter: earned ? "none" : "grayscale(1)",
                      animationDelay:`${i*0.05}s` }}>
                    {badge.icon}
                  </div>

                  <div style={{ fontWeight:700, fontSize:13, marginBottom:6,
                    color: earned ? badge.color : t.muted }}>
                    {badge.name}
                  </div>

                  <div style={{ fontSize:11, color:t.muted, marginBottom:10 }}>
                    {badge.desc}
                  </div>

                  <div style={{ display:"flex", justifyContent:"center", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, color:t.amber,
                      background:t.amber+"18", padding:"2px 8px", borderRadius:99 }}>
                      +{badge.xp} XP
                    </span>
                    {earned ? (
                      <span style={{ fontSize:10, color:badge.color, fontFamily:"Space Mono",
                        background:badge.color+"18", padding:"2px 8px", borderRadius:99 }}>
                        EARNED
                      </span>
                    ) : (
                      <span style={{ fontSize:10, color:t.muted, fontFamily:"Space Mono",
                        background:t.surface, padding:"2px 8px", borderRadius:99 }}>
                        LOCKED
                      </span>
                    )}
                  </div>

                  {earned && date && (
                    <div style={{ marginTop:8, fontSize:10, color:t.muted }}>
                      {new Date(date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}