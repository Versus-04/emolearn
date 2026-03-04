import { useState, useEffect } from "react";
import Nav          from "./components/Nav";
import Toast        from "./components/Toast";
import AuthPage     from "./pages/AuthPage";
import Dashboard    from "./pages/Dashboard";
import CoursesPage  from "./pages/CoursesPage";
import GeneratePage from "./pages/GeneratePage";
import SessionPage  from "./pages/SessionPage";
import MentorPage   from "./pages/MentorPage";
import BadgesPage   from "./pages/BadgesPage";
import ProfilePage  from "./pages/ProfilePage";
import { getTheme } from "./theme";

export default function App() {
  const [token, setToken] = useState(() => { try { return sessionStorage.getItem("emo_token")||""; } catch { return ""; }});
  const [user,  setUser]  = useState(() => { try { return JSON.parse(sessionStorage.getItem("emo_user")||"null"); } catch { return null; }});
  const [page,  setPage]  = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("emo_theme") !== "light"; } catch { return true; }
  });

  const t = getTheme(isDark);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    try { localStorage.setItem("emo_theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);

  function handleAuth(token, userData) {
    try {
      sessionStorage.setItem("emo_token", token);
      sessionStorage.setItem("emo_user", JSON.stringify(userData));
    } catch {}
    setToken(token); setUser(userData);
    setToast({ msg:`Welcome back, ${userData.name||"Learner"}! 🎉`, type:"success" });
  }

  function handleLogout() {
    try { sessionStorage.removeItem("emo_token"); sessionStorage.removeItem("emo_user"); } catch {}
    setToken(""); setUser(null); setPage("dashboard");
  }

  if (!token) return (
    <>
      <AuthPage onAuth={handleAuth} isDark={isDark} onToggleTheme={() => setIsDark(d=>!d)} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );

  return (
    <>
      <Nav page={page} setPage={setPage} onLogout={handleLogout}
        user={user} isDark={isDark} onToggleTheme={() => setIsDark(d=>!d)} />
      <main style={{
        marginLeft:220, padding:"40px 48px",
        minHeight:"100vh", background:t.bg, color:t.text,
        transition:"background 0.3s, color 0.3s",
      }}>
        {page==="dashboard" && <Dashboard    token={token} user={user} isDark={isDark} />}
        {page==="courses"   && <CoursesPage  token={token} isDark={isDark} />}
        {page==="generate"  && (
          <GeneratePage token={token} isDark={isDark} onGenerated={() => {
            setToast({ msg:"Course generated! 🎓", type:"success" });
            setTimeout(() => setPage("courses"), 1500);
          }} />
        )}
        {page==="session"   && <SessionPage  token={token} isDark={isDark} />}
        {page==="mentor"    && <MentorPage   token={token} isDark={isDark} />}
        {page==="badges"    && <BadgesPage   token={token} isDark={isDark} />}
        {page==="profile"   && <ProfilePage  token={token} user={user}  isDark={isDark} />}
      </main>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}