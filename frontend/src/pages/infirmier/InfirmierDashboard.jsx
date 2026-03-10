import { useEffect, useMemo, useState } from "react";
import {
  Users,
  TriangleAlert,
  Pill,
  CalendarDays,
  ArrowUpRight,
  BellRing,
  ClipboardPlus,
  Search,
  Package,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/api";

const StatCard = ({ title, value, subtitle, icon, alert = false }) => (
  <div
    className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
      alert ? "border-red-200" : "border-slate-200"
    }`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`mt-2 text-3xl font-bold ${alert ? "text-red-600" : "text-slate-900"}`}>
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>

      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          alert ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"
        }`}
      >
        {icon}
      </div>
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon, onClick }) => (
  <button
    onClick={onClick}
    className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 text-xs text-slate-500">{desc}</p>
  </button>
);

const medecinTypeLabel = {
  TRAITANT: "Médecin traitant",
  TRAVAIL: "Médecin du travail",
  CONTROLEUR: "Médecin contrôleur",
};

const statutLabel = {
  PREVU: "Prévu",
  TERMINE: "Terminé",
  REPORTE: "Reporté",
  ANNULE: "Annulé",
};

function InjuryBadge({ text }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      <TriangleAlert size={12} />
      {text || "-"}
    </span>
  );
}

function HSEEBadge({ sent }) {
  return sent ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <CheckCircle2 size={12} />
      Envoyé HSEE
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      En attente
    </span>
  );
}

