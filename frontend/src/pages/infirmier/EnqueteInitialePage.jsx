import { useMemo, useState } from "react";
import { FileText, RotateCcw } from "lucide-react";
import { jsPDF } from "jspdf";

const Input = ({ label, required = false, error = "", ...props }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
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
    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
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

const formatPhone = (value) => value.replace(/[^\d+ ]/g, "");

const buildPdf = (data) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Enquête initiale d’accident", pageWidth / 2, y, { align: "center" });

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
    const text = value || "-";
    doc.text(text, margin + 55, y);
    y += 6;
  };

  line("Nom et prénom :", data.victime.nomPrenom);
  line("Matricule :", data.victime.matricule);
  line("Numéro de téléphone :", data.victime.numeroTelephone);
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
  line("Lieu de l’accident :", data.accident.lieuAccident);

  doc.setFont("helvetica", "bold");
  doc.text("Circonstances :", margin, y);
  doc.setFont("helvetica", "normal");
  const circ = doc.splitTextToSize(data.accident.circonstancesAccident || "-", pageWidth - margin * 2 - 40);
  doc.text(circ, margin + 40, y);
  y += Math.max(6, circ.length * 5);

  line("Siège et type de lésion :", data.accident.siegeTypeLesion);
  line("Lieu transport victime :", data.accident.lieuTransportVictime);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Témoins", margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Nom et prénom", margin, y);
  doc.text("Matricule", margin + 60, y);
  doc.text("CIN", margin + 100, y);
  doc.text("N° téléphone", margin + 135, y);
  y += 4;
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  if (!data.temoins.length) {
    doc.text("-", margin, y);
    y += 6;
  } else {
    data.temoins.forEach((t) => {
      doc.text(t.nomPrenom || "-", margin, y);
      doc.text(t.matricule || "-", margin + 60, y);
      doc.text(t.cin || "-", margin + 100, y);
      doc.text(t.numeroTelephone || "-", margin + 135, y);
      y += 6;
    });
  }

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text("Signature :", margin, y);
  doc.line(margin + 20, y + 1, pageWidth - margin, y + 1);

  return doc;
};

