import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import {
  CalendarDays,
  Download,
  FileText,
  Plus,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Plane,
  Timer,
} from "lucide-react";
import { api } from "@/api/api";

const STATUT_OPTIONS = [
  { value: "PRESENT", label: "Présent" },
  { value: "ABSENT", label: "Absent" },
  { value: "CONGE", label: "Congé" },
  { value: "MISSION", label: "Mission" },
];

const emptyForm = {
  id: null,
  medecin: "",
  date: "",
  heure_arrivee: "",
  heure_depart: "",
  statut: "PRESENT",
  note: "",
};

const StatCard = ({ title, value, icon, accent }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ModalShell = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-slate-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

const formatDateInput = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const DASHBOARD_FILTERS = {
  view: "day",
  date: formatDateInput(new Date()),
  medecin: "",
  statut: "",
};

const parseTime = (value) => {
  if (!value) return null;
  const [h, m] = value.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
};

export default function PointageMedecinsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [medecins, setMedecins] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFilters, setSummaryFilters] = useState({
    year: new Date().getFullYear(),
    medecin: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, date: formatDateInput(new Date()) });

  const loadMedecins = async () => {
    const accessToken = localStorage.getItem("access");
    const res = await api.get(
      "/medecins/",
      accessToken
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : undefined
    );
    setMedecins(Array.isArray(res.data) ? res.data : []);
  };

  const loadPointages = async () => {
    const params = new URLSearchParams();
    if (DASHBOARD_FILTERS.date) params.set("date", DASHBOARD_FILTERS.date);
    if (DASHBOARD_FILTERS.view) params.set("view", DASHBOARD_FILTERS.view);
    if (DASHBOARD_FILTERS.medecin) params.set("medecin", DASHBOARD_FILTERS.medecin);
    if (DASHBOARD_FILTERS.statut) params.set("statut", DASHBOARD_FILTERS.statut);
    const accessToken = localStorage.getItem("access");
    const res = await api.get(
      `/medical/pointage-medecins/?${params.toString()}`,
      accessToken
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : undefined
    );
    setPointages(Array.isArray(res.data) ? res.data : []);
  };

  const loadAnnualSummary = useCallback(async () => {
    const params = new URLSearchParams();
    if (summaryFilters.year) params.set("year", summaryFilters.year);
    if (summaryFilters.medecin) params.set("medecin", summaryFilters.medecin);
    const accessToken = localStorage.getItem("access");
    const res = await api.get(
      `/medical/pointage-medecins/summary/?${params.toString()}`,
      accessToken
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : undefined
    );
    setSummary(res.data || null);
  }, [summaryFilters.medecin, summaryFilters.year]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        await Promise.all([loadMedecins(), loadPointages()]);
      } catch {
        if (!cancelled) setErr("Impossible de charger les pointages.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setSummaryLoading(true);
        await loadAnnualSummary();
      } catch {
        setErr("Impossible de charger le récapitulatif annuel.");
      } finally {
        setSummaryLoading(false);
      }
    };
    run();
  }, [loadAnnualSummary]);

  const stats = useMemo(() => {
    const total = pointages.length;
    const present = pointages.filter((p) => p.statut === "PRESENT").length;
    const absent = pointages.filter((p) => p.statut === "ABSENT").length;
    const conge = pointages.filter((p) => p.statut === "CONGE").length;
    const mission = pointages.filter((p) => p.statut === "MISSION").length;
    const totalMinutes = pointages.reduce((acc, item) => {
      const start = parseTime(item.heure_arrivee);
      const end = parseTime(item.heure_depart);
      if (start === null || end === null || end < start) return acc;
      return acc + (end - start);
    }, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    return { total, present, absent, conge, mission, totalHours };
  }, [pointages]);

  const annualMonthly = useMemo(() => {
    return Array.isArray(summary?.monthlySummary) ? summary.monthlySummary : [];
  }, [summary]);

  const annualPresenceData = useMemo(
    () =>
      annualMonthly.map((row) => ({
        month: row.label,
        presents: row.presents,
      })),
    [annualMonthly]
  );

  const annualStatusData = useMemo(
    () =>
      annualMonthly.map((row) => ({
        month: row.label,
        presents: row.presents,
        absents: row.absents,
        conges: row.conges,
        missions: row.missions,
      })),
    [annualMonthly]
  );

  const annualHoursData = useMemo(
    () =>
      annualMonthly.map((row) => ({
        month: row.label,
        heures: row.totalHeures,
      })),
    [annualMonthly]
  );

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, idx) => current - idx);
  }, []);

  const badgeClass = (statut) => {
    switch (statut) {
      case "PRESENT":
        return "bg-emerald-100 text-emerald-700";
      case "ABSENT":
        return "bg-rose-100 text-rose-700";
      case "CONGE":
        return "bg-amber-100 text-amber-700";
      case "MISSION":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const handleSummaryFilterChange = (e) => {
    const { name, value } = e.target;
    setSummaryFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openNew = () => {
    setForm({ ...emptyForm, date: formatDateInput(new Date()) });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setForm({
      id: row.id,
      medecin: row.medecin,
      date: row.date || "",
      heure_arrivee: row.heure_arrivee || "",
      heure_depart: row.heure_depart || "",
      statut: row.statut || "PRESENT",
      note: row.note || "",
    });
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.medecin || !form.date || !form.heure_arrivee || !form.statut) {
      return "Veuillez remplir tous les champs obligatoires.";
    }
    if (form.heure_depart && form.heure_depart < form.heure_arrivee) {
      return "L'heure de départ doit être après l'heure d'arrivée.";
    }
    return "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const message = validateForm();
    if (message) {
      setErr(message);
      return;
    }
    try {
      setSaving(true);
      setErr("");
      setSuccess("");
      const payload = {
        medecin: Number(form.medecin),
        date: form.date,
        heure_arrivee: form.heure_arrivee,
        heure_depart: form.heure_depart || null,
        statut: form.statut,
        note: form.note || "",
      };
      if (form.id) {
        await api.patch(`/medical/pointage-medecins/${form.id}/`, payload);
      } else {
        await api.post("/medical/pointage-medecins/", payload);
      }
      setShowForm(false);
      setForm({ ...emptyForm, date: formatDateInput(new Date()) });
      setSuccess("Pointage enregistré.");
      await loadPointages();
    } catch (error) {
      setErr(error?.response?.data?.detail || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = window.confirm(`Supprimer le pointage de ${row.medecin_nom || "ce médecin"} ?`);
    if (!ok) return;
    try {
      await api.delete(`/medical/pointage-medecins/${row.id}/`);
      await loadPointages();
    } catch {
      setErr("Erreur lors de la suppression.");
    }
  };

  const handleExportCSV = () => {
    const rows = [
      [
        "Médecin",
        "Date",
        "Arrivée",
        "Départ",
        "Durée",
        "Statut",
        "Note",
      ],
      ...pointages.map((row) => {
        const start = parseTime(row.heure_arrivee);
        const end = parseTime(row.heure_depart);
        const duration = formatDuration(end !== null && start !== null ? end - start : 0);
        return [
          row.medecin_nom || "",
          row.date || "",
          row.heure_arrivee || "",
          row.heure_depart || "",
          duration,
          row.statut || "",
          (row.note || "").replace(/\n/g, " "),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v ?? ""}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pointage-medecins.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.text("Pointage Médecins", 15, 15);
    doc.setFont("helvetica", "normal");
    doc.text("Gestion des présences et heures de travail", 15, 22);

    doc.setFontSize(10);
    doc.text(`Total: ${stats.total}`, 15, 32);
    doc.text(`Présents: ${stats.present}`, 45, 32);
    doc.text(`Absents: ${stats.absent}`, 80, 32);
    doc.text(`Congés: ${stats.conge}`, 110, 32);
    doc.text(`Missions: ${stats.mission}`, 140, 32);
    doc.text(`Total heures: ${stats.totalHours}h`, 170, 32, { align: "right" });

    let y = 42;
    doc.setFont("helvetica", "bold");
    doc.text("Médecin", 15, y);
    doc.text("Date", 60, y);
    doc.text("Arrivée", 85, y);
    doc.text("Départ", 105, y);
    doc.text("Durée", 125, y);
    doc.text("Statut", 145, y);
    doc.text("Note", 170, y);

    doc.setFont("helvetica", "normal");
    y += 6;
    pointages.forEach((row) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const start = parseTime(row.heure_arrivee);
      const end = parseTime(row.heure_depart);
      const duration = formatDuration(end !== null && start !== null ? end - start : 0);
      doc.text(String(row.medecin_nom || ""), 15, y);
      doc.text(String(row.date || ""), 60, y);
      doc.text(String(row.heure_arrivee || ""), 85, y);
      doc.text(String(row.heure_depart || "-"), 105, y);
      doc.text(String(duration), 125, y);
      doc.text(String(row.statut || ""), 145, y);
      doc.text(String((row.note || "").slice(0, 18)), 170, y, { align: "right" });
      y += 6;
    });

    doc.save("pointage-medecins.pdf");
  };

  const handleExportAnnualCSV = () => {
    if (!summary) return;
    const rows = [
      [
        "Mois",
        "Présences",
        "Absences",
        "Congés",
        "Missions",
        "Total heures",
        "Taux présence",
      ],
      ...(summary.monthlySummary || []).map((row) => [
        row.label,
        row.presents,
        row.absents,
        row.conges,
        row.missions,
        row.totalHeures,
        `${row.tauxPresence}%`,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v ?? ""}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pointage-annuel.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAnnualPDF = () => {
    if (!summary) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.text("Récapitulatif annuel — Pointage Médecins", 15, 15);
    doc.setFont("helvetica", "normal");
    doc.text(`Année ${summary.year}`, 15, 22);

    doc.setFontSize(10);
    doc.text(`Total: ${summary.totalPointages}`, 15, 32);
    doc.text(`Présents: ${summary.totalPresents}`, 45, 32);
    doc.text(`Absents: ${summary.totalAbsents}`, 80, 32);
    doc.text(`Congés: ${summary.totalConges}`, 110, 32);
    doc.text(`Missions: ${summary.totalMissions}`, 140, 32);
    doc.text(`Heures: ${summary.totalHeures}h`, 175, 32, { align: "right" });

    let y = 42;
    doc.setFont("helvetica", "bold");
    doc.text("Mois", 15, y);
    doc.text("Présents", 40, y);
    doc.text("Absents", 65, y);
    doc.text("Congés", 90, y);
    doc.text("Missions", 110, y);
    doc.text("Heures", 135, y);
    doc.text("Taux", 160, y);

    doc.setFont("helvetica", "normal");
    y += 6;
    (summary.monthlySummary || []).forEach((row) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(row.label || ""), 15, y);
      doc.text(String(row.presents ?? 0), 40, y);
      doc.text(String(row.absents ?? 0), 65, y);
      doc.text(String(row.conges ?? 0), 90, y);
      doc.text(String(row.missions ?? 0), 110, y);
      doc.text(String(row.totalHeures ?? 0), 135, y);
      doc.text(`${row.tauxPresence ?? 0}%`, 160, y);
      y += 6;
    });

    doc.save("pointage-annuel.pdf");
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        Chargement des pointages...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-500">Pointage</p>
            <h1 className="text-3xl font-bold text-slate-900">Pointage Médecins</h1>
            <p className="mt-2 text-sm text-slate-500">
              Gestion des présences et heures de travail
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileText size={16} />
              PDF
            </button>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={16} />
              Nouveau Pointage
            </button>
          </div>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}


      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Récapitulatif annuel
            </h2>
            <p className="text-sm text-slate-500">
              Synthèse des présences par mois
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
              <CalendarDays size={16} className="text-slate-500" />
              <select
                name="year"
                value={summaryFilters.year}
                onChange={handleSummaryFilterChange}
                className="bg-transparent text-slate-700 outline-none"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
              <User size={16} className="text-slate-500" />
              <select
                name="medecin"
                value={summaryFilters.medecin}
                onChange={handleSummaryFilterChange}
                className="bg-transparent text-slate-700 outline-none"
              >
                <option value="">Tous les médecins</option>
                {medecins.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.full_name || med.username || "Médecin"}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleExportAnnualCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportAnnualPDF}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileText size={16} />
              PDF
            </button>
          </div>
        </div>

        {summaryLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-500">
            Chargement du récapitulatif annuel...
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
              <StatCard
                title="Total pointages"
                value={summary?.totalPointages ?? 0}
                icon={<Users size={18} className="text-slate-600" />}
                accent="bg-slate-100"
              />
              <StatCard
                title="Présences"
                value={summary?.totalPresents ?? 0}
                icon={<CheckCircle2 size={18} className="text-emerald-600" />}
                accent="bg-emerald-50"
              />
              <StatCard
                title="Absences"
                value={summary?.totalAbsents ?? 0}
                icon={<XCircle size={18} className="text-rose-600" />}
                accent="bg-rose-50"
              />
              <StatCard
                title="Congés"
                value={summary?.totalConges ?? 0}
                icon={<FileText size={18} className="text-amber-600" />}
                accent="bg-amber-50"
              />
              <StatCard
                title="Missions"
                value={summary?.totalMissions ?? 0}
                icon={<Plane size={18} className="text-blue-600" />}
                accent="bg-blue-50"
              />
              <StatCard
                title="Total heures"
                value={`${summary?.totalHeures ?? 0}h`}
                icon={<Timer size={18} className="text-amber-600" />}
                accent="bg-amber-50"
              />
              <StatCard
                title="Taux présence"
                value={`${summary?.tauxPresence ?? 0}%`}
                icon={<CheckCircle2 size={18} className="text-emerald-600" />}
                accent="bg-emerald-50"
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                  Présence par mois
                </h3>
                <div className="mt-3 h-64 min-h-[240px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                    <BarChart data={annualPresenceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="presents" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                  Répartition mensuelle des statuts
                </h3>
                <div className="mt-3 h-64 min-h-[240px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                    <BarChart data={annualStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="presents" stackId="a" fill="#22c55e" />
                      <Bar dataKey="absents" stackId="a" fill="#f43f5e" />
                      <Bar dataKey="conges" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="missions" stackId="a" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Heures travaillées par mois
                </h3>
                <div className="mt-3 h-64 min-h-[240px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                    <LineChart data={annualHoursData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="heures"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                  Top 5 médecins présents
                </h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {(summary?.topDoctors || []).length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                      Aucun top médecin disponible pour cette année.
                    </div>
                  )}
                  {(summary?.topDoctors || []).map((doc) => (
                    <div
                      key={doc.medecinId}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2"
                    >
                      <span className="font-medium text-slate-700">{doc.nom}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {doc.presents} présences
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Tableau récapitulatif annuel
              </h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-4 py-3">Mois</th>
                      <th className="px-4 py-3">Présences</th>
                      <th className="px-4 py-3">Absences</th>
                      <th className="px-4 py-3">Congés</th>
                      <th className="px-4 py-3">Missions</th>
                      <th className="px-4 py-3">Total heures</th>
                      <th className="px-4 py-3">Taux présence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {annualMonthly.map((row) => (
                      <tr key={row.month} className="text-slate-700 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {row.label}
                        </td>
                        <td className="px-4 py-3">{row.presents}</td>
                        <td className="px-4 py-3">{row.absents}</td>
                        <td className="px-4 py-3">{row.conges}</td>
                        <td className="px-4 py-3">{row.missions}</td>
                        <td className="px-4 py-3">{row.totalHeures}h</td>
                        <td className="px-4 py-3">{row.tauxPresence}%</td>
                      </tr>
                    ))}
                    {annualMonthly.length === 0 && (
                      <tr>
                        <td className="px-4 py-8" colSpan={7}>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-center text-sm text-slate-500">
                            Aucune donnée annuelle disponible pour cette année.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<Users size={18} className="text-slate-600" />}
          accent="bg-slate-100"
        />
        <StatCard
          title="Présents"
          value={stats.present}
          icon={<CheckCircle2 size={18} className="text-emerald-600" />}
          accent="bg-emerald-50"
        />
        <StatCard
          title="Absents"
          value={stats.absent}
          icon={<XCircle size={18} className="text-rose-600" />}
          accent="bg-rose-50"
        />
        <StatCard
          title="Congés"
          value={stats.conge}
          icon={<FileText size={18} className="text-amber-600" />}
          accent="bg-amber-50"
        />
        <StatCard
          title="Missions"
          value={stats.mission}
          icon={<Plane size={18} className="text-blue-600" />}
          accent="bg-blue-50"
        />
        <StatCard
          title="Total Heures"
          value={`${stats.totalHours}h`}
          icon={<Timer size={18} className="text-amber-600" />}
          accent="bg-amber-50"
        />
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Médecin</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Arrivée</th>
                <th className="px-4 py-3">Départ</th>
                <th className="px-4 py-3">Durée</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pointages.map((row) => {
                const start = parseTime(row.heure_arrivee);
                const end = parseTime(row.heure_depart);
                const duration = formatDuration(
                  end !== null && start !== null && end >= start ? end - start : 0
                );
                return (
                  <tr
                    key={row.id}
                    className="text-slate-700 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.medecin_nom || "—"}
                    </td>
                    <td className="px-4 py-3">{row.date || "—"}</td>
                    <td className="px-4 py-3">{row.heure_arrivee || "—"}</td>
                    <td className="px-4 py-3">{row.heure_depart || "—"}</td>
                    <td className="px-4 py-3">{duration}</td>
                    <td className="px-4 py-3">
                      <span
                        title={
                          STATUT_OPTIONS.find((s) => s.value === row.statut)?.label ||
                          row.statut
                        }
                        className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass(
                          row.statut
                        )}`}
                      >
                        {STATUT_OPTIONS.find((s) => s.value === row.statut)?.label ||
                          row.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.note ? row.note.slice(0, 30) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-xl border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="rounded-xl border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pointages.length === 0 && (
                <tr>
                  <td className="px-4 py-8" colSpan={8}>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-center text-sm text-slate-500">
                      Aucun pointage trouvé pour les critères sélectionnés.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalShell
        open={showForm}
        title={form.id ? "Modifier le pointage" : "Nouveau Pointage"}
        onClose={() => setShowForm(false)}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...emptyForm, date: formatDateInput(new Date()) })}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Réinitialiser
            </button>
            <button
              type="submit"
              form="pointage-form"
              disabled={saving}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        }
      >
        <form id="pointage-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Médecin *</label>
              <select
                name="medecin"
                value={form.medecin}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Sélectionner</option>
                {medecins.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.full_name || med.username || "Médecin"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Heure d'arrivée *</label>
              <input
                type="time"
                name="heure_arrivee"
                value={form.heure_arrivee}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Heure de départ</label>
              <input
                type="time"
                name="heure_depart"
                value={form.heure_depart}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Statut *</label>
              <select
                name="statut"
                value={form.statut}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {STATUT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-600">Note</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleFormChange}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}
