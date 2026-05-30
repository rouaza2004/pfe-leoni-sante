import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, User, Loader2 } from "lucide-react";
import { api } from "@/controllers/api/api";

function Badge({ children, color = "slate" }) {
  const styles = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-rose-100 text-rose-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}

function statusColor(statut) {
  if (statut === "TERMINE") return "green";
  if (statut === "ANNULE") return "red";
  if (statut === "REPORTE") return "yellow";
  return "blue";
}

function formatStatus(statut) {
  if (statut === "PREVU") return "Prévu";
  if (statut === "TERMINE") return "Terminé";
  if (statut === "REPORTE") return "Reporté";
  if (statut === "ANNULE") return "Annulé";
  return statut || "—";
}

export default function RDV() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rdvs, setRdvs] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await api.get("/appointments/rdv/");

        if (cancelled) return;

        const all = Array.isArray(res.data) ? res.data : [];

        const traitantOnly = all.filter(
          (item) => item.type_medecin === "TRAITANT"
        );

        setRdvs(traitantOnly);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setErr("Impossible de charger les rendez-vous.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const rdvDuJour = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rdvs.filter((item) => item.date === today).length;
  }, [rdvs]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement des rendez-vous...</span>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        {err}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Rendez-vous</h1>
        <p className="mt-2 text-sm text-slate-500">
          Liste des rendez-vous programmés pour le médecin traitant.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total RDV</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{rdvs.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">RDV du jour</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{rdvDuJour}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Prévu</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {rdvs.filter((item) => item.statut === "PREVU").length}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste des rendez-vous</h2>
            <p className="text-sm text-slate-500">
              Rendez-vous planifiés pour consultation
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3 font-medium">Collaborateur</th>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 font-medium">Heure</th>
                <th className="py-3 font-medium">Motif</th>
                <th className="py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rdvs.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-4">
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <User className="h-4 w-4 text-slate-400" />
                      {`${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() || "—"}
                    </div>
                  </td>
                  <td className="py-4 text-slate-600">{item.date || "—"}</td>
                  <td className="py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      {item.heure || "—"}
                    </div>
                  </td>
                  <td className="py-4 text-slate-600">{item.motif || "—"}</td>
                  <td className="py-4">
                    <Badge color={statusColor(item.statut)}>
                      {formatStatus(item.statut)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rdvs.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">
              Aucun rendez-vous disponible.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
