import { useEffect, useMemo, useState } from "react";
import {
  Users,
  TriangleAlert,
  Pill,
  CalendarDays,
  ArrowUpRight,
  BellRing,
  Package,
  ShieldAlert,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/api";
import { DEFAULT_SITE_FILTER_OPTIONS } from "@/utils/siteOptions";

const StatCard = ({ title, value, subtitle, icon, alert = false, iconClass = "", onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl border bg-white p-2.5 shadow-sm transition hover:shadow-md ${
      alert ? "border-red-200" : "border-slate-200"
    } ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className="flex items-start justify-between gap-2.5">
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{title}</p>
        <p className={`mt-1 text-[22px] font-bold leading-none ${alert ? "text-red-600" : "text-slate-900"}`}>
          {value}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">{subtitle}</p>
      </div>

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          alert ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"
        } ${iconClass}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon, onClick, iconClass = "" }) => (
  <button
    onClick={onClick}
    className="rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div
      className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ${iconClass}`}
    >
      {icon}
    </div>
    <h3 className="text-[13px] font-semibold leading-tight text-slate-900">{title}</h3>
    <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{desc}</p>
  </button>
);

const medecinTypeLabel = {
  TRAITANT: "M\u00e9decin traitant",
  TRAVAIL: "M\u00e9decin du travail",
  CONTROLEUR: "M\u00e9decin contr\u00f4leur",
};

const statutLabel = {
  PREVU: "Pr\u00e9vu",
  TERMINE: "Termin\u00e9",
  REPORTE: "Report\u00e9",
  ANNULE: "Annul\u00e9",
};

function InjuryBadge({ text }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
      <TriangleAlert size={10} />
      {text || "-"}
    </span>
  );
}

function HSEEBadge({ sent }) {
  return sent ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
      <CheckCircle2 size={10} />
      Envoy\u00e9 HSEE
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
      En attente
    </span>
  );
}

function SectionShell({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="text-[10px] text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
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
  const [siteFilter, setSiteFilter] = useState("all");
  const [siteOptions, setSiteOptions] = useState(DEFAULT_SITE_FILTER_OPTIONS);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [siteFilter]);

  const loadSites = async () => {
    try {
      const res = await api.get("/sites/");
      const sites = Array.isArray(res.data) ? res.data : [];
      setSiteOptions([
        ...DEFAULT_SITE_FILTER_OPTIONS.slice(0, 1),
        ...sites
          .map((site) => String(site?.nom || "").trim())
          .filter(Boolean)
          .map((site) => ({ value: site, label: site })),
      ]);
    } catch (e) {
      console.error(e);
      setSiteOptions(DEFAULT_SITE_FILTER_OPTIONS);
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErr("");
      const siteParams = siteFilter !== "all" ? { params: { site: siteFilter } } : undefined;

      const [collabRes, rdvRes, stockRes, accidentStatsRes, incidentsRes] = await Promise.all([
        api.get("/collaborateurs/", siteParams),
        api.get("/appointments/rdv/", siteParams),
        api.get("/medical/stock/items/"),
        api.get("/medical/accidents-travail/stats/", siteParams),
        api.get("/medical/incidents/", siteParams),
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

      setIncidents(
        incidentsData.map((item) => ({
          ...item,
          collaborateur:
            `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() || "\u2014",
          matricule: item.matricule || "\u2014",
        }))
      );
    } catch (e) {
      console.error(e);
      setErr("Erreur chargement dashboard infirmier.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const stats = useMemo(() => {
    const stockAlerts = stockItems.filter((item) => item.quantite <= item.seuil_critique).length;
    const incidentsToday = incidents.filter((i) => i.date_incident === today).length;

    return {
      totalPatients: collaborateurs.length,
      accidentsToday: accidentStats.today || 0,
      incidentsToday,
      stockAlerts,
      accidentsSentHSEE: accidentStats.sent_hsee || 0,
    };
  }, [collaborateurs, stockItems, accidentStats, incidents, today]);

  const stockAlertsList = useMemo(
    () => stockItems.filter((item) => item.quantite <= item.seuil_critique).slice(0, 4),
    [stockItems]
  );

  const rdvTodayList = useMemo(() => rdvs.filter((r) => r.date === today).slice(0, 4), [rdvs, today]);

  const recentAccidents = (accidentStats.recent || []).slice(0, 4);

  const recentIncidents = useMemo(() => {
    return [...incidents]
      .sort((a, b) => {
        const da = `${a.date_incident || ""} ${a.heure_incident || ""}`;
        const db = `${b.date_incident || ""} ${b.heure_incident || ""}`;
        return db.localeCompare(da);
      })
      .slice(0, 4);
  }, [incidents]);

  return (
    <div className="space-y-2">
      <div className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">Espace Infirmier</p>
          <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
            Dashboard Infirmier
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Suivi des patients, soins infirmiers, accidents, stock et rendez-vous.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <label className="mb-1 block text-[11px] font-medium text-slate-500">Site</label>
          <select
            value={siteFilter}
            onChange={(event) => setSiteFilter(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
          >
            {siteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {err}
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Collaborateurs"
          value={loading ? "..." : stats.totalPatients}
          subtitle="Patients accessibles"
          icon={<Users size={16} className="text-emerald-600" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Incidents aujourd'hui"
          value={loading ? "..." : stats.incidentsToday}
          subtitle="Soins / incidents infirmiers"
          icon={<TriangleAlert size={16} className="text-rose-600" />}
          iconClass="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Accidents aujourd'hui"
          value={loading ? "..." : stats.accidentsToday}
          subtitle={"D\u00e9clarations d'accidents"}
          icon={<ShieldAlert size={16} className="text-amber-600" />}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          title={"Envoy\u00e9s \u00e0 HSEE"}
          value={loading ? "..." : stats.accidentsSentHSEE}
          subtitle="Accidents transmis"
          icon={<CheckCircle2 size={16} className="text-blue-600" />}
          iconClass="bg-blue-50 text-blue-600"
          onClick={() => navigate("/infirmier/enquete-initiale?filter=sent")}
        />
        <StatCard
          title="Stock critique"
          value={loading ? "..." : stats.stockAlerts}
          subtitle="Articles sous le seuil"
          icon={<Pill size={16} />}
          alert
        />
      </div>

      <SectionShell title="Actions rapides" subtitle={"Acc\u00e8s direct aux t\u00e2ches fr\u00e9quentes"}>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <QuickAction
            title="Accueil patient"
            desc="Ouvrir le dossier."
            icon={<Users size={15} className="text-emerald-600" />}
            onClick={() => navigate("/infirmier/patients")}
            iconClass="bg-emerald-50 text-emerald-600"
          />
          <QuickAction
            title="Ajouter incident"
            desc={"D\u00e9clarer un incident."}
            icon={<TriangleAlert size={15} className="text-rose-600" />}
            onClick={() => navigate("/infirmier/incidents")}
            iconClass="bg-rose-50 text-rose-600"
          />
          <QuickAction
            title="Ajouter accident"
            desc={"Pr\u00e9parer l'enqu\u00eate."}
            icon={<ShieldAlert size={15} className="text-amber-600" />}
            onClick={() => navigate("/infirmier/accidents")}
            iconClass="bg-amber-50 text-amber-600"
          />
          <QuickAction
            title="Maladies pro."
            desc={"D\u00e9claration rapide."}
            icon={<FileText size={15} className="text-slate-700" />}
            onClick={() => navigate("/infirmier/maladies-professionnelles")}
            iconClass="bg-slate-100 text-slate-700"
          />
          <QuickAction
            title="Gestion stock"
            desc={"Suivre les alertes m\u00e9dicaments."}
            icon={<Package size={15} className="text-indigo-600" />}
            onClick={() => navigate("/infirmier/stock")}
            iconClass="bg-indigo-50 text-indigo-600"
          />
          <QuickAction
            title="Rendez-vous"
            desc={"Visites programm\u00e9es."}
            icon={<CalendarDays size={15} className="text-blue-600" />}
            onClick={() => navigate("/infirmier/rdv")}
            iconClass="bg-blue-50 text-blue-600"
          />
        </div>
      </SectionShell>

      <div className="grid gap-2 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
        <SectionShell
          title={"Incidents r\u00e9cents"}
          subtitle={"Derniers soins enregistr\u00e9s"}
          action={
            <button
              onClick={() => navigate("/infirmier/incidents")}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              Voir tout
              <ArrowUpRight size={13} />
            </button>
          }
        >
          {loading ? (
            <div className="py-4 text-center text-slate-500">Chargement...</div>
          ) : recentIncidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-1.5 py-1 font-medium">Date</th>
                    <th className="px-1.5 py-1 font-medium">Collaborateur</th>
                    <th className="px-1.5 py-1 font-medium">Matricule</th>
                    <th className="px-1.5 py-1 font-medium">Lésion</th>
                    <th className="px-1.5 py-1 font-medium">Soin</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncidents.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-1.5 py-1 text-slate-700">
                        <div>{item.date_incident}</div>
                        <div className="text-[10px] text-slate-400">{item.heure_incident}</div>
                      </td>
                      <td className="px-1.5 py-1 font-medium text-slate-900">{item.collaborateur}</td>
                      <td className="px-1.5 py-1 text-slate-700">{item.matricule}</td>
                      <td className="px-1.5 py-1">
                        <InjuryBadge text={item.mode_lesion} />
                      </td>
                      <td className="px-1.5 py-1 text-slate-700">{item.remarque}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500">Aucun incident disponible.</div>
          )}
        </SectionShell>

        <SectionShell
          title={"Accidents r\u00e9cents"}
          subtitle={"Derni\u00e8res d\u00e9clarations"}
          action={
            <button
              onClick={() => navigate("/infirmier/accidents")}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              Voir tout
              <ArrowUpRight size={13} />
            </button>
          }
        >
          {loading ? (
            <div className="py-4 text-center text-slate-500">Chargement...</div>
          ) : recentAccidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-1.5 py-1 font-medium">Date</th>
                    <th className="px-1.5 py-1 font-medium">Collaborateur</th>
                    <th className="px-1.5 py-1 font-medium">Matricule</th>
                    <th className="px-1.5 py-1 font-medium">Lésion</th>
                    <th className="px-1.5 py-1 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAccidents.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-1.5 py-1 text-slate-700">{item.date_accident}</td>
                      <td className="px-1.5 py-1 font-medium text-slate-900">
                        {item.collaborateur_prenom} {item.collaborateur_nom}
                      </td>
                      <td className="px-1.5 py-1 text-slate-700">{item.matricule}</td>
                      <td className="px-1.5 py-1">
                        <InjuryBadge text={item.nature_lesion} />
                      </td>
                      <td className="px-1.5 py-1">
                        <HSEEBadge sent={item.envoye_hsee} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500">Aucun accident disponible.</div>
          )}
        </SectionShell>

        <div className="space-y-2">
          <SectionShell
            title="Alertes stock"
            subtitle={"M\u00e9dicaments sous le seuil"}
            action={<BellRing className="text-red-500" size={14} />}
          >
            {loading ? (
              <div className="text-xs text-slate-500">Chargement...</div>
            ) : stockAlertsList.length > 0 ? (
              <div className="space-y-1.5">
                {stockAlertsList.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-red-100 bg-red-50 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-900">{item.nom}</p>
                        <p className="text-[10px] text-slate-500">
                          Min: {item.seuil_critique} {item.unite}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">{item.quantite}</p>
                        <p className="text-[10px] text-slate-500">{item.unite}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Aucune alerte stock.</div>
            )}
          </SectionShell>

          <SectionShell
            title="Rendez-vous du jour"
            subtitle="Programme infirmier"
            action={<CalendarDays size={14} className="text-slate-700" />}
          >
            {loading ? (
              <div className="text-xs text-slate-500">Chargement...</div>
            ) : rdvTodayList.length > 0 ? (
              <div className="space-y-1.5">
                {rdvTodayList.map((rdv) => (
                  <div
                    key={rdv.id}
                    className="rounded-2xl border border-slate-200 p-2 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-900">
                          {rdv.collaborateur_prenom} {rdv.collaborateur_nom}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {medecinTypeLabel[rdv.type_medecin] || rdv.type_medecin} ·{" "}
                          {statutLabel[rdv.statut] || rdv.statut}
                        </p>
                      </div>
                      <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        {rdv.heure}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Aucun rendez-vous aujourd'hui.</div>
            )}
          </SectionShell>

          <SectionShell title={"R\u00e9sum\u00e9 rapide"} subtitle="Indicateurs utiles">
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Total incidents</span>
                <span className="font-semibold text-slate-900">{loading ? "..." : incidents.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Total accidents</span>
                <span className="font-semibold text-slate-900">{loading ? "..." : accidentStats.total}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Accidents ce mois</span>
                <span className="font-semibold text-slate-900">
                  {loading ? "..." : accidentStats.this_month}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Envoyés à HSEE</span>
                <span className="font-semibold text-emerald-600">
                  {loading ? "..." : stats.accidentsSentHSEE}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Articles critiques</span>
                <span className="font-semibold text-red-600">{loading ? "..." : stats.stockAlerts}</span>
              </div>
            </div>
          </SectionShell>
        </div>
      </div>
    </div>
  );
}


