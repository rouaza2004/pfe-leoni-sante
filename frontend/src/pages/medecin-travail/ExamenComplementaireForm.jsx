import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Activity,
  FileDown,
  Eye,
  RotateCcw,
} from "lucide-react";
import { api } from "@/api/api";
import { getUsername } from "@/auth/auth";

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
      {label}
    </label>
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
    />
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
      {label}
    </label>
    <textarea
      {...props}
      rows={4}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
    />
  </div>
);

const Check = ({ label, name, checked, onChange }) => (
  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer bg-white hover:bg-slate-50 transition">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} />
    <span className="text-sm text-slate-700">{label}</span>
  </label>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <h2 className="text-sm font-semibold text-slate-900 mb-5 uppercase tracking-wide">
      {title}
    </h2>
    {children}
  </div>
);

const calcAge = (dateNaissance) => {
  if (!dateNaissance) return "";
  const birth = new Date(dateNaissance);
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return `${age}`;
};

export default function ExamenComplementaireForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const collaborateurId = Number(id);

  const [collab, setCollab] = useState(null);
  const [examens, setExamens] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [currentExamId, setCurrentExamId] = useState(null);

  const baseFormRef = useRef(null);

  const todayISO = useMemo(() => {
    const d = new Date();
    const pad = (v) => `${v}`.padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const [form, setForm] = useState({
    numero: "Auto",
    date: todayISO,
    medecin_travail: getUsername() || "",
    nom_prenom: "",
    age: "",
    matricule: "",
    entreprise: "",
    poste_travail: "",
    renseignements_cliniques: "",
    visiotest: false,
    audiogramme: false,
    ecg: false,
    efr: false,
  });

  const resetForm = (prefill = {}) => {
    const next = {
      numero: "Auto",
      date: todayISO,
      medecin_travail: getUsername() || "",
      nom_prenom: "",
      age: "",
      matricule: "",
      entreprise: "",
      poste_travail: "",
      renseignements_cliniques: "",
      visiotest: false,
      audiogramme: false,
      ecg: false,
      efr: false,
      ...prefill,
    };
    baseFormRef.current = next;
    setForm(next);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [collabRes, dossierRes, examensRes] = await Promise.all([
          api.get(`/collaborateurs/${collaborateurId}/`),
          api.get(`/medical/dossier/${collaborateurId}/`),
          api.get(`/medical/examens-complementaires/${collaborateurId}/`),
        ]);

        if (cancelled) return;

        const c = collabRes.data || {};
        const d = dossierRes.data || {};
        const list = Array.isArray(examensRes.data) ? examensRes.data : [];

        const prefill = {
          nom_prenom: `${c.nom || ""} ${c.prenom || ""}`.trim(),
          age: calcAge(c.date_naissance) || c.age || "",
          matricule: c.matricule || "",
          poste_travail: c.poste || "",
          entreprise: d.entreprise || "",
        };

        setCollab(c);
        setExamens(list);
        resetForm(prefill);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr("Impossible de charger les données.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [collaborateurId, todayISO]);

  const fullName = useMemo(() => {
    if (!collab) return "";
    return `${collab.nom || ""} ${collab.prenom || ""}`.trim();
  }, [collab]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSuccess("");
    setCurrentExamId(null);
  };

  const createExam = async () => {
    const payload = {
      nom_prenom: form.nom_prenom,
      age: form.age,
      cin: form.matricule,
      poste_travail: form.poste_travail,
      entreprise: form.entreprise,
      renseignements_cliniques: form.renseignements_cliniques,
      visiotest: form.visiotest,
      audiogramme: form.audiogramme,
      ecg: form.ecg,
      efr: form.efr,
    };

    const res = await api.post(
      `/medical/examens-complementaires/${collaborateurId}/`,
      payload
    );

    const created = res.data;
    setExamens((prev) => [created, ...prev]);
    setCurrentExamId(created.id);
    setSuccess("Demande enregistrée avec succès.");
    return created;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErr("");
      setSuccess("");
      await createExam();
    } catch (e) {
      console.error(e);
      setErr("Erreur lors de la création de la demande.");
    } finally {
      setSaving(false);
    }
  };

  const openPdf = (examId) => {
    if (!examId) return;
    window.open(`/api/medical/examens-complementaires/${examId}/pdf/`, "_blank");
  };

  const handleGeneratePdf = async () => {
    try {
      setSaving(true);
      setErr("");
      const exam = currentExamId
        ? { id: currentExamId }
        : await createExam();
      openPdf(exam.id);
    } catch (e) {
      console.error(e);
      setErr("Impossible de générer le PDF.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      setSaving(true);
      setErr("");
      const exam = currentExamId
        ? { id: currentExamId }
        : await createExam();
      openPdf(exam.id);
    } catch (e) {
      console.error(e);
      setErr("Impossible d’ouvrir l’aperçu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-500">Chargement du formulaire...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <button
        type="button"
        onClick={() => navigate(`/medecin-travail/collaborateurs/${collaborateurId}`)}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Retour au dossier collaborateur
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-slate-500">Médecin du travail</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Demande d’examens complémentaires
            </h1>
            <p className="text-slate-500 mt-2">
              Collaborateur :{" "}
              <span className="font-medium text-slate-700">{fullName || "-"}</span>
            </p>
          </div>

          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Activity className="h-6 w-6 text-slate-700" />
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="A. En-tête">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input label="Numéro / No" name="numero" value={form.numero} readOnly />
            <Input label="Date" name="date" value={form.date} readOnly />
            <Input
              label="Médecin du travail"
              name="medecin_travail"
              value={form.medecin_travail}
              onChange={handleChange}
            />
          </div>
        </SectionCard>

        <SectionCard title="B. Informations du collaborateur">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Nom et prénom"
              name="nom_prenom"
              value={form.nom_prenom}
              onChange={handleChange}
            />
            <Input label="Âge" name="age" value={form.age} onChange={handleChange} />
            <Input
              label="Matricule"
              name="matricule"
              value={form.matricule}
              onChange={handleChange}
            />
            <Input
              label="Entreprise"
              name="entreprise"
              value={form.entreprise}
              onChange={handleChange}
            />
            <Input
              label="Poste de travail"
              name="poste_travail"
              value={form.poste_travail}
              onChange={handleChange}
            />
          </div>
        </SectionCard>

        <SectionCard title="C. Renseignements cliniques">
          <TextArea
            label="Renseignements cliniques"
            name="renseignements_cliniques"
            value={form.renseignements_cliniques}
            onChange={handleChange}
          />
        </SectionCard>

        <SectionCard title="D. Examens complémentaires demandés">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Check
              label="Visiotest"
              name="visiotest"
              checked={form.visiotest}
              onChange={handleChange}
            />
            <Check
              label="Audiogramme"
              name="audiogramme"
              checked={form.audiogramme}
              onChange={handleChange}
            />
            <Check label="ECG" name="ecg" checked={form.ecg} onChange={handleChange} />
            <Check label="EFR" name="efr" checked={form.efr} onChange={handleChange} />
          </div>
        </SectionCard>

        <SectionCard title="E. Validation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Date" name="date_footer" value={form.date} readOnly />
            <Input
              label="Cachet et signature du médecin du travail"
              name="signature"
              value={form.medecin_travail}
              onChange={handleChange}
            />
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-60"
          >
            <FileDown size={16} />
            Générer PDF
          </button>
          <button
            type="button"
            onClick={handlePreview}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-60"
          >
            <Eye size={16} />
            Aperçu
          </button>
          <button
            type="button"
            onClick={() => resetForm(baseFormRef.current || {})}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium hover:bg-slate-50 transition"
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={() => navigate(`/medecin-travail/collaborateurs/${collaborateurId}`)}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium hover:bg-slate-50 transition"
          >
            Annuler
          </button>
        </div>
      </form>

      {examens.length > 0 && (
        <SectionCard title="Historique des demandes">
          <div className="space-y-3">
            {examens.map((examen) => (
              <div
                key={examen.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Demande #{examen.id}
                  </p>
                  <p className="text-xs text-slate-500">
                    Date : {examen.date || "-"} · {examen.nom_prenom || "-"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Examens :{" "}
                    {[
                      examen.visiotest && "Visiotest",
                      examen.audiogramme && "Audiogramme",
                      examen.ecg && "ECG",
                      examen.efr && "EFR",
                    ]
                      .filter(Boolean)
                      .join(", ") || "Aucun"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPdf(examen.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Eye className="h-4 w-4" />
                    Voir PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => openPdf(examen.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FileDown className="h-4 w-4" />
                    Télécharger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
