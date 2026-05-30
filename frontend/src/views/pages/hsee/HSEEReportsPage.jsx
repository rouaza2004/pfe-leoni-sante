import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  Clock3,
  FileBadge2,
  FileText,
  Loader2,
  ShieldAlert,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { getUsername } from "@/controllers/auth/auth";
import { toast } from "sonner";

import GeneratedReportCard from "@/views/components/hsee/reports/GeneratedReportCard";
import ReportParametersModal from "@/views/components/hsee/reports/ReportParametersModal";
import ReportTemplateCard from "@/views/components/hsee/reports/ReportTemplateCard";
import ReportsHeader from "@/views/components/hsee/reports/ReportsHeader";
import ReportsHero from "@/views/components/hsee/reports/ReportsHero";
import ReportsStats from "@/views/components/hsee/reports/ReportsStats";
import ReportTemplateSelectionModal from "@/views/components/hsee/reports/ReportTemplateSelectionModal";
import {
  downloadReport,
  generateReport,
  getGeneratedReports,
  getReportsDashboardStats,
  getReportTemplateDetails,
  getReportTemplates,
  previewGeneratedReport,
  previewReport,
  printReport,
  sendReport,
} from "@/models/services/hseeReportsService";

const TEMPLATE_VISUALS = {
  accidents: {
    icon: TriangleAlert,
    iconWrap: "bg-rose-50",
    iconColor: "text-rose-600",
    badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  },
  medical: {
    icon: Stethoscope,
    iconWrap: "bg-sky-50",
    iconColor: "text-sky-600",
    badgeClass: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  },
  stock: {
    icon: Boxes,
    iconWrap: "bg-emerald-50",
    iconColor: "text-emerald-600",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  },
  risks: {
    icon: ShieldAlert,
    iconWrap: "bg-violet-50",
    iconColor: "text-violet-600",
    badgeClass: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  },
  kpis: {
    icon: BarChart3,
    iconWrap: "bg-indigo-50",
    iconColor: "text-indigo-600",
    badgeClass: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
  },
  committee: {
    icon: FileBadge2,
    iconWrap: "bg-amber-50",
    iconColor: "text-amber-600",
    badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  },
};

