import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, Loader2, RotateCcw, Send } from "lucide-react";
import { jsPDF } from "jspdf";
import { api } from "@/api/api";
import { useSearchParams } from "react-router-dom";

const Input = ({ label, required = false, error = "", ...props }) => (
  <div>
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
    <input
      {...props}
      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-100 ${
        error ? "border-red-300 focus:border-red-300" : "border-slate-200"
      }`}
    />
    {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
  </div>
);

const TextArea = ({ label, required = false, error = "", rows = 4, ...props }) => (
  <div>
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
    <textarea
      {...props}
      rows={rows}
      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-100 ${
        error ? "border-red-300 focus:border-red-300" : "border-slate-200"
      }`}
    />
    {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
  </div>
);

const SectionCard = ({ title, children }) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-900">
      {title}
    </h2>
    {children}
  </section>
);

const emptyTemoin = () => ({
  nomPrenom: "",
  matricule: "",
  cin: "",
  numeroTelephone: "",
});

const emptyVictime = () => ({
  nomPrenom: "",
  matricule: "",
  numeroTelephone: "",
  appartenance: "",
  horaireTravail: "",
});

const emptyAccident = () => ({
  dateAccident: "",
  heureAccident: "",
  lieuAccident: "",
  circonstancesAccident: "",
  siegeTypeLesion: "",
  lieuTransportVictime: "",
});

const formatPhone = (value) => value.replace(/[^\d+ ]/g, "");

const cleanTemoins = (temoins) =>
  temoins
    .map((temoin) => ({
      nomPrenom: (temoin.nomPrenom || "").trim(),
      matricule: (temoin.matricule || "").trim(),
      cin: (temoin.cin || "").trim(),
      numeroTelephone: (temoin.numeroTelephone || "").trim(),
    }))
    .filter((temoin) =>
      [temoin.nomPrenom, temoin.matricule, temoin.cin, temoin.numeroTelephone].some(Boolean)
    );

const buildPdf = (data) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Enquete initiale d'accident", pageWidth / 2, y, { align: "center" });

  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Victime", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  const line = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value || "-", margin + 55, y);
    y += 6;
  };

  line("Nom et prenom :", data.victime.nomPrenom);
  line("Matricule :", data.victime.matricule);
  line("Numero de telephone :", data.victime.numeroTelephone);
  line("Appartenance :", data.victime.appartenance);
  line("Horaire de travail :", data.victime.horaireTravail);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Accident", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  line(
    "Date et heure :",
    `${data.accident.dateAccident || "-"} ${data.accident.heureAccident || ""}`.trim()
  );
  line("Lieu de l'accident :", data.accident.lieuAccident);

  doc.setFont("helvetica", "bold");
  doc.text("Circonstances :", margin, y);
  doc.setFont("helvetica", "normal");
  const circ = doc.splitTextToSize(
    data.accident.circonstancesAccident || "-",
    pageWidth - margin * 2 - 40
  );
  doc.text(circ, margin + 40, y);
  y += Math.max(6, circ.length * 5);

  line("Siege et type de lesion :", data.accident.siegeTypeLesion);
  line("Lieu transport victime :", data.accident.lieuTransportVictime);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Temoins", margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Nom et prenom", margin, y);
  doc.text("Matricule", margin + 60, y);
  doc.text("CIN", margin + 100, y);
  doc.text("Telephone", margin + 135, y);
  y += 4;
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  if (!data.temoins.length) {
    doc.text("-", margin, y);
    y += 6;
  } else {
    data.temoins.forEach((temoin) => {
      doc.text(temoin.nomPrenom || "-", margin, y);
      doc.text(temoin.matricule || "-", margin + 60, y);
      doc.text(temoin.cin || "-", margin + 100, y);
      doc.text(temoin.numeroTelephone || "-", margin + 135, y);
      y += 6;
    });
  }

  y += 10;
  doc.text("Signature :", margin, y);
  doc.line(margin + 20, y + 1, pageWidth - margin, y + 1);

  return doc;
};

const buildPayload = ({ victime, accident, temoins }) => ({
  victime_nom_prenom: victime.nomPrenom.trim(),
  victime_matricule: victime.matricule.trim(),
  victime_numero_telephone: victime.numeroTelephone.trim(),
  victime_appartenance: victime.appartenance.trim(),
  victime_horaire_travail: victime.horaireTravail.trim(),
  date_accident: accident.dateAccident,
  heure_accident: accident.heureAccident,
  lieu_accident: accident.lieuAccident.trim(),
  circonstances_accident: accident.circonstancesAccident.trim(),
  siege_type_lesion: accident.siegeTypeLesion.trim(),
  lieu_transport_victime: accident.lieuTransportVictime.trim(),
  temoins: cleanTemoins(temoins),
});

