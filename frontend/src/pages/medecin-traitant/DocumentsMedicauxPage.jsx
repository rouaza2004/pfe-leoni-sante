import { useEffect, useState } from "react";
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

  const createOrdonnance = async () => {
    try {
      setErr("");
      await api.post(`/medical/ordonnances/${collaborateurId}/`, {
        contenu: ordoContenu,
      });
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
  const today = cert.date
    ? new Date(cert.date).toLocaleDateString("fr-FR")
    : "....................";

  const debut = cert.date_debut_repos
    ? new Date(cert.date_debut_repos).toLocaleDateString("fr-FR")
    : "....................";

  const patientName =
    `${collab?.prenom || ""} ${collab?.nom || ""}`.trim() ||
    "................................";

  const doctorName = cert.created_by_name || "Docteur";
  const cleanDoctorName = doctorName.replace(/^Dr\s*/i, "");
  const nbJours = cert.nb_jours_repos ? String(cert.nb_jours_repos) : "........";

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Certificat médical</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: "Times New Roman", serif;
      color: #111;
      font-size: 15px;
      line-height: 1.55;
    }

    .page {
      width: 100%;
      min-height: 100vh;
      position: relative;
      padding: 8px 8px 24px 8px;
      box-sizing: border-box;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 22px;
    }

    .header-left {
      width: 42%;
      font-style: italic;
      font-size: 14px;
      line-height: 1.35;
    }

    .header-left .name {
      font-weight: bold;
    }

    .header-right {
      width: 22%;
      text-align: right;
      direction: rtl;
      font-size: 17px;
      line-height: 1.25;
      font-weight: bold;
    }

    .specialite {
      margin-top: 2px;
      font-style: italic;
      font-size: 14px;
    }

    .date-line {
      margin-top: 16px;
      margin-bottom: 30px;
      font-weight: bold;
      font-size: 15px;
    }

    .title {
      text-align: center;
      font-weight: 700;
      font-size: 18px;
      margin: 26px 0 34px;
      letter-spacing: 0.5px;
    }

    .content {
      font-size: 15px;
      margin-top: 10px;
    }

    .line {
      margin: 10px 0;
    }

    .inline-line {
      display: inline-block;
      border-bottom: 1px dotted #222;
      min-width: 160px;
      height: 16px;
      vertical-align: baseline;
      text-align: center;
      font-weight: bold;
    }

    .inline-line.short {
      min-width: 55px;
    }

    .inline-line.medium {
      min-width: 120px;
    }

    .inline-line.long {
      min-width: 210px;
    }

    .footer {
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 8px;
      border-top: 1px solid #666;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 14px;
    }

    .obs {
      margin-top: 18px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <div>Docteur</div>
        <div class="name">${cleanDoctorName}</div>
        <div class="specialite">Médecine Générale</div>
      </div>

      <div class="header-right">
        <div>الدكتور</div>
        <div>طبيب عام</div>
      </div>
    </div>

    <div class="date-line">
      Menzel Hayet, le <span class="inline-line medium">${today}</span>
    </div>

    <div class="title">CERTIFICAT&nbsp;&nbsp;MEDICAL</div>

    <div class="content">
      <div class="line">
        Je soussigné, Docteur <b>${cleanDoctorName}</b>, certifie avoir reçu et
      </div>

      <div class="line">
        examiné aujourd'hui M <span class="inline-line long">${patientName}</span>
      </div>

      <div class="line">
        et que son état de santé nécessite
        <span class="inline-line short">${nbJours}</span>
        jour(s) de repos à
      </div>

      <div class="line">
        partir du <span class="inline-line medium">${debut}</span>
        sauf complications
      </div>

      <div class="line">ultérieures.</div>

      <div class="line" style="margin-top:18px;">
        Certificat délivré à l'intéressé(e) pour servir et valoir ce que
      </div>

      <div class="line">de droit ./.</div>

      ${
        cert.contenu
          ? `<div class="obs"><b>Observation :</b> ${String(cert.contenu)}</div>`
          : ""
      }
    </div>

    <div class="footer">
      <div>Leoni Menzel Hayet</div>
      <div>Service Médical</div>
    </div>
  </div>
</body>
</html>`;
};
  const buildOrdonnanceHtml = (ordo) => {
    const today = new Date(ordo.date || Date.now()).toLocaleDateString();
    const nom = `${collab?.prenom || ""} ${collab?.nom || ""}`.trim();
    const doctorName = ordo.created_by_name || "Docteur";

    return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
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
</head>
<body>
<div class="top">
  <div>
    <div><b>${doctorName}</b></div>
    <div class="muted">Médecine Générale</div>
  </div>
  <div class="muted">Menzel Hayet, le ${today}</div>
</div>

<div class="title">ORDONNANCE</div>

<div class="line"><b>Patient:</b> ${nom || "____________________"}</div>
<div class="line"><pre>${String(ordo.contenu || "")}</pre></div>

<div class="footer">
  <div><b>Leoni Menzel Hayet</b></div>
  <div><b>Service Médical</b></div>
</div>
</body>
</html>`;
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (err) return <div className="p-6 text-rose-700">{err}</div>;
  if (!collab) return <div className="p-6">Collaborateur introuvable.</div>;

  return (
    <div className="p-6 space-y-4">
      <button
        type="button"
        onClick={() =>
          navigate(`/medecin-traitant/collaborateurs/${collaborateurId}`)
        }
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
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                >
                  <div className="text-sm">
                    <div className="font-semibold">Certificat #{c.id}</div>
                    <div className="text-slate-500">
                      Date:{" "}
                      {c.date
                        ? new Date(c.date).toLocaleDateString()
                        : "—"}{" "}
                      · Repos: {c.nb_jours_repos} jour(s)
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
              placeholder={
                "Ex:\n- Paracétamol 500mg: 1 cp x 3/j pendant 5 jours\n- ..."
              }
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
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                >
                  <div className="text-sm">
                    <div className="font-semibold">Ordonnance #{o.id}</div>
                    <div className="text-slate-500">
                      Date:{" "}
                      {o.date
                        ? new Date(o.date).toLocaleDateString()
                        : "—"}
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