const DEFAULT_VISUAL = {
  icon: FileText,
  iconWrap: "bg-slate-100",
  iconColor: "text-slate-600",
  badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

function formatToday() {
  const now = new Date();
  return now.toLocaleDateString("fr-FR");
}

function openBlobUrl(url) {
  const next = window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return next;
}

function mapTemplateToUi(template) {
  const visual = TEMPLATE_VISUALS[template.icon_key] || DEFAULT_VISUAL;
  return {
    id: template.id,
    title: template.name,
    description: template.description,
    category: template.category,
    icon: visual.icon,
    iconWrap: visual.iconWrap,
    iconColor: visual.iconColor,
    badgeClass: visual.badgeClass,
    modalTags: (template.sections_available || []).slice(0, 3).map((item) => item.label),
    formatsSupported: template.formats_supported || [],
    periods: template.periods || [],
    detailLevels: template.detail_levels || [],
    departments: template.departments || [],
    sectionsAvailable: template.sections_available || [],
    active: template.active !== false,
    iconKey: template.icon_key,
  };
}

function mapReportToUi(report) {
  const visual = TEMPLATE_VISUALS[
    report.template_key === "medical-stock"
      ? "stock"
      : report.template_key === "medical-visits"
      ? "medical"
      : report.template_key === "risk-mapping"
      ? "risks"
      : report.template_key === "hsee-kpis"
      ? "kpis"
      : report.template_key === "comite-hse"
      ? "committee"
      : "accidents"
  ] || DEFAULT_VISUAL;

  return {
    id: report.id,
    code: report.code,
    title: report.title,
    category: report.category,
    categoryClass: visual.badgeClass,
    status: report.status,
    statusLabel: report.status_label,
    format: report.format,
    description: report.description,
    generatedAt: report.generated_at_display,
    period: report.period_label || "-",
    author: report.created_by_name || "-",
    size: report.file_size || "-",
    iconWrap: visual.iconWrap,
    iconColor: visual.iconColor,
  };
}

function buildStats(stats) {
  return [
    {
      title: "Rapports Générés",
      value: String(stats.total_generated ?? 0),
      subtitle: "Documents publiés et partagés",
      icon: FileText,
      tone: {
        card: "border-sky-200 bg-sky-50/80",
        icon: "bg-white text-sky-600 ring-1 ring-sky-100",
      },
    },
    {
      title: "Planifiés",
      value: String(stats.total_scheduled ?? 0),
      subtitle: "Rapports en attente de génération",
      icon: Clock3,
      tone: {
        card: "border-amber-200 bg-amber-50/80",
        icon: "bg-white text-amber-600 ring-1 ring-amber-100",
      },
    },
    {
      title: "Ce Mois",
      value: String(stats.total_this_month ?? 0),
      subtitle: "Rapports créés sur la période courante",
      icon: Activity,
      tone: {
        card: "border-emerald-200 bg-emerald-50/80",
        icon: "bg-white text-emerald-600 ring-1 ring-emerald-100",
      },
    },
    {
      title: "Modèles Disponibles",
      value: String(stats.total_templates ?? 0),
      subtitle: "Bibliothèque prête à l’emploi",
      icon: FileBadge2,
      tone: {
        card: "border-violet-200 bg-violet-50/80",
        icon: "bg-white text-violet-600 ring-1 ring-violet-100",
      },
    },
  ];
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message}</span>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 3, rowsClass = "md:grid-cols-2 xl:grid-cols-3" }) {
  return (
    <div className={`grid gap-5 ${rowsClass}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-[26px] border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function HSEEReportsPage() {
  const username = getUsername() || "Utilisateur";
  const [searchValue, setSearchValue] = useState("");

  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isParametersModalOpen, setIsParametersModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState(null);
  const [templateDetailsLoading, setTemplateDetailsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportActionLoading, setReportActionLoading] = useState({});
  const [reportParameters, setReportParameters] = useState({
    period: "",
    format: "PDF",
    department: "",
    detailLevel: "",
    sections: [],
    generatedDate: formatToday(),
    generatedBy: username,
    sendEmail: true,
  });

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError("");
      const data = await getReportsDashboardStats();
      setStats(data);
    } catch (error) {
      console.error(error);
      setStatsError("Impossible de charger les statistiques des rapports.");
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError("");
      const data = await getReportTemplates();
      const mapped = data.filter((item) => item.active !== false).map(mapTemplateToUi);
      setTemplates(mapped);
      if (!selectedTemplateId && mapped[0]) {
        setSelectedTemplateId(mapped[0].id);
      }
    } catch (error) {
      console.error(error);
      setTemplatesError("Impossible de charger les modèles de rapports.");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      setReportsError("");
      const data = await getGeneratedReports();
      setReports(data.map(mapReportToUi));
    } catch (error) {
      console.error(error);
      setReportsError("Impossible de charger les rapports générés.");
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadTemplates();
    loadReports();
  }, []);

  const filteredTemplates = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((template) =>
      [template.title, template.description, template.category].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [templates, searchValue]);

  const filteredReports = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) =>
      [
        report.title,
        report.code,
        report.category,
        report.author,
        report.period,
        report.format,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [reports, searchValue]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [selectedTemplateId, templates]
  );

  const statsItems = useMemo(() => buildStats(stats), [stats]);

  const handleOpenNewReport = (template) => {
    setSelectedTemplateId(template?.id || templates[0]?.id || "");
    setIsTemplateModalOpen(true);
  };

  const hydrateParametersFromTemplate = (detail) => {
    setSelectedTemplateDetails(detail);
    setReportParameters({
      period: detail.periods?.[0]?.value || "",
      format: detail.formatsSupported?.[0] || "PDF",
      department: detail.departments?.[0]?.value ?? "",
      detailLevel: detail.detailLevels?.[1]?.value || detail.detailLevels?.[0]?.value || "",
      sections: detail.sectionsAvailable?.slice(0, 3).map((item) => item.value) || [],
      generatedDate: formatToday(),
      generatedBy: username,
      sendEmail: true,
    });
  };

  const handleContinueToParameters = async () => {
    if (!selectedTemplateId) return;
    try {
      setTemplateDetailsLoading(true);
      const detail = await getReportTemplateDetails(selectedTemplateId);
      hydrateParametersFromTemplate(mapTemplateToUi(detail));
      setIsTemplateModalOpen(false);
      setIsParametersModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les paramètres du modèle.");
    } finally {
      setTemplateDetailsLoading(false);
    }
  };

  const handleParameterChange = (field, value) => {
    setReportParameters((current) => ({ ...current, [field]: value }));
  };

  const handleToggleSection = (sectionValue) => {
    setReportParameters((current) => {
      const exists = current.sections.includes(sectionValue);
      return {
        ...current,
        sections: exists
          ? current.sections.filter((item) => item !== sectionValue)
          : [...current.sections, sectionValue],
      };
    });
  };

  const buildGeneratePayload = () => ({
    template_id: selectedTemplateId,
    period: reportParameters.period,
    format: reportParameters.format,
    department: reportParameters.department,
    detail_level: reportParameters.detailLevel,
    sections: reportParameters.sections,
    generated_by: reportParameters.generatedBy,
    send_email_after_generation: reportParameters.sendEmail,
  });

  const handlePreviewReport = async () => {
    try {
      const url = await previewReport(buildGeneratePayload());
      openBlobUrl(url);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de prévisualiser le rapport.");
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      await generateReport(buildGeneratePayload());
      setIsParametersModalOpen(false);
      await Promise.all([loadReports(), loadStats()]);
      toast.success("Rapport généré avec succès.");
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.detail || "Impossible de générer le rapport.";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const withReportAction = async (reportId, action) => {
    try {
      setReportActionLoading((current) => ({ ...current, [reportId]: true }));
      await action();
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.detail || "Action indisponible pour ce rapport.";
      toast.error(message);
    } finally {
      setReportActionLoading((current) => ({ ...current, [reportId]: false }));
    }
  };

  const handlePreviewGenerated = (report) =>
    withReportAction(report.id, async () => {
      const url = await previewGeneratedReport(report.id);
      openBlobUrl(url);
    });

  const handleDownloadGenerated = (report) =>
    withReportAction(report.id, async () => {
      await downloadReport(
        report.id,
        `${report.code || report.id}.${report.format === "EXCEL" ? "xlsx" : "pdf"}`
      );
    });

  const handleSendGenerated = (report) =>
    withReportAction(report.id, async () => {
      await sendReport(report.id);
      await Promise.all([loadReports(), loadStats()]);
      toast.success("Rapport envoyé avec succès.");
    });

  const handlePrintGenerated = (report) =>
    withReportAction(report.id, async () => {
      await printReport(report.id);
    });

  return (
    <>
      <div className="space-y-6 bg-slate-50">
        <ReportsHeader
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          notificationCount={3}
        />

        <ReportsHero onNewReport={handleOpenNewReport} />

        {statsError ? (
          <ErrorBlock message={statsError} onRetry={loadStats} />
        ) : statsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-[26px] border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <ReportsStats items={statsItems} />
        )}

        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Modèles de Rapports Disponibles
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sélectionnez un modèle prêt à l’emploi pour générer rapidement un rapport HSEE.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {templatesError ? (
              <ErrorBlock message={templatesError} onRetry={loadTemplates} />
            ) : templatesLoading ? (
              <SkeletonGrid count={6} />
            ) : filteredTemplates.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                Aucun modèle ne correspond à votre recherche.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <ReportTemplateCard
                    key={template.id}
                    template={template}
                    onGenerate={handleOpenNewReport}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Rapports Générés
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Consultez les rapports déjà produits, puis visualisez, téléchargez ou partagez-les.
            </p>
          </div>

          <div className="mt-6">
            {reportsError ? (
              <ErrorBlock message={reportsError} onRetry={loadReports} />
            ) : reportsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-48 animate-pulse rounded-[28px] border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                Aucun rapport généré ne correspond à votre recherche.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <GeneratedReportCard
                    key={report.id}
                    report={report}
                    actionLoading={Boolean(reportActionLoading[report.id])}
                    onPreview={() => handlePreviewGenerated(report)}
                    onDownload={() => handleDownloadGenerated(report)}
                    onSend={() => handleSendGenerated(report)}
                    onPrint={() => handlePrintGenerated(report)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <ReportTemplateSelectionModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
        onContinue={handleContinueToParameters}
        loading={templatesLoading}
      />

      <ReportParametersModal
        open={isParametersModalOpen}
        onOpenChange={setIsParametersModalOpen}
        values={reportParameters}
        sections={selectedTemplateDetails?.sectionsAvailable || []}
        periodOptions={selectedTemplateDetails?.periods || []}
        formatOptions={(selectedTemplateDetails?.formatsSupported || []).map((item) => ({
          value: item,
          label: item === "EXCEL" ? "Excel" : item,
        }))}
        departmentOptions={selectedTemplateDetails?.departments || []}
        detailLevelOptions={selectedTemplateDetails?.detailLevels || []}
        onFieldChange={handleParameterChange}
        onToggleSection={handleToggleSection}
        onPreview={handlePreviewReport}
        onGenerate={handleGenerateReport}
        selectedTemplateTitle={selectedTemplate?.title || "le modèle sélectionné"}
        loading={templateDetailsLoading}
        submitting={generating}
      />
    </>
  );
}

