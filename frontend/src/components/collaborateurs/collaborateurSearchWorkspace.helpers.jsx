export function InfoCard({ title, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2.5 text-sm text-slate-600">{children}</div>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/40 p-6 text-sm text-slate-600 shadow-sm shadow-slate-200/40">
      {text}
    </div>
  );
}

export const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
};

export const getInitials = (prenom, nom) =>
  `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase() || "--";
