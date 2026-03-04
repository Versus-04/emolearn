const API = "http://127.0.0.1:8000";

// ─── HELPER ───────────────────────────────────────────────────────────────────
// Safely fetch and return JSON. Never throws — always returns an object.
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { detail: text }; }
    if (!res.ok) {
      return { error: true, status: res.status, detail: data.detail || `Error ${res.status}` };
    }
    return data;
  } catch (err) {
    return { error: true, detail: "Cannot connect to backend. Make sure uvicorn is running on port 8000." };
  }
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function jsonHeaders() {
  return { "Content-Type": "application/json" };
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (email, password,name) =>
    safeFetch(`${API}/register`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password,name }),
    }),

  login: (email, password) =>
    safeFetch(`${API}/login`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password }),
    }),
  profile: (token) =>
  safeFetch(`${API}/profile`, {
    headers: authHeaders(token),
  }),  
  ping: () =>
    safeFetch(`${API}/`),
};

// ─── LEARNING / WELLNESS ──────────────────────────────────────────────────────

export const learningAPI = {
  submitLesson: (token, data) =>
    safeFetch(`${API}/submit_lesson`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  wellness: (token) =>
    safeFetch(`${API}/wellness_check`, {
      headers: authHeaders(token),
    }),

  recommend: (token) =>
    safeFetch(`${API}/recommend_next`, {
      headers: authHeaders(token),
    }),

  badges: (token) =>
    safeFetch(`${API}/badges`, {
      headers: authHeaders(token),
    }),

  mentorChat: (token, message) =>
    safeFetch(`${API}/mentor_chat`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ message }),
    }),
};

// ─── COURSES ──────────────────────────────────────────────────────────────────

export const courseAPI = {
  getCourses: () =>
    safeFetch(`${API}/courses`),

  getModules: (courseId) =>
    safeFetch(`${API}/modules/${courseId}`),

  getLessons: (moduleId) =>
    safeFetch(`${API}/lessons/${moduleId}`),

  getExercises: (lessonId) =>
    safeFetch(`${API}/exercises/${lessonId}`),

  generateCourse: (token, data) =>
    safeFetch(`${API}/generate_course`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
};