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

const QuickAction = ({ title, desc, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition w-full"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
      <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  </button>
);

export default function MedecinTravailDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard Médecin du Travail
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Suivi des visites médicales, dossiers médicaux et aptitude au travail
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Visites aujourd'hui" value="2" icon={<Calendar size={22} />} />
        <StatCard title="Visites en retard" value="18" icon={<AlertTriangle size={22} />} danger />
        <StatCard title="Conformité" value="82%" icon={<ShieldCheck size={22} />} />
        <StatCard title="Collaborateurs suivis" value="124" icon={<Users size={22} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Actions rapides
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Accès direct aux principaux modules du médecin du travail
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              title="Collaborateurs"
              desc="Consulter la liste des collaborateurs et ouvrir leur dossier médical."
              icon={<Users className="h-5 w-5 text-slate-700" />}
              onClick={() => navigate("/medecin-travail/collaborateurs")}
            />

            <QuickAction
              title="Dossiers médicaux"
              desc="Créer ou mettre à jour les dossiers médicaux des collaborateurs."
              icon={<FileText className="h-5 w-5 text-slate-700" />}
              onClick={() => navigate("/medecin-travail/collaborateurs")}
            />

            <QuickAction
              title="Examens initiaux"
              desc="Saisir les visites d’embauche et les examens médicaux initiaux."
              icon={<Stethoscope className="h-5 w-5 text-slate-700" />}
              onClick={() => navigate("/medecin-travail/collaborateurs")}
            />

            <QuickAction
              title="Examens ultérieurs"
              desc="Ajouter les visites périodiques, reprises et contrôles."
              icon={<ClipboardList className="h-5 w-5 text-slate-700" />}
              onClick={() => navigate("/medecin-travail/collaborateurs")}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900">Rappels</h2>
          <div className="space-y-3 mt-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                18 visites en retard
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Planifier rapidement les visites périodiques en attente.
              </p>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-800">
                Aptitude au travail
              </p>
              <p className="text-sm text-sky-700 mt-1">
                Vérifier la création des fiches d’aptitude après chaque visite importante.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
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
                  Collaborateur EMP001 — aujourd’hui
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
                  Collaborateur EMP014 — aujourd’hui
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
                  Collaborateur EMP020 — hier
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