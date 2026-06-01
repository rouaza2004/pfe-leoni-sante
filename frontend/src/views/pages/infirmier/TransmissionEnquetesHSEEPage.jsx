import { useEffect, useMemo, useState } from "react";
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

import { api } from "@/controllers/api/api";
import HSEEPageHeader from "@/views/components/hsee/HSEEPageHeader";
import TransmissionEmptyState from "@/views/components/infirmier/transmission-hsee/TransmissionEmptyState";
import TransmissionFilters from "@/views/components/infirmier/transmission-hsee/TransmissionFilters";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/views/components/infirmier/transmission-hsee/TransmissionFormField";
import TransmissionHistoryTable from "@/views/components/infirmier/transmission-hsee/TransmissionHistoryTable";
import TransmissionStatCard from "@/views/components/infirmier/transmission-hsee/TransmissionStatCard";
import { LEONI_SITES } from "@/utils/siteOptions";

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

function buildInitialForm(sites = LEONI_SITES) {
  return {
    id: null,
    reference: "",
    type: TYPE_OPTIONS[0],
    dateAccident: formatToday(),
    site: sites[0] || LEONI_SITES[0] || "",
    responsable: "",
    gravity: GRAVITY_OPTIONS[1],
    commentaire: "",
    priority: PRIORITY_OPTIONS[1],
    urgent: false,
    document: null,
  };
}

function getDocumentName(value) {
  if (!value) return "";
  if (typeof value.name === "string") return value.name;
  if (typeof value.documentName === "string") return value.documentName;
  return "";
}

