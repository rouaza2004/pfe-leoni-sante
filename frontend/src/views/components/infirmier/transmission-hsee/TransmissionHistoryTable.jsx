import { Check, Download, Eye, FileText, X } from "lucide-react";

import TransmissionStatusBadge from "./TransmissionStatusBadge";

function ActionButton({ children, icon: Icon, onClick, tone = "default" }) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

export default function TransmissionHistoryTable({
  rows,
  onPreview,
  onDownload,
  onValidate,
  onReject,
  onLoadDraft,
}) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full border-separate border-spacing-y-2 text-[11px]">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-1.5 py-1 font-medium">Référence</th>
              <th className="px-1.5 py-1 font-medium">Date</th>
              <th className="px-1.5 py-1 font-medium">Site</th>
              <th className="px-1.5 py-1 font-medium">Responsable</th>
              <th className="px-1.5 py-1 font-medium">Statut</th>
              <th className="px-1.5 py-1 font-medium">Priorité</th>
              <th className="px-1.5 py-1 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <td className="rounded-l-2xl px-1.5 py-1.5 font-medium text-slate-900">
                  {row.reference}
                </td>
                <td className="px-1.5 py-1.5 text-slate-700">{row.dateAccident}</td>
                <td className="px-1.5 py-1.5 text-slate-700">{row.site}</td>
                <td className="px-1.5 py-1.5 text-slate-700">{row.responsable}</td>
                <td className="px-1.5 py-1.5">
                  <TransmissionStatusBadge status={row.status} />
                </td>
                <td className="px-1.5 py-1.5">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                    {row.urgent ? `${row.priority} · Urgent` : row.priority}
                  </span>
                </td>
                <td className="rounded-r-2xl px-1.5 py-1.5">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton icon={Eye} onClick={() => onPreview(row)}>
                      Voir
                    </ActionButton>
                    <ActionButton icon={Download} onClick={() => onDownload(row)}>
                      PDF
                    </ActionButton>
                    <ActionButton icon={FileText} onClick={() => onLoadDraft(row)}>
                      Charger
                    </ActionButton>
                    {row.status === "En attente" ? (
                      <>
                        <ActionButton icon={Check} tone="success" onClick={() => onValidate(row.id)}>
                          Valider
                        </ActionButton>
                        <ActionButton icon={X} tone="danger" onClick={() => onReject(row.id)}>
                          Rejeter
                        </ActionButton>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 lg:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{row.reference}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {row.site} · {row.responsable}
                </p>
              </div>
              <TransmissionStatusBadge status={row.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-2.5 py-1.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Date</p>
                <p className="mt-0.5 font-medium text-slate-800">{row.dateAccident}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-2.5 py-1.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Priorité</p>
                <p className="mt-0.5 font-medium text-slate-800">
                  {row.urgent ? `${row.priority} · Urgent` : row.priority}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton icon={Eye} onClick={() => onPreview(row)}>
                Voir
              </ActionButton>
              <ActionButton icon={Download} onClick={() => onDownload(row)}>
                PDF
              </ActionButton>
              <ActionButton icon={FileText} onClick={() => onLoadDraft(row)}>
                Charger
              </ActionButton>
              {row.status === "En attente" ? (
                <>
                  <ActionButton icon={Check} tone="success" onClick={() => onValidate(row.id)}>
                    Valider
                  </ActionButton>
                  <ActionButton icon={X} tone="danger" onClick={() => onReject(row.id)}>
                    Rejeter
                  </ActionButton>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

