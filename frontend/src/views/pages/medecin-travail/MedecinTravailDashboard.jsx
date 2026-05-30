import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Users,
  FileText,
  Stethoscope,
  Activity,
} from "lucide-react";
import { api } from "@/controllers/api/api";
import { getUserRole, getUsername } from "@/controllers/auth/auth";

const getGreetingByTime = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 11) return "Bonjour";
  if (hour >= 12 && hour <= 17) return "Bon après-midi";
  return "Bonsoir";
};

const formatFrenchDate = (date = new Date()) => {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString("fr-FR");
  }
};

const getDisplayNameFromUser = (user, fallbackUsername, role) => {
  if (!user || typeof user !== "object") {
    return fallbackUsername || (role ? "Docteur" : "");
  }

  const first =
    user.first_name ||
    user.firstName ||
    user.prenom ||
    user?.user?.prenom ||
    "";
  const last =
    user.last_name ||
    user.lastName ||
    user.nom ||
    user?.user?.nom ||
    "";
  const full =
    user.full_name ||
    user.fullName ||
    user.name ||
    user.username ||
    user.doctor_name ||
    user.medecin_name ||
    user?.profile?.name ||
    "";

  const combined = `${first} ${last}`.trim();
  const baseName = full || combined || fallbackUsername || "";
  if (!baseName) return role ? "Docteur" : "";

  const hasDr = /\bdr\.?\b/i.test(baseName);
  const isDoctor = ["MEDECIN_TRAVAIL", "MEDECIN_TRAITANT", "MEDECIN_CONTROLEUR"].includes(
    role
  );
  if (hasDr || !isDoctor) return baseName;
  return `Dr. ${baseName}`;
};

const statusClasses = {
  dark: "border-slate-900 bg-slate-900 text-white",
  soft: "border-slate-200 bg-slate-100 text-slate-800",
  muted: "border-slate-200 bg-slate-50 text-slate-700",
};

const medecinTypeLabel = {
  TRAITANT: "Médecin traitant",
  TRAVAIL: "Médecin du travail",
  CONTROLEUR: "Médecin contrôleur",
};

const rdvStatusLabel = {
  PREVU: "En attente",
  TERMINE: "Terminé",
  REPORTE: "Reporté",
  ANNULE: "Annulé",
};

const rdvStatusTone = {
  PREVU: "muted",
  TERMINE: "soft",
  REPORTE: "muted",
  ANNULE: "muted",
};

