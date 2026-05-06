import { FileText, ShieldAlert, ShieldCheck } from "lucide-react";

const auditEntries = [
  {
    id: "audit-1",
    action: "Création utilisateur",
    actor: "Admin Principal",
    date: "2026-04-13 08:45",
    status: "Succès",
  },
  {
    id: "audit-2",
    action: "Mise à jour des permissions",
    actor: "Admin Principal",
    date: "2026-04-12 16:20",
    status: "Succès",
  },
  {
    id: "audit-3",
    action: "Modification de configuration",
    actor: "Admin Système",
    date: "2026-04-12 11:05",
    status: "Surveillance",
  },
];

const statusStyles = {
  Succès: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Surveillance: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function AdminAudit() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
          Journaux d&apos;Audit
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Historique administratif des actions sensibles et changements système.
        </p>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Traçabilité centralisée</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Vue dédiée à l&apos;administration pour consulter les actions récentes sans dépendre
              d&apos;un module partagé incomplet.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Activité récente</h2>
            <p className="mt-1 text-sm text-slate-500">
              Dernières opérations administratives enregistrées.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-500 sm:flex">
            <FileText size={16} />
            Journal local
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {auditEntries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{entry.action}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {entry.actor} · {entry.date}
                  </p>
                </div>
              </div>

              <span
                className={[
                  "inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1",
                  statusStyles[entry.status] || "bg-slate-100 text-slate-600 ring-slate-200",
                ].join(" ")}
              >
                {entry.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
