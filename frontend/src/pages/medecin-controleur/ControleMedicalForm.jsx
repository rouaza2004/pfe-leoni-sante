import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/api/api";

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
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
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
    />
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

export default function ControleMedicalForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [collaborateur, setCollaborateur] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setErr("");

      await api.post("/controle-medical/", {
        collaborateur: id,
        ...form,
      });

      navigate("/medecin-controleur/controle-medical");
    } catch (e) {
      console.error(e);
      setErr("Erreur lors de l'enregistrement du contrôle médical.");
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
