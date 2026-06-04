import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/api/api";

function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

function fieldClass(error) {
  return `w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 ${
    error
      ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 focus:border-sky-400 focus:ring-sky-100"
  }`;
}

const Input = ({ label, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <input
      {...props}
      className={fieldClass(error)}
    />
    {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}
  </div>
);

const TextArea = ({ label, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <textarea
      {...props}
      rows={4}
      className={fieldClass(error)}
    />
    {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <select
      {...props}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
    >
      {children}
    </select>
  </div>
);

function getSegmentLabel(collaborateur) {
  return (
    collaborateur?.segment_nom ||
    collaborateur?.segment?.nom ||
    collaborateur?.segment ||
    ""
  );
}

function buildPdfPrefill(collaborateur, form) {
  const details = [form.presence === "absent" ? "Collaborateur absent" : "Collaborateur present"];

  if (form.adresse_visite?.trim()) {
    details.push(`Adresse de visite : ${form.adresse_visite.trim()}`);
  }

  if (form.conclusion?.trim()) {
    details.push(`Conclusion : ${form.conclusion.trim()}`);
  }

  if (form.decision?.trim()) {
    details.push(`Decision / Recommandation : ${form.decision.trim()}`);
  }

  return {
    date: form.date_controle,
    ville: form.adresse_visite,
    matricule: collaborateur?.matricule || "",
    segment: getSegmentLabel(collaborateur),
    nom: collaborateur?.nom || "",
    prenom: collaborateur?.prenom || "",
    reposPrescrit: form.decision || "",
    avisMedecinControleur: details.join("\n"),
  };
}

export default function ControleMedicalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collaborateur, setCollaborateur] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [form, setForm] = useState({
    date_controle: "",
    adresse_visite: "",
    presence: "present",
    conclusion: "",
    decision: "",
  });

  useEffect(() => {
    const fetchCollaborateur = async () => {
      try {
        const res = await api.get(`/collaborateurs/${id}/`);
        setCollaborateur(res.data);
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger les informations du collaborateur.");
      }
    };

    fetchCollaborateur();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const validateBeforeNavigate = () => {
    const nextErrors = {};

    if (!hasValue(collaborateur?.nom)) nextErrors.nom = "Veuillez renseigner le nom.";
    if (!hasValue(collaborateur?.prenom)) nextErrors.prenom = "Veuillez renseigner le prénom.";
    if (!hasValue(collaborateur?.matricule)) {
      nextErrors.matricule = "Veuillez renseigner le matricule LEONI.";
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateBeforeNavigate()) {
      setErr("Veuillez compléter les champs obligatoires avant de générer le PDF.");
      return;
    }

    try {
      setSaving(true);
      setErr("");

      navigate("/medecin-controleur/controle-medical", {
        state: {
          prefill: buildPdfPrefill(collaborateur, form),
        },
      });
    } catch (error) {
      console.error(error);
      setErr("Erreur lors de la preparation du controle medical.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sky-700 hover:text-slate-900"
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      <div className="rounded-[26px] border border-slate-200 bg-gradient-to-br from-white via-sky-50/35 to-white p-5 shadow-sm shadow-slate-200/50">
        <h1 className="text-2xl font-bold text-slate-800">Contrôle Médical</h1>
        {collaborateur && (
          <p className="text-slate-500">
            {collaborateur.nom} {collaborateur.prenom} - {collaborateur.matricule}
          </p>
        )}
        {validationErrors.nom || validationErrors.prenom || validationErrors.matricule ? (
          <div className="mt-3 space-y-1 text-sm text-rose-600">
            {validationErrors.nom ? <p>{validationErrors.nom}</p> : null}
            {validationErrors.prenom ? <p>{validationErrors.prenom}</p> : null}
            {validationErrors.matricule ? <p>{validationErrors.matricule}</p> : null}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 ring-1 ring-sky-100/60"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date du contrôle"
            type="date"
            name="date_controle"
            value={form.date_controle}
            onChange={handleChange}
          />

          <Input
            label="Adresse de visite"
            name="adresse_visite"
            value={form.adresse_visite}
            onChange={handleChange}
            placeholder="Adresse"
          />
        </div>

        <Select
          label="Présence du collaborateur"
          name="presence"
          value={form.presence}
          onChange={handleChange}
        >
          <option value="present">Présent</option>
          <option value="absent">Absent</option>
        </Select>

        <TextArea
          label="Conclusion"
          name="conclusion"
          value={form.conclusion}
          onChange={handleChange}
          placeholder="Conclusion du médecin contrôleur"
        />

        <TextArea
          label="Décision / Recommandation"
          name="decision"
          value={form.decision}
          onChange={handleChange}
          placeholder="Ex: reprise, prolongation, expertise..."
        />

        {err && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-slate-900 text-white flex items-center gap-2 shadow-sm shadow-sky-900/25 transition hover:bg-slate-800"
        >
          <Save size={18} />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}


