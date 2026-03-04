export default function Loader({ text = "Loading…" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 13 }}>
      <div
        style={{
          width: 18, height: 18,
          borderRadius: "50%",
          border: "2px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin-slow 0.8s linear infinite",
        }}
      />
      {text}
    </div>
  );
}