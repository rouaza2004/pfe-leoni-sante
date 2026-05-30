import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  ShieldAlert,
  Siren,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import AddRiskModal from "@/views/components/hsee/AddRiskModal";
import HSEEPageHeader from "@/views/components/hsee/HSEEPageHeader";
import RiskCard from "@/views/components/hsee/RiskCard";
import RiskMatrix from "@/views/components/hsee/RiskMatrix";
import RiskSummaryCard from "@/views/components/hsee/RiskSummaryCard";
import {
  computeRiskKpis,
  createRiskFromForm,
  getRiskMapData,
} from "@/models/services/hseeRiskMapService";

function EmptyState({ message }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
      {message}
    </div>
  );
}

export default function HSEERiskMapPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riskMap, setRiskMap] = useState({ risks: [], kpis: null });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingRisk, setIsSavingRisk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getRiskMapData();
        if (cancelled) return;
        setRiskMap(data);
      } catch (err) {
        console.error("Erreur chargement cartographie risques", err);
        if (!cancelled) {
          setError("Impossible de charger la cartographie des risques.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, []);

  const risks = riskMap.risks || [];
  const kpis = riskMap.kpis || computeRiskKpis(risks);

  const sortedRisks = useMemo(
    () => [...risks].sort((a, b) => b.criticality - a.criticality || a.code.localeCompare(b.code)),
    [risks],
  );

  const handleAddRisk = async (formValues) => {
    try {
      setIsSavingRisk(true);

      setRiskMap((current) => {
        const nextRisk = createRiskFromForm(formValues, current.risks || []);
        const nextRisks = [nextRisk, ...(current.risks || [])];
        return {
          risks: nextRisks,
          kpis: computeRiskKpis(nextRisks),
        };
      });

      setIsAddModalOpen(false);
      toast.success("Le nouveau risque a été ajouté à la cartographie.");
    } finally {
      setIsSavingRisk(false);
    }
  };

  return (
    <div className="space-y-8 bg-slate-50 pb-6">
      <AddRiskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddRisk}
        saving={isSavingRisk}
      />

      <HSEEPageHeader
        eyebrow="HSEE Risk Mapping"
        title="Cartographie des Risques"
        subtitle="Identification, évaluation et suivi des risques professionnels."
        actions={
          <>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Exporter
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Nouveau Risque
            </button>
          </>
        }
      />

      {error ? (
        <section className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
          {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <RiskSummaryCard
          label="Risques Critiques"
          value={loading ? "..." : kpis.critiques}
          hint="Surveillance immédiate"
          icon={Siren}
          accentClass="bg-rose-100 text-rose-700"
        />
        <RiskSummaryCard
          label="Risques Élevés"
          value={loading ? "..." : kpis.eleves}
          hint="Priorité opérationnelle"
          icon={ShieldAlert}
          accentClass="bg-orange-100 text-orange-700"
        />
        <RiskSummaryCard
          label="En Traitement"
          value={loading ? "..." : kpis.enTraitement}
          hint="Actions en cours"
          icon={TimerReset}
          accentClass="bg-blue-100 text-blue-700"
        />
        <RiskSummaryCard
          label="Maîtrisés"
          value={loading ? "..." : kpis.maitrises}
          hint="Risques stabilisés"
          icon={CheckCircle2}
          accentClass="bg-emerald-100 text-emerald-700"
        />
      </section>

      {loading ? (
        <section className="flex min-h-[360px] items-center justify-center rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Chargement de la cartographie des risques...</span>
          </div>
        </section>
      ) : risks.length === 0 ? (
        <EmptyState message="Aucun risque disponible pour la cartographie actuelle." />
      ) : (
        <>
          <RiskMatrix risks={sortedRisks} />

          <section className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Registre détaillé des risques
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Vue opérationnelle des risques évalués, de leur criticité et des mesures en place.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Voir tous les risques
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              {sortedRisks.map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

