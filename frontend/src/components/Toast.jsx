import { useEffect } from "react";

export default function Toast({ msg, type = "success", onClose }) {
  const colors = {
    success: "var(--green)",
    error:   "var(--red)",
    info:    "var(--accent)",
  };

  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 999,
        background: "var(--card)",
        border: `1px solid ${colors[type]}55`,
        borderLeft: `4px solid ${colors[type]}`,
        borderRadius: 10,
        padding: "14px 20px",
        minWidth: 260, maxWidth: 360,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        animation: "fade-in 0.3s ease both",
        fontSize: 14,
        color: "var(--text)",
      }}
    >
      {msg}
    </div>
  );
}