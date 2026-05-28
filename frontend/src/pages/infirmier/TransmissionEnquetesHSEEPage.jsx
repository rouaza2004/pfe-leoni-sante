import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileUp,
  Save,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

import HSEEPageHeader from "@/components/hsee/HSEEPageHeader";
import TransmissionEmptyState from "@/components/infirmier/transmission-hsee/TransmissionEmptyState";
import TransmissionFilters from "@/components/infirmier/transmission-hsee/TransmissionFilters";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/infirmier/transmission-hsee/TransmissionFormField";
import TransmissionHistoryTable from "@/components/infirmier/transmission-hsee/TransmissionHistoryTable";
import TransmissionStatCard from "@/components/infirmier/transmission-hsee/TransmissionStatCard";
import { LEONI_SITES } from "@/utils/siteOptions";

const SITES = LEONI_SITES;
const TYPE_OPTIONS = [
  "Accident de travail",
  "Presqu'accident",
  "Incident sécurité",
  "Maladie professionnelle",
];
const GRAVITY_OPTIONS = ["Faible", "Modérée", "Élevée", "Critique"];
const PRIORITY_OPTIONS = ["Basse", "Normale", "Haute", "Critique"];
const STATUS_OPTIONS = ["all", "Brouillon", "En attente", "Validée", "Rejetée"];

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialForm() {
  return {
    id: null,
    reference: "",
    type: TYPE_OPTIONS[0],
    dateAccident: formatToday(),
    site: SITES[0],
    responsable: "",
    gravity: GRAVITY_OPTIONS[1],
    commentaire: "",
    priority: PRIORITY_OPTIONS[1],
    urgent: false,
    document: null,
  };
}

function buildPdf(form, status) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 18;

  const line = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 16, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "-"), 66, y);
    y += 7;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Transmission des enquêtes vers HSEE", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(11);
  line("Numéro enquête :", form.reference);
  line("Type d'enquête :", form.type);
  line("Date d'accident :", form.dateAccident);
  line("Site :", form.site);
  line("Responsable :", form.responsable);
  line("Niveau de gravité :", form.gravity);
  line("Priorité :", form.priority);
  line("Statut :", status);
  line("Urgent :", form.urgent ? "Oui" : "Non");
  line("Document lié :", form.document?.name || "Aucun fichier");

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Commentaire de transmission", 16, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const text = doc.splitTextToSize(form.commentaire || "-", 178);
  doc.text(text, 16, y);

  return doc;
}

function buildRowFromForm(form, status = "Brouillon") {
  const now = new Date();
  return {
    id: form.id || `tx-${now.getTime()}`,
    reference: form.reference,
    type: form.type,
    dateAccident: form.dateAccident,
    site: form.site,
    responsable: form.responsable,
    gravity: form.gravity,
    commentaire: form.commentaire,
    priority: form.priority,
    urgent: form.urgent,
    document: form.document,
    status,
    createdAt: now.toISOString(),
  };
}

function validateForm(form) {
  const next = {};
  if (!form.reference.trim()) next.reference = "Champ obligatoire.";
  if (!form.dateAccident) next.dateAccident = "Champ obligatoire.";
  if (!form.site) next.site = "Champ obligatoire.";
  if (!form.responsable.trim()) next.responsable = "Champ obligatoire.";
  if (!form.commentaire.trim()) next.commentaire = "Champ obligatoire.";
  return next;
}