const mapRecordToForm = (record) => ({
  victime: {
    nomPrenom: record.victime_nom_prenom || "",
    matricule: record.victime_matricule || "",
    numeroTelephone: record.victime_numero_telephone || "",
    appartenance: record.victime_appartenance || "",
    horaireTravail: record.victime_horaire_travail || "",
  },
  accident: {
    dateAccident: record.date_accident || "",
    heureAccident: record.heure_accident || "",
    lieuAccident: record.lieu_accident || "",
    circonstancesAccident: record.circonstances_accident || "",
    siegeTypeLesion: record.siege_type_lesion || "",
    lieuTransportVictime: record.lieu_transport_victime || "",
  },
  temoins:
    Array.isArray(record.temoins) && record.temoins.length
      ? record.temoins.map((temoin) => ({
          nomPrenom: temoin.nomPrenom || "",
          matricule: temoin.matricule || "",
          cin: temoin.cin || "",
          numeroTelephone: temoin.numeroTelephone || "",
        }))
      : [emptyTemoin()],
});

const statusTone = (statut) => {
  if (statut === "ENVOYE_HSEE") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (statut === "ENREGISTRE") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

export default function EnqueteInitialePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [records, setRecords] = useState([]);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [victime, setVictime] = useState(emptyVictime);
  const [accident, setAccident] = useState(emptyAccident);
  const [temoins, setTemoins] = useState([emptyTemoin()]);
  const [errors, setErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState(searchParams.get("filter") || "all");

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    setStatusFilter(searchParams.get("filter") || "all");
  }, [searchParams]);

  const canRemoveTemoin = useMemo(() => temoins.length > 1, [temoins.length]);
  const filteredRecords = useMemo(() => {
    if (statusFilter === "sent") {
      return records.filter((record) => record.sent_to_hsee);
    }
    return records;
  }, [records, statusFilter]);

  const validate = () => {
    const next = {};
    if (!victime.nomPrenom.trim()) next.nomPrenom = "Champ obligatoire.";
    if (!victime.matricule.trim()) next.matricule = "Champ obligatoire.";
    if (!accident.dateAccident) next.dateAccident = "Champ obligatoire.";
    if (!accident.heureAccident) next.heureAccident = "Champ obligatoire.";
    if (!accident.lieuAccident.trim()) next.lieuAccident = "Champ obligatoire.";
    if (!accident.circonstancesAccident.trim()) {
      next.circonstancesAccident = "Champ obligatoire.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const loadRecords = async () => {
    try {
      setLoadingRecords(true);
      const response = await api.get("/medical/enquetes-initiales/");
      const nextRecords = Array.isArray(response.data) ? response.data : [];
      setRecords(nextRecords);
    } catch (error) {
      console.error(error);
      setErr("Erreur lors du chargement des enquetes initiales.");
    } finally {
      setLoadingRecords(false);
    }
  };

  const reset = () => {
    setVictime(emptyVictime());
    setAccident(emptyAccident());
    setTemoins([emptyTemoin()]);
    setCurrentRecord(null);
    setErrors({});
    setErr("");
    setSuccess("");
  };

  const openRecord = (record) => {
    const mapped = mapRecordToForm(record);
    setVictime(mapped.victime);
    setAccident(mapped.accident);
    setTemoins(mapped.temoins);
    setCurrentRecord(record);
    setErrors({});
    setErr("");
    setSuccess("");
  };

  const refreshCurrentRecord = (record) => {
    setCurrentRecord(record);
    setRecords((prev) => {
      const existing = prev.find((item) => item.id === record.id);
      if (!existing) return [record, ...prev];
      return prev.map((item) => (item.id === record.id ? record : item));
    });
  };

  const persistCurrentRecord = async () => {
    const payload = buildPayload({ victime, accident, temoins });
    const response = currentRecord?.id
      ? await api.patch(`/medical/enquetes-initiales/${currentRecord.id}/`, payload)
      : await api.post("/medical/enquetes-initiales/", payload);

    refreshCurrentRecord(response.data);
    return response.data;
  };

  const generate = (preview = false) => {
    const doc = buildPdf({ victime, accident, temoins: cleanTemoins(temoins) });
    if (preview) {
      window.open(doc.output("bloburl"), "_blank");
      return;
    }
    doc.save("enquete-initiale-accident.pdf");
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      setErr("");
      setSuccess("");
      await persistCurrentRecord();
      setSuccess("Enquete initiale enregistree avec succes.");
      await loadRecords();
    } catch (error) {
      console.error(error);
      setErr(
        error?.response?.data?.detail ||
          "Erreur lors de l'enregistrement de l'enquete initiale."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSendToHSEE = async (record = currentRecord) => {
    try {
      setSending(true);
      setErr("");
      setSuccess("");
      let targetRecord = record;

      if (!record || record.id === currentRecord?.id) {
        if (!validate()) return;
        targetRecord = await persistCurrentRecord();
      }

      const response = await api.post(
        `/medical/enquetes-initiales/${targetRecord.id}/send-to-hsee/`
      );
      refreshCurrentRecord(response.data);
      setSuccess("Enquete initiale envoyee a HSEE avec succes. Le PDF a ete genere.");
      await loadRecords();
    } catch (error) {
      console.error(error);
      setErr(
        error?.response?.data?.detail ||
          "Erreur lors de l'envoi de l'enquete initiale a HSEE."
      );
    } finally {
      setSending(false);
    }
  };

  const handlePdfOpen = async (record, download = false) => {
    if (!record?.id) return;

    try {
      const pdfUrl = record.pdf_url || `/medical/enquetes-initiales/${record.id}/pdf/`;
      const suffix = download ? "?download=1" : "";
      const response = await api.get(`${pdfUrl}${suffix}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));

      if (download) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `enquete-initiale-${record.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      }

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error(error);
      setErr("Impossible d'ouvrir le PDF de l'enquete initiale.");
    }
  };

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    if (value === "all") {
      setSearchParams({});
      return;
    }
    setSearchParams({ filter: value });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Incidents</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Enquete initiale</h1>
            <p className="mt-2 text-sm text-slate-500">
              Renseignez l'enquete, enregistrez-la puis envoyez-la a HSEE.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
            <FileText className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </div>

      {currentRecord ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Statut dossier
            </p>
            <span
              className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-medium ${statusTone(
                currentRecord.statut
              )}`}
            >
              {currentRecord.statut_display || currentRecord.statut || "Brouillon"}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cree le
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {currentRecord.created_at
                ? new Date(currentRecord.created_at).toLocaleString("fr-FR")
                : "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Envoi HSEE
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {currentRecord.sent_to_hsee_at
                ? new Date(currentRecord.sent_to_hsee_at).toLocaleString("fr-FR")
                : "Non envoye"}
            </p>
          </div>
        </div>
      ) : null}

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {err}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="space-y-6">
        <SectionCard title="Victime">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Nom et prenom"
              required
              value={victime.nomPrenom}
              error={errors.nomPrenom}
              onChange={(e) =>
                setVictime((prev) => ({ ...prev, nomPrenom: e.target.value }))
              }
            />
            <Input
              label="Matricule"
              required
              value={victime.matricule}
              error={errors.matricule}
              onChange={(e) =>
                setVictime((prev) => ({ ...prev, matricule: e.target.value }))
              }
            />
            <Input
              label="Numero de telephone"
              value={victime.numeroTelephone}
              onChange={(e) =>
                setVictime((prev) => ({
                  ...prev,
                  numeroTelephone: formatPhone(e.target.value),
                }))
              }
            />
            <Input
              label="Appartenance"
              value={victime.appartenance}
              onChange={(e) =>
                setVictime((prev) => ({ ...prev, appartenance: e.target.value }))
              }
            />
            <Input
              label="Horaire de travail"
              value={victime.horaireTravail}
              onChange={(e) =>
                setVictime((prev) => ({ ...prev, horaireTravail: e.target.value }))
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="Accident">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Date accident"
              type="date"
              required
              value={accident.dateAccident}
              error={errors.dateAccident}
              onChange={(e) =>
                setAccident((prev) => ({ ...prev, dateAccident: e.target.value }))
              }
            />
            <Input
              label="Heure accident"
              type="time"
              required
              value={accident.heureAccident}
              error={errors.heureAccident}
              onChange={(e) =>
                setAccident((prev) => ({ ...prev, heureAccident: e.target.value }))
              }
            />
            <Input
              label="Lieu accident"
              required
              value={accident.lieuAccident}
              error={errors.lieuAccident}
              onChange={(e) =>
                setAccident((prev) => ({ ...prev, lieuAccident: e.target.value }))
              }
            />
            <Input
              label="Siege et type de lesion"
              value={accident.siegeTypeLesion}
              onChange={(e) =>
                setAccident((prev) => ({
                  ...prev,
                  siegeTypeLesion: e.target.value,
                }))
              }
            />
            <Input
              label="Lieu transport victime"
              value={accident.lieuTransportVictime}
              onChange={(e) =>
                setAccident((prev) => ({
                  ...prev,
                  lieuTransportVictime: e.target.value,
                }))
              }
            />
            <div className="md:col-span-2">
              <TextArea
                label="Circonstances accident"
                required
                rows={5}
                value={accident.circonstancesAccident}
                error={errors.circonstancesAccident}
                onChange={(e) =>
                  setAccident((prev) => ({
                    ...prev,
                    circonstancesAccident: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Temoins">
          <div className="space-y-4">
            {temoins.map((temoin, index) => (
              <div
                key={`temoin-${index}`}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    Temoin {index + 1}
                  </p>
                  {canRemoveTemoin ? (
                    <button
                      type="button"
                      onClick={() =>
                        setTemoins((prev) => prev.filter((_, current) => current !== index))
                      }
                      className="text-xs font-medium text-red-600"
                    >
                      Supprimer
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Nom et prenom"
                    value={temoin.nomPrenom}
                    onChange={(e) =>
                      setTemoins((prev) =>
                        prev.map((item, current) =>
                          current === index ? { ...item, nomPrenom: e.target.value } : item
                        )
                      )
                    }
                  />
                  <Input
                    label="Matricule"
                    value={temoin.matricule}
                    onChange={(e) =>
                      setTemoins((prev) =>
                        prev.map((item, current) =>
                          current === index ? { ...item, matricule: e.target.value } : item
                        )
                      )
                    }
                  />
                  <Input
                    label="CIN"
                    value={temoin.cin}
                    onChange={(e) =>
                      setTemoins((prev) =>
                        prev.map((item, current) =>
                          current === index ? { ...item, cin: e.target.value } : item
                        )
                      )
                    }
                  />
                  <Input
                    label="Numero de telephone"
                    value={temoin.numeroTelephone}
                    onChange={(e) =>
                      setTemoins((prev) =>
                        prev.map((item, current) =>
                          current === index
                            ? { ...item, numeroTelephone: formatPhone(e.target.value) }
                            : item
                        )
                      )
                    }
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setTemoins((prev) => [...prev, emptyTemoin()])}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Ajouter un temoin
            </button>
          </div>
        </SectionCard>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => generate(true)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Previsualiser PDF
          </button>
          <button
            type="button"
            onClick={() => {
              if (!validate()) return;
              generate(false);
            }}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Generer PDF
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reinitialiser
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {currentRecord?.id ? "Mettre a jour" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => handleSendToHSEE()}
            disabled={sending || currentRecord?.sent_to_hsee}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {currentRecord?.sent_to_hsee ? "Deja envoye a HSEE" : "Envoyer a HSEE"}
          </button>
        </div>
      </div>

      <SectionCard title="Enquetes enregistrees">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Consultez les enquetes initiales et filtrez rapidement celles deja envoyees a HSEE.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                statusFilter === "all"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("sent")}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                statusFilter === "sent"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Envoye a HSEE
            </button>
          </div>
        </div>
        {loadingRecords ? (
          <div className="py-8 text-center text-sm text-slate-500">Chargement...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Aucune enquete initiale enregistree.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Collaborateur</th>
                  <th className="px-3 py-3 font-medium">Matricule</th>
                  <th className="px-3 py-3 font-medium">Type d'accident</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-3 py-3 font-medium">Date envoi HSEE</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 text-slate-700">{record.date_accident || "-"}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {record.victime_nom_prenom || "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {record.victime_matricule || "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{record.type_accident || "-"}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusTone(
                          record.statut
                        )}`}
                      >
                        {record.statut_display || record.statut}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {record.sent_to_hsee_at
                        ? new Date(record.sent_to_hsee_at).toLocaleString("fr-FR")
                        : "-"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openRecord(record)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Charger
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendToHSEE(record)}
                          disabled={record.sent_to_hsee}
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {record.sent_to_hsee ? "Envoye HSEE" : "Envoyer a HSEE"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePdfOpen(record)}
                          disabled={!record.sent_to_hsee}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePdfOpen(record, true)}
                          disabled={!record.sent_to_hsee}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Telecharger
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}


