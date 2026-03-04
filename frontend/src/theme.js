// Returns theme values based on current mode
export function getTheme(isDark = true) {
  return isDark ? {
    bg:"#080b14", surface:"#0d1221", card:"#111827", border:"#1e2d4a",
    accent:"#00e5ff", accentSoft:"#00bcd4", violet:"#7c3aed", pink:"#ec4899",
    green:"#22c55e", amber:"#f59e0b", red:"#ef4444", text:"#e2e8f0", muted:"#64748b",
  } : {
    bg:"#f0f4ff", surface:"#e8eef8", card:"#ffffff", border:"#cbd5e1",
    accent:"#0284c7", accentSoft:"#0369a1", violet:"#7c3aed", pink:"#db2777",
    green:"#16a34a", amber:"#d97706", red:"#dc2626", text:"#0f172a", muted:"#64748b",
  };
}

// Default dark theme (used as fallback)
export const theme = getTheme(true);

export const emotionColors = {
  Happy:"#22c55e", Focused:"#00e5ff", Neutral:"#94a3b8",
  Anxious:"#f59e0b", Stressed:"#ef4444", Confused:"#a78bfa",
  Tired:"#64748b", Excited:"#ec4899",
};