function isFileDocument(value) {
  return typeof File !== "undefined" && value instanceof File;
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
  line("Document lié :", getDocumentName(form.document) || "Aucun fichier");

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Commentaire de transmission", 16, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const text = doc.splitTextToSize(form.commentaire || "-", 178);
  doc.text(text, 16, y);

  return doc;
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

function mapTransmissionRow(row) {
  return {
    id: row.id,
    reference: row.reference || "",
    type: row.type || TYPE_OPTIONS[0],
    dateAccident: row.dateAccident || "",
    site: row.site || "",
    responsable: row.responsable || "",
    gravity: row.gravity || "",
    commentaire: row.commentaire || "",
    priority: row.priority || "",
    urgent: Boolean(row.urgent),
    status: row.status || "Brouillon",
    statusCode: row.statusCode || "BROUILLON",
    documentName: row.documentName || "",
    documentUrl: row.documentUrl || "",
    pdfUrl: row.pdfUrl || "",
    sentAt: row.sentAt || "",
    createdAt: row.createdAt || "",
    updatedAt: row.updatedAt || "",
  };
}

function buildFormData(form, action) {
  const payload = new FormData();
  payload.append("reference", form.reference);
  payload.append("type", form.type);
  payload.append("dateAccident", form.dateAccident);
  payload.append("site", form.site);
  payload.append("responsable", form.responsable);
  payload.append("gravity", form.gravity);
  payload.append("commentaire", form.commentaire);
  payload.append("priority", form.priority);
  payload.append("urgent", form.urgent ? "true" : "false");
  payload.append("action", action);
  if (isFileDocument(form.document)) {
    payload.append("document", form.document);
  }
  return payload;
}

export default function TransmissionEnquetesHSEEPage() {
  const [sites, setSites] = useState(LEONI_SITES);
  const [form, setForm] = useState(() => buildInitialForm(LEONI_SITES));
  const [errors, setErrors] = useState({});
  const [transmissions, setTransmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPageData = async () => {
      try {
        setIsLoading(true);
        const [sitesResponse, transmissionsResponse] = await Promise.all([
          api.get("/sites/"),
          api.get("/medical/hsee-transmissions/"),
        ]);

        if (cancelled) return;

        const nextSites = Array.isArray(sitesResponse.data)
          ? sitesResponse.data.map((item) => item?.nom).filter(Boolean)
          : [];
        const resolvedSites = nextSites.length ? nextSites : LEONI_SITES;
        setSites(resolvedSites);
        setForm((current) => ({
          ...current,
          site: resolvedSites.includes(current.site) ? current.site : resolvedSites[0] || "",
        }));

        const rows = Array.isArray(transmissionsResponse.data)
          ? transmissionsResponse.data.map(mapTransmissionRow)
          : [];
        setTransmissions(rows);
      } catch (error) {
        console.error("Erreur chargement transmissions HSEE", error);
        if (!cancelled) {
          toast.error("Impossible de charger les transmissions HSEE.");
          setSites(LEONI_SITES);
          setTransmissions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const siteOptions = useMemo(
    () => [{ value: "all", label: "Tous les sites" }, ...sites.map((item) => ({ value: item, label: item }))],
    [sites]
  );

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const upsertTransmissionState = (row) => {
    const normalized = mapTransmissionRow(row);
    setTransmissions((current) => {
      const exists = current.some((item) => item.id === normalized.id);
      if (!exists) return [normalized, ...current];
      return current.map((item) => (item.id === normalized.id ? normalized : item));
    });
    return normalized;
  };

  const persistTransmission = async (action) => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;

    try {
      setIsSaving(true);
      const payload = buildFormData(form, action);
      const response = form.id
        ? await api.patch(`/medical/hsee-transmissions/${form.id}/`, payload)
        : await api.post("/medical/hsee-transmissions/", payload);
      const saved = upsertTransmissionState(response.data);
      setForm((current) => ({
        ...current,
        id: saved.id,
        document: saved.documentName
          ? { name: saved.documentName, url: saved.documentUrl || "", persisted: true }
          : current.document,
      }));
      return saved;
    } catch (error) {
      console.error("Erreur sauvegarde transmission HSEE", error);
      toast.error("Impossible d'enregistrer la transmission.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateTransmissionStatus = async (id, action, message, tone = "success") => {
    try {
      const payload = new FormData();
      payload.append("action", action);
      const response = await api.patch(`/medical/hsee-transmissions/${id}/`, payload);
      upsertTransmissionState(response.data);
      if (tone === "error") {
        toast.error(message);
      } else {
        toast.success(message);
      }
    } catch (error) {
      console.error("Erreur mise a jour statut transmission HSEE", error);
      toast.error("Impossible de mettre à jour le statut.");
    }
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

    buildPdf(form, form.id ? "Enregistrée" : "Brouillon").save(
      `${form.reference || "transmission-hsee"}.pdf`
    );
    toast.success("PDF généré avec succès.");
  };

  const handleSave = async () => {
    const row = await persistTransmission("save");
    if (!row) return;
    toast.success("Transmission enregistrée en brouillon.");
  };

  const handleTransmit = async () => {
    const row = await persistTransmission("transmit");
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
      document: row.documentName
        ? { name: row.documentName, url: row.documentUrl || "", persisted: true }
        : null,
    });
    setErrors({});
    toast.success("Transmission chargée dans le formulaire.");
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
        document: row.documentName ? { name: row.documentName } : null,
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
        document: row.documentName ? { name: row.documentName } : null,
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
            options={sites.map((item) => ({ value: item, label: item }))}
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
                {getDocumentName(form.document) || "Ajouter un fichier PDF ou document justificatif"}
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
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[13px] font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
          <button
            type="button"
            onClick={handleTransmit}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
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
        siteOptions={siteOptions}
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

        {isLoading ? (
          <TransmissionEmptyState text="Chargement des transmissions HSEE..." />
        ) : filteredTransmissions.length === 0 ? (
          <TransmissionEmptyState text="Aucune enquête transmise actuellement" />
        ) : (
          <TransmissionHistoryTable
            rows={filteredTransmissions}
            onPreview={handlePreviewRow}
            onDownload={handleDownloadRow}
            onValidate={(id) => updateTransmissionStatus(id, "validate", "Transmission validée.")}
            onReject={(id) =>
              updateTransmissionStatus(id, "reject", "Transmission rejetée.", "error")
            }
            onLoadDraft={handleLoadDraft}
          />
        )}
      </section>
    </div>
  );
}
