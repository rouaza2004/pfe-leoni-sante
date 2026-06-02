export default function StatCard({ title, value, icon, hint, danger, tone = "neutral" }) {
  const toneStyles = {
    neutral: {
      card: "border-slate-200",
      icon: "bg-slate-100 border-slate-200 text-slate-700",
      value: "text-slate-900",
    },
    info: {
      card: "border-sky-200 bg-sky-50/40",
      icon: "bg-sky-100 border-sky-200 text-sky-700",
      value: "text-slate-900",
    },
    success: {
      card: "border-emerald-200 bg-emerald-50/40",
      icon: "bg-emerald-100 border-emerald-200 text-emerald-700",
      value: "text-slate-900",
    },
    warning: {
      card: "border-red-200 bg-red-50/40",
      icon: "bg-red-100 border-red-200 text-red-700",
      value: "text-red-600",
    },
  };

  const toneStyle = danger ? toneStyles.warning : toneStyles[tone] || toneStyles.neutral;

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-5 shadow-sm transition",
        "hover:shadow-md",
        toneStyle.card,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <div className="mt-2 flex items-end gap-2">
            <h3 className={["text-3xl font-bold", toneStyle.value].join(" ")}>
              {value}
            </h3>
          </div>

          {hint ? (
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          ) : null}
        </div>

        <div
          className={[
            "h-11 w-11 rounded-2xl flex items-center justify-center border",
            toneStyle.icon,
          ].join(" ")}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

