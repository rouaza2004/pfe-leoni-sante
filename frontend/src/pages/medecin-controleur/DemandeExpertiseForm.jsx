import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/api/api";

export default function DemandeExpertiseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collaborateur, setCollaborateur] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    date_demande: "",
    motif: "",
    observations: "",
    destination_expertise: "",
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

      await api.post("/demande-expertise/", {
        collaborateur: id,
        ...form,
      });

      navigate("/medecin-controleur/historique");
    } catch (e) {
      console.error(e);
      setErr("Erreur lors de l'enregistrement de la demande d’expertise.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Demande d’Expertise
        </h1>
        {collaborateur && (
          <p className="text-slate-500">
            {collaborateur.nom} {collaborateur.prenom} - {collaborateur.matricule}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Date de demande
          </label>
          <input
            type="date"
            name="date_demande"
            value={form.date_demande}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Motif
          </label>
          <textarea
            name="motif"
            rows={4}
            value={form.motif}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Observations
          </label>
          <textarea
            name="observations"
            rows={4}
            value={form.observations}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Destination expertise
          </label>
          <input
            type="text"
            name="destination_expertise"
            value={form.destination_expertise}
            onChange={handleChange}
            placeholder="Clinique / Médecin expert / Centre..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-slate-900 text-white flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}