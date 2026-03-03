export default function StatusBadge({ status, className = "" }) {
  const getStyle = () => {
    const s = status?.toLowerCase();
    if (s === "critique" || s === "critical")
      return { background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" };
    if (s === "attention" || s === "warning")
      return { background: "#fef9c3", color: "#ca8a04", borderColor: "#fde047" };
    if (s === "ok" || s === "normal")
      return { background: "#dcfce7", color: "#16a34a", borderColor: "#86efac" };
    return { background: "#f3f4f6", color: "#374151", borderColor: "#d1d5db" };
  };

  return (
    <span
      className={className}
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        border: "1px solid",
        display: "inline-block",
        fontWeight: 500,
        ...getStyle(),
      }}
    >
      {status}
    </span>
  );
}