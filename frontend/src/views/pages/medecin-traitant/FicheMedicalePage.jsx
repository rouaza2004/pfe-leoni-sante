import { useState } from "react";
import { ArrowLeft, Printer, RotateCcw, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import leoniLogo from "@/views/assets/leoni-logo.png";
import { buildFicheMedicalePrintHtml } from "./FicheMedicalePrintTemplate";

const STORAGE_KEY = "medecin-traitant-fiche-medicale-draft";

const emptyForm = {
  matricule: "",
  nomPrenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  adresse: "",
  telephone: "",
  notes: "",
};

function FormField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
      />
    </label>
  );
}

export default function FicheMedicalePage() {
  const navigate = useNavigate();
  const [storedDraft] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });
  const [form, setForm] = useState(() => ({
    matricule: storedDraft?.matricule || "",
    nomPrenom: storedDraft?.nomPrenom || "",
    dateNaissance: storedDraft?.dateNaissance || "",
    lieuNaissance: storedDraft?.lieuNaissance || "",
    adresse: storedDraft?.adresse || "",
    telephone: storedDraft?.telephone || "",
    notes: storedDraft?.notes || "",
  }));
  const [savedAt, setSavedAt] = useState(() => storedDraft?.savedAt || "");
  const [status, setStatus] = useState("");

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setStatus("");
  };

  const handleSave = () => {
    const payload = {
      ...form,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSavedAt(payload.savedAt);
    setStatus("Fiche enregistree.");
  };

  const handleReset = () => {
    setForm(emptyForm);
    setSavedAt("");
    setStatus("Fiche reinitialisee.");
    localStorage.removeItem(STORAGE_KEY);
  };

  const handlePrint = () => {
    const popup = window.open("", "_blank", "width=900,height=1200");

    if (!popup) {
      setStatus("Autoriser les popups pour imprimer la fiche.");
      return;
    }

    const html = buildFicheMedicalePrintHtml({
      form,
      logoSrc: leoniLogo,
      savedAt,
    });

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.onload = () => {
      popup.focus();
      popup.print();
    };
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/medecin-traitant")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Retour au dashboard
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reinitialiser
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Printer size={16} />
            Imprimer / Export PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Save size={16} />
            Enregistrer
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8 print:shadow-none">
        <div className="rounded-[30px] border-[3px] border-slate-400 bg-white p-5 md:p-7">
          <div className="mb-5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fiche medicale</h1>
            <p className="mt-1 text-sm text-slate-500">
              Identite du collaborateur et informations de contact.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Matricule / Numero"
              value={form.matricule}
              onChange={(value) => updateField("matricule", value)}
              placeholder="Identifiant dossier"
            />
            <FormField
              label="Nom et prenom"
              value={form.nomPrenom}
              onChange={(value) => updateField("nomPrenom", value)}
              placeholder="Nom complet"
            />
            <FormField
              label="Telephone"
              value={form.telephone}
              onChange={(value) => updateField("telephone", value)}
              placeholder="Numero de telephone"
            />
            <FormField
              label="Date de naissance"
              type="date"
              value={form.dateNaissance}
              onChange={(value) => updateField("dateNaissance", value)}
            />
            <FormField
              label="Lieu de naissance"
              value={form.lieuNaissance}
              onChange={(value) => updateField("lieuNaissance", value)}
              placeholder="Ville / lieu"
            />
          </div>

          <div className="mt-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Adresse</span>
              <textarea
                value={form.adresse}
                onChange={(event) => updateField("adresse", event.target.value)}
                placeholder="Adresse complete"
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>
          </div>

          <div className="mt-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Notes / observations medicales / historique
              </span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Saisir les observations medicales, antecedents ou historique..."
                rows={10}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>{status || "Les donnees enregistrees localement pourront etre reliees au backend ensuite."}</p>
          <p>
            {savedAt
              ? `Dernier enregistrement : ${new Date(savedAt).toLocaleString()}`
              : "Aucun enregistrement pour le moment."}
          </p>
        </div>
      </div>
    </div>
  );
}

