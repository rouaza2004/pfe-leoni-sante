const TONES = {
  critique: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
  eleve: "bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200",
  moyen: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200",
  faible: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  traitement: "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200",
  maitrise: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  planifie: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

export default function RiskBadge({ children, tone = "neutral" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TONES[tone] || TONES.neutral}`}
    >
      {children}
    </span>
  );
}