export default function EnqueteInitialePage() {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [victime, setVictime] = useState({
    nomPrenom: "",
    matricule: "",
    numeroTelephone: "",
    appartenance: "",
    horaireTravail: "",
  });
  const [accident, setAccident] = useState({
    dateAccident: "",
    heureAccident: "",
    lieuAccident: "",
    circonstancesAccident: "",
    siegeTypeLesion: "",
    lieuTransportVictime: "",
  });
  const [temoins, setTemoins] = useState([emptyTemoin()]);
  const [errors, setErrors] = useState({});

  const canRemoveTemoin = useMemo(() => temoins.length > 1, [temoins.length]);

  const validate = () => {
    const next = {};
    if (!victime.nomPrenom.trim()) next.nomPrenom = "Champ obligatoire.";
    if (!victime.matricule.trim()) next.matricule = "Champ obligatoire.";
    if (!accident.dateAccident) next.dateAccident = "Champ obligatoire.";
    if (!accident.heureAccident) next.heureAccident = "Champ obligatoire.";
    if (!accident.lieuAccident.trim()) next.lieuAccident = "Champ obligatoire.";
    if (!accident.circonstancesAccident.trim())
      next.circonstancesAccident = "Champ obligatoire.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reset = () => {
    setVictime({
      nomPrenom: "",
      matricule: "",
      numeroTelephone: "",
      appartenance: "",
      horaireTravail: "",
    });
    setAccident({
      dateAccident: "",
      heureAccident: "",
      lieuAccident: "",
      circonstancesAccident: "",
      siegeTypeLesion: "",
      lieuTransportVictime: "",
    });
    setTemoins([emptyTemoin()]);
    setErrors({});
    setErr("");
    setSuccess("");
  };

  const generate = (preview = false) => {
    const doc = buildPdf({ victime, accident, temoins });
    if (preview) {
      window.open(doc.output("bloburl"), "_blank");
      return;
    }
    doc.save("enquete-initiale-accident.pdf");
  };

  const handleGenerate = () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setErr("");
      generate(false);
      setSuccess("PDF généré avec succès.");
    } catch (e) {
      setErr("Erreur lors de la génération du PDF.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!validate()) return;
    generate(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Incidents</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Enquête initiale
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Renseignez les informations de l’enquête et générez le PDF.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
            <FileText className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </div>

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
              label="Nom et prénom"
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
              label="Numéro de téléphone"
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
                setVictime((prev) => ({
                  ...prev,
                  horaireTravail: e.target.value,
                }))
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="Accident">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Date de l’accident"
              type="date"
              required
              value={accident.dateAccident}
              error={errors.dateAccident}
              onChange={(e) =>
                setAccident((prev) => ({ ...prev, dateAccident: e.target.value }))
              }
            />
            <Input
              label="Heure de l’accident"
              type="time"
              required
              value={accident.heureAccident}
              error={errors.heureAccident}
              onChange={(e) =>
                setAccident((prev) => ({ ...prev, heureAccident: e.target.value }))
              }
            />
            <Input
              label="Lieu de l’accident"
              required
              value={accident.lieuAccident}
              error={errors.lieuAccident}
              onChange={(e) =>
                setAccident((prev) => ({ ...prev, lieuAccident: e.target.value }))
              }
            />
            <Input
              label="Siège et type de lésion"
              value={accident.siegeTypeLesion}
              onChange={(e) =>
                setAccident((prev) => ({
                  ...prev,
                  siegeTypeLesion: e.target.value,
                }))
              }
            />
            <Input
              label="Lieu de transport de la victime"
              value={accident.lieuTransportVictime}
              onChange={(e) =>
                setAccident((prev) => ({
                  ...prev,
                  lieuTransportVictime: e.target.value,
                }))
              }
            />
            <TextArea
              label="Circonstances de l’accident"
              required
              rows={4}
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
        </SectionCard>

        <SectionCard title="Témoins">
          <div className="space-y-4">
            {temoins.map((t, idx) => (
              <div
                key={`temoin-${idx}`}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Input
                    label="Nom et prénom"
                    value={t.nomPrenom}
                    onChange={(e) => {
                      const next = [...temoins];
                      next[idx] = { ...next[idx], nomPrenom: e.target.value };
                      setTemoins(next);
                    }}
                  />
                  <Input
                    label="Matricule"
                    value={t.matricule}
                    onChange={(e) => {
                      const next = [...temoins];
                      next[idx] = { ...next[idx], matricule: e.target.value };
                      setTemoins(next);
                    }}
                  />
                  <Input
                    label="CIN"
                    value={t.cin}
                    onChange={(e) => {
                      const next = [...temoins];
                      next[idx] = { ...next[idx], cin: e.target.value };
                      setTemoins(next);
                    }}
                  />
                  <Input
                    label="N° téléphone"
                    value={t.numeroTelephone}
                    onChange={(e) => {
                      const next = [...temoins];
                      next[idx] = {
                        ...next[idx],
                        numeroTelephone: formatPhone(e.target.value),
                      };
                      setTemoins(next);
                    }}
                  />
                </div>
                {canRemoveTemoin ? (
                  <button
                    type="button"
                    onClick={() =>
                      setTemoins((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="mt-3 text-xs text-red-600 hover:text-red-700"
                  >
                    Supprimer ce témoin
                  </button>
                ) : null}
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setTemoins((prev) => [...prev, emptyTemoin()])}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Ajouter un témoin
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <RotateCcw size={14} />
                Réinitialiser
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
        >
          <FileText size={16} />
          Générer PDF
        </button>
        <button
          type="button"
          onClick={handlePreview}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Aperçu PDF
        </button>
      </div>
    </div>
  );
}
