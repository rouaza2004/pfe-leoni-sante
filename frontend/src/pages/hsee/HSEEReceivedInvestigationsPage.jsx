import { Fragment, useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Eye, Search, UserRoundSearch } from "lucide-react";
import { api } from "@/api/api";
import HSEEPageHeader from "@/components/hsee/HSEEPageHeader";

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/40 p-6 text-sm text-slate-600 shadow-sm shadow-slate-200/40">
      {text}
    </div>
  );
}

export default function HSEEReceivedInvestigationsPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadRecords = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await api.get("/hsee/enquetes-received/");
        if (!cancelled) {
          setRecords(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Erreur chargement enquetes recues HSEE", error);
        if (!cancelled) {
          setRecords([]);
          setErrorMessage("Impossible de charger les enquetes recues.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (dateFilter && record.date !== dateFilter) {
        return false;
      }

      if (!query) return true;

      return [
        record.collaborateur,
        record.matricule,
        record.type_accident,
        record.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [records, search, dateFilter]);

  const handlePdf = async (record, download = false) => {
    try {
      const suffix = download ? "?download=1" : "";
      const response = await api.get(
        `${record.pdf_url || `/medical/enquetes-initiales/${record.id}/pdf/`}${suffix}`,
        { responseType: "blob" }
      );
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      if (download) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `enquete-recue-hsee-${record.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      }

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Erreur ouverture PDF enquete recue", error);
      setErrorMessage("Impossible d'ouvrir le PDF de l'enquete.");
    }
  };

  return (
    <div className="space-y-6">
      <HSEEPageHeader
        title="Enquêtes reçues"
        subtitle="Consultez les enquêtes initiales envoyées à HSEE par l'équipe infirmière."
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <UserRoundSearch className="h-4 w-4 text-sky-600" />
            {records.length} enquête(s) reçue(s)
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:w-[560px]">
            <label className="flex h-11 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-200/40 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
              <Search size={16} className="text-sky-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par collaborateur, matricule, type..."
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
          <p className="text-sm text-slate-500">Chargement des enquêtes reçues...</p>
        ) : filteredRecords.length === 0 ? (
          <EmptyState text="Aucune enquête reçue ne correspond aux filtres actuels." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Collaborateur</th>
                  <th className="px-4 py-2 font-medium">Matricule</th>
                  <th className="px-4 py-2 font-medium">Type d'accident</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Date d'envoi</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                  <th className="px-4 py-2 font-medium text-right">Détail</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const isExpanded = expandedId === String(record.id);
                  return (
                    <Fragment key={record.id}>
                      <tr className="rounded-2xl border border-sky-100 bg-sky-50/40 text-sm text-slate-700 shadow-sm shadow-slate-200/40">
                        <td className="rounded-l-2xl px-4 py-4">{formatDate(record.date)}</td>
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {record.collaborateur || "--"}
                        </td>
                        <td className="px-4 py-4">{record.matricule || "--"}</td>
                        <td className="px-4 py-4">{record.type_accident || "--"}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            {record.status || "Envoyé HSEE"}
                          </span>
                        </td>
                        <td className="px-4 py-4">{formatDateTime(record.sent_to_hsee_at)}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handlePdf(record)}
                              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                            >
                              <Eye className="h-4 w-4" />
                              Voir
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePdf(record, true)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              <Download className="h-4 w-4" />
                              Télécharger PDF
                            </button>
                          </div>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? "" : String(record.id))}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                          >
                            <UserRoundSearch className="h-4 w-4" />
                            {isExpanded ? "Fermer" : "Voir"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr>
                          <td colSpan={8} className="px-1 pb-2 pt-0">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                              <div className="grid gap-6 lg:grid-cols-2">
                                <div className="rounded-2xl bg-white p-4 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">
                                    Informations générales
                                  </h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p><span className="font-medium text-slate-800">Lieu :</span> {record.detail?.lieu_accident || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Heure :</span> {record.detail?.heure_accident || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Appartenance :</span> {record.detail?.victime_appartenance || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Horaire :</span> {record.detail?.victime_horaire_travail || "--"}</p>
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-white p-4 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">
                                    Détails accident
                                  </h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p><span className="font-medium text-slate-800">Siège / lésion :</span> {record.detail?.siege_type_lesion || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Transport victime :</span> {record.detail?.lieu_transport_victime || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Circonstances :</span> {record.detail?.circonstances_accident || "--"}</p>
                                  </div>
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
    </div>
  );
}
