export default function StatCard({ label, value, sub, color, icon }) {
  return (
    <div
      className="card fade-in"
      style={{
        borderColor: `${color}33`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow blob */}
      <div
        style={{
          position: "absolute", top: 0, right: 0,
          width: 80, height: 80,
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        }}
      />

      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 11, color: `${color}99`, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}