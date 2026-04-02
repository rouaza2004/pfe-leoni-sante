import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/dashboard/StatCard";
import {
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Users,
  FileText,
  Stethoscope,
  ClipboardList,
  Activity,
} from "lucide-react";
import { api } from "@/api/api";
import { getUserRole, getUsername } from "@/auth/auth";

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

const StatusBadge = ({ label, tone }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClasses[tone]}`}
  >
    {label}
  </span>
);

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
    return (
      tryParse("user") ||
      tryParse("profile") ||
      tryParse("currentUser") ||
      null
    );
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
        const name = `${item.collaborateur_prenom || ""} ${
          item.collaborateur_nom || ""
        }`.trim();
        const status = rdvStatusLabel[item.statut] || item.statut || "En attente";
        const statusTone = rdvStatusTone[item.statut] || "muted";
        const description =
          item.motif ||
          medecinTypeLabel[item.type_medecin] ||
          "Consultation médicale";

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
      `${inProgress.collaborateur_prenom || ""} ${
        inProgress.collaborateur_nom || ""
      }`.trim() || "—"
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
    if (ratio >= 0.8) return "bg-emerald-500/70";
    if (ratio >= 0.5) return "bg-amber-500/70";
    return "bg-sky-500/70";
  }, [rdvsDuJour.length, CAPACITY_MAX]);

  const conformite = useMemo(() => {
    if (!rdvsDuJour.length) return 0;
    return Math.round((termines / rdvsDuJour.length) * 100);
  }, [rdvsDuJour.length, termines]);

  const collaborateursSuivis = useMemo(() => {
    const keys = rdvs.map((item) => {
      if (item.collaborateur_id) return `id:${item.collaborateur_id}`;
      if (item.collaborateur?.id) return `id:${item.collaborateur.id}`;
      const fullName = `${item.collaborateur_prenom || ""} ${
        item.collaborateur_nom || ""
      }`.trim();
      return fullName ? `name:${fullName}` : `rdv:${item.id}`;
    });
    return new Set(keys).size;
  }, [rdvs]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{headerTitle}</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tableau de bord — {subtitleDate}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Visites aujourd'hui"
          value={`${rdvsDuJour.length}`}
          icon={<Calendar size={22} />}
          tone="info"
        />
        <StatCard
          title="Visites en retard"
          value={`${visitesEnRetard}`}
          icon={<AlertTriangle size={22} />}
          tone="warning"
        />
        <StatCard
          title="Conformité"
          value={`${conformite}%`}
          icon={<ShieldCheck size={22} />}
          tone="success"
        />
        <StatCard
          title="Collaborateurs suivis"
          value={`${collaborateursSuivis}`}
          icon={<Users size={22} />}
          tone="info"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Capacité du jour</h2>
            <p className="text-sm text-slate-500 mt-1">
              Maximum {CAPACITY_MAX} patients par jour
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-slate-900">
              {rdvsDuJour.length} / {CAPACITY_MAX}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2.5 rounded-full bg-slate-100/80 overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${progressTone}`}
            style={{ width: progressWidth }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200">
            {termines} terminés
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-amber-200">
            {restants} restants
          </span>
          <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white shadow-sm">
            En consultation : {enConsultation}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Rendez-vous du jour
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Contrôles médicaux, validations de reprise et dossiers à traiter.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate("/medecin-travail/collaborateurs")}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Users size={15} />
                Recherche collaborateur
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <FileText size={15} />
                Voir l'historique
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {rdvLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                Chargement des rendez-vous...
              </div>
            ) : rendezVousRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                Aucun rendez-vous prévu pour aujourd'hui.
              </div>
            ) : (
              rendezVousRows.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-3 transition hover:border-slate-300 lg:grid-cols-[74px_minmax(0,1fr)_auto]"
                >
                  <div className="rounded-2xl bg-white px-3 py-2.5 text-center shadow-sm ring-1 ring-slate-100">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Heure
                    </p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                      {item.time}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.reference}
                        </p>
                      </div>
                      <StatusBadge label={item.status} tone={item.statusTone} />
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-600">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between gap-2 sm:flex-row lg:flex-col lg:items-end">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Stethoscope size={14} />
                      {item.medecinType}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/medecin-travail/collaborateurs/${item.collabId}/dossier`
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      Ouvrir dossier
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900">Rappels</h2>
          <div className="space-y-3 mt-5">
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 shadow-sm">
              <p className="text-sm font-semibold text-amber-800">
                18 visites en retard
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Planifier rapidement les visites périodiques en attente.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-4 shadow-sm">
              <p className="text-sm font-semibold text-sky-800">
                Aptitude au travail
              </p>
              <p className="text-sm text-sky-700 mt-1">
                Vérifier la création des fiches d’aptitude après chaque visite importante.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 shadow-sm">
              <p className="text-sm font-semibold text-emerald-800">
                Dossiers médicaux
              </p>
              <p className="text-sm text-emerald-700 mt-1">
                Les dossiers remplis ici seront visibles aussi par l’infirmier et le médecin traitant.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Activité récente
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Dossier médical mis à jour
                </p>
                <p className="text-sm text-slate-500">
                  Collaborateur 1056538197 — aujourd’hui
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Examen initial enregistré
                </p>
                <p className="text-sm text-slate-500">
                  Collaborateur 1694416702 — aujourd’hui
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Examen complémentaire demandé
                </p>
                <p className="text-sm text-slate-500">
                  Collaborateur 1683114410 — hier
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Workflow conseillé
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">
                1. Ouvrir collaborateur
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Chercher le collaborateur concerné depuis la liste principale.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">
                2. Vérifier / compléter dossier médical
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Compléter entreprise et localité avant les actes médicaux.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">
                3. Ajouter examen
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Examen initial ou ultérieur selon le contexte de visite.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">
                4. Créer aptitude / analyses si besoin
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Finaliser la visite avec fiche aptitude et examens complémentaires.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