const StatCard = ({ title, value, subtitle, icon, iconClass = "", alert = false }) => (
  <div
    className={`rounded-2xl border bg-white p-2.5 shadow-sm transition hover:shadow-md ${
      alert ? "border-red-200" : "border-slate-200"
    }`}
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

const StatusBadge = ({ label, tone }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClasses[tone]}`}
  >
    {label}
  </span>
);

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

export default function MedecinTravailDashboard() {
  const navigate = useNavigate();
  const [rdvs, setRdvs] = useState([]);
  const [rdvLoading, setRdvLoading] = useState(true);

  const CAPACITY_MAX = 20;
  const role = getUserRole();
  const fallbackUsername = getUsername();

  const storedUser = useMemo(() => {
    const tryParse = (key) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };
    return tryParse("user") || tryParse("profile") || tryParse("currentUser") || null;
  }, []);

  const displayName = useMemo(
    () => getDisplayNameFromUser(storedUser, fallbackUsername, role),
    [storedUser, fallbackUsername, role]
  );

  const greeting = useMemo(() => getGreetingByTime(), []);
  const subtitleDate = useMemo(() => formatFrenchDate(), []);
  const headerTitle = displayName ? `${greeting}, ${displayName}` : greeting;

  useEffect(() => {
    let cancelled = false;

    const loadRdvs = async () => {
      try {
        setRdvLoading(true);
        const res = await api.get("/appointments/rdv/");
        if (cancelled) return;

        const all = Array.isArray(res.data) ? res.data : [];
        const travailOnly = all.filter(
          (item) =>
            item.type_medecin === "TRAVAIL" ||
            item.type_medecin === "MEDECIN_TRAVAIL"
        );
        setRdvs(travailOnly);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setRdvs([]);
        }
      } finally {
        if (!cancelled) {
          setRdvLoading(false);
        }
      }
    };

    loadRdvs();

    return () => {
      cancelled = true;
    };
  }, []);

  const rdvsDuJour = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rdvs.filter((item) => item.date === today);
  }, [rdvs]);

  const rendezVousRows = useMemo(() => {
    const normalizeTime = (val) => {
      if (!val) return "--:--";
      const str = String(val);
      return str.length >= 5 ? str.slice(0, 5) : str;
    };

    return [...rdvsDuJour]
      .sort((a, b) => String(a.heure).localeCompare(String(b.heure)))
      .map((item) => {
        const name = `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim();
        const status = rdvStatusLabel[item.statut] || item.statut || "En attente";
        const statusTone = rdvStatusTone[item.statut] || "muted";
        const description =
          item.motif || medecinTypeLabel[item.type_medecin] || "Consultation médicale";

        return {
          id: item.id,
          time: normalizeTime(item.heure),
          name: name || "Collaborateur",
          reference: item.matricule || "—",
          description,
          status,
          statusTone,
          medecinType: medecinTypeLabel[item.type_medecin] || "Consultation médicale",
          collabId: item.collaborateur,
        };
      });
  }, [rdvsDuJour]);

  const visitesEnRetard = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rdvs.filter(
      (item) =>
        item.date &&
        item.date < today &&
        item.statut !== "TERMINE" &&
        item.statut !== "ANNULE"
    ).length;
  }, [rdvs]);

  const termines = useMemo(
    () => rdvsDuJour.filter((item) => item.statut === "TERMINE").length,
    [rdvsDuJour]
  );

  const restants = useMemo(
    () => Math.max(rdvsDuJour.length - termines, 0),
    [rdvsDuJour, termines]
  );

  const enConsultation = useMemo(() => {
    const inProgress =
      rdvsDuJour.find((item) => item.statut === "EN_COURS") ||
      rdvsDuJour.find((item) => item.statut === "PREVU");
    if (!inProgress) return "—";
    return (
      `${inProgress.collaborateur_prenom || ""} ${inProgress.collaborateur_nom || ""}`.trim() ||
      "—"
    );
  }, [rdvsDuJour]);

  const progressWidth = useMemo(() => {
    if (!CAPACITY_MAX) return "0%";
    const ratio = Math.min(rdvsDuJour.length / CAPACITY_MAX, 1);
    return `${Math.round(ratio * 100)}%`;
  }, [rdvsDuJour.length, CAPACITY_MAX]);

  const progressTone = useMemo(() => {
    if (!CAPACITY_MAX) return "bg-slate-300";
    const ratio = rdvsDuJour.length / CAPACITY_MAX;
    if (ratio >= 0.8) return "bg-emerald-500/80";
    if (ratio >= 0.5) return "bg-amber-500/80";
    return "bg-sky-500/80";
  }, [rdvsDuJour.length, CAPACITY_MAX]);

  const conformite = useMemo(() => {
    if (!rdvsDuJour.length) return 0;
    return Math.round((termines / rdvsDuJour.length) * 100);
  }, [rdvsDuJour.length, termines]);

  const collaborateursSuivis = useMemo(() => {
    const keys = rdvs.map((item) => {
      if (item.collaborateur_id) return `id:${item.collaborateur_id}`;
      if (item.collaborateur?.id) return `id:${item.collaborateur.id}`;
      const fullName = `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim();
      return fullName ? `name:${fullName}` : `rdv:${item.id}`;
    });
    return new Set(keys).size;
  }, [rdvs]);

  return (
    <div className="space-y-2">
      <div className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">Espace Médecin du travail</p>
          <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
            {headerTitle}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">Tableau de bord • {subtitleDate}</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Visites aujourd'hui"
          value={rdvsDuJour.length}
          subtitle="Planning du jour"
          icon={<Calendar size={16} className="text-blue-600" />}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Visites en retard"
          value={visitesEnRetard}
          subtitle="À replanifier"
          icon={<AlertTriangle size={16} className="text-red-600" />}
          iconClass="bg-red-50 text-red-600"
          alert={visitesEnRetard > 0}
        />
        <StatCard
          title="Conformité"
          value={`${conformite}%`}
          subtitle="Visites terminées"
          icon={<ShieldCheck size={16} className="text-emerald-600" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Collaborateurs suivis"
          value={collaborateursSuivis}
          subtitle="Patients accessibles"
          icon={<Users size={16} className="text-indigo-600" />}
          iconClass="bg-indigo-50 text-indigo-600"
        />
      </div>

      <SectionShell
        title="Capacité du jour"
        subtitle={`Maximum ${CAPACITY_MAX} patients par jour`}
        action={
          <span className="text-[18px] font-bold leading-none text-slate-900">
            {rdvsDuJour.length} / {CAPACITY_MAX}
          </span>
        }
      >
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${progressTone}`} style={{ width: progressWidth }} />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
            {termines} terminés
          </span>
          <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
            {restants} restants
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200">
            En consultation : {enConsultation}
          </span>
        </div>
      </SectionShell>

      <div className="grid gap-2 xl:grid-cols-[1.55fr_0.85fr]">
        <SectionShell
          title="Rendez-vous du jour"
          subtitle="Contrôles médicaux, validations de reprise et dossiers à traiter"
          action={
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => navigate("/medecin-travail/collaborateurs")}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-slate-800"
              >
                <Users size={13} />
                Recherche
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <FileText size={13} />
                Historique
              </button>
            </div>
          }
        >
          <div className="space-y-1.5">
            {rdvLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-xs text-slate-500">
                Chargement des rendez-vous...
              </div>
            ) : rendezVousRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-xs text-slate-500">
                Aucun rendez-vous prévu pour aujourd'hui.
              </div>
            ) : (
              rendezVousRows.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition hover:border-slate-300 md:grid-cols-[64px_minmax(0,1fr)_auto]"
                >
                  <div className="rounded-xl bg-white px-2 py-2 text-center shadow-sm ring-1 ring-slate-100">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Heure
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-slate-900">
                      {item.time}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500">{item.reference}</p>
                      </div>
                      <StatusBadge label={item.status} tone={item.statusTone} />
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-600">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between gap-1.5 md:items-end">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Stethoscope size={12} />
                      {item.medecinType}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/medecin-travail/collaborateurs/${item.collabId}/dossier`)
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      Ouvrir dossier
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionShell>

        <SectionShell title="Rappels" subtitle="Points d'attention du service médical">
          <div className="space-y-1.5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-2.5">
              <p className="text-[11px] font-semibold text-amber-800">18 visites en retard</p>
              <p className="mt-0.5 text-[10px] text-amber-700">
                Planifier rapidement les visites périodiques en attente.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-2.5">
              <p className="text-[11px] font-semibold text-sky-800">Aptitude au travail</p>
              <p className="mt-0.5 text-[10px] text-sky-700">
                Vérifier la création des fiches d'aptitude après chaque visite importante.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5">
              <p className="text-[11px] font-semibold text-emerald-800">Dossiers médicaux</p>
              <p className="mt-0.5 text-[10px] text-emerald-700">
                Les dossiers remplis ici seront visibles aussi par l'infirmier et le médecin traitant.
              </p>
            </div>
          </div>
        </SectionShell>
      </div>

      <div className="grid gap-2 xl:grid-cols-2">
        <SectionShell title="Activité récente" subtitle="Dernières actions enregistrées">
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-2xl border border-slate-200 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-900">Dossier médical mis à jour</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Collaborateur 1056538197 — aujourd'hui
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-slate-200 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-900">Examen initial enregistré</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Collaborateur 1694416702 — aujourd'hui
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-slate-200 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-900">Examen complémentaire demandé</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Collaborateur 1683114410 — hier
                </p>
              </div>
            </div>
          </div>
        </SectionShell>

        <SectionShell title="Workflow conseillé" subtitle="Étapes recommandées">
          <div className="space-y-1.5">
            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-900">1. Ouvrir collaborateur</p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Chercher le collaborateur concerné depuis la liste principale.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-900">
                2. Vérifier / compléter dossier médical
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Compléter entreprise et localité avant les actes médicaux.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-900">3. Ajouter examen</p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Examen initial ou ultérieur selon le contexte de visite.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-900">
                4. Créer aptitude / analyses si besoin
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Finaliser la visite avec fiche aptitude et examens complémentaires.
              </p>
            </div>
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

