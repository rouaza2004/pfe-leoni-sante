import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/controllers/api/api";

import DossierMedical from "../medecin-traitant/DossierMedical";

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const collaborateurId = Number(id);

  const [collab, setCollab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setErr("");
        setLoading(true);

        const res = await api.get(`/collaborateurs/${collaborateurId}/`);

        if (cancelled) return;
        setCollab(res.data);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setErr("Erreur chargement patient");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (!Number.isFinite(collaborateurId)) return;

    load();

    return () => {
      cancelled = true;
    };
  }, [collaborateurId]);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!collab) return <div className="p-6">Patient introuvable</div>;

  const siteLabel = collab.site
    ? `${collab.site.nom} - ${collab.site.localite}`
    : "—";

  return (
    <div className="p-6 space-y-4">

      {/* Retour */}
      <button
        onClick={() => navigate("/infirmier/patients")}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      {/* Card patient */}
      <div className="bg-white rounded-xl border p-5">
        <h1 className="text-xl font-bold">
          {collab.prenom} {collab.nom}
        </h1>

        <p className="text-sm text-slate-500">
          {collab.matricule} · {collab.email || "—"}
        </p>
      </div>

      {/* Infos */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold">Informations collaborateur</h2>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">

          <div>
            <p className="text-slate-500">Site</p>
            <p className="font-medium">{siteLabel}</p>
          </div>

          <div>
            <p className="text-slate-500">Créé le</p>
            <p className="font-medium">
              {collab.created_at
                ? new Date(collab.created_at).toLocaleString()
                : "—"}
            </p>
          </div>

        </div>
      </div>

      {/* dossier medical (lecture seulement) */}
      <DossierMedical collaborateurId={collaborateurId} />

    </div>
  );
}
