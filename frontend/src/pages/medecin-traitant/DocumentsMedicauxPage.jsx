import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/api/api";

const TabBtn = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition
      ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    type="button"
  >
    {children}
  </button>
);

export default function DocumentsMedicauxPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const collaborateurId = Number(id);

  const [tab, setTab] = useState("certificat");
  const [collab, setCollab] = useState(null);

  const [ordonnances, setOrdonnances] = useState([]);
  const [certificats, setCertificats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [ordoContenu, setOrdoContenu] = useState("");
  const [certNbJours, setCertNbJours] = useState(1);
  const [certDebut, setCertDebut] = useState("");
  const [certContenu, setCertContenu] = useState("");

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const [cRes, oRes, ceRes] = await Promise.all([
        api.get(`/collaborateurs/${collaborateurId}/`),
        api.get(`/medical/ordonnances/${collaborateurId}/`),
        api.get(`/medical/certificats/${collaborateurId}/`),
      ]);

      setCollab(cRes.data);
      setOrdonnances(Array.isArray(oRes.data) ? oRes.data : []);
      setCertificats(Array.isArray(ceRes.data) ? ceRes.data : []);
    } catch (e) {
      console.error(e);
      setErr("Erreur chargement documents médicaux.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collaborateurId) {
      load();
    }
  }, [collaborateurId]);

  const createOrdonnance = async () => {
    try {
      setErr("");

      await api.post(`/medical/ordonnances/${collaborateurId}/`, {
        contenu: ordoContenu,
      });

      setOrdoContenu("");
      await load();
      setTab("ordonnance");
    } catch (e) {
      console.error(e);
      setErr("Erreur création ordonnance.");
    }
  };

  const createCertificat = async () => {
    try {
      setErr("");

      await api.post(`/medical/certificats/${collaborateurId}/`, {
        nb_jours_repos: Number(certNbJours) || 0,
        date_debut_repos: certDebut || null,
        contenu: certContenu || "",
      });

      setCertNbJours(1);
      setCertDebut("");
      setCertContenu("");
      await load();
      setTab("certificat");
    } catch (e) {
      console.error(e);
      setErr("Erreur création certificat.");
    }
  };

  const openCertificatPdf = async (certificatId) => {
    try {
      setErr("");

      const res = await api.get(`/medical/certificats/${certificatId}/pdf/`, {
        responseType: "blob",
      });

      const file = new Blob([res.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");
    } catch (e) {
      console.error(e);
      setErr("Erreur ouverture PDF certificat.");
    }
  };

  const openOrdonnancePdf = async (ordonnanceId) => {
    try {
      setErr("");

      const res = await api.get(`/medical/ordonnances/${ordonnanceId}/pdf/`, {
        responseType: "blob",
      });

      const file = new Blob([res.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");
    } catch (e) {
      console.error(e);
      setErr("Erreur ouverture PDF ordonnance.");
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!collab) {
    return <div className="p-6">Collaborateur introuvable.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <button
        type="button"
        onClick={() =>
          navigate(`/medecin-traitant/collaborateurs/${collaborateurId}`)
        }
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <div className="bg-white rounded-xl border p-5">
        <h1 className="text-xl font-bold">Documents médicaux</h1>
        <p className="text-sm text-slate-500">
          {collab.prenom} {collab.nom} · {collab.matricule}
        </p>
      </div>

      {err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <TabBtn
          active={tab === "certificat"}
          onClick={() => setTab("certificat")}
        >
          Créer certificat
        </TabBtn>

        <TabBtn
          active={tab === "ordonnance"}
          onClick={() => setTab("ordonnance")}
        >
          Créer ordonnance
        </TabBtn>
      </div>

      {tab === "certificat" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-bold">Certificat médical</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500">Nombre de jours</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min="1"
                value={certNbJours}
                onChange={(e) => setCertNbJours(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Date début repos</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                type="date"
                value={certDebut}
                onChange={(e) => setCertDebut(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500">
              Observation (optionnel)
            </label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[100px]"
              value={certContenu}
              onChange={(e) => setCertContenu(e.target.value)}
              placeholder="Observation complémentaire..."
            />
          </div>

          <button
            type="button"
            onClick={createCertificat}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            Enregistrer certificat
          </button>

          <div className="pt-3 space-y-2">
            <h3 className="font-semibold">Historique certificats</h3>

            {certificats.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun certificat.</p>
            ) : (
              certificats.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <div className="text-sm">
                    <div className="font-semibold">Certificat #{c.id}</div>
                    <div className="text-slate-500">
                      Date:{" "}
                      {c.date
                        ? new Date(c.date).toLocaleDateString("fr-FR")
                        : "—"}{" "}
                      · Repos: {c.nb_jours_repos ?? 0} jour(s)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCertificatPdf(c.id)}
                    className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Générer PDF
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "ordonnance" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-bold">Ordonnance</h2>

          <div>
            <label className="text-xs text-slate-500">Contenu</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[140px]"
              placeholder={
                "Ex:\n- Paracétamol 500mg : 1 cp x 3/j pendant 5 jours\n- ..."
              }
              value={ordoContenu}
              onChange={(e) => setOrdoContenu(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={createOrdonnance}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            Enregistrer ordonnance
          </button>

          <div className="pt-3 space-y-2">
            <h3 className="font-semibold">Historique ordonnances</h3>

            {ordonnances.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune ordonnance.</p>
            ) : (
              ordonnances.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <div className="text-sm">
                    <div className="font-semibold">Ordonnance #{o.id}</div>
                    <div className="text-slate-500">
                      Date:{" "}
                      {o.date
                        ? new Date(o.date).toLocaleDateString("fr-FR")
                        : "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openOrdonnancePdf(o.id)}
                    className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Générer PDF
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}