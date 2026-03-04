import { useState, useEffect } from "react";
import { learningAPI } from "../api/api";
import { getTheme } from "../theme";
import Loader from "../components/Loader";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function ProfilePage({ token, user, isDark }) {
  const t = getTheme(isDark);
  const [profile, setProfile] = useState(user || null);
  const [badges,  setBadges]  = useState([]);
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    async function load() {
      try {
        const [p, b] = await Promise.all([
          learningAPI.profile(token),
          learningAPI.badges(token),
        ]);
        if (!p.error) setProfile(p);
        if (Array.isArray(b)) setBadges(b);
      } catch {}
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) return <Loader />;

  const initials = profile?.name
    ? profile.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)
    : "??";

  const xpInLevel = (profile?.xp || 0) % 100;
  const xpToNext  = 100 - xpInLevel;

  // Radar chart data (mock skills from level/xp/streak)
  const level  = profile?.level  || 1;
  const xp     = profile?.xp     || 0;
  const streak = profile?.streak || 0;
  const radarData = [
    { subject:"Consistency", value: Math.min(100, streak*10) },
    { subject:"XP",          value: Math.min(100, xp) },
    { subject:"Level",       value: Math.min(100, level*10) },
    { subject:"Badges",      value: Math.min(100, badges.length*15) },
    { subject:"Engagement",  value: Math.min(100, 40 + level*8) },
  ];

  // Weekly XP bar chart (mock data based on xp)
  const weekData = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>({
    day:d, xp: Math.round((xp / 7) * (0.5 + Math.random()))
  }));

  return (
    <div>
      <div className="slide-left" style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Profile</h2>
        <p style={{ color:t.muted, fontSize:14 }}>Your learning identity and performance</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24 }}>

        {/* Left column */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Avatar card */}
          <div className="card fade-in" style={{
            textAlign:"center", borderColor:t.accent+"44",
            background:`linear-gradient(135deg, ${t.accent}08, ${t.violet}08)`,
          }}>
            {/* Glowing avatar */}
            <div className="float" style={{
              width:80, height:80, borderRadius:"50%",
              background:`conic-gradient(${t.accent},${t.violet},${t.pink},${t.accent})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28, fontWeight:800, color:"#080b14", margin:"0 auto 16px",
              fontFamily:"'Space Mono',monospace",
              boxShadow:`0 0 40px ${t.accent}40`,
            }}>
              {initials}
            </div>

            <div style={{ fontSize:20, fontWeight:800, color:t.text, marginBottom:4 }}>
              {profile?.name || "Learner"}
            </div>
            <div style={{ fontSize:13, color:t.muted, marginBottom:16 }}>
              {profile?.email}
            </div>

            <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:20 }}>
              <span className="level-badge">Level {profile?.level||1}</span>
              {streak >= 7 && (
                <span style={{ fontSize:11, background:t.pink+"22", color:t.pink,
                  border:`1px solid ${t.pink}44`, padding:"3px 10px", borderRadius:99,
                  fontFamily:"Space Mono", fontWeight:700 }}>
                  🔥 ON FIRE
                </span>
              )}
            </div>

            {/* XP bar */}
            <div style={{ marginBottom:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                fontSize:11, color:t.muted, marginBottom:6 }}>
                <span>{xpInLevel} / 100 XP</span>
                <span>{xpToNext} to next</span>
              </div>
              <div className="xp-bar-track">
                <div className="xp-bar-fill" style={{ width:`${xpInLevel}%` }} />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stagger" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { label:"Total XP",  value:profile?.xp||0,           color:t.amber,  icon:"⚡" },
              { label:"Level",     value:profile?.level||1,         color:t.violet, icon:"🏆" },
              { label:"Streak",    value:(profile?.streak||0)+"d",  color:t.pink,   icon:"🔥" },
              { label:"Badges",    value:badges.length,             color:t.green,  icon:"🏅" },
            ].map(s=>(
              <div key={s.label} className="card fade-in" style={{
                textAlign:"center", borderColor:s.color+"33",
                background:s.color+"06",
              }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:t.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Radar chart */}
          <div className="card fade-in" style={{ borderColor:t.violet+"33" }}>
            <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase",
              letterSpacing:"0.08em", marginBottom:14 }}>Skills Radar</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                <PolarGrid stroke={t.border} />
                <PolarAngleAxis dataKey="subject"
                  tick={{ fill:t.muted, fontSize:11 }} />
                <Radar dataKey="value" stroke={t.accent} fill={t.accent}
                  fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly XP chart */}
          <div className="card fade-in" style={{ borderColor:t.amber+"33" }}>
            <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase",
              letterSpacing:"0.08em", marginBottom:14 }}>Weekly XP Distribution</div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={weekData} barSize={24}>
                <XAxis dataKey="day" tick={{ fill:t.muted, fontSize:11 }}
                  axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background:t.card, border:`1px solid ${t.border}`,
                    borderRadius:8, fontSize:11 }}
                  labelStyle={{ color:t.muted }}
                />
                <Bar dataKey="xp" radius={[6,6,0,0]} name="XP">
                  {weekData.map((_,i)=>(
                    <Cell key={i} fill={i===new Date().getDay()-1?t.accent:t.violet+"88"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent badges */}
          {badges.length > 0 && (
            <div className="card fade-in">
              <div style={{ fontSize:11, color:t.muted, textTransform:"uppercase",
                letterSpacing:"0.08em", marginBottom:14 }}>Recent Badges</div>
              <div className="stagger" style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {badges.slice(0, 4).map((b, i) => (
                  <div key={i} className="fade-in" style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"10px 14px", background:t.surface,
                    borderRadius:10, border:`1px solid ${t.border}`,
                  }}>
                    <span style={{ fontSize:22 }}>🏅</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:t.text }}>{b.name}</div>
                      <div style={{ fontSize:11, color:t.muted }}>
                        {new Date(b.unlocked_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:t.green,
                      background:t.green+"18", padding:"2px 8px", borderRadius:99 }}>
                      EARNED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}