import { Fragment, useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, FileText, Search } from "lucide-react";

import { getMedecinControleurHistory } from "@/services/medecinControleurHistoryService";

const filters = [
  { id: "all", label: "Tous" },
  { id: "controle", label: "Contrôle médical" },
  { id: "expertise", label: "Demande d'expertise" },
];

function firstArray(...values) {
  return values.find((value) => Array.isArray(value)) || [];
}

function extractHistoryRecords(payload, type) {
  const combined = firstArray(
    payload,
    payload?.records,
    payload?.history,
    payload?.historique,
    payload?.dossiers
  );

  if (type === "controle") {
    return firstArray(
      payload?.controles,
      payload?.controles_medicaux,
      payload?.controle_medical_history,
      payload?.history?.controles,
      payload?.historique?.controles,
      payload?.records?.controles,
      combined.filter?.((item) => item.type === "controle")
    );
  }

  return firstArray(
    payload?.expertises,
    payload?.demandes_expertise,
    payload?.demande_expertise_history,
    payload?.history?.expertises,
    payload?.historique?.expertises,
    payload?.records?.expertises,
    combined.filter?.((item) => item.type === "expertise")
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/40 p-6 text-sm text-slate-600 shadow-sm shadow-slate-200/40">
      {text}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

function buildSummary(record) {
  if (record.type === "controle") {
    return record.avis_medecin_controleur || record.repos_prescrit || "--";
  }

  return record.autres_missions || record.aptitude_poste || record.destinataire || "--";
}

export default function HistoriquePage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const history = await getMedecinControleurHistory();

        if (cancelled) return;

        const controles = extractHistoryRecords(history, "controle").map(
          (item) => ({
            ...item,
            id: `controle-${item.id}`,
            recordId: item.id,
            type: "controle",
            typeLabel: "Contrôle médical",
            matricule_display: item.matricule || "--",
            summary: item.avis_medecin_controleur || item.repos_prescrit || "--",
          })
        );

        const expertises = extractHistoryRecords(history, "expertise").map(
          (item) => ({
            ...item,
            id: `expertise-${item.id}`,
            recordId: item.id,
            type: "expertise",
            typeLabel: "Demande d'expertise",
            matricule_display: item.matricule_leoni || "--",
            summary: item.autres_missions || item.aptitude_poste || item.destinataire || "--",
          })
        );

        const combined = [...controles, ...expertises].sort((a, b) => {
          const aDate = new Date(a.created_at || a.date || 0).getTime();
          const bDate = new Date(b.created_at || b.date || 0).getTime();
          return bDate - aDate;
        });

        setRecords(combined);
      } catch (error) {
        console.error("Erreur chargement historique médecin contrôleur", {
          historyEndpoint: "/api/medical/medecin-controleur/*",
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
        if (!cancelled) {
          setErrorMessage("Impossible de charger l'historique sauvegardé.");
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (activeFilter !== "all" && record.type !== activeFilter) {
        return false;
      }

      if (dateFilter && record.date !== dateFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        record.nom,
        record.prenom,
        record.matricule,
        record.matricule_leoni,
        record.medecin_identifiant,
        record.destinataire,
        buildSummary(record),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [activeFilter, dateFilter, records, search]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-sky-50/35 to-white p-6 shadow-sm shadow-slate-200/50">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Historique</h1>
        <p className="mt-2 text-sm text-slate-500">
          Historique des contrôles médicaux et des demandes d&apos;expertise.
        </p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFilter === filter.id
                    ? "bg-slate-900 text-white shadow-sm shadow-sky-900/25"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50/40"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:flex-row xl:w-[520px]">
            <label className="flex h-11 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-200/40 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
              <Search size={16} className="text-sky-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par nom, matricule ou médecin..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-200/40">
              <CalendarDays size={16} className="text-sky-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
            </label>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        {isLoading ? (
          <p className="text-sm text-slate-500">Chargement de l&apos;historique...</p>
        ) : filteredRecords.length === 0 ? (
          <EmptyState text="Aucun enregistrement sauvegardé ne correspond aux filtres actuels." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Nom</th>
                  <th className="px-4 py-2 font-medium">Prénom</th>
                  <th className="px-4 py-2 font-medium">Matricule</th>
                  <th className="px-4 py-2 font-medium">Médecin contrôleur</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Résumé</th>
                  <th className="px-4 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const isExpanded = expandedId === record.id;

                  return (
                    <Fragment key={record.id}>
                      <tr
                        className="rounded-2xl border border-sky-100 bg-sky-50/40 text-sm text-slate-700 shadow-sm shadow-slate-200/40"
                      >
                        <td className="rounded-l-2xl px-4 py-4">
                          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
                            {record.typeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4">{formatDate(record.date)}</td>
                        <td className="px-4 py-4 font-medium text-slate-900">{record.nom || "--"}</td>
                        <td className="px-4 py-4">{record.prenom || "--"}</td>
                        <td className="px-4 py-4">{record.matricule_display}</td>
                        <td className="px-4 py-4">{record.medecin_identifiant || "--"}</td>
                        <td className="px-4 py-4">{record.statut || "--"}</td>
                        <td className="max-w-[280px] px-4 py-4">
                          <span className="line-clamp-2">{record.summary}</span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? "" : record.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                          >
                            {isExpanded ? "Fermer" : "Voir"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr>
                          <td colSpan={9} className="px-2 pb-3">
                            <div className="rounded-[24px] border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm shadow-slate-200/40 ring-1 ring-sky-100/60">
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-2">
                                  <p>
                                    <span className="font-semibold text-slate-900">Type :</span>{" "}
                                    {record.typeLabel}
                                  </p>
                                  <p>
                                    <span className="font-semibold text-slate-900">Date :</span>{" "}
                                    {formatDate(record.date)}
                                  </p>
                                  <p>
                                    <span className="font-semibold text-slate-900">Nom :</span>{" "}
                                    {record.nom || "--"}
                                  </p>
                                  <p>
                                    <span className="font-semibold text-slate-900">Prénom :</span>{" "}
                                    {record.prenom || "--"}
                                  </p>
                                  <p>
                                    <span className="font-semibold text-slate-900">Matricule :</span>{" "}
                                    {record.matricule_display}
                                  </p>
                                  <p>
                                    <span className="font-semibold text-slate-900">
                                      Médecin contrôleur :
                                    </span>{" "}
                                    {record.medecin_identifiant || "--"}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  {record.type === "controle" ? (
                                    <>
                                      <p>
                                        <span className="font-semibold text-slate-900">Segment :</span>{" "}
                                        {record.segment || "--"}
                                      </p>
                                      <p>
                                        <span className="font-semibold text-slate-900">
                                          Repos prescrit :
                                        </span>{" "}
                                        {record.repos_prescrit || "--"}
                                      </p>
                                      <p>
                                        <span className="font-semibold text-slate-900">Avis :</span>{" "}
                                        {record.avis_medecin_controleur || "--"}
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p>
                                        <span className="font-semibold text-slate-900">
                                          Destinataire :
                                        </span>{" "}
                                        {record.destinataire || "--"}
                                      </p>
                                      <p>
                                        <span className="font-semibold text-slate-900">
                                          Pièces jointes :
                                        </span>{" "}
                                        {record.attachment_names?.length
                                          ? record.attachment_names.join(", ")
                                          : record.pieces_jointes || "--"}
                                      </p>
                                      <p>
                                        <span className="font-semibold text-slate-900">
                                          Aptitude au poste :
                                        </span>{" "}
                                        {record.aptitude_poste || "--"}
                                      </p>
                                      <p>
                                        <span className="font-semibold text-slate-900">
                                          Autres missions :
                                        </span>{" "}
                                        {record.autres_missions || "--"}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-sky-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Contrôles médicaux</p>
              <p className="text-xs text-slate-500">
                {records.filter((record) => record.type === "controle").length} enregistrement(s)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
          <div className="flex items-center gap-3">
            <ClipboardList size={18} className="text-sky-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Demandes d&apos;expertise</p>
              <p className="text-xs text-slate-500">
                {records.filter((record) => record.type === "expertise").length} enregistrement(s)
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


