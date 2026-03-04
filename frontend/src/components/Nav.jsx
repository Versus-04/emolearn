import { getTheme } from "../theme";

const tabs = [
  { id:"dashboard", label:"Dashboard", icon:"⬡" },
  { id:"courses",   label:"Courses",   icon:"◉" },
  { id:"generate",  label:"Generate",  icon:"✦" },
  { id:"session",   label:"Session",   icon:"◈" },
  { id:"mentor",    label:"Mentor",    icon:"◎" },
  { id:"badges",    label:"Badges",    icon:"◆" },
  { id:"profile",   label:"Profile",   icon:"👤" },
];

export default function Nav({ page, setPage, onLogout, user, isDark, onToggleTheme }) {
  const t = getTheme(isDark);
  const initials = user?.name
    ? user.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)
    : "??";

  const xpInLevel  = (user?.xp || 0) % 100;
  const xpToNext   = 100 - xpInLevel;

  return (
    <nav style={{
      position:"fixed", left:0, top:0, bottom:0, width:220,
      background:t.surface, borderRight:`1px solid ${t.border}`,
      display:"flex", flexDirection:"column", padding:"24px 0", zIndex:100,
      transition:"background 0.3s, border-color 0.3s",
      boxShadow:`4px 0 24px rgba(0,0,0,0.3)`,
    }}>
      {/* Logo */}
      <div style={{ padding:"0 22px 24px", borderBottom:`1px solid ${t.border}`, marginBottom:12 }}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:13, fontWeight:700,
          color:t.accent, letterSpacing:"0.1em", textTransform:"uppercase" }}>
          EmoLearn
        </div>
        <div style={{ fontSize:10, color:t.muted, marginTop:3 }}>
          Adaptive · Aware · Alive
        </div>
      </div>

      {/* Nav links */}
      <div className="stagger" style={{ flex:1, display:"flex", flexDirection:"column",
        gap:3, padding:"0 10px", overflowY:"auto" }}>
        {tabs.map((tab) => {
          const active = page === tab.id;
          return (
            <button key={tab.id} onClick={() => setPage(tab.id)}
              className="fade-in"
              style={{
                display:"flex", alignItems:"center", gap:11,
                padding:"10px 13px", borderRadius:10,
                background: active ? t.accent+"18" : "transparent",
                border: active ? `1px solid ${t.accent}33` : "1px solid transparent",
                color: active ? t.accent : t.muted,
                fontSize:13, fontWeight: active ? 600 : 400,
                textAlign:"left", transition:"all 0.15s",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background=t.border+"44"; e.currentTarget.style.color=t.text; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=t.muted; }}}>
              <span style={{ fontSize:15, width:18, textAlign:"center" }}>{tab.icon}</span>
              {tab.label}
              {active && (
                <div style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%",
                  background:t.accent, boxShadow:`0 0 6px ${t.accent}` }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Theme toggle */}
      <div style={{ padding:"12px 14px 8px" }}>
        <button onClick={onToggleTheme} style={{
          width:"100%", display:"flex", alignItems:"center", gap:10,
          padding:"9px 13px", borderRadius:10,
          background:t.card, border:`1px solid ${t.border}`,
          color:t.muted, fontSize:12, transition:"all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=t.amber; e.currentTarget.style.color=t.amber; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor=t.border; e.currentTarget.style.color=t.muted; }}>
          <span style={{ fontSize:16 }}>{isDark ? "☀️" : "🌙"}</span>
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* User card with XP bar */}
      {user && (
        <div onClick={() => setPage("profile")}
          style={{ margin:"4px 10px 10px", padding:"12px 13px", borderRadius:12,
            background:t.card, border:`1px solid ${t.border}`,
            cursor:"pointer", transition:"all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8 }}>
            {/* Avatar */}
            <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0,
              background:`conic-gradient(${t.accent},${t.violet})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:800, color:"#080b14",
              fontFamily:"'Space Mono',monospace" }}>
              {initials}
            </div>
            <div style={{ overflow:"hidden", flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:t.text,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {user.name || "Learner"}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span className="level-badge">Lv.{user.level||1}</span>
                <span style={{ fontSize:10, color:t.muted }}>{user.xp||0} XP</span>
              </div>
            </div>
          </div>
          {/* XP progress bar */}
          <div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width:`${xpInLevel}%` }} />
            </div>
            <div style={{ fontSize:10, color:t.muted, marginTop:3, textAlign:"right" }}>
              {xpToNext} XP to next level
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div style={{ padding:"0 10px" }}>
        <button onClick={onLogout} className="btn-ghost"
          style={{ width:"100%", textAlign:"left", fontSize:12, padding:"9px 13px" }}>
          ⎋ &nbsp;Logout
        </button>
      </div>
    </nav>
  );
}