import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/api/api";

const TabBtn = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition
      ${active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
    type="button"
  >
    {children}
  </button>
);

function printHtml(html) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

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
      setOrdonnances(oRes.data || []);
      setCertificats(ceRes.data || []);
    } catch (e) {
      console.error(e);
      setErr("Erreur chargement documents médicaux.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collaborateurId) load();
  }, [collaborateurId]);

  const doctorName = useMemo(() => "Docteur", []);

  const createOrdonnance = async () => {
    try {
      setErr("");
      await api.post(`/medical/ordonnances/${collaborateurId}/`, { contenu: ordoContenu });
      setOrdoContenu("");
      load();
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
      load();
    } catch (e) {
      console.error(e);
      setErr("Erreur création certificat.");
    }
  };

  const buildCertificatHtml = (cert) => {
    const today = new Date(cert.date || Date.now()).toLocaleDateString();
    const debut = cert.date_debut_repos ? new Date(cert.date_debut_repos).toLocaleDateString() : "__________";
    const nom = `${collab?.prenom || ""} ${collab?.nom || ""}`.trim();

    return `
<!doctype html>
<html><head><meta charset="utf-8" />
<title>Certificat médical</title>
<style>
  body{ font-family: Arial, sans-serif; padding: 40px; }
  .top{ display:flex; justify-content:space-between; }
  .muted{ color:#444; }
  .title{ text-align:center; margin:40px 0 20px; font-weight:700; letter-spacing:1px; }
  .line{ margin-top:18px; line-height:1.8; font-size:16px;}
  .footer{ margin-top:60px; display:flex; justify-content:space-between; }
  .signature{ margin-top:50px; }
</style>
</head><body>
<div class="top">
  <div><div><b>${doctorName}</b></div><div class="muted">Médecine Générale</div></div>
  <div class="muted">Menzel Hayet, le ${today}</div>
</div>
<div class="title">CERTIFICAT&nbsp;&nbsp;MEDICAL</div>
<div class="line">Je soussigné, ${doctorName}, certifie avoir reçu et examiné aujourd’hui M <b>${nom || "____________________"}</b></div>
<div class="line">et que son état de santé nécessite <b>(${cert.nb_jours_repos || 0})</b> jour(s) de repos à partir du <b>${debut}</b> sauf complications ultérieures.</div>
<div class="line">Certificat délivré à l’intéressé(e) pour servir et valoir ce que de droit.</div>
${cert.contenu ? `<div class="line"><b>Observation:</b> ${String(cert.contenu)}</div>` : ""}
<div class="signature"></div>
<div class="footer"><div><b>Leoni Menzel Hayet</b></div><div><b>Service Médical</b></div></div>
</body></html>`;
  };

  const buildOrdonnanceHtml = (ordo) => {
    const today = new Date(ordo.date || Date.now()).toLocaleDateString();
    const nom = `${collab?.prenom || ""} ${collab?.nom || ""}`.trim();

    return `
<!doctype html>
<html><head><meta charset="utf-8" />
<title>Ordonnance</title>
<style>
  body{ font-family: Arial, sans-serif; padding: 40px; }
  .top{ display:flex; justify-content:space-between; }
  .muted{ color:#444; }
  .title{ text-align:center; margin:40px 0 10px; font-weight:700; letter-spacing:1px; }
  .line{ margin-top:14px; line-height:1.8; font-size:16px;}
  pre{ white-space:pre-wrap; font-family: inherit; }
  .footer{ margin-top:60px; display:flex; justify-content:space-between; }
</style>
</head><body>
<div class="top">
  <div><div><b>${doctorName}</b></div><div class="muted">Médecine Générale</div></div>
  <div class="muted">Menzel Hayet, le ${today}</div>
</div>
<div class="title">ORDONNANCE</div>
<div class="line"><b>Patient:</b> ${nom || "____________________"}</div>
<div class="line"><pre>${String(ordo.contenu || "")}</pre></div>
<div class="footer"><div><b>Leoni Menzel Hayet</b></div><div><b>Service Médical</b></div></div>
</body></html>`;
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
        <h1 className="text-xl font-bold">Documents médicaux</h1>
        <p className="text-sm text-slate-500">
          {collab.prenom} {collab.nom} · {collab.matricule}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabBtn active={tab === "certificat"} onClick={() => setTab("certificat")}>Créer certificat</TabBtn>
        <TabBtn active={tab === "ordonnance"} onClick={() => setTab("ordonnance")}>Créer ordonnance</TabBtn>
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
            <label className="text-xs text-slate-500">Observation (optionnel)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[100px]"
              value={certContenu}
              onChange={(e) => setCertContenu(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={createCertificat}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
          >
            Enregistrer certificat
          </button>

          <div className="pt-3 space-y-2">
            <h3 className="font-semibold">Historique certificats</h3>

            {certificats.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun certificat.</p>
            ) : (
              certificats.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="text-sm">
                    <div className="font-semibold">Certificat #{c.id}</div>
                    <div className="text-slate-500">
                      Date: {c.date ? new Date(c.date).toLocaleDateString() : "—"} · Repos: {c.nb_jours_repos} jour(s)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => printHtml(buildCertificatHtml(c))}
                    className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Imprimer
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
              placeholder={"Ex:\n- Paracétamol 500mg: 1 cp x 3/j pendant 5 jours\n- ..."}
              value={ordoContenu}
              onChange={(e) => setOrdoContenu(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={createOrdonnance}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
          >
            Enregistrer ordonnance
          </button>

          <div className="pt-3 space-y-2">
            <h3 className="font-semibold">Historique ordonnances</h3>

            {ordonnances.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune ordonnance.</p>
            ) : (
              ordonnances.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="text-sm">
                    <div className="font-semibold">Ordonnance #{o.id}</div>
                    <div className="text-slate-500">
                      Date: {o.date ? new Date(o.date).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => printHtml(buildOrdonnanceHtml(o))}
                    className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Imprimer
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