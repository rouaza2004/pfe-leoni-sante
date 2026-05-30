const STATUS_STYLES = {
  "En attente": "border-amber-200 bg-amber-50 text-amber-700",
  "Validée": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Rejetée": "border-rose-200 bg-rose-50 text-rose-700",
  Brouillon: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function TransmissionStatusBadge({ status }) {
  const tone = STATUS_STYLES[status] || STATUS_STYLES.Brouillon;

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}
    >
      {status}
    </span>
  );
}

