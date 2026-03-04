import { useState } from "react";
import { authAPI } from "../api/api";
import { getTheme } from "../theme";

// ─── Password criteria checker ────────────────────────────────────────────────
const CRITERIA = [
  { id:"len",   label:"At least 8 characters",          test: p => p.length >= 8           },
  { id:"upper", label:"One uppercase letter (A-Z)",     test: p => /[A-Z]/.test(p)         },
  { id:"lower", label:"One lowercase letter (a-z)",     test: p => /[a-z]/.test(p)         },
  { id:"num",   label:"One number (0-9)",                test: p => /[0-9]/.test(p)         },
  { id:"spec",  label:"One special character (!@#$…)",  test: p => /[^A-Za-z0-9]/.test(p)  },
];

function PasswordStrength({ password, t }) {
  if (!password) return null;
  const passed = CRITERIA.filter(c => c.test(password)).length;
  const strengthColor = passed <= 1 ? t.red : passed <= 3 ? t.amber : t.green;
  const strengthLabel = passed <= 1 ? "Weak" : passed <= 3 ? "Fair" : passed === 4 ? "Good" : "Strong";

  return (
    <div style={{ marginTop:10 }}>
      {/* Strength bar */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:6 }}>
        <div style={{ fontSize:11, color:t.muted }}>Password strength</div>
        <div style={{ fontSize:11, fontWeight:700, color:strengthColor }}>{strengthLabel}</div>
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:10 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex:1, height:4, borderRadius:99,
            background: i <= passed ? strengthColor : t.border,
            transition:"background 0.3s",
          }} />
        ))}
      </div>
      {/* Criteria checklist */}
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {CRITERIA.map(c => {
          const ok = c.test(password);
          return (
            <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8,
              fontSize:12, color: ok ? t.green : t.muted,
              transition:"color 0.2s" }}>
              <span style={{ fontSize:11, flexShrink:0 }}>{ok ? "✓" : "○"}</span>
              {c.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Email validator ──────────────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function AuthPage({ onAuth, isDark, onToggleTheme }) {
  const t = getTheme(isDark);

  const [mode, setMode]         = useState("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // Live validation states
  const emailTouched    = email.length > 0;
  const emailValid      = isValidEmail(email);
  const passwordTouched = password.length > 0;
  const passScore       = CRITERIA.filter(c => c.test(password)).length;
  const passValid       = passScore >= 5;   // all 5 criteria must pass for register
  const nameValid       = name.trim().length >= 2;

  const canSubmit = mode === "login"
    ? emailValid && password.length >= 1
    : emailValid && passValid && nameValid;

  function switchMode(m) {
    setMode(m); setError(""); setSuccess("");
    setName(""); setEmail(""); setPassword("");
  }

  async function submit() {
    // Extra guard
    if (!emailValid)            { setError("Please enter a valid email address."); return; }
    if (mode === "register") {
      if (!nameValid)           { setError("Please enter your full name (min 2 characters)."); return; }
      if (!passValid)           { setError("Password doesn't meet all the requirements."); return; }
    }

    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "login") {
        const data = await authAPI.login(email.trim(), password);
        if (data.detail || data.error) {
          setError(data.detail || "Incorrect email or password.");
        } else {
          onAuth(data.access_token, {
            name:   data.name,
            email:  data.email,
            xp:     data.xp    || 0,
            level:  data.level || 1,
            streak: data.streak|| 0,
          });
        }
      } else {
        const data = await authAPI.register(email.trim(), password, name.trim());
        if (data.detail || data.error) {
          setError(data.detail || "Registration failed. Try a different email.");
        } else {
          setSuccess("Account created! Signing you in…");
          // Auto login
          setTimeout(async () => {
            try {
              const loginData = await authAPI.login(email.trim(), password);
              if (loginData.access_token) {
                onAuth(loginData.access_token, {
                  name:   loginData.name,
                  email:  loginData.email,
                  xp:     loginData.xp    || 0,
                  level:  loginData.level || 1,
                  streak: loginData.streak|| 0,
                });
              }
            } catch {}
          }, 800);
        }
      }
    } catch {
      setError("Connection failed. Make sure your backend is running on port 8000.");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background: isDark
        ? "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,229,255,0.08), #080b14)"
        : "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(2,132,199,0.1), #f0f4ff)",
      transition:"background 0.3s",
    }}>

      {/* Theme toggle top-right */}
      <button onClick={onToggleTheme} style={{
        position:"fixed", top:18, right:18, background:t.card,
        border:`1px solid ${t.border}`, borderRadius:10, padding:"8px 14px",
        fontSize:13, color:t.muted, cursor:"pointer", transition:"all 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=t.amber; e.currentTarget.style.color=t.amber; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=t.border; e.currentTarget.style.color=t.muted; }}>
        {isDark ? "☀️ Light" : "🌙 Dark"}
      </button>

      <div className="fade-in" style={{ width:"100%", maxWidth:440, padding:"0 24px" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div className="float" style={{
            width:68, height:68, borderRadius:"50%",
            background:"conic-gradient(var(--accent), var(--violet), var(--pink), var(--accent))",
            margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:30, boxShadow:"0 0 48px rgba(0,229,255,0.3)",
          }}>🧠</div>
          <h1 style={{ fontFamily:"'Space Mono',monospace", fontSize:20,
            letterSpacing:"0.12em", color:t.text }}>EMOLEARN</h1>
          <p style={{ color:t.muted, fontSize:13, marginTop:6 }}>
            Emotion-Aware Adaptive Learning
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{
          boxShadow:`0 24px 64px ${isDark?"rgba(0,0,0,0.6)":"rgba(0,0,0,0.12)"}`,
          borderColor: t.border,
        }}>

          {/* Mode tabs */}
          <div style={{ display:"flex", background:t.surface, borderRadius:10,
            padding:4, marginBottom:24, gap:4 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex:1, padding:"9px 0", borderRadius:8,
                background: mode===m ? t.card : "transparent",
                color: mode===m ? t.accent : t.muted,
                fontSize:13, fontWeight: mode===m ? 700 : 400,
                border: mode===m ? `1px solid ${t.border}` : "1px solid transparent",
                textTransform:"capitalize", transition:"all 0.2s",
              }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Name field — register only */}
            {mode === "register" && (
              <div className="fade-in">
                <label style={{ fontSize:12, color:t.muted, display:"block", marginBottom:6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  style={{
                    borderColor: name.length > 0
                      ? nameValid ? t.green : t.red
                      : t.border,
                  }}
                />
                {name.length > 0 && !nameValid && (
                  <div style={{ fontSize:11, color:t.red, marginTop:5 }}>
                    ✕ Name must be at least 2 characters
                  </div>
                )}
              </div>
            )}

            {/* Email field */}
            <div>
              <label style={{ fontSize:12, color:t.muted, display:"block", marginBottom:6 }}>
                Email Address
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={e => e.key === "Enter" && submit()}
                style={{
                  borderColor: emailTouched
                    ? emailValid ? t.green : t.red
                    : t.border,
                }}
              />
              {emailTouched && !emailValid && (
                <div style={{ fontSize:11, color:t.red, marginTop:5 }}>
                  ✕ Enter a valid email address (e.g. you@example.com)
                </div>
              )}
              {emailTouched && emailValid && (
                <div style={{ fontSize:11, color:t.green, marginTop:5 }}>
                  ✓ Valid email
                </div>
              )}
            </div>

            {/* Password field */}
            <div>
              <label style={{ fontSize:12, color:t.muted, display:"block", marginBottom:6 }}>
                Password
              </label>
              <div style={{ position:"relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === "Enter" && submit()}
                  style={{
                    paddingRight:44,
                    borderColor: passwordTouched
                      ? mode === "register"
                        ? passValid ? t.green : t.red
                        : password.length >= 1 ? t.green : t.border
                      : t.border,
                  }}
                />
                {/* Show/hide toggle */}
                <button onClick={() => setShowPass(s => !s)} style={{
                  position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer",
                  fontSize:16, color:t.muted, padding:0, lineHeight:1,
                }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>

              {/* Password criteria — register only */}
              {mode === "register" && passwordTouched && (
                <PasswordStrength password={password} t={t} />
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="fade-in" style={{
                background:t.red+"15", border:`1px solid ${t.red}40`,
                borderRadius:8, padding:"10px 14px", fontSize:13, color:t.red,
              }}>
                ✕ {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="fade-in" style={{
                background:t.green+"15", border:`1px solid ${t.green}40`,
                borderRadius:8, padding:"10px 14px", fontSize:13, color:t.green,
              }}>
                ✓ {success}
              </div>
            )}

            {/* Submit */}
            <button className="btn-primary" onClick={submit}
              disabled={loading || !canSubmit}
              style={{ width:"100%", marginTop:4, fontSize:15, padding:"13px 0" }}>
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign In →"
                  : "Create Account →"}
            </button>

            {/* Switch mode hint */}
            <div style={{ textAlign:"center", fontSize:12, color:t.muted }}>
              {mode === "login" ? (
                <>Don't have an account?{" "}
                  <button onClick={() => switchMode("register")} style={{
                    background:"none", border:"none", color:t.accent,
                    fontSize:12, cursor:"pointer", fontWeight:600,
                  }}>Register free</button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button onClick={() => switchMode("login")} style={{
                    background:"none", border:"none", color:t.accent,
                    fontSize:12, cursor:"pointer", fontWeight:600,
                  }}>Sign in</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}