export default function TransmissionEnquetesHSEEPage() {
  const [form, setForm] = useState(buildInitialForm);
  const [errors, setErrors] = useState({});
  const [transmissions, setTransmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const stats = useMemo(() => {
    const countByStatus = (status) =>
      transmissions.filter((item) => item.status === status).length;

    return {
      total: transmissions.length,
      pending: countByStatus("En attente"),
      validated: countByStatus("Validée"),
      rejected: countByStatus("Rejetée"),
    };
  }, [transmissions]);

  const filteredTransmissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transmissions.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (siteFilter !== "all" && item.site !== siteFilter) return false;
      if (dateFilter && item.dateAccident !== dateFilter) return false;
      if (!query) return true;

      return [item.reference, item.type, item.site, item.responsable]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [dateFilter, search, siteFilter, statusFilter, transmissions]);

  const statCards = [
    {
      title: "Enquêtes transmises",
      value: stats.total,
      hint: "Total des dossiers créés ou envoyés.",
      icon: FileCheck2,
      tone: { card: "border-sky-200 bg-sky-50/80", icon: "bg-white text-sky-600" },
    },
    {
      title: "En attente",
      value: stats.pending,
      hint: "En attente de validation HSEE.",
      icon: Clock3,
      tone: { card: "border-amber-200 bg-amber-50/80", icon: "bg-white text-amber-600" },
    },
    {
      title: "Validées",
      value: stats.validated,
      hint: "Transmissions validées.",
      icon: CheckCircle2,
      tone: { card: "border-emerald-200 bg-emerald-50/80", icon: "bg-white text-emerald-600" },
    },
    {
      title: "Rejetées",
      value: stats.rejected,
      hint: "Dossiers à reprendre.",
      icon: XCircle,
      tone: { card: "border-rose-200 bg-rose-50/80", icon: "bg-white text-rose-600" },
    },
  ];

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const upsertTransmission = (status) => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;

    const nextRow = buildRowFromForm(form, status);
    setTransmissions((current) => {
      const exists = current.some((item) => item.id === nextRow.id);
      if (!exists) return [nextRow, ...current];
      return current.map((item) => (item.id === nextRow.id ? nextRow : item));
    });
    setForm((current) => ({ ...current, id: nextRow.id }));
    return nextRow;
  };

  const handlePreview = () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const doc = buildPdf(form, "Prévisualisation");
    window.open(doc.output("bloburl"), "_blank", "noopener,noreferrer");
  };

  const handleGeneratePdf = () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    buildPdf(form, "Brouillon").save(`${form.reference || "transmission-hsee"}.pdf`);
    toast.success("PDF généré avec succès.");
  };

  const handleSave = () => {
    const row = upsertTransmission("Brouillon");
    if (!row) return;
    toast.success("Transmission enregistrée en brouillon.");
  };

  const handleTransmit = () => {
    const row = upsertTransmission("En attente");
    if (!row) return;
    toast.success("Enquête transmise vers HSEE.");
  };

  const handleLoadDraft = (row) => {
    setForm({
      id: row.id,
      reference: row.reference,
      type: row.type,
      dateAccident: row.dateAccident,
      site: row.site,
      responsable: row.responsable,
      gravity: row.gravity,
      commentaire: row.commentaire,
      priority: row.priority,
      urgent: row.urgent,
      document: row.document || null,
    });
    setErrors({});
    toast.success("Transmission chargée dans le formulaire.");
  };

  const updateStatus = (id, status) => {
    setTransmissions((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handlePreviewRow = (row) => {
    const doc = buildPdf(
      {
        id: row.id,
        reference: row.reference,
        type: row.type,
        dateAccident: row.dateAccident,
        site: row.site,
        responsable: row.responsable,
        gravity: row.gravity,
        commentaire: row.commentaire,
        priority: row.priority,
        urgent: row.urgent,
        document: row.document,
      },
      row.status
    );
    window.open(doc.output("bloburl"), "_blank", "noopener,noreferrer");
  };

  const handleDownloadRow = (row) => {
    const doc = buildPdf(
      {
        id: row.id,
        reference: row.reference,
        type: row.type,
        dateAccident: row.dateAccident,
        site: row.site,
        responsable: row.responsable,
        gravity: row.gravity,
        commentaire: row.commentaire,
        priority: row.priority,
        urgent: row.urgent,
        document: row.document,
      },
      row.status
    );
    doc.save(`${row.reference || "transmission-hsee"}.pdf`);
  };

  return (
    <div className="space-y-2">
      <HSEEPageHeader
        eyebrow="Espace infirmier"
        title="Transmission des enquêtes HSEE"
        subtitle="Gestion et suivi des enquêtes transmises au département HSEE"
        leading={
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ShieldAlert className="h-4 w-4" />
          </div>
        }
      />

      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <TransmissionStatCard key={item.title} {...item} />
        ))}
      </section>

      <section className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold leading-tight text-slate-900">
              Formulaire de transmission
            </h2>
            <p className="text-[10px] text-slate-500">
              Préparez l’enquête, joignez le document et déclenchez la transmission.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600">
            <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
            {form.urgent ? "Transmission marquée urgente" : "Circuit standard"}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <TextField
            label="Numéro enquête"
            required
            value={form.reference}
            error={errors.reference}
            onChange={(event) => setField("reference", event.target.value)}
          />
          <SelectField
            label="Type d’enquête"
            value={form.type}
            onChange={(event) => setField("type", event.target.value)}
            options={TYPE_OPTIONS.map((item) => ({ value: item, label: item }))}
          />
          <TextField
            label="Date d’accident"
            type="date"
            required
            value={form.dateAccident}
            error={errors.dateAccident}
            onChange={(event) => setField("dateAccident", event.target.value)}
          />
          <SelectField
            label="Site"
            required
            value={form.site}
            error={errors.site}
            onChange={(event) => setField("site", event.target.value)}
            options={SITES.map((item) => ({ value: item, label: item }))}
          />
          <TextField
            label="Responsable"
            required
            value={form.responsable}
            error={errors.responsable}
            onChange={(event) => setField("responsable", event.target.value)}
          />
          <SelectField
            label="Niveau de gravité"
            value={form.gravity}
            onChange={(event) => setField("gravity", event.target.value)}
            options={GRAVITY_OPTIONS.map((item) => ({ value: item, label: item }))}
          />
          <SelectField
            label="Priorité"
            value={form.priority}
            onChange={(event) => setField("priority", event.target.value)}
            options={PRIORITY_OPTIONS.map((item) => ({ value: item, label: item }))}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Upload PDF/document
            </p>
            <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-600 transition hover:border-slate-400">
              <span className="truncate">
                {form.document?.name || "Ajouter un fichier PDF ou document justificatif"}
              </span>
              <FileUp className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(event) => setField("document", event.target.files?.[0] || null)}
              />
            </label>
          </div>
          <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <input
              type="checkbox"
              checked={form.urgent}
              onChange={(event) => setField("urgent", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
            />
            <span className="text-[13px] font-medium text-slate-700">Urgent</span>
          </label>
          <TextAreaField
            label="Commentaire de transmission"
            required
            rows={5}
            className="md:col-span-2 xl:col-span-3"
            value={form.commentaire}
            error={errors.commentaire}
            onChange={(event) => setField("commentaire", event.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Prévisualiser
          </button>
          <button
            type="button"
            onClick={handleGeneratePdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Générer PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[13px] font-medium text-white transition hover:bg-slate-800"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
          <button
            type="button"
            onClick={handleTransmit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <Send className="h-4 w-4" />
            Transmettre vers HSEE
          </button>
        </div>
      </section>

      <TransmissionFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        site={siteFilter}
        onSiteChange={setSiteFilter}
        date={dateFilter}
        onDateChange={setDateFilter}
        statusOptions={STATUS_OPTIONS.map((item) => ({
          value: item,
          label: item === "all" ? "Tous les statuts" : item,
        }))}
        siteOptions={[
          { value: "all", label: "Tous les sites" },
          ...SITES.map((item) => ({ value: item, label: item })),
        ]}
      />

      <section className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-2">
          <h2 className="text-sm font-semibold leading-tight text-slate-900">
            Historique des transmissions
          </h2>
          <p className="text-[10px] text-slate-500">
            Suivez les statuts, rechargez un brouillon ou appliquez le circuit de validation.
          </p>
        </div>

        {filteredTransmissions.length === 0 ? (
          <TransmissionEmptyState text="Aucune enquête transmise actuellement" />
        ) : (
          <TransmissionHistoryTable
            rows={filteredTransmissions}
            onPreview={handlePreviewRow}
            onDownload={handleDownloadRow}
            onValidate={(id) => {
              updateStatus(id, "Validée");
              toast.success("Transmission validée.");
            }}
            onReject={(id) => {
              updateStatus(id, "Rejetée");
              toast.error("Transmission rejetée.");
            }}
            onLoadDraft={handleLoadDraft}
          />
        )}
      </section>
    </div>
  );
}


