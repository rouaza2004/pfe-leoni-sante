import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Eye,
  FileSpreadsheet,
  FileUp,
  ShieldCheck,
  Upload,
  UserPlus,
} from "lucide-react";

import { api } from "@/api/api";

const pillClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

const SENT_STORAGE_KEY = "rh_nouveaux_operateurs_sent_to_infirmiere";

function formatDateLabel(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isCurrentMonth(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function StatusPill({ label, tone }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        pillClasses[tone] || pillClasses.warning
      }`}
    >
      {label}
    </span>
  );
}

function getSentOperateurIds() {
  try {
    const raw = window.localStorage.getItem(SENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSentOperateurIds(ids) {
  window.localStorage.setItem(SENT_STORAGE_KEY, JSON.stringify(ids));
}

async function envoyerOperateurInfirmiere(operateurId) {
  if (!operateurId) {
    throw new Error("Opérateur introuvable.");
  }

  const sentIds = getSentOperateurIds();
  if (!sentIds.includes(operateurId)) {
    setSentOperateurIds([...sentIds, operateurId]);
  }

  return { success: true, operateurId };
}

function buildOperatorRows(collaborateurs, appointments, sentIds) {
  const appointmentCollaborateurIds = new Set(
    appointments
      .map((appointment) => appointment.collaborateur)
      .filter((id) => id !== null && id !== undefined)
      .map(String)
  );

  return collaborateurs
    .filter((item) => item.actif !== false && isCurrentMonth(item.created_at))
    .sort((a, b) => {
      const createdDiff = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (createdDiff !== 0) return createdDiff;
      return String(b.id || "").localeCompare(String(a.id || ""));
    })
    .map((item) => {
      const hasAppointment = appointmentCollaborateurIds.has(String(item.id));
      const sentToInfirmiere = sentIds.includes(String(item.id));
      const statut = hasAppointment ? "Rendez-vous affecté" : "À planifier";
      return {
        id: String(item.id),
        matricule: item.matricule || "N/A",
        nom: item.nom || "",
        prenom: item.prenom || "",
        departement: item.departement || "Non défini",
        poste: item.poste || "Non défini",
        dateImport: item.created_at,
        statut,
        statutTone: hasAppointment ? "success" : "warning",
        hasAppointment,
        sentToInfirmiere,
      };
    });
}

export default function NouveauxOperateursRH() {
  const inputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPlanningView = searchParams.get("filter") === "to-plan";
  const [selectedFileName, setSelectedFileName] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [sendingId, setSendingId] = useState("");
  const [sendingAll, setSendingAll] = useState(false);
  const [sentIds, setSentIds] = useState(() => getSentOperateurIds().map(String));
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planningOnly, setPlanningOnly] = useState(initialPlanningView);

  useEffect(() => {
    setPlanningOnly(searchParams.get("filter") === "to-plan");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadRows = async () => {
      try {
        setLoading(true);
        setError("");
        const [collabRes, appointmentRes] = await Promise.all([
          api.get("/collaborateurs/"),
          api.get("/appointments/rdv/"),
        ]);
        if (cancelled) return;
        setCollaborateurs(Array.isArray(collabRes.data) ? collabRes.data : []);
        setAppointments(Array.isArray(appointmentRes.data) ? appointmentRes.data : []);
      } catch (err) {
        console.error("Erreur chargement nouveaux opérateurs RH", err);
        if (!cancelled) setError("Impossible de charger les nouveaux opérateurs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRows();
    return () => {
      cancelled = true;
    };
  }, []);

  const importedRows = useMemo(
    () => buildOperatorRows(collaborateurs, appointments, sentIds),
    [appointments, collaborateurs, sentIds]
  );

  const visibleRows = useMemo(
    () => (planningOnly ? importedRows.filter((row) => !row.hasAppointment) : importedRows),
    [importedRows, planningOnly]
  );

  const rowsToSend = useMemo(
    () => visibleRows.filter((row) => !row.hasAppointment && !row.sentToInfirmiere),
    [visibleRows]
  );

  const setView = (nextPlanningOnly) => {
    setPlanningOnly(nextPlanningOnly);
    setSearchParams(nextPlanningOnly ? { filter: "to-plan" } : {});
  };

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file?.name || "");
  };

  const handleSendToInfirmiere = async (row) => {
    try {
      setSendingId(row.id);
      setFeedback({ type: "", message: "" });
      await envoyerOperateurInfirmiere(row.id);
      const nextIds = [...new Set([...sentIds, row.id])];
      setSentIds(nextIds);
      setFeedback({
        type: "success",
        message: "Envoyé à l'infirmière avec succès",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message || "Erreur lors de l'envoi à l'infirmière.",
      });
    } finally {
      setSendingId("");
    }
  };

  const handleSendAllToInfirmiere = async () => {
    if (rowsToSend.length === 0) {
      setFeedback({
        type: "success",
        message: "Aucun opérateur à planifier restant à envoyer.",
      });
      return;
    }

    try {
      setSendingAll(true);
      setFeedback({ type: "", message: "" });
      await Promise.all(rowsToSend.map((row) => envoyerOperateurInfirmiere(row.id)));
      const nextIds = [...new Set([...sentIds, ...rowsToSend.map((row) => row.id)])];
      setSentIds(nextIds);
      setFeedback({
        type: "success",
        message: "Envoyé à l'infirmière avec succès",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message || "Erreur lors de l'envoi à l'infirmière.",
      });
    } finally {
      setSendingAll(false);
    }
  };

  const pageTitle = planningOnly ? "Visites d'embauche à planifier" : "Integration nouveaux operateurs";
  const listTitle = planningOnly
    ? `Visites d'embauche à planifier - ${visibleRows.length} opérateurs`
    : `Dernière importation - ${visibleRows.length} opérateurs`;

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                <UserPlus size={14} className="text-slate-700" />
                Parcours d'embauche
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 font-medium text-white">
                <ShieldCheck size={14} />
                RH onboarding
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                LEONI
              </p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
                {pageTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600">
                Import Excel et affectation des visites d'embauche.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBrowseClick}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-200/60 transition hover:bg-sky-700"
          >
            <Upload size={16} />
            Importer fichier Excel
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="rounded-[28px] border-2 border-dashed border-sky-200 bg-sky-50/35 px-6 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-sky-200 bg-white text-sky-600 shadow-sm shadow-sky-100/60">
            <FileSpreadsheet size={28} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            Glissez-deposez votre fichier Excel ici
          </h2>
          <p className="mt-2 text-sm text-slate-500">Formats acceptes: .xlsx, .xls</p>

          <button
            type="button"
            onClick={handleBrowseClick}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/40 transition hover:bg-slate-50"
          >
            <FileUp size={16} />
            Parcourir
          </button>

          {selectedFileName ? (
            <p className="mt-4 text-sm font-medium text-slate-700">{selectedFileName}</p>
          ) : null}
        </div>
      </section>

      {feedback.message ? (
        <div
          className={`rounded-[22px] border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{listTitle}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {planningOnly
                ? "Opérateurs sans rendez-vous médical affecté."
                : "Prévisualisation, validation et affectation des visites d'embauche."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView(false)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-medium transition ${
                !planningOnly
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Eye size={15} />
              Tous les nouveaux
            </button>
            <button
              type="button"
              onClick={() => setView(true)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-medium transition ${
                planningOnly
                  ? "border-sky-200 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <UserPlus size={15} />
              Visites à planifier
            </button>
            <button
              type="button"
              onClick={handleSendAllToInfirmiere}
              disabled={sendingAll || rowsToSend.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck size={15} />
              {sendingAll ? "Envoi..." : "Envoyer à l'infirmière"}
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[980px] overflow-hidden rounded-[24px] border border-slate-200">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Prenom</th>
                  <th className="px-4 py-3">Departement</th>
                  <th className="px-4 py-3">Poste</th>
                  <th className="px-4 py-3">Date import</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-t border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/35"
                    }`}
                  >
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{row.matricule}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">{row.nom || "--"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">{row.prenom || "--"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.departement}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.poste}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{formatDateLabel(row.dateImport)}</td>
                    <td className="px-4 py-3.5 text-sm">
                      <StatusPill label={row.statut} tone={row.statutTone} />
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      {row.sentToInfirmiere ? (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                          Déjà envoyé
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendToInfirmiere(row)}
                          disabled={sendingId === row.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ShieldCheck size={14} />
                          {sendingId === row.id ? "Envoi..." : "Envoyer à l'infirmière"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleRows.length === 0 ? (
              <div className="border-t border-slate-100 px-4 py-6 text-sm text-slate-500">
                {loading ? "Chargement des opérateurs..." : "Aucun opérateur à afficher pour ce filtre."}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
