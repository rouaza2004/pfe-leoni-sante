import { Download, Eye, FileText, Printer, Send } from "lucide-react";

function Badge({ children, className }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function ActionButton({ children, icon: Icon, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </button>
  );
}

function statusClass(status) {
  if (status === "SENT") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  if (status === "SCHEDULED") return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
  return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
}

export default function GeneratedReportCard({
  report,
  onPreview,
  onDownload,
  onSend,
  onPrint,
  actionLoading = false,
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-3">
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${report.iconWrap}`}
          >
            <FileText className={`h-5 w-5 ${report.iconColor}`} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight text-slate-950">
                {report.title}
              </h3>
              <span className="text-xs font-medium text-slate-400">
                ({report.code || report.id})
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className={report.categoryClass}>{report.category}</Badge>
              <Badge className={statusClass(report.status)}>
                {report.statusLabel || report.status}
              </Badge>
              <Badge className="bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                {report.format}
              </Badge>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">{report.description}</p>

            <div className="mt-4 grid gap-2 text-sm text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Généré le
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">{report.generatedAt}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Période
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">{report.period}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Par
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">{report.author}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Taille
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">{report.size}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:w-[180px] xl:grid-cols-1">
          <ActionButton icon={Eye} onClick={onPreview} disabled={actionLoading}>
            Voir
          </ActionButton>
          <ActionButton icon={Download} onClick={onDownload} disabled={actionLoading}>
            Télécharger
          </ActionButton>
          <ActionButton icon={Send} onClick={onSend} disabled={actionLoading}>
            Envoyer
          </ActionButton>
          <ActionButton icon={Printer} onClick={onPrint} disabled={actionLoading}>
            Imprimer
          </ActionButton>
        </div>
      </div>
    </article>
  );
}
