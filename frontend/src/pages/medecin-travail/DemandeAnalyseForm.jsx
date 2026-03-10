import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FlaskConical } from "lucide-react";
import { api } from "@/api/api";

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-200"
    />
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <textarea
      {...props}
      rows={4}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-200"
    />
  </div>
);

const Check = ({ label, name, checked, onChange }) => (
  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} />
    <span className="text-sm text-slate-700">{label}</span>
  </label>
);

export default function DemandeAnalyseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const collaborateurId = Number(id);

  const [collab, setCollab] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    nom_prenom: "",
    age: "",
    cin: "",
    gsm: "",
    entreprise: "",
    poste_travail: "",
    renseignements_cliniques: "",
    glycemie: false,
    creatinine: false,
    nfs: false,
    vs: false,
    transaminases: false,
    acide_urique: false,
    triglycerides: false,
    cholesterol: false,
    examen_selles: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [collabRes, dossierRes] = await Promise.all([
          api.get(`/collaborateurs/${collaborateurId}/`),
          api.get(`/medical/dossier/${collaborateurId}/`),
        ]);

        if (cancelled) return;

        const c = collabRes.data || {};
        const d = dossierRes.data || {};

        setCollab(c);
        setForm((prev) => ({
          ...prev,
          nom_prenom: `${c.nom || ""} ${c.prenom || ""}`.trim(),
          age: c.age || "",
          cin: c.cin || "",
          gsm: c.telephone || c.gsm || "",
          entreprise: d.entreprise || "",
          poste_travail: c.poste || "",
        }));
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
  }, [collaborateurId]);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setErr("");
      setSuccess("");

      await api.post(`/medical/examens-labo/${collaborateurId}/`, form);

      setSuccess("Demande d’examens de laboratoire créée avec succès.");

      setTimeout(() => {
        navigate(`/medecin-travail/collaborateurs/${collaborateurId}`);
      }, 900);
    } catch (e) {
      console.error(e);
      setErr("Erreur lors de la création de la demande labo.");
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
              Demande d’examens laboratoire
            </h1>
            <p className="text-slate-500 mt-2">
              Collaborateur : <span className="font-medium text-slate-700">{fullName || "-"}</span>
            </p>
          </div>

          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <FlaskConical className="h-6 w-6 text-slate-700" />
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">Informations</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Nom et prénom" name="nom_prenom" value={form.nom_prenom} onChange={handleChange} />
            <Input label="Âge" name="age" value={form.age} onChange={handleChange} />
            <Input label="CIN" name="cin" value={form.cin} onChange={handleChange} />
            <Input label="GSM" name="gsm" value={form.gsm} onChange={handleChange} />
            <Input label="Entreprise" name="entreprise" value={form.entreprise} onChange={handleChange} />
            <Input label="Poste de travail" name="poste_travail" value={form.poste_travail} onChange={handleChange} />
          </div>

          <div className="mt-5">
            <TextArea
              label="Renseignements cliniques"
              name="renseignements_cliniques"
              value={form.renseignements_cliniques}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">Examens demandés</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Check label="Glycémie" name="glycemie" checked={form.glycemie} onChange={handleChange} />
            <Check label="Créatinine" name="creatinine" checked={form.creatinine} onChange={handleChange} />
            <Check label="NFS" name="nfs" checked={form.nfs} onChange={handleChange} />
            <Check label="VS" name="vs" checked={form.vs} onChange={handleChange} />
            <Check label="Transaminases" name="transaminases" checked={form.transaminases} onChange={handleChange} />
            <Check label="Acide urique" name="acide_urique" checked={form.acide_urique} onChange={handleChange} />
            <Check label="Triglycérides" name="triglycerides" checked={form.triglycerides} onChange={handleChange} />
            <Check label="Cholestérol" name="cholesterol" checked={form.cholesterol} onChange={handleChange} />
            <Check
              label="Examen copro-parasitologique des selles"
              name="examen_selles"
              checked={form.examen_selles}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : "Créer la demande"}
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
    </div>
  );
}