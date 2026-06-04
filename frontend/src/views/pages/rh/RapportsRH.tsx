import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Download, FileSpreadsheet, Printer } from "lucide-react";

type Report = {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
};

type FeedbackType = "success" | "info";

type Feedback = {
  type: FeedbackType;
  message: string;
};

type ActionIconButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

const reports: Report[] = [
  {
    id: "report-1",
    title: "Rapport mensuel d'aptitude",
    period: "Mars 2025",
    generatedAt: "2025-04-01",
  },
  {
    id: "report-2",
    title: "Synthèse absences & retards",
    period: "Q1 2025",
    generatedAt: "2025-04-02",
  },
  {
    id: "report-3",
    title: "Bilan des visites médicales",
    period: "2024",
    generatedAt: "2025-01-15",
  },
  {
    id: "report-4",
    title: "Suivi intégration opérateurs",
    period: "Mars 2025",
    generatedAt: "2025-04-01",
  },
];

const feedbackStyles: Record<FeedbackType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

function ActionIconButton({ label, icon: Icon, onClick }: ActionIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm shadow-slate-200/40 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
    >
      <Icon size={18} />
    </button>
  );
}

export default function RapportsRH() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!feedback) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  function handleGenerateReport() {
    setFeedback({
      type: "info",
      message: "Génération de rapport simulée. Le raccordement backend pourra être ajouté ensuite.",
    });
  }

  function handleDownload(report: Report) {
    console.info("Téléchargement du rapport", report);
    setFeedback({
      type: "success",
      message: `${report.title} prêt au téléchargement.`,
    });
  }

  function handlePrint(report: Report) {
    console.info("Impression du rapport", report);
    window.print();
  }

  return (
    <div className="space-y-6 pb-16">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
              Rapports RH
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Génération et consultation des rapports administratifs
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateReport}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
          >
            <FileSpreadsheet size={18} />
            Générer un rapport
          </button>
        </div>
      </section>

      {feedback ? (
        <div
          className={[
            "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm",
            feedbackStyles[feedback.type] || feedbackStyles.info,
          ].join(" ")}
        >
          <CheckCircle2 size={18} />
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  {report.title}
                </h2>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <p>
                    <span className="font-medium text-slate-700">Période:</span> {report.period}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Généré le:</span>{" "}
                    {report.generatedAt}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
                <ActionIconButton
                  label={`Télécharger ${report.title}`}
                  icon={Download}
                  onClick={() => handleDownload(report)}
                />
                <ActionIconButton
                  label={`Imprimer ${report.title}`}
                  icon={Printer}
                  onClick={() => handlePrint(report)}
                />
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

