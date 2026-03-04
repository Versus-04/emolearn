export default function MetricBar({ value, color = "#00e5ff" }) {
  const pct = Math.round(value * 100);
  return (
    <div className="metric-bar-bg">
      <div
        className="metric-bar-fill"
        style={{
          "--target-width": `${pct}%`,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
        }}
      />
    </div>
  );
}