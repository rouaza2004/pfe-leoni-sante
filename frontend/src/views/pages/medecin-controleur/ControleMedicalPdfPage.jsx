import { useMemo, useState } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { getUsername } from "@/auth/auth";
import { saveControleMedicalHistory } from "@/services/medecinControleurHistoryService";
import { downloadControleMedicalPdf } from "@/utils/generateControleMedicalPdf";

function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

function fieldClass(error) {
  return `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
    error
      ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 focus:border-sky-400 focus:ring-sky-100"
  }`;
}

function Field({ label, children, hint, error }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

function SectionCard({ title, subtitle, children, icon }) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ControleMedicalPdfPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const doctorIdentifier = getUsername() || "Dr. ____________";
  const prefill = location.state?.prefill || {};

  const [form, setForm] = useState({
    date: prefill.date || today,
    ville: prefill.ville || prefill.lieu || "",
    matricule: prefill.matricule || "",
    segment: prefill.segment || "",
    nom: prefill.nom || "",
    prenom: prefill.prenom || "",
    reposPrescrit: prefill.reposPrescrit || "",
    avisMedecinControleur: prefill.avisMedecinControleur || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (hasValue(value)) {
      setValidationErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateBeforeGenerate = () => {
    const nextErrors = {};

    if (!hasValue(form.nom)) nextErrors.nom = "Veuillez renseigner le nom.";
    if (!hasValue(form.prenom)) nextErrors.prenom = "Veuillez renseigner le prénom.";
    if (!hasValue(form.matricule)) nextErrors.matricule = "Veuillez renseigner le matricule LEONI.";

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGeneratePdf = async () => {
    if (!validateBeforeGenerate()) {
      return;
    }

    try {
      setIsSaving(true);

      const pdfData = {
        ...form,
        medecinControleur: doctorIdentifier,
      };
      const pdfFilename = downloadControleMedicalPdf(pdfData);

      await saveControleMedicalHistory({
        date: pdfData.date,
        matricule: pdfData.matricule,
        segment: pdfData.segment,
        nom: pdfData.nom,
        prenom: pdfData.prenom,
        repos_prescrit: pdfData.reposPrescrit,
        avis_medecin_controleur: pdfData.avisMedecinControleur,
        medecin_identifiant: pdfData.medecinControleur,
        pdf_filename: pdfFilename,
        statut: "VALIDE",
      });
    } catch (error) {
      console.error("Erreur generation controle medical PDF", error);
      window.alert("Impossible de generer le PDF du controle medical ou d'enregistrer l'historique.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-sky-700 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-sky-50/35 to-white p-6 shadow-sm shadow-slate-200/50">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Contrôle médical
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Renseignez le formulaire puis générez le document PDF au format administratif.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <div className="space-y-6">
          <SectionCard
            title="Informations générales"
            subtitle="Données principales à reproduire dans le document"
            icon={<FileText size={18} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Ville / Lieu">
                <input
                  type="text"
                  name="ville"
                  value={form.ville}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Matricule" error={validationErrors.matricule}>
                <input
                  type="text"
                  name="matricule"
                  value={form.matricule}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.matricule)}
                />
              </Field>

              <Field label="Segment">
                <input
                  type="text"
                  name="segment"
                  value={form.segment}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field
                label="Médecin contrôleur"
                hint="Renseigné automatiquement depuis la session active."
              >
                <input
                  type="text"
                  value={doctorIdentifier}
                  readOnly
                  className="w-full rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </Field>

              <Field label="Nom" error={validationErrors.nom}>
                <input
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.nom)}
                />
              </Field>

              <Field label="Prénom" error={validationErrors.prenom}>
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.prenom)}
                />
              </Field>

              <Field label="Repos prescrit">
                <input
                  type="text"
                  name="reposPrescrit"
                  value={form.reposPrescrit}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Avis du médecin contrôleur"
            subtitle="Zone de texte libre imprimée dans la grande section centrale du PDF"
            icon={<FileText size={18} />}
          >
            <Field label="Avis du médecin contrôleur">
              <textarea
                name="avisMedecinControleur"
                rows={10}
                value={form.avisMedecinControleur}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </Field>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <h2 className="text-base font-semibold text-slate-900">PDF</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Le document reprend les valeurs du formulaire au format administratif sur une seule
              page A4.
            </p>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-sky-900/25 transition hover:bg-slate-800"
            >
              <Download size={16} />
              {isSaving ? "Enregistrement..." : "Générer PDF"}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}



