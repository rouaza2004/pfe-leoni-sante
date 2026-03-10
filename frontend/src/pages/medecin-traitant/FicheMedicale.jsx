import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/api/api";

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <input
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function FicheMedicale() {
  const { id } = useParams();
  const navigate = useNavigate();
  const collaborateurId = Number(id);

  const [collab, setCollab] = useState(null);
  const [fiche, setFiche] = useState(null);

  const [form, setForm] = useState({
    date_naissance: "",
    lieu_naissance: "",
    adresse: "",
    telephone: "",
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const [cRes, fRes] = await Promise.all([
        api.get(`/collaborateurs/${collaborateurId}/`),
        api.get(`/medical/fiche/${collaborateurId}/`),
      ]);

      setCollab(cRes.data);
      setFiche(fRes.data || null);

      setForm({
        date_naissance: fRes.data?.date_naissance || "",
        lieu_naissance: fRes.data?.lieu_naissance || "",
        adresse: fRes.data?.adresse || "",
        telephone: fRes.data?.telephone || "",
      });
    } catch (e) {
      console.error(e);
      setErr("Erreur chargement fiche médicale.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collaborateurId) load();
  }, [collaborateurId]);

  const save = async () => {
    try {
      setErr("");
      setSaving(true);

      const res = await api.patch(`/medical/fiche/${collaborateurId}/`, form);
      setFiche(res.data);
    } catch (e) {
      console.error(e);
      setErr("Erreur enregistrement fiche médicale.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (err) return <div className="p-6 text-rose-700">{err}</div>;
  if (!collab) return <div className="p-6">Collaborateur introuvable.</div>;

  return (
    <div className="p-6 space-y-4">
      <button
        type="button"
        onClick={() => navigate(`/medecin-traitant/collaborateurs/${collaborateurId}`)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="bg-white rounded-xl border p-5">
        <h1 className="text-xl font-bold">Fiche médicale</h1>
        <p className="text-sm text-slate-500">
          {collab.prenom} {collab.nom} · {collab.matricule}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Informations personnelles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Date de naissance"
            type="date"
            value={form.date_naissance}
            onChange={(v) => setForm({ ...form, date_naissance: v })}
          />
          <Field
            label="Lieu de naissance"
            value={form.lieu_naissance}
            onChange={(v) => setForm({ ...form, lieu_naissance: v })}
          />
          <Field
            label="Adresse"
            value={form.adresse}
            onChange={(v) => setForm({ ...form, adresse: v })}
          />
          <Field
            label="Tél"
            value={form.telephone}
            onChange={(v) => setForm({ ...form, telephone: v })}
          />
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
        >
          Enregistrer
        </button>

        {fiche?.updated_at && (
          <p className="text-xs text-slate-500">
            Dernière mise à jour: {new Date(fiche.updated_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}