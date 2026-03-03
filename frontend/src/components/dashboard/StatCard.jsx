export default function StatCard({ title, value, icon, hint, danger }) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white p-5 shadow-sm transition",
        "hover:shadow-md",
        danger ? "border-red-200 bg-red-50/40" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <div className="mt-2 flex items-end gap-2">
            <h3 className={["text-3xl font-bold", danger ? "text-red-600" : "text-slate-900"].join(" ")}>
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
            danger ? "bg-red-100 border-red-200" : "bg-slate-100 border-slate-200",
          ].join(" ")}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}