export default function InfirmierDashboard() {
  const navigate = useNavigate();

  const [collaborateurs, setCollaborateurs] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [accidentStats, setAccidentStats] = useState({
    total: 0,
    today: 0,
    this_month: 0,
    sent_hsee: 0,
    recent: [],
  });
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErr("");

      const [collabRes, rdvRes, stockRes, accidentStatsRes, incidentsRes] =
        await Promise.all([
          api.get("/collaborateurs/"),
          api.get("/appointments/rdv/"),
          api.get("/medical/stock/items/"),
          api.get("/medical/accidents-travail/stats/"),
          api.get("/medical/incidents/"),
        ]);

      const collabs = Array.isArray(collabRes.data) ? collabRes.data : [];
      const incidentsData = Array.isArray(incidentsRes.data) ? incidentsRes.data : [];

      setCollaborateurs(collabs);
      setRdvs(Array.isArray(rdvRes.data) ? rdvRes.data : []);
      setStockItems(Array.isArray(stockRes.data) ? stockRes.data : []);
      setAccidentStats(
        accidentStatsRes.data || {
          total: 0,
          today: 0,
          this_month: 0,
          sent_hsee: 0,
          recent: [],
        }
      );

      const dossiersResults = await Promise.all(
        collabs.map(async (collab) => {
          try {
            const dRes = await api.get(`/medical/dossier/${collab.id}/`);
            return {
              dossierId: dRes.data?.id,
              collab,
            };
          } catch (e) {
            console.error("Erreur dossier collaborateur", collab.id, e);
            return null;
          }
        })
      );

      const dossierMap = {};
      dossiersResults.forEach((entry) => {
        if (entry?.dossierId) {
          dossierMap[entry.dossierId] = entry.collab;
        }
      });

      const enrichedIncidents = incidentsData.map((item) => {
        const collab = dossierMap[item.dossier] || {};

        return {
          ...item,
          collaborateur:
            `${collab.prenom || ""} ${collab.nom || ""}`.trim() || "—",
          matricule: collab.matricule || "—",
          segment:
            item.segment ||
            collab.segment_nom ||
            collab.segment?.nom ||
            collab.segment ||
            "—",
          poste_occupe:
            item.poste_occupe ||
            collab.poste_nom ||
            collab.poste?.nom ||
            collab.poste ||
            "—",
          telephone: item.telephone || collab.telephone || collab.tel || "—",
        };
      });

      setIncidents(enrichedIncidents);
    } catch (e) {
      console.error(e);
      setErr("Erreur chargement dashboard infirmier.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const stats = useMemo(() => {
    const stockAlerts = stockItems.filter(
      (item) => item.quantite <= item.seuil_critique
    ).length;

    const rdvToday = rdvs.filter((r) => r.date === today).length;
    const incidentsToday = incidents.filter((i) => i.date_incident === today).length;

    return {
      totalPatients: collaborateurs.length,
      accidentsToday: accidentStats.today || 0,
      incidentsToday,
      rdvToday,
      stockAlerts,
      accidentsSentHSEE: accidentStats.sent_hsee || 0,
    };
  }, [collaborateurs, rdvs, stockItems, accidentStats, incidents, today]);

  const stockAlertsList = useMemo(() => {
    return stockItems.filter((item) => item.quantite <= item.seuil_critique).slice(0, 5);
  }, [stockItems]);

  const rdvTodayList = useMemo(() => {
    return rdvs.filter((r) => r.date === today).slice(0, 5);
  }, [rdvs, today]);

  const recentAccidents = accidentStats.recent || [];

  const recentIncidents = useMemo(() => {
    return [...incidents]
      .sort((a, b) => {
        const da = `${a.date_incident || ""} ${a.heure_incident || ""}`;
        const db = `${b.date_incident || ""} ${b.heure_incident || ""}`;
        return db.localeCompare(da);
      })
      .slice(0, 5);
  }, [incidents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Espace Infirmier</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard Infirmier
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Suivi des patients, soins infirmiers, accidents, stock et rendez-vous.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/infirmier/patients")}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Search size={16} />
            Accueil patient
          </button>

          <button
            onClick={() => navigate("/infirmier/incidents")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ClipboardPlus size={16} />
            Déclarer incident
          </button>

          <button
            onClick={() => navigate("/infirmier/accidents")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ShieldAlert size={16} />
            Accidents de travail
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Collaborateurs"
          value={loading ? "..." : stats.totalPatients}
          subtitle="Patients accessibles"
          icon={<Users size={22} />}
        />
        <StatCard
          title="Incidents aujourd'hui"
          value={loading ? "..." : stats.incidentsToday}
          subtitle="Soins / incidents infirmiers"
          icon={<TriangleAlert size={22} />}
        />
        <StatCard
          title="Accidents aujourd'hui"
          value={loading ? "..." : stats.accidentsToday}
          subtitle="Déclarations d'accidents"
          icon={<ShieldAlert size={22} />}
        />
        <StatCard
          title="Envoyés à HSEE"
          value={loading ? "..." : stats.accidentsSentHSEE}
          subtitle="Accidents transmis"
          icon={<CheckCircle2 size={22} />}
        />
        <StatCard
          title="Stock critique"
          value={loading ? "..." : stats.stockAlerts}
          subtitle="Articles sous le seuil"
          icon={<Pill size={22} />}
          alert
        />
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Actions rapides</h2>
            <p className="text-sm text-slate-500">Accès direct aux tâches fréquentes</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <QuickAction
            title="Accueil patient"
            desc="Chercher un collaborateur et ouvrir son dossier."
            icon={<Users size={20} />}
            onClick={() => navigate("/infirmier/patients")}
          />
          <QuickAction
            title="Ajouter incident"
            desc="Déclarer un soin infirmier ou incident simple."
            icon={<TriangleAlert size={20} />}
            onClick={() => navigate("/infirmier/incidents")}
          />
          <QuickAction
            title="Ajouter accident"
            desc="Déclarer un accident de travail et préparer l'enquête."
            icon={<ShieldAlert size={20} />}
            onClick={() => navigate("/infirmier/accidents")}
          />
          <QuickAction
            title="Gestion stock"
            desc="Voir les entrées, sorties et alertes médicaments."
            icon={<Package size={20} />}
            onClick={() => navigate("/infirmier/stock")}
          />
          <QuickAction
            title="Rendez-vous"
            desc="Consulter les visites et suivis programmés."
            icon={<CalendarDays size={20} />}
            onClick={() => navigate("/infirmier/rdv")}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Incidents récents</h2>
              <p className="text-sm text-slate-500">Derniers soins infirmiers enregistrés</p>
            </div>

            <button
              onClick={() => navigate("/infirmier/incidents")}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Voir tout
              <ArrowUpRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">Chargement...</div>
          ) : recentIncidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Collaborateur</th>
                    <th className="px-3 py-3 font-medium">Matricule</th>
                    <th className="px-3 py-3 font-medium">Lésion</th>
                    <th className="px-3 py-3 font-medium">Soin</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncidents.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 text-slate-700">
                        <div>{item.date_incident}</div>
                        <div className="text-xs text-slate-400">{item.heure_incident}</div>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.collaborateur}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{item.matricule}</td>
                      <td className="px-3 py-3">
                        <InjuryBadge text={item.mode_lesion} />
                      </td>
                      <td className="px-3 py-3 text-slate-700">{item.remarque}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500">
              Aucun incident disponible.
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Accidents récents</h2>
              <p className="text-sm text-slate-500">Dernières déclarations enregistrées</p>
            </div>

            <button
              onClick={() => navigate("/infirmier/accidents")}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Voir tout
              <ArrowUpRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">Chargement...</div>
          ) : recentAccidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Collaborateur</th>
                    <th className="px-3 py-3 font-medium">Matricule</th>
                    <th className="px-3 py-3 font-medium">Lésion</th>
                    <th className="px-3 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAccidents.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 text-slate-700">{item.date_accident}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.collaborateur_prenom} {item.collaborateur_nom}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{item.matricule}</td>
                      <td className="px-3 py-3">
                        <InjuryBadge text={item.nature_lesion} />
                      </td>
                      <td className="px-3 py-3">
                        <HSEEBadge sent={item.envoye_hsee} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500">
              Aucun accident disponible.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Alertes stock</h2>
                <p className="text-sm text-slate-500">Médicaments sous le seuil</p>
              </div>
              <BellRing className="text-red-500" size={20} />
            </div>

            {loading ? (
              <div className="text-sm text-slate-500">Chargement...</div>
            ) : stockAlertsList.length > 0 ? (
              <div className="space-y-3">
                {stockAlertsList.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-red-100 bg-red-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.nom}</p>
                        <p className="text-xs text-slate-500">
                          Seuil minimal: {item.seuil_critique} {item.unite}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{item.quantite}</p>
                        <p className="text-xs text-slate-500">{item.unite}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Aucune alerte stock.</div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Rendez-vous du jour</h2>
                <p className="text-sm text-slate-500">Programme infirmier</p>
              </div>
              <CalendarDays size={20} className="text-slate-700" />
            </div>

            {loading ? (
              <div className="text-sm text-slate-500">Chargement...</div>
            ) : rdvTodayList.length > 0 ? (
              <div className="space-y-3">
                {rdvTodayList.map((rdv) => (
                  <div
                    key={rdv.id}
                    className="rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {rdv.collaborateur_prenom} {rdv.collaborateur_nom}
                        </p>
                        <p className="text-xs text-slate-500">
                          {medecinTypeLabel[rdv.type_medecin] || rdv.type_medecin} ·{" "}
                          {statutLabel[rdv.statut] || rdv.statut}
                        </p>
                      </div>
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {rdv.heure}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Aucun rendez-vous aujourd'hui.</div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Résumé rapide</h2>
              <p className="text-sm text-slate-500">Indicateurs utiles</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Total incidents</span>
                <span className="font-semibold text-slate-900">
                  {loading ? "..." : incidents.length}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Total accidents</span>
                <span className="font-semibold text-slate-900">
                  {loading ? "..." : accidentStats.total}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Accidents ce mois</span>
                <span className="font-semibold text-slate-900">
                  {loading ? "..." : accidentStats.this_month}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Envoyés à HSEE</span>
                <span className="font-semibold text-emerald-600">
                  {loading ? "..." : stats.accidentsSentHSEE}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Articles critiques</span>
                <span className="font-semibold text-red-600">
                  {loading ? "..." : stats.stockAlerts}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2" />
      </div>
    </div>
  );
}